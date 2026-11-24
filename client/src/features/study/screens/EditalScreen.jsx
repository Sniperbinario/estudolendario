import { useState } from "react";
import { StudyIcon } from "../components/StudyIcon";

export default function EditalScreen({ examName, blocks, completedTopics, pendingCount, progress, getSubjectProgress, performance, onToggleTopic, onStartQuestions }) {
  const [openSubject, setOpenSubject] = useState(null);
  const totalSubjects = Object.values(blocks || {}).reduce((sum, subjects) => sum + subjects.length, 0);

  return (
    <main className="study-page edital-page">
      <header className="study-page__header edital-page__header">
        <div>
          <span className="study-page__eyebrow">Edital verticalizado</span>
          <h1>Seu conteúdo, sem ruído</h1>
          <p>Avance tópico por tópico e mantenha uma visão clara do que já foi estudado.</p>
        </div>
        <div className="study-context-card">
          <span>Concurso ativo</span>
          <strong>{examName}</strong>
        </div>
      </header>

      <section className="edital-overview">
        <div className="edital-overview__progress">
          <div><span>Progresso geral</span><strong>{progress}%</strong></div>
          <div className="edital-overview__bar"><i style={{ width: `${progress}%` }} /></div>
          <p>Você concluiu {completedTopics.size} tópicos do edital.</p>
        </div>
        <dl>
          <div><dt>Matérias</dt><dd>{totalSubjects}</dd></div>
          <div><dt>Concluídos</dt><dd>{completedTopics.size}</dd></div>
          <div><dt>Pendentes</dt><dd>{pendingCount}</dd></div>
        </dl>
      </section>

      <div className="edital-blocks">
        {Object.entries(blocks || {}).map(([block, subjects], blockIndex) => (
          <section className="edital-block" key={block}>
            <div className="edital-block__title">
              <span>{String(blockIndex + 1).padStart(2, "0")}</span>
              <div><small>Bloco do edital</small><h2>{block}</h2></div>
              <b>{subjects.length} matérias</b>
            </div>

            <div className="edital-subjects">
              {subjects.map((subject) => {
                const isOpen = openSubject === subject.nome;
                const subjectProgress = getSubjectProgress(subject.nome);
                const stats = performance?.porMateria?.[subject.nome] || {};
                const answered = (stats.acertos || 0) + (stats.erros || 0);
                return (
                  <article className={`edital-subject ${isOpen ? "is-open" : ""}`} key={subject.nome}>
                    <button className="edital-subject__head" onClick={() => setOpenSubject(isOpen ? null : subject.nome)}>
                      <span className="edital-subject__initial">{subject.nome.trim().slice(0, 2).toUpperCase()}</span>
                      <div>
                        <h3>{subject.nome}</h3>
                        <p>{subject.topicos.length} tópicos {answered ? `· ${answered} questões respondidas` : ""}</p>
                      </div>
                      <div className="edital-subject__status">
                        <span><i style={{ width: `${subjectProgress}%` }} /></span><b>{subjectProgress}%</b>
                      </div>
                      <StudyIcon name="chevron" size={17} />
                    </button>

                    {isOpen && (
                      <div className="edital-subject__body">
                        <div className="edital-topic-list">
                          {subject.topicos.map((topic) => {
                            const completed = completedTopics.has(`${subject.nome}|||${topic}`);
                            return (
                              <button className={completed ? "is-complete" : ""} key={topic} onClick={() => onToggleTopic(subject.nome, topic, completed)}>
                                <span>{completed && <StudyIcon name="check" size={13} />}</span>
                                <p>{topic}</p>
                                <small>{completed ? "Concluído" : "Marcar como estudado"}</small>
                              </button>
                            );
                          })}
                        </div>
                        <div className="edital-subject__footer">
                          <span>{subjectProgress}% desta matéria concluído</span>
                          <button className="study-button study-button--quiet" onClick={() => onStartQuestions(subject.nome)}><StudyIcon name="questions" size={15} /> Praticar matéria</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
