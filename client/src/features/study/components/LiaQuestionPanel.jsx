import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StudyIcon } from "./StudyIcon";
import { askLia, getLiaUsage } from "../services/studyApi";

const beforeActions = [
  ["hint", "Dê uma dica", "target"],
  ["concept", "Explique o conceito", "book"],
];
const afterActions = [
  ["explain", "Explicar resolução", "sparkles"],
  ["alternatives", "Analisar alternativas", "list"],
  ["example", "Dar um exemplo", "book"],
  ["simplify", "Explicar mais simples", "user"],
  ["flashcard", "Criar flashcard", "cards"],
];

function answerLabel(question, value) {
  if (value == null) return null;
  if (question.tipo === "multipla_escolha") return `${["A", "B", "C", "D", "E"][Number(value)] || ""}) ${question.alternativas?.[Number(value)] || ""}`.trim();
  return value === true ? "Certo" : "Errado";
}

export default function LiaQuestionPanel({ question, subject, topic, selected, correctAnswer, answered, onSaveNote, onSaveFlashcard }) {
  const [usage, setUsage] = useState({ used: 0, limit: 100, remaining: 100 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const actions = answered ? afterActions : beforeActions;
  const usagePercent = Math.min(100, Math.round((usage.used / Math.max(usage.limit, 1)) * 100));

  useEffect(() => {
    getLiaUsage().then(setUsage).catch(() => {});
  }, []);

  useEffect(() => { setResult(null); setError(""); setSaved(""); }, [question?.id, question?.enunciado]);

  const context = useMemo(() => ({
    subject: subject || question?.materia || "",
    topic: topic || question?.assunto || question?.topico || "",
    board: question?.banca || "",
    year: question?.ano || "",
    statement: question?.enunciado || "",
    options: question?.tipo === "multipla_escolha" ? question?.alternativas || [] : ["Certo", "Errado"],
    selectedAnswer: answered ? answerLabel(question, selected) : null,
    correctAnswer: answered ? answerLabel(question, correctAnswer) : null,
    explanation: answered ? question?.explicacao || "" : "",
  }), [question, subject, topic, selected, correctAnswer, answered]);

  const ask = async (action) => {
    setLoading(action);
    setError("");
    setSaved("");
    try {
      const response = await askLia(action, context);
      setResult(response);
      if (response.usage) setUsage(response.usage);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading("");
    }
  };

  const saveNote = async () => {
    if (!result?.reply) return;
    await onSaveNote(result.reply);
    setSaved("Explicação salva em Meus resumos.");
  };

  const saveFlashcard = async () => {
    if (!result?.flashcard) return;
    await onSaveFlashcard(result.flashcard);
    setSaved("Flashcard salvo no seu baralho.");
  };

  return (
    <section className="lia-panel">
      <header>
        <span className="lia-avatar"><StudyIcon name="sparkles" size={18} /></span>
        <div><span>Tutora de estudos</span><h2>Pergunte à LIA</h2></div>
        <b>{usage.remaining}/{usage.limit}</b>
      </header>
      <div className="lia-usage"><i style={{ width: `${usagePercent}%` }} /><span>{usage.remaining} consultas disponíveis neste mês</span></div>
      <p className="lia-intro">{answered ? "Agora posso explicar a correção e transformar este aprendizado em revisão." : "Peça uma pista sem receber o gabarito antes de tentar."}</p>
      <div className="lia-actions">
        {actions.map(([id, label, icon]) => <button key={id} disabled={Boolean(loading) || usage.remaining <= 0} onClick={() => ask(id)}><StudyIcon name={icon} size={15} />{loading === id ? "Pensando..." : label}</button>)}
      </div>
      {error && <p className="lia-error">{error}</p>}
      {result?.kind === "text" && <div className="lia-answer"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result.reply}</ReactMarkdown><button onClick={saveNote}><StudyIcon name="note" size={14} /> Salvar nos meus resumos</button></div>}
      {result?.kind === "flashcard" && <div className="lia-flashcard"><span>Frente</span><strong>{result.flashcard.front}</strong><span>Verso</span><p>{result.flashcard.back}</p><button onClick={saveFlashcard}><StudyIcon name="save" size={14} /> Salvar flashcard</button></div>}
      {saved && <p className="lia-saved"><StudyIcon name="check" size={13} /> {saved}</p>}
      <small>A LIA pode errar. Confira leis, datas e o gabarito oficial.</small>
    </section>
  );
}
