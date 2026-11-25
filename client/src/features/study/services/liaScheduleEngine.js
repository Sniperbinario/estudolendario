const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || minimum));

function parseLocalDate(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(iso, amount) {
  const date = parseLocalDate(iso);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

function targetSubjectCount(minutes, available) {
  const desired = minutes <= 75 ? 2 : minutes <= 150 ? 3 : minutes <= 210 ? 3 : minutes <= 270 ? 4 : 5;
  return Math.max(1, Math.min(desired, available));
}

function normalizeProfiles(profiles = []) {
  return new Map(profiles.map((profile) => [profile.subject, {
    difficulty: clamp(profile.difficulty, 1, 5),
    priority: clamp(profile.priority, 1, 5),
    theoryMinutes: clamp(profile.theoryMinutes, 25, 55),
    questionMinutes: clamp(profile.questionMinutes, 15, 30),
    rationale: String(profile.rationale || ""),
  }]));
}

function makeBlock(task, date, weekday) {
  return {
    nome: task.subject,
    topico: task.topic,
    tempo: task.minutes,
    cor: task.block,
    chave: task.key,
    dia: weekday,
    data: date,
    activityType: task.activityType,
    activityLabel: task.activityLabel,
    reason: task.reason || "",
    reviewStage: task.reviewStage || null,
    topicId: task.id || null,
  };
}

function pickTask(queue, remaining, lastSubject, counts, subjectLimit, predicate = () => true) {
  const eligible = queue
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => task.minutes <= remaining && (counts.get(task.subject) || 0) < subjectLimit && predicate(task));
  const choice = eligible.find(({ task }) => !lastSubject || task.subject !== lastSubject);
  if (!choice) return null;
  queue.splice(choice.index, 1);
  return choice.task;
}

export function validateIntelligentSchedule({ blocks, topics, weeklyHours, startDate, dependencies = [] }) {
  const errors = [];
  const theory = blocks.filter((block) => block.activityType === "theory");
  const expectedKeys = new Set(topics.map((topic) => topic.key));
  const theoryKeys = theory.map((block) => block.chave);
  const duplicateTheory = theoryKeys.filter((key, index) => theoryKeys.indexOf(key) !== index);
  if (duplicateTheory.length) errors.push("Há conteúdos teóricos repetidos.");
  expectedKeys.forEach((key) => {
    if (!theoryKeys.includes(key)) errors.push(`Conteúdo não planejado: ${key}`);
  });

  const byDate = new Map();
  blocks.forEach((block) => {
    if (!byDate.has(block.data)) byDate.set(block.data, []);
    byDate.get(block.data).push(block);
  });
  byDate.forEach((dayBlocks, date) => {
    const weekday = DAY_NAMES[parseLocalDate(date).getDay()];
    const capacity = Math.round((Number(weeklyHours[weekday]) || 0) * 60);
    const total = dayBlocks.reduce((sum, block) => sum + Number(block.tempo || 0), 0);
    if (total > capacity) errors.push(`${date} ultrapassa a disponibilidade em ${total - capacity} minutos.`);
    const distinctSubjects = new Set(dayBlocks.map((block) => block.nome));
    if (distinctSubjects.size > 1) {
      const perSubject = new Map();
      dayBlocks.forEach((block, index) => {
        perSubject.set(block.nome, (perSubject.get(block.nome) || 0) + 1);
        if (index && block.nome === dayBlocks[index - 1].nome) errors.push(`${date} repete a mesma matéria em sequência.`);
      });
      perSubject.forEach((count, subject) => {
        if (count > 2) errors.push(`${date} concentra atividades demais em ${subject}.`);
      });
    }
  });
  const theoryPosition = new Map(theory.map((block, index) => [block.topicId, index]));
  dependencies.forEach((dependency) => {
    (dependency.requires || []).forEach((requiredId) => {
      if ((theoryPosition.get(requiredId) ?? Infinity) >= (theoryPosition.get(dependency.topicId) ?? -1)) {
        errors.push(`Pré-requisito ${requiredId} aparece depois de ${dependency.topicId}.`);
      }
    });
  });
  if (blocks.some((block) => block.data < startDate)) errors.push("Há blocos antes da data inicial.");
  return { valid: errors.length === 0, errors };
}

export function buildIntelligentSchedule({
  topics,
  orderedTopicIds,
  subjectProfiles = [],
  complexTopicIds = [],
  dependencies = [],
  weeklyHours,
  startDate,
  level = "zero",
  includeFlashcards = false,
}) {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const order = [...orderedTopicIds, ...topics.map((topic) => topic.id)]
    .filter((id, index, values) => topicById.has(id) && values.indexOf(id) === index);
  const profiles = normalizeProfiles(subjectProfiles);
  const complex = new Set(complexTopicIds);
  const prerequisites = new Map(dependencies.map((item) => [item.topicId, new Set(item.requires || [])]));
  const queues = new Map();
  order.forEach((id) => {
    const topic = topicById.get(id);
    if (!queues.has(topic.subject)) queues.set(topic.subject, []);
    queues.get(topic.subject).push(topic);
  });
  const subjects = [...queues.keys()].sort((a, b) => (profiles.get(b)?.priority || 3) - (profiles.get(a)?.priority || 3));
  const completedTheory = new Set();
  const questionQueue = [];
  const reviewQueue = [];
  const blocks = [];
  let cursor = parseLocalDate(startDate);
  let subjectCursor = 0;
  let studyDayCount = 0;
  let guard = 0;

  const hasPendingTheory = () => [...queues.values()].some((queue) => queue.length);
  while ((hasPendingTheory() || questionQueue.length || reviewQueue.length) && guard < 3650) {
    guard += 1;
    const date = toISODate(cursor);
    const weekday = DAY_NAMES[cursor.getDay()];
    const capacity = Math.round((Number(weeklyHours[weekday]) || 0) * 60);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12);
    if (capacity < 15) continue;

    const activeSubjects = subjects.filter((subject) => (queues.get(subject)?.length || 0) > 0 || questionQueue.some((task) => task.subject === subject) || reviewQueue.some((task) => task.subject === subject));
    const subjectLimit = activeSubjects.length > 1 ? 2 : 4;
    const desiredSubjects = targetSubjectCount(capacity, Math.max(1, activeSubjects.length));
    const counts = new Map();
    const dayBlocks = [];
    let remaining = capacity;
    let lastSubject = "";

    const append = (task) => {
      if (!task || task.minutes > remaining) return false;
      dayBlocks.push(makeBlock(task, date, weekday));
      remaining -= task.minutes;
      counts.set(task.subject, (counts.get(task.subject) || 0) + 1);
      lastSubject = task.subject;
      return true;
    };

    const dueReviews = reviewQueue.filter((task) => task.dueDate <= date);
    dueReviews.forEach((task) => reviewQueue.splice(reviewQueue.indexOf(task), 1));
    let reviewMinutes = 0;
    const reviewBudget = Math.min(45, Math.floor(capacity * 0.25));
    while (dueReviews.length && reviewMinutes < reviewBudget) {
      const task = pickTask(dueReviews, Math.min(remaining, reviewBudget - reviewMinutes), lastSubject, counts, subjectLimit);
      if (!task) break;
      if (append(task)) reviewMinutes += task.minutes;
    }
    reviewQueue.push(...dueReviews);

    const selectedSubjects = [];
    for (let attempts = 0; attempts < subjects.length * 2 && selectedSubjects.length < desiredSubjects; attempts += 1) {
      const subject = subjects[subjectCursor % subjects.length];
      subjectCursor += 1;
      const queue = queues.get(subject) || [];
      const next = queue[0];
      const requirements = next ? prerequisites.get(next.id) : null;
      const unlocked = !requirements || [...requirements].every((id) => completedTheory.has(id));
      if (next && unlocked && !selectedSubjects.includes(subject)) selectedSubjects.push(subject);
    }
    if (!selectedSubjects.length && hasPendingTheory()) {
      const fallback = subjects.find((subject) => (queues.get(subject)?.length || 0) > 0);
      if (fallback) selectedSubjects.push(fallback);
    }

    const theoryTasks = [];
    selectedSubjects.forEach((subject) => {
      const topic = queues.get(subject)?.[0];
      if (!topic) return;
      const requirements = prerequisites.get(topic.id);
      if (requirements && ![...requirements].every((id) => completedTheory.has(id))) return;
      const profile = profiles.get(subject) || { difficulty: 3, priority: 3, theoryMinutes: 35, questionMinutes: 20, rationale: "" };
      let minutes = profile.theoryMinutes + (complex.has(topic.id) ? 5 : 0) + (level === "zero" && profile.difficulty >= 4 ? 5 : 0);
      minutes = clamp(minutes, 25, 55);
      theoryTasks.push({
        ...topic,
        key: topic.key,
        minutes,
        activityType: "theory",
        activityLabel: "Aprender conteúdo",
        reason: topic.reason || profile.rationale,
      });
    });

    while (theoryTasks.length) {
      const task = pickTask(theoryTasks, remaining, lastSubject, counts, subjectLimit);
      if (!task) break;
      if (!append(task)) break;
      queues.get(task.subject).shift();
      completedTheory.add(task.id);
      const profile = profiles.get(task.subject) || { questionMinutes: 20 };
      questionQueue.push({ ...task, key: `${task.key}|||questions`, minutes: profile.questionMinutes, activityType: "questions", activityLabel: "Resolver questões", dueDate: date });
      [
        [1, 10, "Revisar amanhã", "tomorrow"],
        [7, 15, "Revisar daqui a 7 dias", "week"],
        [30, 15, "Revisar daqui a 30 dias", "month"],
      ].forEach(([days, minutes, label, stage]) => reviewQueue.push({ ...task, key: `${task.key}|||review-${days}`, minutes, activityType: "review", activityLabel: label, reviewStage: stage, dueDate: addDays(date, days) }));
    }

    const readyQuestions = questionQueue.filter((task) => task.dueDate <= date);
    readyQuestions.forEach((task) => questionQueue.splice(questionQueue.indexOf(task), 1));
    while (readyQuestions.length) {
      const task = pickTask(readyQuestions, remaining, lastSubject, counts, subjectLimit);
      if (!task) break;
      append(task);
    }
    questionQueue.push(...readyQuestions);

    if (includeFlashcards && studyDayCount % 3 === 2 && remaining >= 15 && dayBlocks.length) {
      const source = [...dayBlocks].reverse().find((block) => block.nome !== lastSubject && (counts.get(block.nome) || 0) < subjectLimit);
      if (source) append({ subject: source.nome, topic: source.topico, block: source.cor, key: `${source.chave}|||flashcards`, minutes: 15, activityType: "flashcards", activityLabel: "Treinar com flashcards" });
    }

    if (dayBlocks.length) {
      blocks.push(...dayBlocks);
      studyDayCount += 1;
    }
  }

  if (hasPendingTheory()) throw new Error("Não foi possível encaixar todos os conteúdos respeitando os pré-requisitos e a disponibilidade.");
  const result = validateIntelligentSchedule({ blocks, topics: topics.map((topic) => ({ ...topic, key: topic.key })), weeklyHours, startDate, dependencies });
  if (!result.valid) throw new Error(`O cronograma não passou na validação: ${result.errors[0]}`);
  return { blocks, validation: result };
}

export function groupScheduleByDate(blocks = []) {
  return blocks.reduce((grouped, block) => {
    if (!grouped[block.data]) grouped[block.data] = [];
    grouped[block.data].push(block);
    return grouped;
  }, {});
}

