import { StudyIcon } from "../components/StudyIcon";

export default function MaterialSupportScreen({ material, onQuestions, onEdital }) {
  const keyPoints = material?.conteudo?.pontosChave || ["Leia o tópico no edital", "Resolva questões", "Anote os erros", "Revise em D+1 e D+7"];
  const roadmap = material?.conteudo?.roteiro || ["Estudar a teoria curta", "Fazer uma bateria de questões", "Registrar os erros", "Agendar a próxima revisão"];
  return (
    <main className="study-page material-page">
      <header className="study-page__header"><div><span className="study-page__eyebrow">Material de apoio</span><h1>{material?.materia || "Matéria"}</h1><p>{material?.assunto || "Resumo estratégico para orientar sua próxima sessão."}</p></div><button className="study-button study-button--quiet" onClick={onEdital}><StudyIcon name="file" size={15} /> Ver no edital</button></header>
      <section className="material-hero"><div><span>Resumo estratégico</span><h2>O que você precisa levar para a prova</h2><p>{material?.conteudo?.resumo || "Este material ainda está sendo ampliado. Use os pontos-chave e o roteiro de estudo para avançar com segurança."}</p></div><StudyIcon name="book" size={34} /></section>
      <div className="material-grid"><section><div className="section-heading"><div><span>Essencial</span><h2>Pontos-chave</h2></div></div><ul>{keyPoints.map((item, index) => <li key={index}><span><StudyIcon name="check" size={14} /></span>{item}</li>)}</ul></section><section><div className="section-heading"><div><span>Próximos passos</span><h2>Roteiro sugerido</h2></div></div><ol>{roadmap.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></section></div>
      <div className="material-actions"><button className="study-button study-button--primary" onClick={onQuestions}><StudyIcon name="questions" size={16} /> Resolver questões desta matéria</button><button className="study-button study-button--quiet" onClick={onEdital}>Abrir edital verticalizado</button></div>
    </main>
  );
}
