import { useMemo, useState } from "react";
import { StudyIcon } from "../components/StudyIcon";

const today = () => new Date().toISOString().slice(0, 10);
const emptyEntry = () => ({ date: today(), subject: "", hours: "", questions: "", hits: "", examPercent: "", discursiveScore: "" });

export default function PerformanceScreen({
  performance, streak, examProgress, automaticMinutes = 0, discursiveEvolution = null, manualEntries = [], subjects = [],
  onQuestions, onRefresh, onReset, onSaveManual, onDeleteManual,
}) {
  const [entry, setEntry] = useState(emptyEntry);
  const [saving, setSaving] = useState(false);

  const indicators = useMemo(() => {
    const automatic = performance?.porMateria || {};
    const bySubject = {};
    Object.entries(automatic).forEach(([name, data]) => {
      bySubject[name] = { hits: Number(data.acertos) || 0, misses: Number(data.erros) || 0 };
    });
    manualEntries.forEach((item) => {
      if (!item.subject || !item.questions) return;
      const current = bySubject[item.subject] || { hits: 0, misses: 0 };
      const hits = Math.min(Number(item.questions) || 0, Number(item.hits) || 0);
      bySubject[item.subject] = { hits: current.hits + hits, misses: current.misses + Math.max(0, (Number(item.questions) || 0) - hits) };
    });
    const subjectRows = Object.entries(bySubject).map(([name, data]) => {
      const total = data.hits + data.misses;
      return { name, total, hits: data.hits, rate: total ? Math.round((data.hits / total) * 100) : 0 };
    }).filter((item) => item.total).sort((a, b) => b.rate - a.rate);
    const automaticHits = Number(performance?.geral?.acertos) || 0;
    const automaticMisses = Number(performance?.geral?.erros) || 0;
    const manualQuestions = manualEntries.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
    const manualHits = manualEntries.reduce((sum, item) => sum + Math.min(Number(item.questions) || 0, Number(item.hits) || 0), 0);
    const totalQuestions = automaticHits + automaticMisses + manualQuestions;
    const totalHits = automaticHits + manualHits;
    const minutes = manualEntries.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
    const manualExam = [...manualEntries].reverse().find((item) => Number.isFinite(Number(item.examPercent)) && item.examPercent !== "")?.examPercent;
    const discursive = manualEntries.filter((item) => item.discursiveScore !== "").map((item) => Number(item.discursiveScore)).filter(Number.isFinite);
    const evolution = discursive.length > 1 ? Math.round((discursive[discursive.length - 1] - discursive[0]) * 10) / 10 : null;
    return {
      subjects: subjectRows,
      totalQuestions,
      accuracy: totalQuestions ? Math.round((totalHits / totalQuestions) * 100) : 0,
      minutes: minutes + (Number(automaticMinutes) || 0),
      examPercent: manualExam === undefined ? examProgress : Math.max(examProgress || 0, Number(manualExam) || 0),
      evolution: evolution === null ? discursiveEvolution : evolution,
    };
  }, [performance, manualEntries, examProgress, automaticMinutes, discursiveEvolution]);

  const best = indicators.subjects[0];
  const priority = [...indicators.subjects].sort((a, b) => a.rate - b.rate)[0];

  const submit = async (event) => {
    event.preventDefault();
    const hasValue = Number(entry.hours) || Number(entry.questions) || entry.examPercent !== "" || entry.discursiveScore !== "";
    if (!hasValue) return;
    setSaving(true);
    try {
      await onSaveManual({
        date: entry.date || today(),
        subject: entry.subject,
        minutes: Math.round((Number(entry.hours) || 0) * 60),
        questions: Math.max(0, Number(entry.questions) || 0),
        hits: Math.min(Math.max(0, Number(entry.questions) || 0), Math.max(0, Number(entry.hits) || 0)),
        examPercent: entry.examPercent === "" ? "" : Math.min(100, Math.max(0, Number(entry.examPercent) || 0)),
        discursiveScore: entry.discursiveScore === "" ? "" : Math.min(100, Math.max(0, Number(entry.discursiveScore) || 0)),
      });
      setEntry(emptyEntry());
    } finally { setSaving(false); }
  };

  return (
    <main className="study-page performance-page">
      <header className="study-page__header">
        <div><span className="study-page__eyebrow">Acompanhamento</span><h1>Indicadores da preparação</h1><p>Dados da plataforma e estudos feitos por fora, reunidos no mesmo painel.</p></div>
        <button className="study-button study-button--quiet" onClick={onRefresh}><StudyIcon name="repeat" size={15} /> Atualizar dados</button>
      </header>

      <section className="indicator-overview">
        <article><StudyIcon name="clock" /><span>Horas líquidas</span><strong>{Math.floor(indicators.minutes / 60)}h {indicators.minutes % 60}min</strong><small>plataforma + lançamentos</small></article>
        <article><StudyIcon name="questions" /><span>Questões resolvidas</span><strong>{indicators.totalQuestions}</strong><small>total combinado</small></article>
        <article><StudyIcon name="chart" /><span>Acertos por matéria</span><strong>{best ? `${best.rate}%` : "—"}</strong><small>{best?.name || "sem questões ainda"}</small></article>
        <article><StudyIcon name="file" /><span>Edital estudado</span><strong>{indicators.examPercent || 0}%</strong><small>progresso consolidado</small></article>
        <article><StudyIcon name="note" /><span>Provas discursivas</span><strong>{indicators.evolution === null ? "—" : `${indicators.evolution > 0 ? "+" : ""}${indicators.evolution}`}</strong><small>evolução entre notas</small></article>
      </section>

      <section className="manual-indicators">
        <div className="manual-indicators__heading"><div><span>Lançamento manual</span><h2>Estudou fora da plataforma?</h2><p>Registre o que fez para não perder nenhuma parte da sua evolução.</p></div><StudyIcon name="edit" size={22} /></div>
        <form className="manual-indicators__form" onSubmit={submit}>
          <label><span>Data</span><input type="date" value={entry.date} onChange={(event) => setEntry({ ...entry, date: event.target.value })} /></label>
          <label><span>Matéria</span><select value={entry.subject} onChange={(event) => setEntry({ ...entry, subject: event.target.value })}><option value="">Geral</option>{subjects.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label><span>Horas líquidas</span><input type="number" min="0" step="0.25" placeholder="Ex.: 1,5" value={entry.hours} onChange={(event) => setEntry({ ...entry, hours: event.target.value })} /></label>
          <label><span>Questões</span><input type="number" min="0" placeholder="0" value={entry.questions} onChange={(event) => setEntry({ ...entry, questions: event.target.value })} /></label>
          <label><span>Acertos</span><input type="number" min="0" max={entry.questions || undefined} placeholder="0" value={entry.hits} onChange={(event) => setEntry({ ...entry, hits: event.target.value })} /></label>
          <label><span>Edital concluído (%)</span><input type="number" min="0" max="100" placeholder="0 a 100" value={entry.examPercent} onChange={(event) => setEntry({ ...entry, examPercent: event.target.value })} /></label>
          <label><span>Nota discursiva</span><input type="number" min="0" max="100" step="0.1" placeholder="Opcional" value={entry.discursiveScore} onChange={(event) => setEntry({ ...entry, discursiveScore: event.target.value })} /></label>
          <button className="study-button study-button--primary" type="submit" disabled={saving}><StudyIcon name="save" size={15} /> {saving ? "Salvando..." : "Adicionar registro"}</button>
        </form>
      </section>

      {manualEntries.length > 0 && <section className="manual-history"><div className="section-heading"><div><span>Registros recentes</span><h2>Estudo lançado manualmente</h2></div></div>{[...manualEntries].reverse().slice(0, 8).map((item) => <article key={item.id}><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}</time><div><strong>{item.subject || "Estudo geral"}</strong><span>{item.minutes ? `${Math.floor(item.minutes / 60)}h ${item.minutes % 60}min` : "Sem tempo"} · {item.questions || 0} questões</span></div><div>{item.examPercent !== "" && <span>Edital {item.examPercent}%</span>}{item.discursiveScore !== "" && <span>Discursiva {item.discursiveScore}</span>}</div><button onClick={() => onDeleteManual(item.id)} aria-label="Excluir registro"><StudyIcon name="trash" size={16} /></button></article>)}</section>}

      {indicators.subjects.length ? <div className="performance-layout"><section className="performance-chart"><div className="section-heading"><div><span>Aproveitamento por matéria</span><h2>Onde está sua maior oportunidade</h2></div></div>{indicators.subjects.map((item) => <article key={item.name}><div><strong>{item.name}</strong><span>{item.hits} acertos em {item.total}</span></div><div className="performance-bar"><i className={item.rate >= 70 ? "is-good" : item.rate < 50 ? "is-low" : ""} style={{ width: `${item.rate}%` }} /></div><b>{item.rate}%</b></article>)}</section><aside><section className="performance-insight is-positive"><StudyIcon name="check" size={18} /><div><span>Ponto forte</span><strong>{best?.name}</strong><p>{best?.rate}% de aproveitamento. Mantenha com revisões curtas.</p></div></section><section className="performance-insight"><StudyIcon name="target" size={18} /><div><span>Prioridade</span><strong>{priority?.name}</strong><p>{priority?.rate}% de aproveitamento. Recomendamos 30 minutos de questões.</p><button onClick={onQuestions}>Treinar agora <StudyIcon name="arrow" size={14} /></button></div></section></aside></div> : <div className="study-empty-state"><StudyIcon name="chart" size={26} /><h2>Seus indicadores começam com o primeiro registro</h2><p>Use o formulário acima ou resolva questões na plataforma.</p><button className="study-button study-button--primary" onClick={onQuestions}>Responder questões</button></div>}
      {!!indicators.totalQuestions && <button className="performance-reset" onClick={onReset}>Zerar histórico automático de questões</button>}
    </main>
  );
}
