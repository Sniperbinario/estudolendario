import test from "node:test";
import assert from "node:assert/strict";
import questoesReceitaAuditor from "./questoesReceitaAuditor.js";

test("amostra de Português da Receita contém somente questões completas", () => {
  const questoes = questoesReceitaAuditor["Língua Portuguesa"];

  assert.equal(questoes.length, 14);
  assert.equal(new Set(questoes.map((questao) => questao.id)).size, 14);
  assert.ok(questoes.every((questao) => questao.tipo === "multipla_escolha"));
  assert.ok(questoes.every((questao) => questao.alternativas.length === 5));
  assert.ok(questoes.every((questao) => questao.correta >= 0 && questao.correta <= 4));
  assert.ok(questoes.every((questao) => questao.materia === "Língua Portuguesa"));
  assert.ok(questoes.every((questao) => questao.fonte.includes("gabarito definitivo")));
});

test("conversão preserva o gabarito oficial da primeira questão", () => {
  const primeira = questoesReceitaAuditor["Língua Portuguesa"][0];

  assert.equal(primeira.numeroOriginal, 1);
  assert.equal(primeira.correta, 3);
  assert.equal(primeira.alternativas[primeira.correta], "ninguém deve aderir ao comodismo.");
});
