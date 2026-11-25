const test = require("node:test");
const assert = require("node:assert/strict");
const { PDFDocument } = require("pdf-lib");
const {
  hasPdfHeader,
  inspectPdf,
  splitPdfBuffer,
  storedChunkToBuffer,
  savePdfInFirestore,
  parseJsonReply,
  normalizeMindMap,
  normalizeFlashcard,
  normalizeFlashcards,
  normalizeSchedule,
  monthKey,
} = require("./study-tools");

test("inspectPdf accepts a valid PDF and counts its pages", async () => {
  const document = await PDFDocument.create();
  document.addPage();
  document.addPage();
  const buffer = Buffer.from(await document.save());

  assert.equal(hasPdfHeader(buffer), true);
  assert.deepEqual(await inspectPdf(buffer), { pageCount: 2 });
});

test("inspectPdf rejects content that is not a PDF", async () => {
  const buffer = Buffer.from("arquivo qualquer");
  assert.equal(hasPdfHeader(buffer), false);
  await assert.rejects(() => inspectPdf(buffer), /não parece ser um PDF válido/);
});

test("PDF chunks can be reassembled without changing the file", () => {
  const original = Buffer.alloc(1_500_000, 7);
  const chunks = splitPdfBuffer(original);
  const stored = chunks.map((chunk) => storedChunkToBuffer({ toBuffer: () => chunk }));
  assert.ok(chunks.length > 1);
  assert.deepEqual(Buffer.concat(stored), original);
});

test("Firestore PDF fallback splits large uploads across safe commits", async () => {
  const stored = new Map();
  let commits = 0;
  const firestore = {
    batch() {
      const operations = [];
      return {
        set(reference, data) { operations.push(["set", reference.path, data]); },
        delete(reference) { operations.push(["delete", reference.path]); },
        async commit() {
          commits += 1;
          operations.forEach(([kind, path, data]) => kind === "set" ? stored.set(path, data) : stored.delete(path));
        },
      };
    },
  };
  const reference = {
    path: "files/file-1",
    collection(name) {
      return { doc: (id) => ({ path: `${this.path}/${name}/${id}` }) };
    },
    async set(data) { stored.set(this.path, data); },
  };
  const buffer = Buffer.alloc(6 * 1024 * 1024, 3);
  const record = await savePdfInFirestore({ firestore, reference, buffer, record: { size: buffer.length } });
  assert.equal(record.storageBackend, "firestore");
  assert.equal(record.chunkCount, 10);
  assert.equal(commits, 2);
  assert.equal([...stored.keys()].filter((key) => key.includes("/content/")).length, 10);
});

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

test("normalizeSchedule removes invented IDs and appends omitted topics", () => {
  const schedule = normalizeSchedule({
    title: "Base antes da prática",
    summary: "Comece pelos fundamentos.",
    orderedTopicIds: ["t2", "inventado", "t2", "t1"],
    reasons: [{ topicId: "t2", reason: "Pré-requisito" }, { topicId: "inventado", reason: "Ignorar" }],
  }, ["t1", "t2", "t3"], "Concurso");
  assert.deepEqual(schedule.orderedTopicIds, ["t2", "t1", "t3"]);
  assert.deepEqual(schedule.reasons, [{ topicId: "t2", reason: "Pré-requisito" }]);
});

test("normalizeSchedule keeps safe strategy metadata and removes invalid dependencies", () => {
  const schedule = normalizeSchedule({
    orderedTopicIds: ["t1", "t2", "t3"],
    subjectProfiles: [
      { subject: "Português", difficulty: 9, priority: 4, theoryMinutes: 200, questionMinutes: 5, rationale: "Base" },
      { subject: "Inventada", difficulty: 5 },
    ],
    complexTopicIds: ["t2", "inventado"],
    dependencies: [
      { topicId: "t2", requires: ["t1", "inventado"] },
      { topicId: "t1", requires: ["t3"] },
    ],
  }, [
    { id: "t1", subject: "Português" },
    { id: "t2", subject: "Português" },
    { id: "t3", subject: "Direito" },
  ], "Concurso");
  assert.deepEqual(schedule.complexTopicIds, ["t2"]);
  assert.deepEqual(schedule.dependencies, [{ topicId: "t2", requires: ["t1"] }]);
  assert.equal(schedule.subjectProfiles[0].difficulty, 5);
  assert.equal(schedule.subjectProfiles[0].theoryMinutes, 55);
  assert.equal(schedule.subjectProfiles[0].questionMinutes, 15);
  assert.ok(schedule.subjectProfiles.some((profile) => profile.subject === "Direito"));
});

test("monthKey uses YYYY-MM", () => {
  assert.match(monthKey(), /^\d{4}-\d{2}$/);
});
