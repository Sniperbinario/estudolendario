const agenda = [
  ["Direito Constitucional", "Controle de constitucionalidade", "45 min", "done"],
  ["Língua Portuguesa", "Interpretação de textos", "35 min", "active"],
  ["Raciocínio Lógico", "Proposições", "30 min", "next"],
];

export function ProductPreview() {
  return (
    <div className="product-preview" aria-label="Prévia do painel da plataforma">
      <div className="product-preview__chrome">
        <span /><span /><span />
        <span className="product-preview__title">Visão de hoje</span>
      </div>
      <div className="product-preview__body">
        <aside className="product-preview__sidebar">
          <div className="preview-logo">EL</div>
          {[0, 1, 2, 3, 4].map((item) => <span key={item} className={item === 0 ? "is-active" : ""} />)}
        </aside>
        <div className="product-preview__content">
          <div className="preview-heading">
            <div><small>TERÇA-FEIRA, 24 NOV</small><h3>Bom dia, futuro aprovado.</h3></div>
            <div className="preview-avatar">HR</div>
          </div>
          <div className="preview-stats">
            <article><small>Meta semanal</small><strong>8h 40min</strong><span><i style={{ width: "72%" }} /></span></article>
            <article><small>Sequência</small><strong>12 dias</strong><em>melhor marca</em></article>
            <article><small>Desempenho</small><strong>78%</strong><em>+6% este mês</em></article>
          </div>
          <div className="preview-grid">
            <section className="preview-agenda">
              <div className="preview-section-title"><strong>Plano de hoje</strong><span>3 sessões</span></div>
              {agenda.map(([subject, topic, time, status]) => (
                <div className={`preview-task preview-task--${status}`} key={subject}>
                  <span className="preview-task__status" />
                  <div><strong>{subject}</strong><small>{topic}</small></div>
                  <time>{time}</time>
                </div>
              ))}
            </section>
            <section className="preview-progress">
              <div className="preview-section-title"><strong>Seu edital</strong><span>PF</span></div>
              <div className="preview-ring"><strong>64%</strong><small>concluído</small></div>
              <p>Você avançou <strong>4 tópicos</strong> nesta semana.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
