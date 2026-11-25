import { useEffect, useMemo, useRef, useState } from "react";
import { StudyIcon } from "./StudyIcon";
import { deleteSummaryFile, listSummaryFiles, openSummaryFile, uploadSummaryFile } from "../services/studyApi";

function formatSize(bytes) {
  if (!Number(bytes)) return "0 MB";
  return `${(Number(bytes) / 1024 / 1024).toFixed(1).replace(".0", "")} MB`;
}

export default function SummaryFilesPanel({ examId, subject, topic }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listSummaryFiles(examId)
      .then((result) => { if (active) setFiles(result.files || []); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [examId]);

  const currentFiles = useMemo(
    () => files.filter((file) => file.subject === subject && file.topic === topic),
    [files, subject, topic],
  );

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setSuccess("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return setError("Escolha um arquivo PDF.");
    if (file.size > 10 * 1024 * 1024) return setError("O PDF deve ter no máximo 10 MB.");
    setUploading(true);
    try {
      const result = await uploadSummaryFile({ file, examId, subject, topic });
      setFiles((current) => current.some((item) => item.id === result.file.id) ? current : [result.file, ...current]);
      setSuccess(result.duplicate ? "Este PDF já estava salvo neste concurso." : "PDF adicionado aos seus resumos.");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (file) => {
    if (!window.confirm(`Excluir “${file.name}”?`)) return;
    setError("");
    try {
      await deleteSummaryFile(file.id);
      setFiles((current) => current.filter((item) => item.id !== file.id));
    } catch (reason) {
      setError(reason.message);
    }
  };

  return (
    <div className="summary-files">
      <section className="summary-upload-card">
        <span className="summary-upload-card__icon"><StudyIcon name="upload" size={23} /></span>
        <div><span>Material próprio</span><h3>Adicione seu resumo em PDF</h3><p>Até 10 páginas e 10 MB. O arquivo fica privado na sua conta e organizado neste tópico.</p></div>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} hidden />
        <button className="study-button study-button--primary" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <StudyIcon name="upload" size={16} /> {uploading ? "Enviando..." : "Escolher PDF"}
        </button>
      </section>
      {error && <p className="summary-file-message is-error">{error}</p>}
      {success && <p className="summary-file-message is-success">{success}</p>}
      <section className="summary-file-list">
        <div className="section-heading"><div><span>Arquivos do tópico</span><h3>Seus PDFs</h3></div><b>{currentFiles.length}</b></div>
        {loading ? <div className="summary-files__loading"><span /> Carregando arquivos...</div> : currentFiles.length ? currentFiles.map((file) => (
          <article key={file.id}>
            <span className="summary-file-list__icon"><StudyIcon name="file" size={20} /></span>
            <div><strong>{file.name}</strong><small>{file.pageCount} {file.pageCount === 1 ? "página" : "páginas"} · {formatSize(file.size)}</small></div>
            <button onClick={() => openSummaryFile(file.id)}><StudyIcon name="open" size={15} /> Abrir</button>
            <button className="is-danger" aria-label={`Excluir ${file.name}`} onClick={() => removeFile(file)}><StudyIcon name="trash" size={15} /></button>
          </article>
        )) : <div className="summary-files__empty"><StudyIcon name="file" size={22} /><p>Nenhum PDF neste tópico.</p><span>Você pode continuar escrevendo normalmente ou anexar seu próprio resumo.</span></div>}
      </section>
    </div>
  );
}
