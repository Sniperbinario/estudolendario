import test from "node:test";
import assert from "node:assert/strict";
import { cleanSummaryContent, splitSummaryKey, summaryDocumentId } from "./summaryModel.js";

test("summaryDocumentId is stable and never contains a path separator", () => {
  const key = "Direito Constitucional|||Controle / constitucionalidade";
  assert.equal(summaryDocumentId(key), summaryDocumentId(key));
  assert.equal(summaryDocumentId(key).includes("/"), false);
});

test("summaryDocumentId keeps very long keys within the Firestore limit", () => {
  const id = summaryDocumentId(`Português|||${"conteúdo ".repeat(500)}`);
  assert.match(id, /^summary-[a-f0-9]{16}$/);
  assert.ok(id.length < 100);
});

test("splitSummaryKey preserves separators inside the topic", () => {
  assert.deepEqual(splitSummaryKey("Português|||Parte 1|||Parte 2"), {
    subject: "Português",
    topic: "Parte 1|||Parte 2",
  });
});

test("cleanSummaryContent removes undefined recursively without changing valid values", () => {
  assert.deepEqual(cleanSummaryContent({ texto: "ok", vazio: undefined, mapa: { x: 1, y: undefined }, lista: [1, null] }), {
    texto: "ok",
    mapa: { x: 1 },
    lista: [1, null],
  });
});
