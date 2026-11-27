import { useMemo, useState } from "react";
import { StudyIcon } from "./StudyIcon";
import { groupScheduleByDate } from "../services/liaScheduleEngine";

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
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export default function LiaSchedulePlanner({ subjects, hours, weekdays, preview, loading, error, planType = "semanal", onHoursChange, onGenerate, onApprove, onDiscard }) {
  const [level, setLevel] = useState("zero");
  const [strategy, setStrategy] = useState("equilibrado");
  const [focusSubjects, setFocusSubjects] = useState([]);
  const [includeFlashcards, setIncludeFlashcards] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const weeklyHours = useMemo(() => Object.values(hours || {}).reduce((sum, value) => sum + (Number(value) || 0), 0), [hours]);
  const previewDays = useMemo(() => preview ? Object.entries(groupScheduleByDate(preview.blocks)).slice(0, 7) : [], [preview]);

  const toggleSubject = (subject) => setFocusSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]);
  const generate = () => onGenerate({ level, strategy, focusSubjects, includeFlashcards, startDate, notes, planType });

  return (
    <section className="lia-schedule">
      <header className="lia-schedule__hero">
        <span className="lia-schedule__icon"><StudyIcon name="sparkles" size={22} /></span>
        <div><span>Planejamento pedagógico</span><h2>Cronograma inteligente com a LIA</h2><p>A LIA analisa dificuldade e pré-requisitos. O sistema valida as horas e distribui as matérias sem concentração.</p></div>
        <strong>{weeklyHours.toLocaleString("pt-BR")}h por semana</strong>
      </header>

      <div className="lia-schedule__grid">
        <section className="lia-schedule__card">
          <div className="lia-schedule__step"><b>1</b><div><strong>Seu momento</strong><span>Isso muda a profundidade e a ordem da trilha.</span></div></div>
          <div className="lia-schedule__choices">
            {LEVELS.map(([id, label, description]) => <button type="button" key={id} className={level === id ? "is-active" : ""} onClick={() => setLevel(id)}><strong>{label}</strong><span>{description}</span></button>)}
          </div>
        </section>

        <section className="lia-schedule__card">
          <div className="lia-schedule__step"><b>2</b><div><strong>Estratégia</strong><span>Escolha o critério principal de prioridade.</span></div></div>
          <div className="lia-schedule__strategy">
            {STRATEGIES.map(([id, label]) => <button type="button" key={id} className={strategy === id ? "is-active" : ""} onClick={() => setStrategy(id)}>{label}</button>)}
          </div>
          {strategy.includes("prioridades") && <div className="lia-schedule__subjects">{subjects.map((subject) => <button type="button" key={subject} className={focusSubjects.includes(subject) ? "is-active" : ""} onClick={() => toggleSubject(subject)}>{subject}</button>)}</div>}
          <label className="lia-schedule__optional"><input type="checkbox" checked={includeFlashcards} onChange={(event) => setIncludeFlashcards(event.target.checked)} /><span><strong>Incluir flashcards quando fizer sentido</strong><small>Opcional. Se desligado, o tempo fica para teoria, questões e revisões.</small></span></label>
        </section>

        <section className="lia-schedule__card lia-schedule__card--wide">
          <div className="lia-schedule__step"><b>3</b><div><strong>Sua disponibilidade</strong><span>A LIA define a duração ideal de cada bloco, sem ultrapassar suas horas.</span></div></div>
          <div className="lia-schedule__hours">
            {weekdays.map((day) => <label key={day}><span>{day.slice(0, 3)}</span><input type="number" min="0" max="12" step="0.5" value={hours[day] ?? 0} onChange={(event) => onHoursChange(day, Math.max(0, Number(event.target.value) || 0))} /><small>horas</small></label>)}
          </div>
          <div className="lia-schedule__settings lia-schedule__settings--auto">
            <label><span>Começar em</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <div className="lia-schedule__automatic"><StudyIcon name="timer" size={17} /><span><strong>Duração inteligente</strong><small>Entre 15 e 55 min conforme atividade e dificuldade.</small></span></div>
            <label className="is-wide"><span>Pedido adicional para a LIA</span><input maxLength="300" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: tenho dificuldade em Direito Administrativo" /></label>
          </div>
          <button type="button" className="lia-schedule__generate" disabled={loading || weeklyHours < 0.5 || (strategy.includes("prioridades") && !focusSubjects.length)} onClick={generate}><StudyIcon name="sparkles" size={17} /> {loading ? "A LIA está analisando..." : "Criar cronograma inteligente"}</button>
          {error && <p className="lia-schedule__error">{error}</p>}
        </section>
      </div>

      {preview && <section className="lia-schedule__preview">
        <header><div><span>Prévia - nada foi salvo ainda</span><h3>{preview.title}</h3><p>{preview.summary}</p></div><b>{preview.blocks.length} atividades</b></header>
        <div className="lia-schedule__week-preview">
          {previewDays.map(([date, dayBlocks]) => <article key={date}><header><div><strong>{formatDate(date)}</strong><small>{dayBlocks.reduce((sum, block) => sum + Number(block.tempo || 0), 0)} min</small></div><span>{new Set(dayBlocks.map((block) => block.nome)).size} matérias</span></header><div>{dayBlocks.map((block, index) => <p key={`${block.chave}-${index}`}><i className={`is-${block.activityType || "theory"}`} /><span><b>{block.activityLabel || "Estudar"}</b><strong>{block.nome}</strong><small>{block.topico}</small></span><em>{block.tempo} min</em></p>)}</div></article>)}
        </div>
        {Object.keys(groupScheduleByDate(preview.blocks)).length > previewDays.length && <p className="lia-schedule__more">A prévia mostra a primeira semana. O plano completo continuará organizado no calendário mensal e semanal.</p>}
        <footer><button type="button" onClick={onDiscard}>Descartar prévia</button><button type="button" className="is-primary" onClick={onApprove}><StudyIcon name="check" size={16} /> Aprovar e salvar cronograma</button></footer>
      </section>}
    </section>
  );
}
