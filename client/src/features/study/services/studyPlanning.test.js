import test from "node:test";
import assert from "node:assert/strict";
import {
  activePlanForType,
  archivePlan,
  blockStatus,
  createReviewCycle,
  derivePending,
  extractDeferredStartSubjects,
  normalizePlans,
  rescheduleReview,
  upsertPlanSlot,
} from "./studyPlanning.js";

test("understands a plain-language request not to start with a subject", () => {
  assert.deepEqual(
    extractDeferredStartSubjects("nao quero comecar com portugues", ["Língua Portuguesa", "Direito Administrativo"]),
    ["Língua Portuguesa"],
  );
  assert.deepEqual(extractDeferredStartSubjects("quero reforcar portugues", ["Língua Portuguesa"]), []);
});

const daily = { id: "daily-1", tipo: "diario", criadoEm: "2026-11-27T10:00:00Z", blocos: [{ nome: "Português", topico: "Interpretação", data: "2026-11-26", tempo: 30 }] };
const weekly = { id: "weekly-1", tipo: "semanal", criadoEm: "2026-11-27T10:00:00Z", blocos: [{ nome: "Direito", topico: "Princípios", data: "2026-11-28", tempo: 40 }] };

test("keeps at most one active plan for each independent type", () => {
  const oldDaily = { ...daily, id: "daily-old", criadoEm: "2026-11-20T10:00:00Z" };
  const plans = normalizePlans([oldDaily, daily, weekly]);
  assert.equal(plans.length, 2);
  assert.equal(activePlanForType(plans, "diario").id, "daily-1");
  assert.throws(() => upsertPlanSlot(plans, { ...daily, id: "daily-2" }), /exclua/i);
});

test("archiving a plan frees only its slot and preserves the other types", () => {
  const result = archivePlan([daily, weekly], "diario", "2026-11-27T12:00:00Z");
  assert.equal(result.plans.length, 1);
  assert.equal(result.plans[0].tipo, "semanal");
  assert.equal(result.archived.status, "excluido");
});

test("progress is shared by topic key and overdue work becomes pending", () => {
  const completedTopics = new Set(["Português|||Interpretação"]);
  const plan = normalizePlans([{ ...daily, blocos: [...daily.blocos, { nome: "Português", topico: "Crase", data: "2026-11-25", tempo: 25 }] }])[0];
  assert.equal(blockStatus(plan.blocos[0], completedTopics, new Set(), "2026-11-27"), "concluido");
  const pending = derivePending([plan], completedTopics, new Set(), "2026-11-27");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].daysLate, 2);
});

test("review cycle starts from actual completion and adapts after difficulty", () => {
  const cycle = createReviewCycle({ examId: "pf", subject: "Informática", topic: "Redes", completedAt: "2026-11-27T18:00:00Z" });
  assert.deepEqual(cycle.stages.map((stage) => stage.dueDate), ["2026-11-28", "2026-12-04", "2026-12-27"]);
  const adapted = rescheduleReview(cycle, "dificuldade", "2026-11-28");
  assert.equal(adapted.stages[1].dueDate, "2026-11-30");
  assert.match(adapted.stages[1].label, /2 dias/);
});
