const PLAN_TYPES = ["diario", "semanal", "mensal"];

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function extractDeferredStartSubjects(notes, subjects = []) {
  const text = normalizeSearchText(notes);
  const rejectsStartingWith = /(?:nao|evit|sem)[\s\S]{0,55}(?:comec|inici)|(?:comec|inici)[\s\S]{0,40}(?:nao|evit)/.test(text);
  if (!rejectsStartingWith) return [];

  return [...new Set(subjects)].filter((subject) => {
    const normalized = normalizeSearchText(subject);
    if (!normalized) return false;
    if (text.includes(normalized)) return true;
    return normalized.split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 6 && !["lingua", "conhecimentos", "nocoes"].includes(word))
      .some((word) => text.includes(word.slice(0, Math.min(7, word.length))));
  });
}

export function normalizePlanType(value) {
  const type = String(value || "").toLowerCase();
  if (PLAN_TYPES.includes(type)) return type;
  if (type === "lia") return "semanal";
  return "semanal";
}

export function topicKey(block = {}) {
  return block.chave || `${block.nome || block.subject || ""}|||${block.topico || block.topic || ""}`;
}

export function activityKey(block = {}) {
  return `${topicKey(block)}|||${block.activityType || "theory"}`;
}

export function stableBlockId(block = {}, planId = "plano", index = 0) {
  if (block.id) return String(block.id);
  const raw = `${planId}-${block.data || "sem-data"}-${activityKey(block)}-${index}`;
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase();
}

export function planPeriod(plan = {}) {
  const type = normalizePlanType(plan.tipo);
  const dates = (plan.blocos || []).map((block) => block.data).filter(Boolean).sort();
  return {
    type,
    start: plan.dataInicio || plan.data || dates[0] || "",
    end: plan.dataFim || plan.data || dates.at(-1) || "",
  };
}

export function normalizePlans(plans = []) {
  const byType = new Map();
  [...plans]
    .sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")))
    .forEach((plan) => {
      const type = normalizePlanType(plan.tipo);
      if (!byType.has(type)) {
        const normalized = {
          ...plan,
          tipo: type,
          status: plan.status || "ativo",
          blocos: (plan.blocos || []).map((block, index) => ({
            ...block,
            id: stableBlockId(block, plan.id, index),
            activityType: block.activityType || "theory",
            chave: topicKey(block),
          })),
        };
        if (normalized.status === "ativo") byType.set(type, normalized);
      }
    });
  return PLAN_TYPES.map((type) => byType.get(type)).filter(Boolean);
}

export function activePlanForType(plans, type) {
  return normalizePlans(plans).find((plan) => plan.tipo === normalizePlanType(type)) || null;
}

export function blockStatus(block, completedTopics = new Set(), completedActivities = new Set(), today = new Date().toISOString().slice(0, 10)) {
  const activity = block.activityType || "theory";
  const completed = activity === "theory"
    ? completedTopics.has(topicKey(block))
    : completedActivities.has(activityKey(block)) || block.status === "concluido";
  if (completed) return "concluido";
  if (block.data && block.data < today) return "atrasado";
  if (block.data === today) return "hoje";
  return "planejado";
}

export function derivePending(plans, completedTopics, completedActivities, today) {
  return normalizePlans(plans).flatMap((plan) => (plan.blocos || [])
    .filter((block) => blockStatus(block, completedTopics, completedActivities, today) === "atrasado")
    .map((block) => ({
      ...block,
      planId: plan.id,
      planType: plan.tipo,
      planTitle: plan.titulo,
      originalDate: block.data,
      pendingId: `${plan.id}::${block.id}`,
      daysLate: Math.max(1, Math.floor((new Date(`${today}T12:00:00`) - new Date(`${block.data}T12:00:00`)) / 86400000)),
    })));
}

export function archivePlan(plans, type, now = new Date().toISOString()) {
  const normalizedType = normalizePlanType(type);
  const active = activePlanForType(plans, normalizedType);
  return {
    active,
    plans: normalizePlans(plans).filter((plan) => plan.tipo !== normalizedType),
    archived: active ? { ...active, status: "excluido", excluidoEm: now } : null,
  };
}

export function upsertPlanSlot(plans, plan) {
  const type = normalizePlanType(plan.tipo);
  if (activePlanForType(plans, type)) {
    throw new Error(`Já existe um cronograma ${type} ativo. Exclua o atual antes de criar outro.`);
  }
  const normalized = normalizePlans([{ ...plan, tipo: type, status: "ativo" }])[0];
  return [normalized, ...normalizePlans(plans)];
}

export function reviewStages(completedDate) {
  const addDays = (value, days) => {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  return [
    { stage: 0, dueDate: addDays(completedDate, 1), label: "Revisar amanhã", activity: "Recordação rápida", minutes: 10 },
    { stage: 1, dueDate: addDays(completedDate, 7), label: "Revisar em 7 dias", activity: "Resolver questões", minutes: 20 },
    { stage: 2, dueDate: addDays(completedDate, 30), label: "Revisar em 30 dias", activity: "Consolidar pontos e erros", minutes: 20 },
  ];
}

export function createReviewCycle({ examId, subject, topic, completedAt = new Date().toISOString() }) {
  const completedDate = completedAt.slice(0, 10);
  const key = `${subject}|||${topic}`;
  return {
    id: `${examId || "edital"}::${key}`,
    examId,
    subject,
    topic,
    topicKey: key,
    completedAt,
    currentStage: 0,
    status: "ativo",
    stages: reviewStages(completedDate).map((stage) => ({ ...stage, status: "pendente" })),
  };
}

export function rescheduleReview(cycle, result, completedDate = new Date().toISOString().slice(0, 10)) {
  const addDays = (days) => {
    const date = new Date(`${completedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const current = Math.max(0, Number(cycle.currentStage) || 0);
  const stages = (cycle.stages || []).map((stage, index) => index === current ? { ...stage, status: "concluido", completedDate, result } : stage);
  if (result === "dificuldade") {
    stages.splice(current + 1, 0, { stage: current + 0.5, dueDate: addDays(2), label: "Reforço em 2 dias", activity: "Rever o ponto de dificuldade", minutes: 15, status: "pendente" });
  }
  const nextStage = Math.min(current + 1, stages.length);
  return { ...cycle, stages, currentStage: nextStage, status: nextStage >= stages.length ? "concluido" : "ativo", updatedAt: new Date().toISOString() };
}

export function planStats(plan, completedTopics, completedActivities, today) {
  const statuses = (plan?.blocos || []).map((block) => blockStatus(block, completedTopics, completedActivities, today));
  const completed = statuses.filter((status) => status === "concluido").length;
  return {
    total: statuses.length,
    completed,
    overdue: statuses.filter((status) => status === "atrasado").length,
    percent: statuses.length ? Math.round((completed / statuses.length) * 100) : 0,
  };
}

export { PLAN_TYPES };
