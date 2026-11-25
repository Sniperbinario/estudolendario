import { useMemo, useState } from "react";
import { StudyIcon } from "./StudyIcon";

const LEVELS = [
  ["zero", "Começando do zero", "Constrói a base antes de avançar."],
  ["intermediario", "Já estou estudando", "Equilibra base, prática e revisão."],
  ["reta_final", "Reta final", "Prioriza incidência, questões e pontos fracos."],
];

const STRATEGIES = [
  ["equilibrado", "Equilibrado"],
  ["peso_edital", "Peso do edital"],
  ["prioridades", "Matérias escolhidas"],
  ["somente_prioridades", "Somente escolhidas"],
];

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function LiaSchedulePlanner({
  subjects,
  hours,
  weekdays,
  preview,
  loading,
  error,
  onHoursChange,
  onGenerate,
  onApprove,
  onDiscard,
}) {
  const [level, setLevel] = useState("zero");
  const [strategy, setStrategy] = useState("equilibrado");
  const [focusSubjects, setFocusSubjects] = useState([]);
  const [sessionMinutes, setSessionMinutes] = useState(30);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const weeklyHours = useMemo(() => Object.values(hours || {}).reduce((sum, value) => sum + (Number(value) || 0), 0), [hours]);

  const toggleSubject = (subject) => {
    setFocusSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]);
  };

  const generate = () => onGenerate({ level, strategy, focusSubjects, sessionMinutes, startDate, notes });

  return (
    <section className="lia-schedule">
      <header className="lia-schedule__hero">
        <span className="lia-schedule__icon"><StudyIcon name="sparkles" size={22} /></span>
        <div><span>Planejamento pedagógico</span><h2>Cronograma inteligente com a LIA</h2><p>A LIA ordena os pré-requisitos. Você continua decidindo quanto e quando estudar.</p></div>
        <strong>{weeklyHours.toLocaleString("pt-BR")}h por semana</strong>
      </header>

      <div className="lia-schedule__grid">
        <section className="lia-schedule__card">
          <div className="lia-schedule__step"><b>1</b><div><strong>Seu momento</strong><span>Isso muda a profundidade e a ordem da trilha.</span></div></div>
          <div className="lia-schedule__choices">
            {LEVELS.map(([id, label, description]) => <button key={id} className={level === id ? "is-active" : ""} onClick={() => setLevel(id)}><strong>{label}</strong><span>{description}</span></button>)}
          </div>
        </section>

        <section className="lia-schedule__card">
          <div className="lia-schedule__step"><b>2</b><div><strong>Estratégia</strong><span>Escolha o critério principal de prioridade.</span></div></div>
          <div className="lia-schedule__strategy">
            {STRATEGIES.map(([id, label]) => <button key={id} className={strategy === id ? "is-active" : ""} onClick={() => setStrategy(id)}>{label}</button>)}
          </div>
          {strategy.includes("prioridades") && <div className="lia-schedule__subjects">{subjects.map((subject) => <button key={subject} className={focusSubjects.includes(subject) ? "is-active" : ""} onClick={() => toggleSubject(subject)}>{subject}</button>)}</div>}
        </section>

        <section className="lia-schedule__card lia-schedule__card--wide">
          <div className="lia-schedule__step"><b>3</b><div><strong>Sua disponibilidade</strong><span>A LIA nunca ultrapassa as horas definidas aqui.</span></div></div>
          <div className="lia-schedule__hours">
            {weekdays.map((day) => <label key={day}><span>{day.slice(0, 3)}</span><input type="number" min="0" max="12" step="0.5" value={hours[day] ?? 0} onChange={(event) => onHoursChange(day, Math.max(0, Number(event.target.value) || 0))} /><small>horas</small></label>)}
          </div>
          <div className="lia-schedule__settings">
            <label><span>Começar em</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label><span>Duração do bloco</span><select value={sessionMinutes} onChange={(event) => setSessionMinutes(Number(event.target.value))}><option value="25">25 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option></select></label>
            <label className="is-wide"><span>Pedido adicional para a LIA</span><input maxLength="300" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: tenho dificuldade em Direito Administrativo" /></label>
          </div>
          <button className="lia-schedule__generate" disabled={loading || weeklyHours < 0.5 || (strategy.includes("prioridades") && !focusSubjects.length)} onClick={generate}><StudyIcon name="sparkles" size={17} /> {loading ? "A LIA está organizando..." : "Criar trilha inteligente"}</button>
          {error && <p className="lia-schedule__error">{error}</p>}
        </section>
      </div>

      {preview && <section className="lia-schedule__preview">
        <header><div><span>Prévia - nada foi salvo ainda</span><h3>{preview.title}</h3><p>{preview.summary}</p></div><b>{preview.blocks.length} blocos</b></header>
        <div className="lia-schedule__timeline">{preview.blocks.slice(0, 12).map((block, index) => <article key={`${block.data}-${block.chave}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{formatDate(block.data)} - {block.tempo} min</small><strong>{block.nome}</strong><p>{block.topico}</p>{block.reason && <em>{block.reason}</em>}</div></article>)}</div>
        {preview.blocks.length > 12 && <p className="lia-schedule__more">Mais {preview.blocks.length - 12} blocos entram no cronograma completo.</p>}
        <footer><button onClick={onDiscard}>Descartar prévia</button><button className="is-primary" onClick={onApprove}><StudyIcon name="check" size={16} /> Aprovar e salvar cronograma</button></footer>
      </section>}
    </section>
  );
}
