import { StudyIcon } from "../components/StudyIcon";

export default function SubjectSelectionScreen({ examName, subjects, performance, onStart, onMaterial, onReview }) {
  const entries = Object.entries(subjects || {});

  return (
    <main className="study-page subject-library">
      <header className="study-page__header">
        <div>
          <span className="study-page__eyebrow">Banco de questões</span>
          <h1>Pratique por matéria</h1>
          <p>Escolha uma disciplina e continue exatamente do ponto em que parou.</p>
        </div>
        <div className="study-context-card">
          <span>Concurso ativo</span>
          <strong>{examName}</strong>
        </div>
      </header>

      {entries.length ? (
        <section className="subject-library__grid" aria-label="Matérias disponíveis">
          {entries.map(([subject, questions], index) => {
            const stats = performance?.porMateria?.[subject] || performance?.[subject] || {};
            const hits = stats.acertos || 0;
            const misses = stats.erros || 0;
            const answered = hits + misses;
            const rate = answered ? Math.round((hits / answered) * 100) : 0;
            const wrong = performance?.questoesErradas?.[subject]?.length || 0;
            const initial = subject.trim().slice(0, 2).toUpperCase();

            return (
              <article className="subject-card" key={subject}>
                <div className="subject-card__top">
                  <span className={`subject-card__initial tone-${index % 4}`}>{initial}</span>
                  <span className="subject-card__count">{questions?.length || 0} questões</span>
                </div>
                <h2>{subject}</h2>
                <p className="subject-card__meta">{answered ? `${answered} questões respondidas` : "Ainda sem histórico nesta matéria"}</p>

                <div className="subject-card__progress" aria-label={`${rate}% de aproveitamento`}>
                  <i style={{ width: `${rate}%` }} />
                </div>
                <div className="subject-card__stats">
                  <span><b>{rate}%</b>Aproveitamento</span>
                  <span><b>{hits}</b>Acertos</span>
                  <span><b>{misses}</b>Erros</span>
                </div>

                <div className="subject-card__actions">
                  <button className="study-button study-button--primary" onClick={() => onStart(subject)}>
                    Resolver questões <StudyIcon name="arrow" size={15} />
                  </button>
                  <div>
                    <button className="study-button study-button--quiet" onClick={() => onMaterial(subject)}>
                      <StudyIcon name="book" size={15} /> Material
                    </button>
                    <button className="study-button study-button--quiet" disabled={!wrong} onClick={() => onReview(subject)}>
                      <StudyIcon name="repeat" size={15} /> Revisar {wrong ? `(${wrong})` : "erros"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="study-empty-state">
          <StudyIcon name="questions" size={24} />
          <h2>Nenhuma matéria disponível</h2>
          <p>O banco de questões deste concurso ainda está sendo preparado.</p>
        </div>
      )}
    </main>
  );
}
