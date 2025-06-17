export function salvarAcessoTemporario() {
  const agora = new Date();
  const validade = new Date(agora.getTime() + 2 * 60 * 60 * 1000); // 2 horas
  localStorage.setItem("acessoTemporario", validade.toISOString());
}

export function temAcessoTemporario() {
  const validade = localStorage.getItem("acessoTemporario");
  if (!validade) return false;
  const agora = new Date();
  return agora < new Date(validade);
}

export function limparAcessoTemporario() {
  localStorage.removeItem("acessoTemporario");
}

export function marcarAcessoFirebase(pago) {
  localStorage.setItem("acessoFirebase", pago ? "true" : "false");
}

export function acessoLiberadoFirebase() {
  return localStorage.getItem("acessoFirebase") === "true";
}
