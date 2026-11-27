import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { buildIntelligentSchedule, validateIntelligentSchedule } from "./liaScheduleEngine.js";
import { buildSchedulePdf } from "./scheduleExport.js";

const hours = { Segunda: 3, Terça: 3, Quarta: 3, Quinta: 3, Sexta: 3, Sábado: 0, Domingo: 0 };
const topics = [
  ["t1", "Português", "Interpretação"], ["t2", "Português", "Classes de palavras"],
  ["t3", "Informática", "Segurança"], ["t4", "Informática", "Redes"],
  ["t5", "Direito Administrativo", "Princípios"], ["t6", "Direito Administrativo", "Atos"],
  ["t7", "Raciocínio Lógico", "Proposições"], ["t8", "Raciocínio Lógico", "Equivalências"],
].map(([id, subject, topic]) => ({ id, subject, topic, key: `${subject}|||${topic}`, block: "B1" }));

test("engine mixes subjects, respects capacity and creates theory and questions", () => {
  const result = buildIntelligentSchedule({
    topics,
    orderedTopicIds: topics.map((topic) => topic.id),
    subjectProfiles: [
      { subject: "Português", difficulty: 3, priority: 4, theoryMinutes: 40, questionMinutes: 20 },
      { subject: "Informática", difficulty: 4, priority: 4, theoryMinutes: 45, questionMinutes: 20 },
      { subject: "Direito Administrativo", difficulty: 4, priority: 5, theoryMinutes: 45, questionMinutes: 25 },
      { subject: "Raciocínio Lógico", difficulty: 4, priority: 3, theoryMinutes: 40, questionMinutes: 20 },
    ],
    complexTopicIds: ["t4"],
    dependencies: [{ topicId: "t4", requires: ["t3"] }],
    weeklyHours: hours,
    startDate: "2026-11-30",
    level: "zero",
    includeFlashcards: false,
  });
  const validation = validateIntelligentSchedule({ blocks: result.blocks, topics, weeklyHours: hours, startDate: "2026-11-30" });
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(result.blocks.filter((block) => block.activityType === "theory").length, topics.length);
  assert.ok(result.blocks.some((block) => block.activityType === "questions"));
  assert.equal(result.blocks.some((block) => block.activityType === "review"), false, "reviews only start after actual completion");
  const firstDay = result.blocks.filter((block) => block.data === result.blocks[0].data);
  assert.ok(new Set(firstDay.map((block) => block.nome)).size >= 3);
  assert.ok(firstDay.reduce((sum, block) => sum + block.tempo, 0) <= 180);
});

test("flashcards are only added when the learner opts in", () => {
  const base = { topics, orderedTopicIds: topics.map((topic) => topic.id), weeklyHours: hours, startDate: "2026-11-30", level: "intermediario" };
  const withoutCards = buildIntelligentSchedule({ ...base, includeFlashcards: false }).blocks;
  const withCards = buildIntelligentSchedule({ ...base, includeFlashcards: true }).blocks;
  assert.equal(withoutCards.some((block) => block.activityType === "flashcards"), false);
  assert.equal(withCards.some((block) => block.activityType === "flashcards"), true);
});

test("schedule PDF is generated with multiple days", async () => {
  const bytes = await buildSchedulePdf({ titulo: "Plano teste", liaResumo: "Distribuição equilibrada.", blocos: [
    { data: "2026-11-30", nome: "Português", topico: "Interpretação", tempo: 40, activityLabel: "Aprender conteúdo" },
    { data: "2026-12-01", nome: "Informática", topico: "Segurança", tempo: 30, activityLabel: "Resolver questões" },
  ] }, "Polícia Federal");
  const document = await PDFDocument.load(bytes);
  assert.ok(bytes.length > 1000);
  assert.ok(document.getPageCount() >= 1);
});
