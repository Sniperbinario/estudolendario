import { StudyIcon } from "../components/StudyIcon";
import LiaQuestionPanel from "../components/LiaQuestionPanel";

function OptionButton({ label, children, state, disabled, onClick }) {
  return (
    <button className={`question-option is-${state}`} disabled={disabled} onClick={onClick}>
      <span>{label}</span><strong>{children}</strong>
      {state === "right" && <StudyIcon name="check" size={16} />}
      {state === "wrong" && <StudyIcon name="x" size={16} />}
    </button>
  );
}

export default function QuestionSessionScreen({
  questions, index, selected, correctAnswer, showExplanation, showText, hits, misses, skipped,
  filter, subject, message, onAnswer, onToggleText, onPrevious, onSkip, onNext, onExit, onSaveError,
  onSaveLiaNote, onSaveFlashcard,
}) {
  if (!questions?.length || index >= questions.length) {
    return (
      <main className="study-page question-empty">
        <div className="study-empty-state">
          <StudyIcon name="questions" size={26} />
          <h1>Sem questões por enquanto</h1>
          <p>{message || "Ainda não há questões cadastradas para esse filtro."}</p>
          <button className="study-button study-button--primary" onClick={onExit}>Escolher outra matéria</button>
        </div>
      </main>
    );
  }

  const question = questions[index];
  const progress = Math.round(((index + 1) / questions.length) * 100);
  const getState = (value) => {
    if (selected === null) return "idle";
    if (value === correctAnswer) return "right";
    if (value === selected) return "wrong";
    return "muted";
  };

  return (
    <main className="study-page question-session">
      <header className="question-session__header">
        <div>
          <span className="study-page__eyebrow">Sessão de questões</span>
          <h1>Questão {index + 1} <small>de {questions.length}</small></h1>
        </div>
        <div className="question-session__tags">
          <span>{filter?.materia || subject || question.materia || "Matéria"}</span>
          {question.banca && <span>{question.banca}</span>}
          {question.ano && <span>{question.ano}</span>}
          <button onClick={onExit}>Encerrar sessão</button>
        </div>
      </header>

      <div className="question-progress"><i style={{ width: `${progress}%` }} /></div>

      <div className="question-session__layout">
        <section className="question-paper">
          {filter?.assunto && <div className="question-paper__topic">{filter.assunto}</div>}
          {question.texto && String(question.texto).trim() && (
            <div className="support-text">
              <button onClick={onToggleText}><StudyIcon name="book" size={15} /> Texto de apoio <span>{showText ? "Ocultar" : "Abrir"}</span></button>
              {showText && <p>{question.texto}</p>}
            </div>
          )}
          <div className="question-statement">{question.enunciado}</div>

          <div className="question-options">
            {question.tipo === "multipla_escolha" ? question.alternativas?.map((answer, answerIndex) => (
              <OptionButton key={answerIndex} label={["A", "B", "C", "D", "E"][answerIndex]} state={getState(answerIndex)} disabled={selected !== null} onClick={() => onAnswer(answerIndex)}>{answer}</OptionButton>
            )) : [true, false].map((value) => (
              <OptionButton key={String(value)} label={value ? "C" : "E"} state={getState(value)} disabled={selected !== null} onClick={() => onAnswer(value)}>{value ? "Certo" : "Errado"}</OptionButton>
            ))}
          </div>

          {showExplanation && (
            <div className="question-feedback">
              <span className={selected === correctAnswer ? "is-right" : "is-wrong"}>{selected === correctAnswer ? "Resposta correta" : "Vamos corrigir este ponto"}</span>
              <h2>Comentário da questão</h2>
              <p>{question.explicacao || "Esta questão ainda não possui comentário cadastrado."}</p>
              {selected !== correctAnswer && <button onClick={onSaveError}><StudyIcon name="note" size={15} /> Salvar no caderno de erros</button>}
            </div>
          )}

          <footer className="question-paper__footer">
            <button className="study-button study-button--quiet" disabled={index === 0} onClick={onPrevious}>Anterior</button>
            <div>
              {selected === null && <button className="study-button study-button--quiet" onClick={onSkip}>Pular</button>}
              {showExplanation && <button className="study-button study-button--primary" onClick={onNext}>{index + 1 === questions.length ? "Finalizar sessão" : "Próxima questão"}<StudyIcon name="arrow" size={15} /></button>}
            </div>
          </footer>
        </section>

        <aside className="question-sidebar">
          <section className="question-score">
            <div className="question-sidebar__title"><StudyIcon name="chart" size={17} /><h2>Seu desempenho</h2></div>
            <div><span className="is-hit"><b>{hits}</b>Acertos</span><span className="is-miss"><b>{misses}</b>Erros</span></div>
            <dl><div><dt>Puladas</dt><dd>{skipped}</dd></div><div><dt>Progresso</dt><dd>{progress}%</dd></div></dl>
          </section>
          <section className="question-tip">
            <StudyIcon name="target" size={18} />
            <div><strong>Resolva com calma</strong><p>Leia o comentário depois de responder. O aprendizado acontece na correção.</p></div>
          </section>
          <LiaQuestionPanel
            question={question}
            subject={filter?.materia || subject || question.materia}
            topic={filter?.assunto || question.assunto || question.topico}
            selected={selected}
            correctAnswer={correctAnswer}
            answered={showExplanation}
            onSaveNote={onSaveLiaNote}
            onSaveFlashcard={onSaveFlashcard}
          />
        </aside>
      </div>
    </main>
  );
}
