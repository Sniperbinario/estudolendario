function compactHash(value, seed = 2166136261) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function summaryDocumentId(summaryKey) {
  const normalized = String(summaryKey || "").trim();
  if (!normalized) throw new Error("O tópico do resumo é obrigatório.");
  const readable = encodeURIComponent(normalized);
  if (readable.length <= 900) return readable;
  return `summary-${compactHash(normalized)}${compactHash(normalized, 2246822507)}`;
}

export function splitSummaryKey(summaryKey) {
  const [subject, ...topicParts] = String(summaryKey || "").split("|||");
  return { subject: subject || "", topic: topicParts.join("|||") };
}

export function cleanSummaryContent(value) {
  if (Array.isArray(value)) return value.map(cleanSummaryContent);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, cleanSummaryContent(item)]),
    );
  }
  return value;
}
