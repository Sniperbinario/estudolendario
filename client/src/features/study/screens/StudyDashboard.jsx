import { StudyIcon } from "../components/StudyIcon";

function formatMinutes(value = 0) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!hours) return `${minutes} min`;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

const quickActions = [
  { screen: "escolherMateria", icon: "questions", label: "Resolver questões", description: "Treino direcionado por matéria" },
  { screen: "flashcards", icon: "cards", label: "Revisar flashcards", description: "Memorização ativa e rápida" },
  { screen: "cronometro", icon: "timer", label: "Abrir cronômetro", description: "Sessão de foco sem distrações" },
  { screen: "simulados", icon: "target", label: "Fazer simulado", description: "Teste seu desempenho real" },
];

export default function StudyDashboard({
  firstName,
  examName,
  examProgress,
  answered,
  accuracy,
  examDays,
  streak,
  todayMinutes,
  weekMinutes,
  todayTasks,
  pendingReviews,
  progressGroups,
  strength,
  weakness,
  discursiveEvolution,
  onNavigate,
  onStartTask,
  onStartReview,
}) {
  const nextTask = todayTasks.find((task) => !task.done);
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="study-dashboard">
      <header className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">{examName}</span>
          <h1>{greeting}, {firstName}.</h1>
          <p>Seu plano está organizado. Concentre-se no próximo passo.</p>
        </div>
        <button className="dashboard-notification" onClick={() => onNavigate("revisao")}><StudyIcon name="repeat" /> {pendingReviews.length} revisões</button>
      </header>

      <section className="dashboard-hero">
        <article className="dashboard-next">
          <div><span className="dashboard-next__label">Próxima sessão</span><h2>{nextTask?.nome || "Organize seu próximo bloco"}</h2><p>{nextTask?.topico || "Seu plano está livre para uma nova sessão."}{nextTask ? ` · ${nextTask.tempo || 30} minutos` : ""}</p><div><button className="dashboard-primary" onClick={() => nextTask ? onStartTask(nextTask) : onNavigate("cronograma")}><StudyIcon name="play" /> {nextTask ? "Começar agora" : "Montar plano"}</button><button onClick={() => onNavigate("cronograma")}>Ver plano</button></div></div>
          <div className="dashboard-hero-ring" style={{ "--hero-progress": `${Math.max(0, Math.min(100, examProgress)) * 3.6}deg` }}><span><strong>{examProgress}%</strong><small>do edital</small></span></div>
        </article>
        <article className="dashboard-streak"><span><StudyIcon name="target" size={20} /></span><small>Sequência atual</small><strong>{streak || 0} dias</strong><p>{streak ? "Seu melhor ritmo nasce da consistência." : "Comece hoje sua sequência."}</p>{examDays > 0 && <b>{examDays} dias até a prova</b>}</article>
      </section>

      <section className="dashboard-stats dashboard-stats--indicators" aria-label="Indicadores da preparação">
        <article className="dashboard-stat">
          <span className="dashboard-stat__icon"><StudyIcon name="clock" /></span>
          <span className="dashboard-stat__label">Horas líquidas</span>
          <div className="dashboard-stat__value dashboard-stat__value--text">{formatMinutes(weekMinutes)}</div>
          <p>{formatMinutes(todayMinutes)} estudados hoje</p>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat__icon"><StudyIcon name="questions" /></span>
          <span className="dashboard-stat__label">Questões resolvidas</span>
          <div className="dashboard-stat__value">{answered}</div>
          <p><strong>{accuracy}%</strong> de acerto geral</p>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat__icon"><StudyIcon name="chart" /></span>
          <span className="dashboard-stat__label">Acertos por matéria</span>
          <div className="dashboard-stat__value dashboard-stat__value--text">{strength ? `${strength.pct}%` : "—"}</div>
          <p>{strength ? `melhor índice: ${strength.materia}` : "resolva questões para medir"}</p>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat__icon"><StudyIcon name="file" /></span>
          <span className="dashboard-stat__label">Edital estudado</span>
          <div className="dashboard-stat__value dashboard-stat__value--text">{examProgress}%</div>
          <p>conteúdo marcado como concluído</p>
        </article>
        <article className="dashboard-stat dashboard-stat--discursive">
          <span className="dashboard-stat__icon"><StudyIcon name="note" /></span>
          <span className="dashboard-stat__label">Provas discursivas</span>
          <div className="dashboard-stat__value dashboard-stat__value--text">{discursiveEvolution == null ? "Sem dados" : `${discursiveEvolution > 0 ? "+" : ""}${discursiveEvolution} pts`}</div>
          <p>{discursiveEvolution == null ? "aguardando o primeiro resultado" : "evolução entre a primeira e a última"}</p>
        </article>
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <section className="dashboard-card dashboard-today">
            <div className="dashboard-card__heading">
              <div><span>Plano de hoje</span><h2>Próximas sessões</h2></div>
              <button onClick={() => onNavigate("cronograma")}>Ver planejamento <StudyIcon name="arrow" size={15} /></button>
            </div>
            {todayTasks.length ? (
              <div className="today-list">
                {todayTasks.slice(0, 5).map((task, index) => (
                  <article className={task.done ? "is-done" : ""} key={`${task.nome}-${task.topico}-${index}`}>
                    <span className="today-list__status">{task.done ? <StudyIcon name="check" size={14} /> : String(index + 1).padStart(2, "0")}</span>
                    <div className="today-list__copy"><strong>{task.nome}</strong><span>{task.topico || "Sessão de estudo"}</span></div>
                    <time>{task.tempo || 30} min</time>
                    {!task.done && <button onClick={() => onStartTask(task)} aria-label={`Iniciar ${task.nome}`}><StudyIcon name="play" size={16} /></button>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <span><StudyIcon name="calendar" size={22} /></span>
                <div><strong>Seu dia ainda está livre</strong><p>Monte um plano curto e possível para começar.</p></div>
                <button onClick={() => onNavigate("cronograma")}>Organizar agora</button>
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <div className="dashboard-card__heading">
              <div><span>Visão do edital</span><h2>Progresso por bloco</h2></div>
              <button onClick={() => onNavigate("editalCompleto")}>Abrir edital <StudyIcon name="arrow" size={15} /></button>
            </div>
            <div className="subject-progress">
              {progressGroups.slice(0, 5).map((group) => (
                <article key={group.name}>
                  <div><strong>{group.name}</strong><span>{group.completed} de {group.total} tópicos</span></div>
                  <div className="subject-progress__bar"><i style={{ width: `${group.percent}%` }} /></div>
                  <b>{group.percent}%</b>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-aside">
          <section className="dashboard-card dashboard-quick">
            <div className="dashboard-card__heading"><div><span>Acesso rápido</span><h2>Hora de praticar</h2></div></div>
            {quickActions.map((action) => (
              <button key={action.screen} onClick={() => onNavigate(action.screen)}>
                <span><StudyIcon name={action.icon} /></span>
                <div><strong>{action.label}</strong><small>{action.description}</small></div>
                <StudyIcon name="arrow" size={15} />
              </button>
            ))}
          </section>

          <section className="dashboard-card dashboard-review">
            <div className="dashboard-card__heading"><div><span>Revisões</span><h2>Fila inteligente</h2></div><b>{pendingReviews.length}</b></div>
            {pendingReviews.length ? pendingReviews.slice(0, 3).map((review, index) => (
              <button key={`${review.id || index}-${review.tipo}`} onClick={() => onStartReview(review)}>
                <span className="dashboard-review__dot" />
                <div><strong>{review.materia}</strong><small>{review.assunto || review.nome}</small></div>
                <StudyIcon name="arrow" size={14} />
              </button>
            )) : <p className="dashboard-review__clear"><StudyIcon name="check" /> Tudo revisado por hoje.</p>}
            <button className="dashboard-review__all" onClick={() => onNavigate("revisao")}>Ver todas as revisões</button>
          </section>

          <section className="dashboard-insight">
            <span><StudyIcon name="chart" /></span>
            <div><small>Leitura do desempenho</small><strong>{strength ? `${strength.materia} é seu ponto forte.` : "Responda questões para gerar análises."}</strong>{weakness && <p>Priorize {weakness.materia} na próxima sessão.</p>}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
