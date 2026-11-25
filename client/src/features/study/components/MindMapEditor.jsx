import { useEffect, useMemo, useRef, useState } from "react";
import { StudyIcon } from "./StudyIcon";
import { askLia } from "../services/studyApi";
import { createMindMapPdf } from "../services/mindMapPdf";

const colors = ["blue", "mint", "violet", "coral", "sky"];
const NODE_WIDTH = 185;
const NODE_HEIGHT = 68;

function initialMap(title) {
  return { title: title || "Mapa mental", nodes: [{ id: "root", parentId: null, text: title || "Tema central" }] };
}

function normalizedMap(value, title) {
  return value?.nodes?.length ? value : initialMap(title);
}

function summaryText(summary) {
  return [summary?.conceito, summary?.pontosChave, summary?.dicasProva, summary?.legislacao, summary?.livre].filter(Boolean).join("\n\n").slice(0, 7000);
}

function safeName(value) {
  return String(value || "mapa-mental").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

export default function MindMapEditor({ value, subject, topic, summary, onSave, saveStatus }) {
  const [map, setMap] = useState(() => normalizedMap(value, topic));
  const [selectedId, setSelectedId] = useState("root");
  const [zoom, setZoom] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [focus, setFocus] = useState("");
  const [message, setMessage] = useState("");
  const editorRef = useRef(null);

  useEffect(() => {
    const next = normalizedMap(value, topic);
    setMap(next);
    setSelectedId(next.nodes[0]?.id || "root");
  }, [value, topic]);

  useEffect(() => {
    const handleFullscreen = () => setFullscreen(document.fullscreenElement === editorRef.current);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const selected = map.nodes.find((node) => node.id === selectedId) || map.nodes[0];
  const layout = useMemo(() => {
    const root = map.nodes.find((node) => node.parentId == null) || map.nodes[0];
    const levels = root ? [[root]] : [];
    const visited = new Set(root ? [root.id] : []);
    for (let depth = 1; depth < 8; depth += 1) {
      const level = map.nodes.filter((node) => !visited.has(node.id) && levels[depth - 1].some((parent) => node.parentId === parent.id));
      if (!level.length) break;
      level.forEach((node) => visited.add(node.id));
      levels.push(level);
    }
    const positions = {};
    const maxRows = Math.max(1, ...levels.map((level) => level.length));
    const rowSpace = 118;
    levels.forEach((level, depth) => level.forEach((node, index) => {
      const offset = ((maxRows - level.length) * rowSpace) / 2;
      positions[node.id] = { x: 65 + depth * 280, y: 55 + offset + index * rowSpace };
    }));
    return { positions, width: Math.max(980, levels.length * 280 + 230), height: Math.max(640, maxRows * rowSpace + 100) };
  }, [map]);

  const updateSelected = (text) => setMap((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selected.id ? { ...node, text } : node) }));

  const addChild = () => {
    if (!selected || map.nodes.length >= 24) return setMessage("O mapa pode ter no máximo 24 blocos.");
    const id = `n-${Date.now().toString(36)}`;
    setMap((current) => ({ ...current, nodes: [...current.nodes, { id, parentId: selected.id, text: "Novo tópico" }] }));
    setSelectedId(id);
    setInspectorOpen(true);
    setMessage("");
  };

  const addSibling = () => {
    if (!selected?.parentId || map.nodes.length >= 24) return;
    const id = `n-${Date.now().toString(36)}`;
    setMap((current) => ({ ...current, nodes: [...current.nodes, { id, parentId: selected.parentId, text: "Novo tópico" }] }));
    setSelectedId(id);
    setInspectorOpen(true);
  };

  const removeSelected = () => {
    if (!selected?.parentId) return;
    const removed = new Set([selected.id]);
    let changed = true;
    while (changed) {
      changed = false;
      map.nodes.forEach((node) => { if (removed.has(node.parentId) && !removed.has(node.id)) { removed.add(node.id); changed = true; } });
    }
    setMap((current) => ({ ...current, nodes: current.nodes.filter((node) => !removed.has(node.id)) }));
    setSelectedId(selected.parentId);
  };

  const generate = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const result = await askLia("mindmap", {
        subject,
        topic,
        focus,
        summary: summaryText(summary),
        currentMap: map.nodes.length > 1 ? map : null,
      });
      setMap(result.mindMap);
      setSelectedId(result.mindMap.nodes[0]?.id || "root");
      setInspectorOpen(false);
      setMessage(`A LIA estruturou ${result.mindMap.nodes.length} blocos e complementou o conteúdo · ${result.usage.remaining} consultas restantes`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await editorRef.current?.requestFullscreen();
    } catch {
      setMessage("Seu navegador bloqueou a tela cheia. Tente novamente.");
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    setMessage("");
    try {
      const bytes = await createMindMapPdf({ map, layout, subject, topic, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT });
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName(subject)}-${safeName(topic)}-mapa-mental.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage("PDF gerado em formato paisagem, pronto para estudar ou compartilhar.");
    } catch {
      setMessage("Não foi possível gerar o PDF deste mapa.");
    } finally {
      setExporting(false);
    }
  };

  const printMap = () => {
    const popup = window.open("about:blank", "_blank");
    if (!popup) return setMessage("O navegador bloqueou a janela de impressão.");
    popup.opener = null;
    const connections = map.nodes.filter((node) => node.parentId && layout.positions[node.id] && layout.positions[node.parentId]).map((node) => {
      const from = layout.positions[node.parentId];
      const to = layout.positions[node.id];
      return `<path d="M ${from.x + NODE_WIDTH} ${from.y + NODE_HEIGHT / 2} C ${from.x + NODE_WIDTH + 50} ${from.y + NODE_HEIGHT / 2}, ${to.x - 50} ${to.y + NODE_HEIGHT / 2}, ${to.x} ${to.y + NODE_HEIGHT / 2}"/>`;
    }).join("");
    const nodes = map.nodes.map((node, index) => {
      const position = layout.positions[node.id];
      if (!position) return "";
      return `<div class="node ${node.parentId == null ? "root" : `tone-${index % 5}`}" style="left:${position.x}px;top:${position.y}px">${escapeHtml(node.text)}</div>`;
    }).join("");
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(topic)} - mapa mental</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#10233b;font-family:Arial,sans-serif}header{margin-bottom:18px}header span{color:#2368df;font-size:11px;font-weight:700;text-transform:uppercase}h1{margin:5px 0 0;font-size:21px}.map{width:${layout.width}px;height:${layout.height}px;position:relative;transform-origin:top left;transform:scale(.62)}svg{position:absolute;inset:0}.node{width:${NODE_WIDTH}px;min-height:${NODE_HEIGHT}px;padding:10px;position:absolute;display:flex;align-items:center;justify-content:center;border:1px solid #9cb2cf;border-radius:14px;background:#fff;font-size:12px;font-weight:700;line-height:1.35;text-align:center}.node.root{color:#fff;border-color:#2368df;background:#2368df}.tone-1{background:#effbf8}.tone-2{background:#f6f2ff}.tone-3{background:#fff2f3}.tone-4{background:#eff9ff}path{fill:none;stroke:#9cb2cf;stroke-width:2}</style></head><body><header><span>Estudo Lendário · Mapa mental</span><h1>${escapeHtml(subject)} · ${escapeHtml(topic)}</h1></header><div class="map"><svg width="${layout.width}" height="${layout.height}">${connections}</svg>${nodes}</div><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
    popup.document.close();
  };

  return (
    <div className={`mindmap-editor ${fullscreen ? "is-fullscreen" : ""}`} ref={editorRef}>
      <header className="mindmap-toolbar">
        <div><span>Mapa do tópico</span><strong>{map.nodes.length} blocos</strong></div>
        <div className="mindmap-toolbar__actions">
          <button onClick={() => setInspectorOpen((value) => !value)}><StudyIcon name="edit" size={15} /> {inspectorOpen ? "Fechar edição" : "Editar bloco"}</button>
          <button onClick={addChild}><StudyIcon name="plus" size={15} /> Filho</button>
          <button disabled={!selected?.parentId} onClick={addSibling}><StudyIcon name="plus" size={15} /> Irmão</button>
          <button disabled={!selected?.parentId} onClick={removeSelected}><StudyIcon name="trash" size={15} /> Excluir</button>
          <button onClick={toggleFullscreen}><StudyIcon name={fullscreen ? "collapse" : "expand"} size={15} /> {fullscreen ? "Sair da tela cheia" : "Tela cheia"}</button>
          <button onClick={exportPdf} disabled={exporting}><StudyIcon name="download" size={15} /> {exporting ? "Gerando..." : "Exportar PDF"}</button>
          <button onClick={printMap}><StudyIcon name="print" size={15} /> Imprimir</button>
          <button className="is-primary" onClick={() => onSave(map)}><StudyIcon name="save" size={15} /> {saveStatus === "salvando" ? "Salvando..." : "Salvar mapa"}</button>
        </div>
      </header>
      <div className="mindmap-lia-bar">
        <span className="mindmap-lia-bar__icon"><StudyIcon name="sparkles" size={18} /></span>
        <div><strong>Aprofundar com a LIA</strong><p>Ela organiza, complementa pontos importantes e cria ramos de regras, exceções, exemplos e pegadinhas.</p></div>
        <input value={focus} maxLength="700" onChange={(event) => setFocus(event.target.value)} placeholder="Opcional: ex. foque nas pegadinhas e diferenças" />
        <button className="is-lia" disabled={generating} onClick={generate}><StudyIcon name="sparkles" size={16} /> {generating ? "Estruturando..." : "Aprofundar mapa"}</button>
      </div>
      {message && <p className="mindmap-message">{message}</p>}
      <div className={`mindmap-workspace ${inspectorOpen ? "has-inspector" : ""}`}>
        {inspectorOpen && <aside>
          <label><span>Texto do bloco selecionado</span><textarea rows="5" maxLength="100" value={selected?.text || ""} onChange={(event) => updateSelected(event.target.value)} /></label>
          <p>Selecione um bloco no mapa e use “Filho” para criar uma nova ramificação.</p>
          <div className="mindmap-zoom"><button onClick={() => setZoom((value) => Math.max(.55, value - .1))}><StudyIcon name="minus" size={15} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.35, value + .1))}><StudyIcon name="plus" size={15} /></button></div>
        </aside>}
        <section className="mindmap-canvas">
          <div style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <svg width={layout.width} height={layout.height} aria-hidden="true">
              {map.nodes.filter((node) => node.parentId && layout.positions[node.id] && layout.positions[node.parentId]).map((node) => {
                const from = layout.positions[node.parentId];
                const to = layout.positions[node.id];
                return <path key={node.id} d={`M ${from.x + NODE_WIDTH} ${from.y + NODE_HEIGHT / 2} C ${from.x + NODE_WIDTH + 50} ${from.y + NODE_HEIGHT / 2}, ${to.x - 50} ${to.y + NODE_HEIGHT / 2}, ${to.x} ${to.y + NODE_HEIGHT / 2}`} />;
              })}
            </svg>
            {map.nodes.map((node, index) => {
              const position = layout.positions[node.id];
              if (!position) return null;
              return <button type="button" className={`mindmap-node tone-${colors[index % colors.length]} ${selectedId === node.id ? "is-selected" : ""} ${node.parentId == null ? "is-root" : ""}`} style={{ left: position.x, top: position.y }} key={node.id} onClick={() => setSelectedId(node.id)}>{node.text}</button>;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
