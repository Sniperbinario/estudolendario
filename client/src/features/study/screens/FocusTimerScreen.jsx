import { StudyIcon } from "../components/StudyIcon";

export default function FocusTimerScreen({ task, time, progress, paused, started, suggestions, onStart, onToggle, onReset, onQuestions, onFlashcards, onFinish, onDefer }) {
  if (!task) {
    return (
      <main className="study-page focus-page">
        <header className="study-page__header"><div><span className="study-page__eyebrow">Modo foco</span><h1>Cronômetro de estudo</h1><p>Escolha uma sessão e estude sem distrações. O tempo fica registrado no seu histórico.</p></div></header>
        <section className="focus-presets">
          {[{ name: "Foco rápido", time: 25, copy: "Uma sessão objetiva para ganhar ritmo." }, { name: "Bloco profundo", time: 45, copy: "Tempo ideal para teoria e anotações." }, { name: "Revisão expressa", time: 15, copy: "Relembre pontos-chave sem acumular." }].map((preset) => (
            <button key={preset.name} onClick={() => onStart({ nome: preset.name, topico: preset.copy, tempo: preset.time })}><span><StudyIcon name="timer" size={19} /></span><div><strong>{preset.name}</strong><small>{preset.copy}</small></div><b>{preset.time} min</b></button>
          ))}
        </section>
        {!!suggestions?.length && <section className="focus-suggestions"><div className="section-heading"><div><span>Sugestões do seu plano</span><h2>Continue o que está programado</h2></div></div>{suggestions.slice(0, 4).map((item, index) => <button key={`${item.nome}-${index}`} onClick={() => onStart(item)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.nome}</strong><small>{item.topico || "Sessão do cronograma"}</small></div><b>{item.tempo || 30} min</b><StudyIcon name="play" size={15} /></button>)}</section>}
      </main>
    );
  }

  return (
    <main className="study-page focus-page focus-page--active">
      <header className="study-page__header"><div><span className="study-page__eyebrow">{started ? "Sessão em andamento" : "Sessão preparada"}</span><h1>{task.nome}</h1><p>{task.topico || "Sessão de estudo focado"}</p></div><button className="study-button study-button--quiet" onClick={onDefer}>Continuar depois</button></header>
      <div className="focus-layout">
        <section className="focus-timer-card">
          <div className="focus-timer-ring" style={{ "--timer-progress": `${Math.max(0, Math.min(100, progress)) * 3.6}deg` }}><div><span>Tempo restante</span><strong>{time}</strong><small>{task.tempo || 25} minutos programados</small></div></div>
          <div className="focus-controls"><button className="study-button study-button--primary" onClick={onToggle}><StudyIcon name={!started || paused ? "play" : "pause"} size={16} /> {!started ? "Iniciar cronômetro" : paused ? "Continuar" : "Pausar"}</button><button className="study-button study-button--quiet" onClick={onReset}><StudyIcon name="repeat" size={16} /> Reiniciar</button></div>
        </section>
        <aside className="focus-session-card">
          <span className="study-page__eyebrow">Roteiro da sessão</span><h2>Foco com fechamento</h2>
          <ol><li className="is-current"><span>1</span><div><strong>Estudo focado</strong><small>{task.tempo || 25} minutos</small></div><b>Agora</b></li><li><span>2</span><div><strong>Questões</strong><small>Valide o aprendizado</small></div></li><li><span>3</span><div><strong>Revisão</strong><small>Feche os pontos-chave</small></div></li></ol>
          <div className="focus-session-actions"><button onClick={onQuestions}><StudyIcon name="questions" size={15} /> Resolver questões</button><button onClick={onFlashcards}><StudyIcon name="cards" size={15} /> Abrir flashcards</button></div>
          <button className="study-button study-button--primary focus-finish" onClick={onFinish}><StudyIcon name="check" size={16} /> Concluir sessão</button>
        </aside>
      </div>
    </main>
  );
}
