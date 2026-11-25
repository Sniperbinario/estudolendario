import { StudyIcon } from "../components/StudyIcon";

export default function StudyHistoryScreen({ studies, schedules, loading, getDate, onClear, onPlan }) {
  const entries = Object.entries(studies || {});
  const total = entries.reduce((sum, [, topics]) => sum + (Array.isArray(topics) ? topics.length : 0), 0);
  return (
    <main className="study-page history-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Histórico</span><h1>Sua preparação em movimento</h1><p>Veja o conteúdo que já passou pela sua rotina de estudos.</p></div><button className="study-button study-button--quiet" onClick={onPlan}><StudyIcon name="calendar" size={15} /> Abrir planejamento</button></header>
      <section className="history-stats"><article><span>Assuntos estudados</span><strong>{total}</strong><i /></article><article><span>Matérias com progresso</span><strong>{entries.length}</strong><i className="is-mint" /></article><article><span>Planos salvos</span><strong>{schedules.length}</strong><i className="is-violet" /></article></section>
      {loading ? <div className="history-loading">Carregando histórico...</div> : entries.length ? <section className="history-timeline">{entries.map(([subject, topics]) => <article key={subject}><div className="history-timeline__subject"><span>{subject.slice(0, 2).toUpperCase()}</span><div><strong>{subject}</strong><small>{topics.length} assuntos concluídos</small></div></div><div className="history-topic-list">{topics.map((topic, index) => <div key={`${topic}-${index}`}><span><StudyIcon name="check" size={13} /></span><p>{topic}</p><time>{getDate(subject, topic) || "Data não registrada"}</time></div>)}</div></article>)}</section> : <div className="study-empty-state"><StudyIcon name="clock" size={25} /><h2>Seu histórico ainda está vazio</h2><p>Conclua uma sessão para começar a acompanhar sua trajetória.</p><button className="study-button study-button--primary" onClick={onPlan}>Montar plano</button></div>}
      {!!entries.length && <button className="performance-reset" onClick={onClear}>Limpar histórico de estudos</button>}
    </main>
  );
}
