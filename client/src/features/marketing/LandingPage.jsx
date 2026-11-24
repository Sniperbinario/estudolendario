import { useState } from "react";
import { Brand } from "./components/Brand";
import { Icon } from "./components/Icon";
import { ProductPreview } from "./components/ProductPreview";
import { faqs, features, plans, steps } from "./content";

function SectionHeading({ eyebrow, title, description, align = "center" }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function Header({ onComecar }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="marketing-header">
      <div className="marketing-shell marketing-header__inner">
        <a href="#topo" className="marketing-header__brand"><Brand /></a>
        <button className="marketing-header__menu" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu" aria-expanded={open}>
          <Icon name="menu" />
        </button>
        <nav className={open ? "is-open" : ""}>
          <a href="#produto" onClick={() => setOpen(false)}>Produto</a>
          <a href="#metodo" onClick={() => setOpen(false)}>Como funciona</a>
          <a href="#planos" onClick={() => setOpen(false)}>Planos</a>
          <a href="#duvidas" onClick={() => setOpen(false)}>Dúvidas</a>
        </nav>
        <div className="marketing-header__actions">
          <button className="button button--ghost" onClick={onComecar}>Entrar</button>
          <button className="button button--primary button--small" onClick={onComecar}>Começar grátis</button>
        </div>
      </div>
    </header>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq-list">
      {faqs.map(([question, answer], index) => (
        <article className={open === index ? "is-open" : ""} key={question}>
          <button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>
            <span>{question}</span><span aria-hidden="true">{open === index ? "−" : "+"}</span>
          </button>
          <div><p>{answer}</p></div>
        </article>
      ))}
    </div>
  );
}

export default function LandingPage({ onComecar }) {
  return (
    <div className="marketing-page" id="topo">
      <Header onComecar={onComecar} />

      <main>
        <section className="marketing-hero">
          <div className="marketing-shell marketing-hero__inner">
            <div className="marketing-hero__copy">
              <span className="hero-badge"><span /> Preparação com direção, não improviso</span>
              <h1>Transforme seu edital em um plano que você consegue cumprir.</h1>
              <p>Organize a rotina, pratique com intenção e acompanhe sua evolução até o dia da prova — sem depender de planilhas espalhadas.</p>
              <div className="marketing-hero__actions">
                <button className="button button--primary button--large" onClick={onComecar}>Começar gratuitamente <Icon name="arrow" /></button>
                <a className="button button--text" href="#produto">Conhecer a plataforma</a>
              </div>
              <div className="marketing-hero__trust">
                <span><Icon name="check" size={16} /> 3 dias para testar</span>
                <span><Icon name="check" size={16} /> Sem cartão no início</span>
                <span><Icon name="check" size={16} /> Cancele quando quiser</span>
              </div>
            </div>
            <div className="marketing-hero__visual"><ProductPreview /></div>
          </div>
        </section>

        <section className="proof-strip">
          <div className="marketing-shell proof-strip__inner">
            <p>Uma única rotina para planejar, praticar e evoluir.</p>
            <div><span><strong>9+</strong> editais organizados</span><span><strong>4</strong> modos de estudo</span><span><strong>1</strong> visão clara do progresso</span></div>
          </div>
        </section>

        <section className="marketing-section" id="produto">
          <div className="marketing-shell">
            <SectionHeading eyebrow="Uma preparação conectada" title="Menos ferramentas. Mais clareza sobre o próximo passo." description="Tudo o que você faz alimenta o mesmo plano: matérias, questões, revisão e desempenho deixam de funcionar como partes soltas." />
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <span className="feature-card__icon"><Icon name={feature.icon} /></span>
                  <h3>{feature.title}</h3><p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--tinted" id="metodo">
          <div className="marketing-shell method-layout">
            <SectionHeading align="left" eyebrow="Do edital à execução" title="Um método simples o bastante para virar rotina." description="Você não precisa planejar tudo de novo toda segunda-feira. O sistema transforma disponibilidade e objetivo em ações concretas." />
            <div className="method-steps">
              {steps.map(([number, title, description]) => (
                <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section" id="planos">
          <div className="marketing-shell">
            <SectionHeading eyebrow="Planos transparentes" title="Comece sem pressão. Continue quando fizer sentido." description="Teste o fluxo completo e escolha o período que combina com a sua preparação." />
            <div className="pricing-grid">
              {plans.map((plan) => (
                <article className={`pricing-card ${plan.featured ? "pricing-card--featured" : ""}`} key={plan.name}>
                  {plan.featured && <span className="pricing-card__label">Mais escolhido</span>}
                  <h3>{plan.name}</h3><p>{plan.description}</p>
                  <div className="pricing-card__price"><strong>{plan.price}</strong><span>{plan.cadence}</span></div>
                  <ul>{plan.items.map((item) => <li key={item}><Icon name="check" size={17} /> {item}</li>)}</ul>
                  <button className={`button ${plan.featured ? "button--primary" : "button--secondary"}`} onClick={onComecar}>{plan.cta}</button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section--faq" id="duvidas">
          <div className="marketing-shell faq-layout">
            <SectionHeading align="left" eyebrow="Dúvidas frequentes" title="Antes de começar, vale saber." description="Informações diretas sobre o teste, a rotina de estudos e os planos." />
            <FAQ />
          </div>
        </section>

        <section className="marketing-cta">
          <div className="marketing-shell marketing-cta__inner">
            <div><span className="eyebrow">Seu próximo ciclo começa aqui</span><h2>Estudar muito ajuda. Estudar com direção muda o jogo.</h2></div>
            <button className="button button--light button--large" onClick={onComecar}>Criar meu plano <Icon name="arrow" /></button>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <div className="marketing-shell marketing-footer__inner">
          <div><Brand /><p>Planejamento, prática e evolução para quem leva a aprovação a sério.</p></div>
          <div className="marketing-footer__links"><a href="#produto">Produto</a><a href="#planos">Planos</a><a href="mailto:contato@estudolendario.com">Contato</a></div>
          <small>© {new Date().getFullYear()} Estudo Lendário. Todos os direitos reservados.</small>
        </div>
      </footer>
    </div>
  );
}
