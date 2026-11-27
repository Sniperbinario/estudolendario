import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { cleanSummaryContent, splitSummaryKey, summaryDocumentId } from "./summaryModel";

export { cleanSummaryContent, splitSummaryKey, summaryDocumentId } from "./summaryModel";

const SUMMARY_SCHEMA_VERSION = 2;
const MAX_SUMMARY_BYTES = 750_000;

export class SummaryConflictError extends Error {
  constructor(latest) {
    super("Este resumo foi alterado em outra aba ou aparelho. A gravação foi bloqueada para evitar perda de dados.");
    this.name = "SummaryConflictError";
    this.code = "summary/conflict";
    this.latest = latest;
  }
}

function assertSummarySize(content) {
  const bytes = new TextEncoder().encode(JSON.stringify(content)).length;
  if (bytes > MAX_SUMMARY_BYTES) {
    throw new Error("Este resumo ficou grande demais para ser salvo com segurança. Divida o conteúdo ou o mapa mental em mais tópicos.");
  }
}

function summariesCollection(db, uid, examId) {
  return collection(db, "users", uid, "extras", examId, "summaries");
}

export async function loadSummaryDocuments(db, uid, examId) {
  const snapshot = await getDocs(summariesCollection(db, uid, examId));
  const summaries = {};
  const versions = {};

  snapshot.forEach((item) => {
    const stored = item.data() || {};
    if (!stored.summaryKey) return;
    summaries[stored.summaryKey] = cleanSummaryContent(stored.content || {});
    versions[stored.summaryKey] = Number(stored.version) || 0;
  });

  return { summaries, versions };
}

export async function saveSummaryDocument(db, { uid, examId, summaryKey, content, expectedVersion = 0 }) {
  const cleanedContent = cleanSummaryContent(content || {});
  assertSummarySize(cleanedContent);
  const { subject, topic } = splitSummaryKey(summaryKey);
  const summaryRef = doc(summariesCollection(db, uid, examId), summaryDocumentId(summaryKey));

  try {
    return await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(summaryRef);
      const current = snapshot.exists() ? snapshot.data() : null;
      const currentVersion = Number(current?.version) || 0;

      if (current?.summaryKey && current.summaryKey !== summaryKey) {
        throw new Error("Conflito interno ao identificar o resumo. Nada foi sobrescrito.");
      }
      if (currentVersion !== Number(expectedVersion || 0)) {
        throw new SummaryConflictError({
          content: cleanSummaryContent(current?.content || {}),
          version: currentVersion,
        });
      }

      const nextVersion = currentVersion + 1;
      const versionRef = doc(summaryRef, "versions", String(nextVersion).padStart(8, "0"));
      const common = {
        summaryKey,
        subject,
        topic,
        content: cleanedContent,
        version: nextVersion,
        schemaVersion: SUMMARY_SCHEMA_VERSION,
        updatedAt: serverTimestamp(),
      };

      transaction.set(summaryRef, {
        ...common,
        createdAt: current?.createdAt || serverTimestamp(),
      });
      transaction.set(versionRef, {
        ...common,
        createdAt: serverTimestamp(),
      });

      return { content: cleanedContent, version: nextVersion };
    });
  } catch (error) {
    if (error instanceof SummaryConflictError) {
      await addDoc(collection(summaryRef, "conflicts"), {
        summaryKey,
        subject,
        topic,
        attemptedContent: cleanedContent,
        expectedVersion: Number(expectedVersion || 0),
        currentVersion: error.latest.version,
        createdAt: serverTimestamp(),
      });
      error.recoveryCopySaved = true;
    }
    throw error;
  }
}

export async function loadSummaryDocument(db, uid, examId, summaryKey) {
  const reference = doc(summariesCollection(db, uid, examId), summaryDocumentId(summaryKey));
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) return { content: {}, version: 0 };
  const stored = snapshot.data() || {};
  return { content: cleanSummaryContent(stored.content || {}), version: Number(stored.version) || 0 };
}
