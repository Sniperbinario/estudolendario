const test = require("node:test");
const assert = require("node:assert/strict");
const { parseJsonReply, normalizeMindMap, normalizeFlashcard, normalizeFlashcards, monthKey } = require("./study-tools");

test("parseJsonReply accepts fenced JSON", () => {
  assert.deepEqual(parseJsonReply('```json\n{"front":"A","back":"B"}\n```'), { front: "A", back: "B" });
});

test("normalizeMindMap repairs missing parents and keeps one root", () => {
  const map = normalizeMindMap({ title: "Tema", nodes: [
    { id: "root", parentId: null, text: "Tema" },
    { id: "child", parentId: "missing", text: "Ramo" },
  ] }, "Tema");
  assert.equal(map.nodes[1].parentId, "root");
  assert.equal(map.title, "Tema");
});

test("normalizeFlashcard requires both sides", () => {
  assert.deepEqual(normalizeFlashcard({ front: "Pergunta", back: "Resposta" }), { front: "Pergunta", back: "Resposta" });
  assert.throws(() => normalizeFlashcard({ front: "Pergunta" }));
});

test("normalizeFlashcards limits and validates a generated deck", () => {
  const cards = normalizeFlashcards({ cards: [
    { front: "Pergunta 1", back: "Resposta 1" },
    { frente: "Pergunta 2", verso: "Resposta 2" },
    { front: "Pergunta 3", back: "Resposta 3" },
  ] }, 2);
  assert.deepEqual(cards, [
    { front: "Pergunta 1", back: "Resposta 1" },
    { front: "Pergunta 2", back: "Resposta 2" },
  ]);
});

test("monthKey uses YYYY-MM", () => {
  assert.match(monthKey(), /^\d{4}-\d{2}$/);
});
