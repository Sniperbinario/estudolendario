import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatDate(value) {
  if (!value) return "Sem data";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function wrapText(text, font, size, width) {
  const words = clean(text).split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildSchedulePdf(schedule, examName = "") {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize = [595.28, 841.89];
  const margin = 44;
  const ink = rgb(0.04, 0.12, 0.22);
  const muted = rgb(0.33, 0.42, 0.53);
  const blue = rgb(0.14, 0.41, 0.87);
  const mint = rgb(0.12, 0.72, 0.58);
  const line = rgb(0.84, 0.88, 0.93);
  let page;
  let y;

  const newPage = () => {
    page = pdf.addPage(pageSize);
    y = pageSize[1] - margin;
    page.drawText("ESTUDO LENDÁRIO", { x: margin, y, size: 9, font: bold, color: mint });
    y -= 26;
  };
  const ensure = (height) => {
    if (!page || y - height < margin + 18) newPage();
  };
  newPage();
  page.drawText(clean(schedule?.titulo) || "Cronograma de estudos", { x: margin, y, size: 20, font: bold, color: ink });
  y -= 22;
  page.drawText(clean(examName) || "Plano personalizado", { x: margin, y, size: 10, font: regular, color: muted });
  y -= 26;
  if (schedule?.liaResumo) {
    const summary = wrapText(schedule.liaResumo, regular, 9, pageSize[0] - margin * 2);
    summary.slice(0, 5).forEach((lineText) => {
      page.drawText(lineText, { x: margin, y, size: 9, font: regular, color: muted });
      y -= 13;
    });
    y -= 8;
  }

  const grouped = (schedule?.blocos || []).reduce((result, block) => {
    const key = block.data || "sem-data";
    if (!result[key]) result[key] = [];
    result[key].push(block);
    return result;
  }, {});
  Object.keys(grouped).sort().forEach((date) => {
    const dayBlocks = grouped[date];
    ensure(70);
    page.drawRectangle({ x: margin, y: y - 22, width: pageSize[0] - margin * 2, height: 24, color: rgb(0.94, 0.97, 1), borderColor: line, borderWidth: 0.5 });
    page.drawText(formatDate(date), { x: margin + 10, y: y - 14, size: 10, font: bold, color: blue });
    const total = dayBlocks.reduce((sum, block) => sum + Number(block.tempo || 0), 0);
    const totalLabel = `${total} min`;
    page.drawText(totalLabel, { x: pageSize[0] - margin - bold.widthOfTextAtSize(totalLabel, 9) - 10, y: y - 14, size: 9, font: bold, color: muted });
    y -= 34;
    dayBlocks.forEach((block) => {
      const title = `${clean(block.activityLabel) || "Estudar"} - ${clean(block.nome)} (${Number(block.tempo || 0)} min)`;
      const topicLines = wrapText(block.topico, regular, 8.5, pageSize[0] - margin * 2 - 22).slice(0, 2);
      const height = 21 + topicLines.length * 11;
      ensure(height + 8);
      page.drawCircle({ x: margin + 4, y: y - 5, size: 2.2, color: mint });
      page.drawText(title, { x: margin + 14, y: y - 9, size: 9, font: bold, color: ink });
      let topicY = y - 21;
      topicLines.forEach((lineText) => {
        page.drawText(lineText, { x: margin + 14, y: topicY, size: 8.5, font: regular, color: muted });
        topicY -= 11;
      });
      y -= height;
    });
    y -= 8;
  });

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    const label = `Página ${index + 1} de ${pages.length}`;
    currentPage.drawText(label, { x: pageSize[0] - margin - regular.widthOfTextAtSize(label, 8), y: 24, size: 8, font: regular, color: muted });
  });
  return pdf.save();
}

export async function downloadSchedulePdf(schedule, examName) {
  const bytes = await buildSchedulePdf(schedule, examName);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${clean(schedule?.titulo || "cronograma").toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "cronograma"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

export function printSchedule(schedule, examName) {
  const grouped = (schedule?.blocos || []).reduce((result, block) => {
    const key = block.data || "sem-data";
    if (!result[key]) result[key] = [];
    result[key].push(block);
    return result;
  }, {});
  const days = Object.keys(grouped).sort().map((date) => `<section><header><strong>${escapeHtml(formatDate(date))}</strong><span>${grouped[date].reduce((sum, block) => sum + Number(block.tempo || 0), 0)} min</span></header>${grouped[date].map((block) => `<article><b>${escapeHtml(block.activityLabel || "Estudar")} · ${escapeHtml(block.nome)}</b><small>${Number(block.tempo || 0)} min</small><p>${escapeHtml(block.topico)}</p></article>`).join("")}</section>`).join("");
  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) throw new Error("O navegador bloqueou a janela de impressão.");
  popup.opener = null;
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(schedule?.titulo || "Cronograma")}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#0a2038}main{max-width:900px;margin:auto}h1{margin:0;font-size:24px}h2{margin:6px 0 22px;color:#617085;font-size:13px;font-weight:500}section{margin:0 0 18px;break-inside:avoid}section>header{display:flex;justify-content:space-between;padding:9px 12px;border:1px solid #d5e0eb;border-radius:10px;background:#eff6ff;color:#2368df;text-transform:capitalize}article{position:relative;padding:10px 12px 8px 24px;border-bottom:1px solid #e5ebf1}article:before{content:"";position:absolute;left:8px;top:15px;width:6px;height:6px;border-radius:50%;background:#2fcfae}article b{font-size:12px}article small{float:right;color:#617085}article p{margin:4px 0 0;color:#617085;font-size:11px;line-height:1.4}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><main><h1>${escapeHtml(schedule?.titulo || "Cronograma de estudos")}</h1><h2>${escapeHtml(examName || "Plano personalizado")}</h2>${days}</main><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`);
  popup.document.close();
}

