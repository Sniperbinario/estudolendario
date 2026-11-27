import { StudyIcon } from "../components/StudyIcon";

const cycle = [
  ["No dia seguinte", "Recordação rápida", "Relembrar sem reler tudo"],
  ["Sete dias depois", "Questões", "Testar se o conteúdo ficou"],
  ["Trinta dias depois", "Consolidação", "Rever pontos e erros"],
];

export default function ReviewScreen({ reviews, studiedTopics, getDate, onStart, onComplete }) {
  return (
    <main className="study-page review-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Revisão inteligente</span><h1>Sua memória também precisa de plano</h1><p>A revisão nasce quando você conclui o estudo, não quando o cronograma é criado.</p></div><div className="study-context-card"><span>Fila de hoje</span><strong>{reviews.length} revisões</strong></div></header>
      <section className="review-cycle">{cycle.map(([day, label, description], index) => <article className={index === 0 ? "is-active" : ""} key={day}><span>{day}</span><strong>{label}</strong><small>{description}</small></article>)}</section>
      <div className="review-layout">
        <section className="review-queue">
          <div className="section-heading"><div><span>Revisões de hoje</span><h2>Sem esmagar o estudo novo</h2></div><b>{reviews.length}</b></div>
          {reviews.length ? reviews.map((review, index) => <article className={review.atrasadaDias > 0 ? "is-late" : ""} key={`${review.tipo}-${review.id || review.cycleId || index}`}><span className="review-queue__type"><StudyIcon name={review.tipo === "flashcard" ? "cards" : review.tipo === "questao" ? "questions" : "repeat"} size={16} /></span><div><small>{review.nome}</small><strong>{review.materia}</strong><p>{review.assunto}</p>{review.acao && <p>{review.acao}</p>}</div>{review.atrasadaDias > 0 && <em>{review.atrasadaDias}d atrasada</em>}<div className="review-queue__actions"><button onClick={() => onStart(review)}>Revisar <StudyIcon name="arrow" size={14} /></button>{review.tipo === "assunto" ? <div className="review-memory-actions"><button onClick={() => onComplete(review, "dificuldade")}>Não lembrei</button><button onClick={() => onComplete(review, "normal")}>Lembrei</button><button onClick={() => onComplete(review, "dominado")}>Muito bem</button></div> : <button onClick={() => onComplete(review, "normal")}><StudyIcon name="check" size={14} /> Concluir</button>}</div></article>) : <div className="review-clear"><StudyIcon name="check" size={25} /><div><strong>Tudo revisado por hoje</strong><p>Sua fila está em dia. O limite diário protege o tempo de conteúdo novo.</p></div></div>}
        </section>
        <aside className="review-history"><div className="section-heading"><div><span>Conteúdo consolidado</span><h2>Últimos tópicos</h2></div></div>{studiedTopics.slice(-7).reverse().map(({ materia, assunto }, index) => <article key={`${materia}-${assunto}-${index}`}><span><StudyIcon name="check" size={13} /></span><div><strong>{materia}</strong><p>{assunto}</p></div><time>{getDate(materia, assunto) || "—"}</time></article>)}</aside>
      </div>
    </main>
  );
}
