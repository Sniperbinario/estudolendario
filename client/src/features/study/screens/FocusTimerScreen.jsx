import { useEffect, useRef, useState } from "react";
import { StudyIcon } from "../components/StudyIcon";

const PRESETS = [
  { name: "Pomodoro clássico", time: 25, breakMinutes: 5, copy: "25 minutos de foco e 5 minutos de pausa." },
  { name: "Foco profundo", time: 50, breakMinutes: 10, copy: "50 minutos de foco e 10 minutos de pausa." },
  { name: "Revisão expressa", time: 15, breakMinutes: 0, copy: "Uma sessão curta, sem pausa automática." },
];

export default function FocusTimerScreen({
  task, time, progress, paused, started, phase, completion, suggestions,
  onStart, onToggle, onReset, onQuestions, onFlashcards, onFinish, onDefer,
  onStartBreak, onContinueFocus,
}) {
  const [customFocus, setCustomFocus] = useState(30);
  const [customBreak, setCustomBreak] = useState(5);
  const [miniTimer, setMiniTimer] = useState(false);
  const pipWindowRef = useRef(null);

  const updatePip = () => {
    const pip = pipWindowRef.current;
    if (!pip || pip.closed || !task) return;
    const root = pip.document.getElementById("timer-root");
    if (!root) return;
    root.innerHTML = `<span>${phase === "break" ? "PAUSA" : "FOCO"}</span><strong>${time}</strong><p>${String(task.nome || "Sessão de estudo").replace(/[<>]/g, "")}</p><div><button id="toggle">${!started || paused ? "Continuar" : "Pausar"}</button><button id="finish">Concluir</button></div>`;
    root.querySelector("#toggle")?.addEventListener("click", onToggle);
    root.querySelector("#finish")?.addEventListener("click", onFinish);
  };

  useEffect(() => {
    updatePip();
  });

  useEffect(() => () => {
    try { pipWindowRef.current?.close(); } catch {}
  }, []);

  const openPictureInPicture = async () => {
    if (!task) return;
    if (!("documentPictureInPicture" in window)) {
      setMiniTimer(true);
      return;
    }
    try {
      const pip = await window.documentPictureInPicture.requestWindow({ width: 330, height: 250 });
      pipWindowRef.current = pip;
      pip.document.head.innerHTML = `<meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#07182b;color:#eef6ff;font-family:Arial,sans-serif}#timer-root{height:100vh;padding:20px;display:grid;place-items:center;text-align:center}span{color:#38d5b3;font-size:11px;font-weight:800;letter-spacing:.15em}strong{font-size:50px;line-height:1}p{margin:0;color:#a9bdd2;font-size:12px}div{display:flex;gap:8px}button{padding:9px 14px;border:1px solid #31516f;border-radius:10px;color:#eef6ff;background:#17314d;font-weight:700}button:first-child{border:0;color:#05251d;background:#42d5b5}</style>`;
      pip.document.body.innerHTML = '<main id="timer-root"></main>';
      pip.addEventListener("pagehide", () => { pipWindowRef.current = null; });
      updatePip();
    } catch {
      setMiniTimer(true);
    }
  };

  if (!task) {
    return (
      <main className="study-page focus-page">
        <header className="study-page__header"><div><span className="study-page__eyebrow">Modo foco</span><h1>Prepare seu cronômetro</h1><p>Escolha o tempo primeiro. A contagem só começa quando você apertar “Iniciar cronômetro”.</p></div></header>
        <section className="focus-presets">
          {PRESETS.map((preset) => <button key={preset.name} onClick={() => onStart({ nome: preset.name, topico: preset.copy, tempo: preset.time, timerMode: preset.breakMinutes ? "pomodoro" : "focus", breakMinutes: preset.breakMinutes })}><span><StudyIcon name="timer" size={19} /></span><div><strong>{preset.name}</strong><small>{preset.copy}</small></div><b>{preset.breakMinutes ? `${preset.time}/${preset.breakMinutes}` : `${preset.time} min`}</b></button>)}
        </section>
        <section className="focus-custom">
          <div><span className="study-page__eyebrow">Personalizado</span><h2>Monte seu próprio ciclo</h2><p>Defina foco e pausa. Coloque pausa em zero se quiser apenas o cronômetro.</p></div>
          <label><span>Foco</span><input type="number" min="5" max="180" value={customFocus} onChange={(event) => setCustomFocus(Math.max(5, Number(event.target.value) || 5))} /><small>min</small></label>
          <label><span>Pausa</span><input type="number" min="0" max="60" value={customBreak} onChange={(event) => setCustomBreak(Math.max(0, Number(event.target.value) || 0))} /><small>min</small></label>
          <button className="study-button study-button--primary" onClick={() => onStart({ nome: "Sessão personalizada", topico: `${customFocus} minutos de foco${customBreak ? ` e ${customBreak} minutos de pausa` : ""}.`, tempo: customFocus, timerMode: customBreak ? "pomodoro" : "focus", breakMinutes: customBreak })}><StudyIcon name="check" size={16} /> Preparar sessão</button>
        </section>
        {!!suggestions?.length && <section className="focus-suggestions"><div className="section-heading"><div><span>Sugestões do seu plano</span><h2>Continue o que está programado</h2></div></div>{suggestions.slice(0, 4).map((item, index) => <button key={`${item.nome}-${index}`} onClick={() => onStart(item)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.nome}</strong><small>{item.activityLabel ? `${item.activityLabel} · ` : ""}{item.topico || "Sessão do cronograma"}</small></div><b>{item.tempo || 30} min</b><StudyIcon name="play" size={15} /></button>)}</section>}
      </main>
    );
  }

  return (
    <main className="study-page focus-page focus-page--active">
      <header className="study-page__header"><div><span className="study-page__eyebrow">{phase === "break" ? "Pausa de recuperação" : started ? "Sessão em andamento" : "Sessão preparada"}</span><h1>{phase === "break" ? "Respire e recupere o foco" : task.nome}</h1><p>{phase === "break" ? "A pausa não entra nas suas horas líquidas de estudo." : task.topico || "Sessão de estudo focado"}</p></div><div className="focus-header-actions"><button className="study-button study-button--quiet" onClick={openPictureInPicture}><StudyIcon name="open" size={15} /> Janela flutuante</button><button className="study-button study-button--quiet" onClick={onDefer}>Continuar depois</button></div></header>
      <div className="focus-layout">
        <section className="focus-timer-card">
          <div className={`focus-timer-ring ${phase === "break" ? "is-break" : ""}`} style={{ "--timer-progress": `${Math.max(0, Math.min(100, progress)) * 3.6}deg` }}><div><span>{phase === "break" ? "Tempo de pausa" : "Tempo restante"}</span><strong>{time}</strong><small>{phase === "break" ? `${task.breakMinutes || 5} minutos de pausa` : `${task.tempo || 25} minutos de foco`}</small></div></div>
          {!completion && <div className="focus-controls"><button className="study-button study-button--primary" onClick={onToggle}><StudyIcon name={!started || paused ? "play" : "pause"} size={16} /> {!started ? "Iniciar cronômetro" : paused ? "Continuar" : "Pausar"}</button><button className="study-button study-button--quiet" onClick={onReset}><StudyIcon name="repeat" size={16} /> Reiniciar</button></div>}
          {completion === "focus" && <div className="focus-completion"><span><StudyIcon name="check" size={20} /></span><h3>Bloco de foco concluído</h3><p>Você escolhe o próximo passo.</p><div>{task.breakMinutes > 0 && <button className="study-button study-button--primary" onClick={onStartBreak}>Começar pausa de {task.breakMinutes} min</button>}<button className="study-button study-button--quiet" onClick={onContinueFocus}>Continuar focado</button><button className="study-button study-button--quiet" onClick={onFinish}>Concluir sessão</button></div></div>}
          {completion === "break" && <div className="focus-completion"><span><StudyIcon name="sun" size={20} /></span><h3>Pausa concluída</h3><p>Quando estiver pronto, volte ao conteúdo.</p><div><button className="study-button study-button--primary" onClick={onContinueFocus}>Voltar ao foco</button><button className="study-button study-button--quiet" onClick={onFinish}>Encerrar sessão</button></div></div>}
        </section>
        <aside className="focus-session-card">
          <span className="study-page__eyebrow">Roteiro da sessão</span><h2>{task.breakMinutes > 0 ? `Foco ${task.tempo} min + pausa ${task.breakMinutes} min` : "Foco com fechamento"}</h2>
          <ol><li className={phase === "focus" ? "is-current" : ""}><span>1</span><div><strong>Estudo focado</strong><small>{task.tempo || 25} minutos</small></div>{phase === "focus" && <b>Agora</b>}</li>{task.breakMinutes > 0 && <li className={phase === "break" ? "is-current" : ""}><span>2</span><div><strong>Pausa</strong><small>{task.breakMinutes} minutos</small></div>{phase === "break" && <b>Agora</b>}</li>}<li><span>{task.breakMinutes > 0 ? 3 : 2}</span><div><strong>Questões ou revisão</strong><small>Valide o aprendizado</small></div></li></ol>
          <div className="focus-session-actions"><button onClick={onQuestions}><StudyIcon name="questions" size={15} /> Resolver questões</button><button onClick={onFlashcards}><StudyIcon name="cards" size={15} /> Abrir flashcards</button></div>
          <button className="study-button study-button--primary focus-finish" onClick={onFinish}><StudyIcon name="check" size={16} /> Concluir sessão</button>
        </aside>
      </div>
      {miniTimer && <aside className="focus-mini-timer"><button aria-label="Fechar" onClick={() => setMiniTimer(false)}><StudyIcon name="close" size={14} /></button><span>{phase === "break" ? "Pausa" : "Foco"}</span><strong>{time}</strong><small>{task.nome}</small><button onClick={onToggle}><StudyIcon name={!started || paused ? "play" : "pause"} size={14} /> {!started || paused ? "Continuar" : "Pausar"}</button></aside>}
    </main>
  );
}
