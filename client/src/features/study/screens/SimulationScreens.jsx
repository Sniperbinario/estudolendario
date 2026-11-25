import { StudyIcon } from "../components/StudyIcon";

export function SimulationsHubScreen({ examName, selecting, simulations, hasDefault, onDefault, onOpenSelection, onCloseSelection, onSelect, onHistory }) {
  return (
    <main className="study-page simulations-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Modo prova</span><h1>{selecting ? "Escolha o simulado" : "Simulados"}</h1><p>{selecting ? "Selecione uma prova e comece quando estiver pronto." : "Treine tempo, estratégia e resistência com uma prova completa."}</p></div><div className="study-context-card"><span>Concurso ativo</span><strong>{examName}</strong></div></header>
      {selecting ? <section className="simulation-list"><button className="simulation-list__back" onClick={onCloseSelection}><StudyIcon name="chevron" size={15} /> Voltar aos modos</button>{simulations?.length ? simulations.map((simulation, index) => <button className="simulation-option" key={simulation.id || index} onClick={() => onSelect(simulation)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{simulation.nome || "Simulado"}</strong><small>{simulation.questoes?.length || 0} questões · correção ao final</small></div><StudyIcon name="arrow" size={17} /></button>) : <div className="study-empty-state"><StudyIcon name="file" size={25} /><h2>Nenhum simulado disponível</h2><p>Este edital ainda não possui provas cadastradas.</p></div>}</section> : <section className="simulation-modes">{hasDefault && <button className="simulation-mode simulation-mode--featured" onClick={onDefault}><span><StudyIcon name="target" size={22} /></span><div><small>Recomendado</small><h2>Simulado completo</h2><p>Experiência de prova com todas as matérias e tempo controlado.</p><b>Começar agora <StudyIcon name="arrow" size={15} /></b></div></button>}<button className="simulation-mode" onClick={onOpenSelection}><span><StudyIcon name="file" size={22} /></span><div><small>Biblioteca</small><h2>Escolher simulado</h2><p>Selecione uma prova específica entre as opções disponíveis.</p><b>Ver simulados <StudyIcon name="arrow" size={15} /></b></div></button><button className="simulation-mode" onClick={onHistory}><span><StudyIcon name="chart" size={22} /></span><div><small>Evolução</small><h2>Resultados anteriores</h2><p>Compare aproveitamento, nota e desempenho por matéria.</p><b>Abrir histórico <StudyIcon name="arrow" size={15} /></b></div></button></section>}
    </main>
  );
}

export function SimulationSessionScreen({ question, index, total, time, showText, onToggleText, onAnswer, onPrevious, onNext, onFinish, onCancel }) {
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0;
  return (
    <main className="study-page simulation-session">
      <header className="question-session__header"><div><span className="study-page__eyebrow">Simulado em andamento</span><h1>Questão {index + 1} <small>de {total}</small></h1></div><div className="simulation-clock"><StudyIcon name="timer" size={16} /><span>Tempo restante</span><strong>{time}</strong><button onClick={onCancel}>Cancelar</button></div></header>
      <div className="question-progress"><i style={{ width: `${progress}%` }} /></div>
      <section className="simulation-paper">
        {question?.texto && <div className="support-text"><button onClick={onToggleText}><StudyIcon name="book" size={15} /> Texto de apoio <span>{showText ? "Ocultar" : "Abrir"}</span></button>{showText && <p>{question.texto}</p>}</div>}
        <div className="question-statement">{question?.enunciado || "Questão indisponível."}</div>
        <div className="simulation-answers"><button onClick={() => onAnswer(true)}><span>C</span><strong>Certo</strong></button><button onClick={() => onAnswer(false)}><span>E</span><strong>Errado</strong></button></div>
        <footer><button className="study-button study-button--quiet" disabled={!index} onClick={onPrevious}>Anterior</button><div><button className="study-button study-button--quiet" disabled={index >= total - 1} onClick={onNext}>Próxima</button><button className="study-button study-button--primary" onClick={onFinish}>Finalizar simulado</button></div></footer>
      </section>
    </main>
  );
}

export function SimulationResultScreen({ summary, score, bySubject, onBack }) {
  const total = summary?.total || 0;
  const rate = total ? Math.round(((summary?.acertos || 0) / total) * 100) : 0;
  return (
    <main className="study-page result-page"><section className="result-card result-card--wide"><span className="result-card__icon"><StudyIcon name="chart" size={27} /></span><span className="study-page__eyebrow">Resultado do simulado</span><h1>Prova concluída</h1><p>Você respondeu {total} questões. Veja como cada matéria contribuiu para a nota.</p><div className="simulation-result-summary"><div className="result-score__ring" style={{ "--result-progress": `${rate * 3.6}deg` }}><span><strong>{rate}%</strong><small>aproveitamento</small></span></div><dl><div><dt>Acertos</dt><dd>{summary?.acertos || 0}</dd></div><div><dt>Erros</dt><dd>{summary?.erros || 0}</dd></div><div><dt>Não respondidas</dt><dd>{summary?.naoRespondidas || 0}</dd></div><div><dt>Nota CESPE</dt><dd>{Number(score || 0).toFixed(2)}</dd></div></dl></div>{Object.keys(bySubject || {}).length > 0 && <div className="simulation-subject-results"><h2>Desempenho por matéria</h2>{Object.entries(bySubject).map(([name, data]) => { const subjectTotal = (data.acertos || 0) + (data.erros || 0); const subjectRate = subjectTotal ? Math.round(((data.acertos || 0) / subjectTotal) * 100) : 0; return <article key={name}><div><strong>{name}</strong><span>{data.acertos || 0} acertos · {data.erros || 0} erros</span></div><div className="performance-bar"><i style={{ width: `${subjectRate}%` }} /></div><b>{subjectRate}%</b></article>; })}</div>}<button className="study-button study-button--primary" onClick={onBack}>Voltar aos simulados</button></section></main>
  );
}

export function SimulationHistoryScreen({ results, onBack }) {
  return (
    <main className="study-page simulations-page"><header className="study-page__header"><div><span className="study-page__eyebrow">Histórico</span><h1>Seus simulados</h1><p>Acompanhe a evolução entre as provas já realizadas.</p></div><button className="study-button study-button--quiet" onClick={onBack}>Voltar aos simulados</button></header>{results?.length ? <section className="simulation-history">{results.map((result, index) => { const total = (result.acertos || 0) + (result.erros || 0); const rate = total ? Math.round(((result.acertos || 0) / total) * 100) : 0; return <article key={result.id || index}><span>{new Date(result.dataHora || Date.now()).toLocaleDateString("pt-BR")}</span><div><strong>{result.titulo || "Simulado"}</strong><small>{total} questões · {result.acertos || 0} acertos</small></div><div className="performance-bar"><i style={{ width: `${rate}%` }} /></div><b>{rate}%</b></article>; })}</section> : <div className="study-empty-state"><StudyIcon name="chart" size={25} /><h2>Nenhum resultado ainda</h2><p>Conclua seu primeiro simulado para começar este histórico.</p></div>}</main>
  );
}
