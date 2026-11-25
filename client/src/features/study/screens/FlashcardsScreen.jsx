import { useEffect, useMemo, useState } from "react";
import { StudyIcon } from "../components/StudyIcon";
import { askLia } from "../services/studyApi";

function FlashcardSelect({ label, value, placeholder, options, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);
  return (
    <div className={`flashcard-select ${disabled ? "is-disabled" : ""}`}>
      <span>{label}</span>
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((state) => !state)}>
        <strong>{current?.label || placeholder}</strong><StudyIcon name="chevron" size={17} />
      </button>
      {open && !disabled && <div className="flashcard-select__menu" role="listbox">
        <button type="button" className={!value ? "is-active" : ""} onClick={() => { onChange(""); setOpen(false); }}><span><StudyIcon name="list" size={15} /></span><strong>{placeholder}</strong>{!value && <StudyIcon name="check" size={14} />}</button>
        {options.map((option) => <button type="button" className={value === option.value ? "is-active" : ""} role="option" aria-selected={value === option.value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label.slice(0, 2).toUpperCase()}</span><div><strong>{option.label}</strong>{option.meta && <small>{option.meta}</small>}</div>{value === option.value && <StudyIcon name="check" size={14} />}</button>)}
      </div>}
    </div>
  );
}

function emptyCard() {
  return { front: "", back: "" };
}

function FlashcardCreator({ catalog, initialSubject, initialTopic, onClose, onSave }) {
  const [subject, setSubject] = useState(initialSubject || "");
  const [topic, setTopic] = useState(initialTopic || "");
  const [focus, setFocus] = useState("");
  const [count, setCount] = useState(5);
  const [cards, setCards] = useState([emptyCard()]);
  const [generatedByLia, setGeneratedByLia] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const topics = catalog.find((item) => item.nome === subject)?.topicos || [];
  const validCards = cards.filter((card) => card.front.trim() && card.back.trim());

  useEffect(() => {
    if (subject && !topics.includes(topic)) setTopic("");
  }, [subject, topic, topics]);

  const updateCard = (index, field, value) => setCards((current) => current.map((card, position) => position === index ? { ...card, [field]: value } : card));
  const removeCard = (index) => setCards((current) => current.length === 1 ? [emptyCard()] : current.filter((_, position) => position !== index));

  const generate = async () => {
    if (!subject || !topic) return setMessage("Escolha uma matéria e um assunto do edital.");
    setGenerating(true);
    setMessage("");
    try {
      const result = await askLia("flashcards", { subject, topic, focus, count });
      setCards(result.flashcards);
      setGeneratedByLia(true);
      setMessage(`A LIA criou ${result.flashcards.length} cards para você revisar antes de salvar · ${result.usage.remaining} consultas restantes`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!subject || !topic) return setMessage("Escolha uma matéria e um assunto do edital.");
    if (!validCards.length) return setMessage("Preencha a pergunta e a resposta de pelo menos um card.");
    setSaving(true);
    setMessage("");
    try {
      await onSave(validCards, subject, topic, generatedByLia ? "Criado com a LIA" : "Criado pelo aluno");
      setMessage(`${validCards.length} flashcard${validCards.length > 1 ? "s" : ""} salvo${validCards.length > 1 ? "s" : ""} no seu baralho.`);
      setCards([emptyCard()]);
      setGeneratedByLia(false);
    } catch {
      setMessage("Não foi possível salvar os flashcards.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flashcard-creator">
      <header>
        <div><span className="study-page__eyebrow">Seu conteúdo</span><h2>Criar flashcards</h2><p>Escolha exatamente a matéria e o assunto do edital. Você pode escrever ou pedir um primeiro rascunho à LIA.</p></div>
        <button className="flashcard-creator__close" onClick={onClose}><StudyIcon name="x" size={16} /> Fechar</button>
      </header>
      <div className="flashcard-creator__context">
        <FlashcardSelect label="Matéria do edital" value={subject} placeholder="Escolha uma matéria" options={catalog.map((item) => ({ value: item.nome, label: item.nome, meta: `${item.topicos?.length || 0} assuntos` }))} onChange={(value) => { setSubject(value); setTopic(""); }} />
        <FlashcardSelect label="Assunto do edital" value={topic} placeholder="Escolha um assunto" options={topics.map((item) => ({ value: item, label: item }))} disabled={!subject} onChange={setTopic} />
      </div>
      <div className="flashcard-lia-create">
        <span><StudyIcon name="sparkles" size={19} /></span>
        <div><strong>Gerar rascunho com a LIA</strong><p>Ela cria perguntas de recuperação ativa; você revisa e edita tudo antes de salvar.</p></div>
        <input value={focus} maxLength="700" onChange={(event) => setFocus(event.target.value)} placeholder="Opcional: foque em conceitos, exceções ou pegadinhas" />
        <select value={count} onChange={(event) => setCount(Number(event.target.value))}><option value="3">3 cards</option><option value="5">5 cards</option><option value="8">8 cards</option></select>
        <button disabled={generating || !subject || !topic} onClick={generate}><StudyIcon name="sparkles" size={16} /> {generating ? "Criando..." : "Criar com a LIA"}</button>
      </div>
      {message && <p className="flashcard-creator__message">{message}</p>}
      <div className="flashcard-drafts">
        {cards.map((card, index) => <article key={index}>
          <div className="flashcard-drafts__number">{String(index + 1).padStart(2, "0")}</div>
          <label><span>Pergunta</span><textarea rows="3" maxLength="500" value={card.front} onChange={(event) => updateCard(index, "front", event.target.value)} placeholder="Ex.: Qual é a diferença entre...?" /></label>
          <label><span>Resposta</span><textarea rows="3" maxLength="900" value={card.back} onChange={(event) => updateCard(index, "back", event.target.value)} placeholder="Escreva uma resposta curta e objetiva." /></label>
          <button className="flashcard-drafts__remove" onClick={() => removeCard(index)} title="Remover card"><StudyIcon name="trash" size={15} /></button>
        </article>)}
      </div>
      <footer><button className="study-button study-button--quiet" onClick={() => { setCards((current) => [...current, emptyCard()]); setGeneratedByLia(false); }}><StudyIcon name="plus" size={15} /> Adicionar card manual</button><button className="study-button study-button--primary" disabled={saving} onClick={save}><StudyIcon name="save" size={15} /> {saving ? "Salvando..." : `Salvar ${validCards.length || ""} card${validCards.length === 1 ? "" : "s"}`}</button></footer>
    </section>
  );
}

export default function FlashcardsScreen({ bank, catalog = [], subject, topic, cards, index, flipped, performance, onSelectSubject, onSelectTopic, onFlip, onRate, onCreateCards }) {
  const [creating, setCreating] = useState(false);
  const subjects = useMemo(() => catalog.map((item) => [item.nome, bank[item.nome] || []]), [bank, catalog]);
  const current = cards?.length ? cards[index % cards.length] : null;
  const topics = catalog.find((item) => item.nome === subject)?.topicos || [];
  const mastered = Object.values(performance || {}).filter((item) => item.ultimoResultado === "acertei").length;
  const review = Object.values(performance || {}).filter((item) => item.ultimoResultado === "errei").length;

  return (
    <main className="study-page flashcards-page">
      <header className="study-page__header">
        <div><span className="study-page__eyebrow">Revisão ativa</span><h1>Flashcards</h1><p>Recupere a informação antes de revelar a resposta. É assim que a memória fica forte.</p></div>
        <div className="flashcards-header-actions"><div className="flashcards-summary"><span><b>{mastered}</b>Dominados</span><span><b>{review}</b>Para revisar</span></div><button className="study-button study-button--primary" onClick={() => setCreating((value) => !value)}><StudyIcon name={creating ? "x" : "plus"} size={16} /> {creating ? "Fechar criação" : "Criar flashcards"}</button></div>
      </header>

      {creating && <FlashcardCreator catalog={catalog} initialSubject={subject} initialTopic={topic} onClose={() => setCreating(false)} onSave={onCreateCards} />}

      <section className="flashcard-filters">
        <FlashcardSelect label="Matéria" value={subject} placeholder="Escolha uma matéria" options={subjects.map(([name, items]) => ({ value: name, label: name, meta: `${items.length} cards` }))} onChange={onSelectSubject} />
        <FlashcardSelect label="Assunto" value={topic} placeholder="Todos os assuntos" options={topics.map((name) => ({ value: name, label: name }))} disabled={!subject} onChange={onSelectTopic} />
      </section>

      {!subjects.length ? (
        <div className="study-empty-state"><StudyIcon name="cards" size={26} /><h2>Edital sem matérias</h2><p>Selecione outro edital para criar seus flashcards.</p></div>
      ) : !subject ? (
        <section className="flashcard-subjects">{subjects.map(([name, items], position) => <button key={name} onClick={() => onSelectSubject(name)}><span className={`subject-card__initial tone-${position % 4}`}>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{items.length ? `${items.length} flashcards disponíveis` : "Nenhum card ainda · crie o primeiro"}</small></div><StudyIcon name="chevron" size={17} /></button>)}</section>
      ) : !current ? (
        <div className="study-empty-state"><StudyIcon name="cards" size={26} /><h2>Nenhum card neste assunto</h2><p>Crie manualmente ou use a LIA para montar um primeiro rascunho.</p><button className="study-button study-button--primary" onClick={() => setCreating(true)}><StudyIcon name="plus" size={15} /> Criar agora</button></div>
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
