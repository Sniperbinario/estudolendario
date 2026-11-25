import { StudyIcon } from "../components/StudyIcon";

export default function DailyChallengeScreen({ completed, onComplete, onFocus }) {
  return (
    <main className="study-page challenge-page"><section className="challenge-card"><span className="challenge-card__icon"><StudyIcon name={completed ? "check" : "target"} size={29} /></span><span className="study-page__eyebrow">Desafio diário</span><h1>{completed ? "Missão cumprida por hoje" : "25 minutos sem interrupções"}</h1><p>{completed ? "Você protegeu sua consistência. Amanhã tem um novo desafio." : "Escolha o conteúdo mais difícil do dia, ative o cronômetro e sustente o foco até o final."}</p><div className="challenge-steps"><span><b>01</b>Escolha um tópico</span><span><b>02</b>Foque por 25 min</span><span><b>03</b>Marque como concluído</span></div><div className="result-actions">{!completed && <button className="study-button study-button--primary" onClick={onFocus}><StudyIcon name="timer" size={16} /> Abrir cronômetro</button>}{!completed && <button className="study-button study-button--quiet" onClick={onComplete}><StudyIcon name="check" size={16} /> Marcar concluído</button>}</div></section></main>
  );
}
