const crypto = require("crypto");

const DEFAULT_MODEL = "gpt-5-mini";

function extractOutputText(response) {
  return (response?.output || [])
    .flatMap((item) => (item?.type === "message" ? item.content || [] : []))
    .filter((item) => item?.type === "output_text" && item.text)
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function safetyIdentifier(value) {
  const secret = process.env.SESSION_SECRET || process.env.FIREBASE_CONFIG_JSON || "estudo-lendario";
  return crypto.createHmac("sha256", secret)
    .update(String(value || "anonymous"))
    .digest("hex")
    .slice(0, 48);
}

async function createAssistantReply({ instructions, input, safetyId, maxOutputTokens = 500 }) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("A LIA ainda não foi configurada neste ambiente.");
    error.status = 503;
    throw error;
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      instructions: String(instructions || "").slice(0, 6000),
      input: String(input || "").slice(0, 12000),
      reasoning: { effort: "low" },
      max_output_tokens: maxOutputTokens,
      store: false,
      safety_identifier: safetyIdentifier(safetyId),
    }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("OpenAI Responses API error", response.status, data?.error?.code || data?.error?.type || "unknown");
    const error = new Error("A LIA demorou para responder. Tente novamente em instantes.");
    error.status = 503;
    throw error;
  }

  const reply = extractOutputText(data);
  if (!reply) {
    const error = new Error("A LIA não conseguiu formar uma resposta. Tente novamente.");
    error.status = 503;
    throw error;
  }

  return {
    reply,
    model,
    requestId: data.id || null,
    usage: data.usage || {},
  };
}

module.exports = { DEFAULT_MODEL, extractOutputText, safetyIdentifier, createAssistantReply };
