import { StudyIcon } from "./StudyIcon";

export default function QuestionSupport({ question, expanded = true, onToggleText }) {
  const text = String(question?.texto || "").trim();
  const visual = question?.apoioVisual;
  const imageUrl = question?.imagem || question?.image;
  if (!text && !visual && !imageUrl) return null;

  return (
    <div className="question-support">
      {text && (
        <section className="support-text">
          <button type="button" aria-expanded={expanded} onClick={onToggleText}>
            <StudyIcon name="book" size={15} />
            <strong>Texto de apoio</strong>
            <span>{expanded ? "Recolher" : "Mostrar texto"}</span>
          </button>
          {expanded && <div className="support-text__content">{text}</div>}
        </section>
      )}

      {(visual || imageUrl) && (
        <figure className="question-visual">
          <figcaption><StudyIcon name="file" size={16} /><span>{visual?.title || "Material visual da questão"}</span></figcaption>
          {imageUrl && <img src={imageUrl} alt={question.altImagem || visual?.description || "Material visual necessário para responder à questão"} loading="lazy" />}
          {visual?.type === "table" && (
            <div className="question-visual__table-wrap">
              <table>
                {Array.isArray(visual.columns) && <thead><tr>{visual.columns.map((column, index) => <th key={`${column}-${index}`}>{column}</th>)}</tr></thead>}
                <tbody>{(visual.rows || []).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          {visual?.actionLabel && <div className="question-visual__action"><StudyIcon name="sparkles" size={15} /><span>{visual.actionLabel}</span></div>}
          {visual?.description && <p>{visual.description}</p>}
        </figure>
      )}
    </div>
  );
}
