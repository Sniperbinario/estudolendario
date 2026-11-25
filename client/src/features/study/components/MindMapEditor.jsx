import { useEffect, useMemo, useState } from "react";
import { StudyIcon } from "./StudyIcon";
import { askLia } from "../services/studyApi";

const colors = ["blue", "mint", "violet", "coral", "sky"];

function initialMap(title) {
  return { title: title || "Mapa mental", nodes: [{ id: "root", parentId: null, text: title || "Tema central" }] };
}

function normalizedMap(value, title) {
  return value?.nodes?.length ? value : initialMap(title);
}

function summaryText(summary) {
  return [summary?.conceito, summary?.pontosChave, summary?.dicasProva, summary?.legislacao, summary?.livre].filter(Boolean).join("\n\n").slice(0, 7000);
}

export default function MindMapEditor({ value, subject, topic, summary, onSave, saveStatus }) {
  const [map, setMap] = useState(() => normalizedMap(value, topic));
  const [selectedId, setSelectedId] = useState("root");
  const [zoom, setZoom] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const next = normalizedMap(value, topic);
    setMap(next);
    setSelectedId(next.nodes[0]?.id || "root");
  }, [value, topic]);

  const selected = map.nodes.find((node) => node.id === selectedId) || map.nodes[0];
  const layout = useMemo(() => {
    const root = map.nodes.find((node) => node.parentId == null) || map.nodes[0];
    const levels = [[root]];
    const visited = new Set([root?.id]);
    for (let depth = 1; depth < 8; depth += 1) {
      const level = map.nodes.filter((node) => !visited.has(node.id) && levels[depth - 1].some((parent) => node.parentId === parent.id));
      if (!level.length) break;
      level.forEach((node) => visited.add(node.id));
      levels.push(level);
    }
    const positions = {};
    const maxRows = Math.max(1, ...levels.map((level) => level.length));
    levels.forEach((level, depth) => level.forEach((node, index) => {
      const spacing = Math.max(92, (maxRows * 92) / Math.max(level.length, 1));
      positions[node.id] = { x: 50 + depth * 230, y: 45 + index * spacing + ((maxRows - level.length) * 42) };
    }));
    return { positions, width: Math.max(760, levels.length * 230 + 180), height: Math.max(430, maxRows * 100 + 80) };
  }, [map]);

  const updateSelected = (text) => setMap((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selected.id ? { ...node, text } : node) }));

  const addChild = () => {
    if (!selected || map.nodes.length >= 24) return setMessage("O mapa pode ter no máximo 24 blocos.");
    const id = `n-${Date.now().toString(36)}`;
    setMap((current) => ({ ...current, nodes: [...current.nodes, { id, parentId: selected.id, text: "Novo tópico" }] }));
    setSelectedId(id);
    setMessage("");
  };

  const addSibling = () => {
    if (!selected?.parentId || map.nodes.length >= 24) return;
    const id = `n-${Date.now().toString(36)}`;
    setMap((current) => ({ ...current, nodes: [...current.nodes, { id, parentId: selected.parentId, text: "Novo tópico" }] }));
    setSelectedId(id);
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
    const content = summaryText(summary);
    if (!content) return setMessage("Escreva ao menos uma parte do resumo antes de gerar o mapa.");
    setGenerating(true);
    setMessage("");
    try {
      const result = await askLia("mindmap", { subject, topic, summary: content });
      setMap(result.mindMap);
      setSelectedId(result.mindMap.nodes[0]?.id || "root");
      setMessage(`Mapa criado pela LIA · ${result.usage.remaining} consultas restantes`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mindmap-editor">
      <header className="mindmap-toolbar">
        <div><span>Mapa do tópico</span><strong>{map.nodes.length} blocos</strong></div>
        <div className="mindmap-toolbar__actions">
          <button onClick={addChild}><StudyIcon name="plus" size={15} /> Filho</button>
          <button disabled={!selected?.parentId} onClick={addSibling}><StudyIcon name="plus" size={15} /> Irmão</button>
          <button disabled={!selected?.parentId} onClick={removeSelected}><StudyIcon name="trash" size={15} /> Excluir</button>
          <button className="is-lia" disabled={generating} onClick={generate}><StudyIcon name="sparkles" size={16} /> {generating ? "Criando..." : "Criar com a LIA"}</button>
          <button className="is-primary" onClick={() => onSave(map)}><StudyIcon name="save" size={15} /> {saveStatus === "salvando" ? "Salvando..." : "Salvar mapa"}</button>
        </div>
      </header>
      {message && <p className="mindmap-message">{message}</p>}
      <div className="mindmap-workspace">
        <aside>
          <label><span>Texto do bloco selecionado</span><textarea rows="4" maxLength="100" value={selected?.text || ""} onChange={(event) => updateSelected(event.target.value)} /></label>
          <p>Selecione um bloco no mapa e use “Filho” para criar uma nova ramificação.</p>
          <div className="mindmap-zoom"><button onClick={() => setZoom((value) => Math.max(.65, value - .1))}><StudyIcon name="minus" size={15} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.25, value + .1))}><StudyIcon name="plus" size={15} /></button></div>
        </aside>
        <section className="mindmap-canvas">
          <div style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <svg width={layout.width} height={layout.height} aria-hidden="true">
              {map.nodes.filter((node) => node.parentId && layout.positions[node.id] && layout.positions[node.parentId]).map((node) => {
                const from = layout.positions[node.parentId];
                const to = layout.positions[node.id];
                return <path key={node.id} d={`M ${from.x + 150} ${from.y + 27} C ${from.x + 190} ${from.y + 27}, ${to.x - 40} ${to.y + 27}, ${to.x} ${to.y + 27}`} />;
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
