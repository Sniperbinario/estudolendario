import { StudyIcon } from "../components/StudyIcon";

export default function PerformanceScreen({ performance, streak, onQuestions, onRefresh, onReset }) {
  const subjects = Object.entries(performance?.porMateria || {}).map(([name, data]) => {
    const total = (data.acertos || 0) + (data.erros || 0);
    return { name, total, hits: data.acertos || 0, rate: total ? Math.round(((data.acertos || 0) / total) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate);
  const total = (performance?.geral?.acertos || 0) + (performance?.geral?.erros || 0);
  const accuracy = total ? Math.round(((performance?.geral?.acertos || 0) / total) * 100) : 0;
  const best = subjects[0];
  const priority = [...subjects].filter((item) => item.total).sort((a, b) => a.rate - b.rate)[0];

  return (
    <main className="study-page performance-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Evolução</span><h1>Seu desempenho</h1><p>Entenda onde você já está forte e qual matéria merece o próximo bloco.</p></div><button className="study-button study-button--quiet" onClick={onRefresh}><StudyIcon name="repeat" size={15} /> Atualizar dados</button></header>
      <section className="performance-stats"><article><span>Questões resolvidas</span><strong>{total}</strong><small>histórico acumulado</small><i /></article><article><span>Aproveitamento</span><strong>{accuracy}%</strong><small>{accuracy >= 70 ? "acima da faixa de consolidação" : "continue praticando"}</small><i className="is-mint" /></article><article><span>Sequência atual</span><strong>{streak} dias</strong><small>consistência de estudo</small><i className="is-violet" /></article></section>
      {subjects.length ? <div className="performance-layout"><section className="performance-chart"><div className="section-heading"><div><span>Aproveitamento por matéria</span><h2>Onde está sua maior oportunidade</h2></div></div>{subjects.map((item) => <article key={item.name}><div><strong>{item.name}</strong><span>{item.hits} acertos em {item.total}</span></div><div className="performance-bar"><i className={item.rate >= 70 ? "is-good" : item.rate < 50 ? "is-low" : ""} style={{ width: `${item.rate}%` }} /></div><b>{item.rate}%</b></article>)}</section><aside><section className="performance-insight is-positive"><StudyIcon name="check" size={18} /><div><span>Ponto forte</span><strong>{best?.name}</strong><p>{best?.rate}% de aproveitamento. Mantenha com revisões curtas.</p></div></section><section className="performance-insight"><StudyIcon name="target" size={18} /><div><span>Prioridade</span><strong>{priority?.name}</strong><p>{priority?.rate}% de aproveitamento. Recomendamos 30 minutos de questões.</p><button onClick={onQuestions}>Treinar agora <StudyIcon name="arrow" size={14} /></button></div></section></aside></div> : <div className="study-empty-state"><StudyIcon name="chart" size={26} /><h2>Seu painel começa com a primeira questão</h2><p>Resolva uma bateria para acompanhar sua evolução por matéria.</p><button className="study-button study-button--primary" onClick={onQuestions}>Responder questões</button></div>}
      {!!total && <button className="performance-reset" onClick={onReset}>Zerar histórico de desempenho</button>}
    </main>
  );
}
