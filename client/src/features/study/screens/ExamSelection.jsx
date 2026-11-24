import { Brand } from "../../marketing/components/Brand";
import { Icon } from "../../marketing/components/Icon";

const exams = [
  { id: "camara_al", code: "CD", name: "Câmara dos Deputados", role: "Analista Legislativo", featured: true },
  { id: "pf", code: "PF", name: "Polícia Federal", role: "Agente, Delegado e Escrivão" },
  { id: "inss", code: "IN", name: "INSS", role: "Técnico do Seguro Social" },
  { id: "alego", code: "AL", name: "ALEGO", role: "Analista Administrativo" },
  { id: "sedes_tdas_tecadm", code: "ST", name: "SEDES-DF", role: "Técnico Administrativo" },
  { id: "sedes_edas_servsocial", code: "SS", name: "SEDES-DF", role: "Assistente Social" },
  { id: "sedes_edas_educsocial", code: "ES", name: "SEDES-DF", role: "Educador Social" },
  { id: "bb_escriturario", code: "BB", name: "Banco do Brasil", role: "Escriturário" },
  { id: "silva_jardim_enf", code: "EN", name: "Silva Jardim — RJ", role: "Técnico em Enfermagem" },
];

function ExamCard({ exam, selected, progress, days, onSelect }) {
  return (
    <button className={`exam-card ${selected ? "is-selected" : ""} ${exam.featured ? "exam-card--featured" : ""}`} onClick={() => onSelect(exam.id)}>
      <span className="exam-card__code">{exam.code}</span>
      <span className="exam-card__copy"><strong>{exam.name}</strong><small>{exam.role}</small></span>
      <span className="exam-card__meta"><strong>{progress}%</strong><small>{days > 0 ? `${days} dias` : "Sem data"}</small></span>
      <span className="exam-card__progress"><i style={{ width: `${progress}%` }} /></span>
      <Icon name="arrow" className="exam-card__arrow" />
    </button>
  );
}

export default function ExamSelection({ selectedExam, getProgress, getDays, onSelect }) {
  const select = (id) => onSelect(id, "modulos");
  return (
    <main className="exam-page">
      <header className="exam-page__header"><Brand /></header>
      <section className="exam-page__intro">
        <span className="eyebrow">Organização por objetivo</span>
        <h1>Qual aprovação você está construindo agora?</h1>
        <p>Escolha um edital para manter cronograma, questões e desempenho separados. Você poderá trocar de objetivo quando quiser.</p>
      </section>
      <section className="exam-list" aria-label="Editais disponíveis">
        {exams.map((exam) => <ExamCard key={exam.id} exam={exam} selected={selectedExam === exam.id} progress={getProgress(exam.id)} days={getDays(exam.id)} onSelect={select} />)}
      </section>
      <footer className="exam-page__foot"><span>Não encontrou seu concurso?</span><a href="mailto:contato@estudolendario.com">Solicitar novo edital</a></footer>
    </main>
  );
}
