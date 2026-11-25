import { StudyIcon } from "../components/StudyIcon";

export default function SessionResultScreen({ hits, misses, skipped, onMore, onDashboard, onReview }) {
  const answered = hits + misses;
  const rate = answered ? Math.round((hits / answered) * 100) : 0;
  const message = rate >= 80 ? "Ótimo domínio nesta sessão" : rate >= 60 ? "Boa base, agora consolide os erros" : "Seus erros já indicam o próximo passo";
  return (
    <main className="study-page result-page">
      <section className="result-card">
        <span className="result-card__icon"><StudyIcon name={rate >= 70 ? "check" : "target"} size={27} /></span>
        <span className="study-page__eyebrow">Sessão concluída</span><h1>{message}</h1><p>Use este resultado para decidir o próximo bloco, sem perder o ritmo.</p>
        <div className="result-score"><div className="result-score__ring" style={{ "--result-progress": `${rate * 3.6}deg` }}><span><strong>{rate}%</strong><small>aproveitamento</small></span></div><dl><div><dt>Acertos</dt><dd>{hits}</dd></div><div><dt>Erros</dt><dd>{misses}</dd></div><div><dt>Puladas</dt><dd>{skipped}</dd></div></dl></div>
        <div className="result-actions"><button className="study-button study-button--primary" onClick={onMore}><StudyIcon name="questions" size={16} /> Fazer mais questões</button>{misses > 0 && <button className="study-button study-button--quiet" onClick={onReview}><StudyIcon name="repeat" size={16} /> Revisar erros</button>}<button className="study-button study-button--quiet" onClick={onDashboard}>Voltar ao início</button></div>
      </section>
    </main>
  );
}
