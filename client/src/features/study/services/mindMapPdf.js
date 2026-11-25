function safePdfText(value, font) {
  const replacements = {
    "—": "-", "–": "-", "→": "->", "←": "<-", "↔": "<->",
    "“": "\"", "”": "\"", "‘": "'", "’": "'", "…": "...", "•": "-", "✓": "OK",
  };
  const source = Array.from(String(value || "")).map((character) => replacements[character] ?? character).join("");
  return Array.from(source).map((character) => {
    try {
      font.encodeText(character);
      return character;
    } catch {
      const fallback = character.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
      return fallback || "?";
    }
  }).join("");
}

function wrapPdfText(text, font, size, maxWidth) {
  const words = safePdfText(text, font).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export async function createMindMapPdf({ map, layout, subject, topic, nodeWidth = 185, nodeHeight = 68, date = new Date() }) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText(safePdfText("Estudo Lendário · Mapa mental", bold), { x: 34, y: 560, size: 11, font: bold, color: rgb(0.14, 0.41, 0.87) });
  page.drawText(safePdfText(`${subject} · ${topic}`, bold), { x: 34, y: 535, size: 17, font: bold, color: rgb(0.06, 0.13, 0.22) });
  const usableWidth = 774;
  const usableHeight = 470;
  const scale = Math.min(usableWidth / layout.width, usableHeight / layout.height, 1);
  const offsetX = 34 + (usableWidth - layout.width * scale) / 2;
  const offsetY = 35 + (usableHeight - layout.height * scale) / 2;
  map.nodes.filter((node) => node.parentId && layout.positions[node.id] && layout.positions[node.parentId]).forEach((node) => {
    const from = layout.positions[node.parentId];
    const to = layout.positions[node.id];
    const leftToRight = to.x >= from.x;
    page.drawLine({
      start: { x: offsetX + (from.x + (leftToRight ? nodeWidth : 0)) * scale, y: offsetY + usableHeight - (from.y + nodeHeight / 2) * scale },
      end: { x: offsetX + (to.x + (leftToRight ? 0 : nodeWidth)) * scale, y: offsetY + usableHeight - (to.y + nodeHeight / 2) * scale },
      thickness: Math.max(0.8, 1.5 * scale),
      color: rgb(0.55, 0.67, 0.82),
    });
  });
  const palette = [[0.95, 0.98, 1], [0.91, 0.98, 0.96], [0.96, 0.94, 1], [1, 0.95, 0.95], [0.93, 0.98, 1]];
  map.nodes.forEach((node, index) => {
    const position = layout.positions[node.id];
    if (!position) return;
    const x = offsetX + position.x * scale;
    const width = nodeWidth * scale;
    const height = nodeHeight * scale;
    const y = offsetY + usableHeight - (position.y + nodeHeight) * scale;
    const root = node.parentId == null;
    const tone = palette[index % palette.length];
    page.drawRectangle({ x, y, width, height, borderWidth: Math.max(.7, 1.2 * scale), borderColor: root ? rgb(.14, .41, .87) : rgb(.57, .68, .82), color: root ? rgb(.14, .41, .87) : rgb(...tone) });
    const size = Math.max(5.5, 10 * scale);
    const lines = wrapPdfText(node.text, bold, size, width - 16 * scale);
    const lineHeight = size * 1.25;
    const startY = y + height / 2 + ((lines.length - 1) * lineHeight) / 2 - size * .35;
    lines.forEach((line, lineIndex) => {
      const textWidth = bold.widthOfTextAtSize(line, size);
      page.drawText(line, { x: x + Math.max(5 * scale, (width - textWidth) / 2), y: startY - lineIndex * lineHeight, size, font: bold, color: root ? rgb(1, 1, 1) : rgb(.06, .13, .22) });
    });
  });
  page.drawText(safePdfText(`Gerado em ${date.toLocaleDateString("pt-BR")}`, regular), { x: 34, y: 18, size: 8, font: regular, color: rgb(.38, .46, .56) });
  return pdf.save();
}
