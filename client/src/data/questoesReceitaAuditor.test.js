import test from "node:test";
import assert from "node:assert/strict";
import questoesReceitaAuditor from "./questoesReceitaAuditor.js";

const EXPECTED_COUNTS = {
  "Língua Portuguesa": 71,
  "Raciocínio Lógico-Matemático": 69,
  "Direito Administrativo": 43,
  "Direito Constitucional": 5,
  "Direito Tributário": 19,
};

const VISUAL_REFERENCE = /\b(imagem|figura|gr[aá]fico|tabela|quadro|planilha|mapa|charge|tirinha|cartum|ilustra[cç][aã]o|diagrama|esquema)\b|representa[cç][aã]o\s+(?:a\s+seguir|abaixo)|mostrad[oa]\s+(?:a\s+seguir|abaixo)/iu;

test("banco recuperado da Receita contém somente questões completas", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(questoesReceitaAuditor).map(([materia, questoes]) => [materia, questoes.length])),
    EXPECTED_COUNTS,
  );

  const questoes = Object.values(questoesReceitaAuditor).flat();
  assert.equal(questoes.length, 207);
  assert.equal(new Set(questoes.map((questao) => questao.id)).size, questoes.length);
  assert.ok(questoes.every((questao) => questao.tipo === "multipla_escolha"));
  assert.ok(questoes.every((questao) => questao.alternativas.length === 5));
  assert.ok(questoes.every((questao) => questao.alternativas.every((alternativa) => alternativa.trim())));
  assert.ok(questoes.every((questao) => Number.isInteger(questao.correta) && questao.correta >= 0 && questao.correta <= 4));
  assert.ok(questoes.every((questao) => questao.banca === "FGV" && questao.ano === 2024));
  assert.ok(questoes.every((questao) => questao.fonte.includes("gabarito definitivo")));
});

test("questões publicadas não dependem de material visual ausente", () => {
  const questoes = Object.values(questoesReceitaAuditor).flat();
  const suspeitas = questoes.filter((questao) => VISUAL_REFERENCE.test([questao.enunciado, ...questao.alternativas].join(" ")));
  assert.deepEqual(suspeitas, []);
});

test("conversão preserva rastreabilidade da prova e do conteúdo", () => {
  const questoes = Object.values(questoesReceitaAuditor).flat();
  assert.ok(questoes.every((questao) => questao.id.startsWith("q_")));
  assert.ok(questoes.every((questao) => questao.provaId && questao.prova?.endsWith(".pdf")));
  assert.ok(questoes.every((questao) => /^[a-f0-9]{64}$/.test(questao.hashOrigem)));
  assert.ok(questoes.every((questao) => Number.isInteger(questao.numeroOriginal)));
});
