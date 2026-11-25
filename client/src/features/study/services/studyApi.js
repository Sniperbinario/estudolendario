import { auth } from "../../../firebase";

async function authorizedFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Entre na sua conta para continuar.");
  const token = await user.getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Não foi possível concluir esta ação.");
  }
  return response;
}

export async function getLiaUsage() {
  return (await authorizedFetch("/api/lia/usage")).json();
}

export async function askLia(action, context) {
  return (await authorizedFetch("/api/lia/ask", {
    method: "POST",
    body: JSON.stringify({ action, context }),
  })).json();
}

export async function listSummaryFiles(examId) {
  return (await authorizedFetch(`/api/summaries/files?examId=${encodeURIComponent(examId || "")}`)).json();
}

export async function uploadSummaryFile({ file, examId, subject, topic }) {
  const form = new FormData();
  form.append("file", file);
  form.append("examId", examId);
  form.append("subject", subject);
  form.append("topic", topic);
  return (await authorizedFetch("/api/summaries/files", { method: "POST", body: form })).json();
}

export async function deleteSummaryFile(id) {
  return (await authorizedFetch(`/api/summaries/files/${encodeURIComponent(id)}`, { method: "DELETE" })).json();
}

export async function openSummaryFile(id) {
  const popup = window.open("about:blank", "_blank");

  try {
    if (popup) popup.opener = null;

    const response = await authorizedFetch(`/api/summaries/files/${encodeURIComponent(id)}/content`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (popup) {
      popup.location.replace(url);
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    popup?.close();
    throw error;
  }
}
