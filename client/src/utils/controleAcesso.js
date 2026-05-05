// src/utils/controleAcesso.js
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

export async function marcarAcessoFirebase(liberado = false) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const db = getDatabase();
  const acessoRef = ref(db, `acessos/${user.uid}`);

  await set(acessoRef, {
    liberado,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function liberarAcessoNoFirebase() {
  try {
    await marcarAcessoFirebase(true);
    console.log("✅ Acesso liberado com sucesso no Firebase!");
  } catch (error) {
    console.error("Erro ao liberar acesso:", error);
  }
}
