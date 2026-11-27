import { useMemo, useState } from "react";
import { StudyIcon } from "../components/StudyIcon";
import LiaSchedulePlanner from "../components/LiaSchedulePlanner";
import { blockStatus, derivePending, normalizePlans, planStats } from "../services/studyPlanning";

const TYPES = [
  ["diario", "Diário", "Organiza somente o dia escolhido."],
  ["semanal", "Semanal", "Planeja sete dias sem exigir um plano mensal."],
  ["mensal", "Mensal", "Distribui o estudo até o fim do mês."],
];

const TYPE_LABEL = { diario: "Diário", semanal: "Semanal", mensal: "Mensal" };
const STATUS_LABEL = { planejado: "A estudar", hoje: "Hoje", concluido: "Estudado", atrasado: "Pendente" };

function formatDate(value) {
  if (!value) return "Sem data";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ScheduleGeneratorScreen({ activePlans, subjects, hours, weekdays, preview, loading, error, onHoursChange, onGenerate, onApprove, onDiscard, onOpenPlan, onDelete }) {
  const [type, setType] = useState("semanal");
  const active = normalizePlans(activePlans).find((plan) => plan.tipo === type);
  return (
    <main className="study-page planning-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Planejamento com controle</span><h1>Gerar cronograma</h1><p>Escolha o período. Cada tipo funciona sozinho e só pode ter um plano ativo.</p></div></header>
      <section className="plan-type-picker">
        {TYPES.map(([id, label, description]) => <button key={id} className={type === id ? "is-active" : ""} onClick={() => setType(id)}><StudyIcon name={id === "diario" ? "timer" : "calendar"} size={19} /><span><strong>{label}</strong><small>{description}</small></span>{activePlans.some((plan) => plan.tipo === id) && <b>Ativo</b>}</button>)}
      </section>
      {active ? (
        <section className="plan-lock-card"><span><StudyIcon name="lock" size={22} /></span><div><small>{TYPE_LABEL[type]} ativo</small><h2>{active.titulo}</h2><p>Para evitar versões conflitantes, conclua ou exclua este cronograma antes de gerar outro do mesmo tipo.</p></div><div><button className="study-button study-button--primary" onClick={() => onOpenPlan(active)}>Abrir meu cronograma</button><button className="study-button study-button--danger" onClick={() => onDelete(type)}>Excluir atual</button></div></section>
      ) : (
        <LiaSchedulePlanner subjects={subjects} hours={hours} weekdays={weekdays} preview={preview} loading={loading} error={error} planType={type} onHoursChange={onHoursChange} onGenerate={(config) => onGenerate({ ...config, planType: type })} onApprove={onApprove} onDiscard={onDiscard} />
      )}
    </main>
  );
}

export function MyScheduleScreen({ plans, completedTopics, completedActivities, selectedId, onSelect, onStart, onExport, onPrint, onDelete, onGenerate }) {
  const today = new Date().toISOString().slice(0, 10);
  const normalized = normalizePlans(plans);
  const selected = normalized.find((plan) => plan.id === selectedId) || normalized[0];
  const grouped = useMemo(() => {
    const source = selected?.blocos || [];
    return source.reduce((acc, block) => { (acc[block.data || "sem-data"] ||= []).push(block); return acc; }, {});
  }, [selected]);
  return (
    <main className="study-page my-plan-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Seu plano em andamento</span><h1>Meu cronograma</h1><p>Cinza é o que falta, azul é hoje, verde é concluído e vermelho é pendência.</p></div><button className="study-button study-button--primary" onClick={onGenerate}><StudyIcon name="sparkles" size={16} /> Gerar cronograma</button></header>
      {!normalized.length ? <section className="study-empty-state"><StudyIcon name="calendar" size={28} /><h2>Nenhum cronograma ativo</h2><p>Você pode criar somente o diário, somente o semanal ou somente o mensal.</p><button className="study-button study-button--primary" onClick={onGenerate}>Criar primeiro cronograma</button></section> : <>
        <section className="plan-slot-tabs">{normalized.map((plan) => { const stats = planStats(plan, completedTopics, completedActivities, today); return <button className={selected?.id === plan.id ? "is-active" : ""} key={plan.id} onClick={() => onSelect(plan)}><span>{TYPE_LABEL[plan.tipo]}</span><strong>{plan.titulo}</strong><small>{stats.percent}% concluído {stats.overdue ? `· ${stats.overdue} pendente(s)` : ""}</small></button>; })}</section>
        <section className="my-plan-toolbar"><div><span>{TYPE_LABEL[selected.tipo]}</span><h2>{selected.titulo}</h2></div><div><button onClick={() => onExport(selected)}><StudyIcon name="download" size={15} /> Exportar PDF</button><button onClick={() => onPrint(selected)}><StudyIcon name="print" size={15} /> Imprimir</button><button className="is-danger" onClick={() => onDelete(selected.tipo)}><StudyIcon name="trash" size={15} /> Excluir</button></div></section>
        <section className="plan-days">{Object.entries(grouped).map(([date, blocks]) => <article className={date === today ? "is-today" : ""} key={date}><header><div><span>{date === today ? "Hoje" : new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long" })}</span><strong>{formatDate(date)}</strong></div><small>{blocks.reduce((sum, block) => sum + Number(block.tempo || 0), 0)} min</small></header><div>{blocks.map((block) => { const status = blockStatus(block, completedTopics, completedActivities, today); return <button className={`plan-block is-${status}`} key={block.id} disabled={status === "concluido"} onClick={() => onStart(block)}><i /><span><small>{block.activityLabel || (block.activityType === "questions" ? "Questões" : block.activityType === "review" ? "Revisão" : "Estudo")}</small><strong>{block.nome}</strong><p>{block.topico}</p></span><em>{block.tempo} min</em><b>{STATUS_LABEL[status]}</b></button>; })}</div></article>)}</section>
      </>}
    </main>
  );
}

export function PendingScheduleScreen({ plans, extraPending = [], completedTopics, completedActivities, onStart, onReschedule, onComplete }) {
  const today = new Date().toISOString().slice(0, 10);
  const automatic = derivePending(plans, completedTopics, completedActivities, today);
  const pending = [...automatic, ...extraPending.filter((item) => !automatic.some((automaticItem) => automaticItem.pendingId === item.pendingId))]
    .filter((item) => blockStatus(item, completedTopics, completedActivities, today) !== "concluido")
    .map((item) => ({ ...item, daysLate: item.daysLate || Math.max(0, Math.floor((new Date(`${today}T12:00:00`) - new Date(`${item.originalDate || item.data}T12:00:00`)) / 86400000)) }));
  return (
    <main className="study-page pending-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">O que precisa de atenção</span><h1>Pendências</h1><p>Nada é movido sozinho. Você decide se estuda agora, reagenda ou conclui.</p></div><div className="study-context-card"><span>Em atraso</span><strong>{pending.length} atividade(s)</strong></div></header>
      <section className="pending-list">{pending.length ? pending.map((item) => <article key={item.pendingId}><span className="pending-list__mark"><StudyIcon name="alert" size={18} /></span><div><small>{TYPE_LABEL[item.planType]} · previsto para {formatDate(item.originalDate)}</small><h2>{item.nome}</h2><p>{item.topico}</p><em>{item.daysLate} {item.daysLate === 1 ? "dia" : "dias"} em atraso · {item.tempo} min</em></div><div><button className="study-button study-button--primary" onClick={() => onStart(item)}>Estudar agora</button><button className="study-button study-button--quiet" onClick={() => onReschedule(item)}>Reagendar</button><button className="study-button study-button--quiet" onClick={() => onComplete(item)}>Marcar concluído</button></div></article>) : <div className="study-empty-state"><StudyIcon name="check" size={27} /><h2>Nenhuma pendência</h2><p>Seu cronograma está em dia.</p></div>}</section>
    </main>
  );
}
