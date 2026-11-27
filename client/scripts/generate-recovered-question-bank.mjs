import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const LETTERS = ["A", "B", "C", "D", "E"];
const TARGET_SUBJECTS = new Map([
  ["Língua Portuguesa", "Língua Portuguesa"],
  ["Raciocínio Lógico-Matemático", "Raciocínio Lógico-Matemático"],
  ["Direito Administrativo", "Direito Administrativo"],
  ["Direito Constitucional", "Direito Constitucional"],
  ["Direito Tributário", "Direito Tributário"],
]);

// Referências como estas indicam que a questão não pode ser respondida com
// segurança sem o material visual original. Elas ficam fora do site até que
// os arquivos de imagem sejam vinculados corretamente.
const VISUAL_REFERENCE = /\b(imagem|figura|gr[aá]fico|tabela|quadro|planilha|mapa|charge|tirinha|cartum|ilustra[cç][aã]o|diagrama|esquema)\b|representa[cç][aã]o\s+(?:a\s+seguir|abaixo)|mostrad[oa]\s+(?:a\s+seguir|abaixo)/iu;
const BLOCKING_REVIEW_CODES = new Set([
  "gabarito_sem_questao",
  "alternativas_incompletas",
  "enunciado_ausente",
  "gabarito_ausente",
  "prova_incompleta",
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasCompleteChoices(question) {
  return LETTERS.every((letter) => clean(question.alternativas?.[letter]));
}

function hasBlockingReview(question) {
  return (question.revisao || []).some((item) => BLOCKING_REVIEW_CODES.has(item.codigo));
}

function isSafe(question) {
  const targetSubject = TARGET_SUBJECTS.get(clean(question.disciplina));
  if (!targetSubject || !clean(question.assunto)) return false;
  if (!LETTERS.includes(question.alternativa_correta) || question.anulada) return false;
  if (!hasCompleteChoices(question) || question.numero_original_inferido) return false;
  if (question.texto_compartilhado_id || hasBlockingReview(question)) return false;
  if (question.classificacao_automatica?.confianca_disciplina !== "alta") return false;
  if (question.classificacao_automatica?.confianca_assunto !== "alta") return false;

  const searchableText = [
    question.enunciado,
    ...LETTERS.map((letter) => question.alternativas?.[letter]),
  ].map(clean).join(" ");
  return !VISUAL_REFERENCE.test(searchableText);
}

function toSiteQuestion(question) {
  const correctIndex = LETTERS.indexOf(question.alternativa_correta);
  const source = question.referencia_prova || {};
  const subject = TARGET_SUBJECTS.get(clean(question.disciplina));

  return {
    id: question.id_deterministico,
    tipo: "multipla_escolha",
    enunciado: clean(question.enunciado),
    alternativas: LETTERS.map((letter) => clean(question.alternativas[letter])),
    correta: correctIndex,
    explicacao: `Gabarito oficial da FGV: alternativa ${question.alternativa_correta}.`,
    materia: subject,
    assunto: clean(question.assunto),
    banca: clean(question.banca) || "FGV",
    ano: Number(question.ano) || 2024,
    numeroOriginal: Number(question.numero_original),
    provaId: clean(source.prova_id),
    prova: clean(source.arquivo),
    fonte: "Caderno oficial e gabarito definitivo da FGV",
    hashOrigem: clean(question.hash_conteudo),
  };
}

function serialize(bank, stats) {
  const banner = [
    "// Arquivo gerado. Não edite manualmente.",
    "// Origem: lote recuperado de provas FGV 2024, com gabarito definitivo.",
    `// Questões publicáveis: ${stats.accepted}; retidas pelo filtro: ${stats.rejected}.`,
    "",
  ].join("\n");
  return `${banner}const questoesReceitaAuditor = ${JSON.stringify(bank, null, 2)};\n\nexport default questoesReceitaAuditor;\n`;
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    throw new Error("Uso: node generate-recovered-question-bank.mjs <questoes.ndjson> <saida.js>");
  }

  const bank = Object.fromEntries([...new Set(TARGET_SUBJECTS.values())].map((subject) => [subject, []]));
  const seen = new Set();
  const stats = { read: 0, accepted: 0, rejected: 0, duplicates: 0 };
  const reader = readline.createInterface({ input: createReadStream(input, { encoding: "utf8" }), crlfDelay: Infinity });

  for await (const line of reader) {
    if (!line.trim()) continue;
    stats.read += 1;
    const question = JSON.parse(line);
    if (!isSafe(question)) {
      stats.rejected += 1;
      continue;
    }
    if (seen.has(question.id_deterministico)) {
      stats.duplicates += 1;
      continue;
    }
    seen.add(question.id_deterministico);
    const converted = toSiteQuestion(question);
    bank[converted.materia].push(converted);
    stats.accepted += 1;
  }

  for (const questions of Object.values(bank)) {
    questions.sort((a, b) => a.materia.localeCompare(b.materia, "pt-BR") || a.prova.localeCompare(b.prova, "pt-BR") || a.numeroOriginal - b.numeroOriginal);
  }

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, serialize(bank, stats), "utf8");
  console.log(JSON.stringify({ ...stats, bySubject: Object.fromEntries(Object.entries(bank).map(([subject, questions]) => [subject, questions.length])) }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
