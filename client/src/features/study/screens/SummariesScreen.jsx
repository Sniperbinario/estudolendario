import { useEffect, useMemo, useState } from "react";
import { StudyIcon } from "../components/StudyIcon";

const fields = [
  ["conceito", "Conceito central", "Explique o tópico com suas próprias palavras."],
  ["pontosChave", "Pontos-chave", "Liste o que mais costuma ser cobrado."],
  ["dicasProva", "Pegadinhas e macetes", "Registre diferenças, exceções e erros comuns."],
  ["legislacao", "Base legal", "Anote leis, artigos e referências importantes."],
  ["livre", "Anotações livres", "Use este espaço para completar seu raciocínio."],
];

export default function SummariesScreen({
  examName, blocks, summaries, manualQuestions, errorBook, completedTopics, loading,
  subject, topic, tab, saveStatus, onSelectSubject, onSelectTopic, onChangeTab,
  onSaveSummary, onSaveSession, onSaveError,
}) {
  const subjects = useMemo(() => Object.values(blocks || {}).flat(), [blocks]);
  const currentSubject = subjects.find((item) => item.nome === subject);
  const topics = currentSubject?.topicos || [];
  const key = topic ? `${subject}|||${topic}` : subject;
  const currentSummary = summaries[key] || {};
  const sessions = [...(manualQuestions[key]?.sessoes || [])].reverse();
  const errors = [...(errorBook[key] || [])].reverse();
  const [draft, setDraft] = useState(currentSummary);
  const [session, setSession] = useState({ total: "", hits: "" });
  const [error, setError] = useState({ questao: "", erro: "", correto: "" });

  useEffect(() => setDraft(currentSummary), [key, summaries]);

  if (loading) return <main className="study-page summary-loading"><span /><p>Carregando seus resumos...</p></main>;

  const saveSession = async () => {
    const total = Math.max(0, Number(session.total) || 0);
    const hits = Math.min(total, Math.max(0, Number(session.hits) || 0));
    if (!total) return;
    await onSaveSession(key, topic, hits, total - hits);
    setSession({ total: "", hits: "" });
  };

  const saveError = async () => {
    if (!error.questao && !error.erro) return;
    await onSaveError(key, { ...error, assunto: topic });
    setError({ questao: "", erro: "", correto: "" });
  };

  return (
    <main className="study-page summaries-page">
      <header className="study-page__header">
        <div><span className="study-page__eyebrow">Base de conhecimento</span><h1>Resumos e anotações</h1><p>Transforme o edital em um material de revisão feito por você.</p></div>
        <div className="study-context-card"><span>Concurso ativo</span><strong>{examName}</strong></div>
      </header>

      <section className="summary-subject-picker">
        <div><span>Matéria</span><strong>{subject || "Escolha uma matéria"}</strong></div>
        <div className="summary-subject-picker__list">
          {subjects.map((item) => <button className={subject === item.nome ? "is-active" : ""} key={item.nome} onClick={() => { onSelectSubject(item.nome); onSelectTopic(""); }}>{item.nome}</button>)}
        </div>
      </section>

      {subject ? (
        <div className="summary-workspace">
          <aside className="summary-topics">
            <div><span>Tópicos da matéria</span><b>{topics.length}</b></div>
            <nav>
              {topics.map((item, index) => {
                const topicKey = `${subject}|||${item}`;
                const hasContent = Object.values(summaries[topicKey] || {}).some(Boolean);
                const complete = completedTopics.has(topicKey);
                return (
                  <button className={topic === item ? "is-active" : ""} key={item} onClick={() => { onSelectTopic(item); onChangeTab("resumo"); }}>
                    <span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p>{(hasContent || complete) && <i />}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="summary-editor">
            {!topic ? (
              <div className="summary-editor__empty"><StudyIcon name="note" size={26} /><h2>Selecione um tópico</h2><p>As anotações, sessões de questões e erros ficam organizados por assunto.</p></div>
            ) : (
              <>
                <header className="summary-editor__header"><div><span>{subject}</span><h2>{topic}</h2></div><span>{completedTopics.has(key) ? "Tópico concluído" : "Em estudo"}</span></header>
                <div className="summary-tabs">
                  {[["resumo", "note", "Resumo"], ["questoes", "questions", "Questões"], ["caderno", "alert", "Erros"]].map(([id, icon, label]) => <button className={tab === id ? "is-active" : ""} key={id} onClick={() => onChangeTab(id)}><StudyIcon name={icon} size={15} />{label}</button>)}
                </div>

                {tab === "resumo" && (
                  <div className="summary-form">
                    <div className="summary-form__status"><span>Suas alterações ficam salvas neste tópico.</span><button className="study-button study-button--primary" onClick={() => onSaveSummary(key, draft)}><StudyIcon name="save" size={15} />{saveStatus === "salvando" ? "Salvando..." : saveStatus === "salvo" ? "Salvo" : "Salvar resumo"}</button></div>
                    {fields.map(([field, label, placeholder]) => (
                      <label key={field}><span>{label}</span><textarea rows={field === "livre" ? 6 : 4} value={draft[field] || ""} placeholder={placeholder} onChange={(event) => setDraft((value) => ({ ...value, [field]: event.target.value }))} /></label>
                    ))}
                  </div>
                )}

                {tab === "questoes" && (
                  <div className="summary-data-panel">
                    <div className="summary-data-panel__form"><div><span>Registrar sessão</span><h3>Como foi seu treino?</h3></div><label>Total de questões<input type="number" min="0" value={session.total} onChange={(event) => setSession((value) => ({ ...value, total: event.target.value }))} /></label><label>Acertos<input type="number" min="0" value={session.hits} onChange={(event) => setSession((value) => ({ ...value, hits: event.target.value }))} /></label><button className="study-button study-button--primary" onClick={saveSession}>Salvar sessão</button></div>
                    <div className="summary-history"><h3>Histórico</h3>{sessions.length ? sessions.map((item, index) => { const total = (item.certas || 0) + (item.erradas || 0); const rate = total ? Math.round((item.certas / total) * 100) : 0; return <article key={index}><div><strong>{item.data}</strong><span>{total} questões</span></div><p><b>{item.certas || 0}</b> acertos · <b>{item.erradas || 0}</b> erros</p><em>{rate}%</em></article>; }) : <p className="summary-muted">Nenhuma sessão registrada neste tópico.</p>}</div>
                  </div>
                )}

                {tab === "caderno" && (
                  <div className="summary-data-panel">
                    <div className="error-form"><span>Novo registro</span><h3>Transforme o erro em revisão</h3><textarea rows="3" placeholder="O que a questão perguntava?" value={error.questao} onChange={(event) => setError((value) => ({ ...value, questao: event.target.value }))} /><textarea rows="3" placeholder="Por que você errou?" value={error.erro} onChange={(event) => setError((value) => ({ ...value, erro: event.target.value }))} /><textarea rows="3" placeholder="Qual era o raciocínio correto?" value={error.correto} onChange={(event) => setError((value) => ({ ...value, correto: event.target.value }))} /><button className="study-button study-button--primary" onClick={saveError}>Salvar no caderno</button></div>
                    <div className="error-list"><h3>Erros registrados</h3>{errors.length ? errors.map((item, index) => <article key={index}><span>{item.data}</span>{item.questao && <p><b>Questão</b>{item.questao}</p>}{item.erro && <p><b>Meu erro</b>{item.erro}</p>}{item.correto && <p><b>Correto</b>{item.correto}</p>}</article>) : <p className="summary-muted">Nenhum erro registrado neste tópico.</p>}</div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      ) : <div className="study-empty-state"><StudyIcon name="book" size={25} /><h2>Comece escolhendo uma matéria</h2><p>Seus tópicos aparecerão aqui, prontos para organizar.</p></div>}
    </main>
  );
}
