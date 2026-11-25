import { StudyIcon } from "../components/StudyIcon";

export default function FlashcardsScreen({ bank, subject, topic, cards, index, flipped, performance, onSelectSubject, onSelectTopic, onFlip, onRate }) {
  const subjects = Object.entries(bank || {});
  const current = cards?.length ? cards[index % cards.length] : null;
  const topics = subject ? [...new Set((bank[subject] || []).map((card) => card.assunto).filter(Boolean))] : [];
  const mastered = Object.values(performance || {}).filter((item) => item.ultimoResultado === "acertei").length;
  const review = Object.values(performance || {}).filter((item) => item.ultimoResultado === "errei").length;

  return (
    <main className="study-page flashcards-page">
      <header className="study-page__header">
        <div><span className="study-page__eyebrow">Revisão ativa</span><h1>Flashcards</h1><p>Recupere a informação antes de revelar a resposta. É assim que a memória fica forte.</p></div>
        <div className="flashcards-summary"><span><b>{mastered}</b>Dominados</span><span><b>{review}</b>Para revisar</span></div>
      </header>

      <section className="flashcard-filters">
        <label><span>Matéria</span><select value={subject} onChange={(event) => onSelectSubject(event.target.value)}><option value="">Escolha uma matéria</option>{subjects.map(([name, items]) => <option value={name} key={name}>{name} · {items.length} cards</option>)}</select></label>
        <label><span>Assunto</span><select value={topic} disabled={!subject} onChange={(event) => onSelectTopic(event.target.value)}><option value="">Todos os assuntos</option>{topics.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
      </section>

      {!subjects.length ? (
        <div className="study-empty-state"><StudyIcon name="cards" size={26} /><h2>Nenhum flashcard disponível</h2><p>Este edital ainda não possui cards cadastrados.</p></div>
      ) : !subject ? (
        <section className="flashcard-subjects">{subjects.map(([name, items], position) => <button key={name} onClick={() => onSelectSubject(name)}><span className={`subject-card__initial tone-${position % 4}`}>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{items.length} flashcards disponíveis</small></div><StudyIcon name="chevron" size={17} /></button>)}</section>
      ) : !current ? (
        <div className="study-empty-state"><StudyIcon name="cards" size={26} /><h2>Nenhum card neste filtro</h2><p>Tente selecionar todos os assuntos da matéria.</p></div>
      ) : (
        <div className="flashcard-session">
          <section className="flashcard-stage">
            <div className="flashcard-stage__meta"><span>{index + 1} de {cards.length}</span><span>{current.tipo || "conceito"}</span></div>
            <div className="flashcard-session__progress"><i style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></div>
            <button className={`flashcard-face ${flipped ? "is-flipped" : ""}`} onClick={onFlip}>
              <span>{flipped ? "Resposta" : "Pergunta"}</span>
              <h2>{flipped ? current.verso : current.frente}</h2>
              {!flipped && <small>Pense na resposta e clique para revelar</small>}
            </button>
            {!flipped ? (
              <button className="study-button study-button--primary flashcard-reveal" onClick={onFlip}><StudyIcon name="repeat" size={16} /> Revelar resposta</button>
            ) : (
              <div className="flashcard-rating"><span>Como foi lembrar?</span><div><button onClick={() => onRate("errei")}><StudyIcon name="alert" size={15} /> Difícil</button><button onClick={() => onRate("errei")}><StudyIcon name="repeat" size={15} /> Quase</button><button className="is-mastered" onClick={() => onRate("acertei")}><StudyIcon name="check" size={15} /> Dominei</button></div></div>
            )}
          </section>
          <aside className="flashcard-deck">
            <span className="study-page__eyebrow">Seu baralho</span><h2>{subject}</h2><p>{topic || "Todos os assuntos"}</p>
            <dl><div><dt>Cards</dt><dd>{cards.length}</dd></div><div><dt>Vistos</dt><dd>{Object.keys(performance || {}).length}</dd></div><div><dt>Domínio</dt><dd>{mastered}</dd></div></dl>
            <div className="flashcard-tip"><StudyIcon name="target" size={18} /><p>Responda mentalmente antes de virar. Classifique com sinceridade para melhorar suas próximas revisões.</p></div>
          </aside>
        </div>
      )}
    </main>
  );
}
