import { useMemo, useState } from "react";
import { Brand } from "../../marketing/components/Brand";
import { StudyIcon } from "./StudyIcon";

const groups = [
  {
    label: "Visão geral",
    items: [
      { screen: "modulos", icon: "home", label: "Início" },
      { screen: "cronograma", icon: "calendar", label: "Meu plano" },
      { screen: "editalCompleto", icon: "file", label: "Edital" },
    ],
  },
  {
    label: "Prática",
    items: [
      { screen: "escolherMateria", icon: "questions", label: "Questões" },
      { screen: "flashcards", icon: "cards", label: "Flashcards" },
      { screen: "simulados", icon: "target", label: "Simulados" },
      { screen: "revisao", icon: "repeat", label: "Revisões" },
    ],
  },
  {
    label: "Evolução",
    items: [
      { screen: "desempenho", icon: "chart", label: "Desempenho" },
      { screen: "resumos", icon: "note", label: "Resumos" },
    ],
  },
];

const aliases = {
  questoes: "escolherMateria",
  resultadoQuestoes: "escolherMateria",
  simuladoAndamento: "simulados",
  resultadoSimulado: "simulados",
  meusSimulados: "simulados",
  historicoEstudo: "cronograma",
  materialApoio: "editalCompleto",
  desafio: "modulos",
};

export default function InternalShell({ children, screen, examName, user, onNavigate, onChangeExam, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = aliases[screen] || screen;
  const firstName = useMemo(() => {
    const source = user?.displayName || user?.email || "Estudante";
    return source.split(/[ @]/)[0];
  }, [user]);

  const navigate = (next) => {
    onNavigate(next);
    setMenuOpen(false);
  };

  return (
    <div className="study-shell">
      <aside className={`study-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="study-sidebar__brand"><Brand /></div>
        <button className="study-sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><StudyIcon name="close" /></button>

        <button className="study-goal" onClick={onChangeExam}>
          <span className="study-goal__mark">EL</span>
          <span><small>Objetivo atual</small><strong>{examName}</strong></span>
          <StudyIcon name="arrow" size={15} />
        </button>

        <nav className="study-nav" aria-label="Navegação da área de estudos">
          {groups.map((group) => (
            <div className="study-nav__group" key={group.label}>
              <span className="study-nav__label">{group.label}</span>
              {group.items.map((item) => (
                <button key={item.screen} className={active === item.screen ? "is-active" : ""} onClick={() => navigate(item.screen)}>
                  <StudyIcon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="study-sidebar__account">
          <button className="study-user" onClick={() => navigate("minhaConta")}>
            <span className="study-user__avatar">{firstName.slice(0, 1).toUpperCase()}</span>
            <span><strong>{firstName}</strong><small>Minha conta</small></span>
          </button>
          <button className="study-logout" onClick={onLogout} aria-label="Sair"><StudyIcon name="logout" /></button>
        </div>
      </aside>

      {menuOpen && <button className="study-shell__overlay" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <div className="study-workspace">
        <header className="study-mobile-header">
          <button onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><StudyIcon name="menu" /></button>
          <Brand />
          <button onClick={() => navigate("minhaConta")} aria-label="Minha conta"><StudyIcon name="user" /></button>
        </header>
        <main className="study-shell__content">{children}</main>
      </div>
    </div>
  );
}
