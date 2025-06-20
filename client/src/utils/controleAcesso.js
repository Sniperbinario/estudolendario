// src/utils/controleAcesso.js
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

export async function liberarAcessoNoFirebase() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const db = getDatabase();
  const acessoRef = ref(db, `acessos/${user.uid}`);

  try {
    await set(acessoRef, {
      liberado: true,
      liberadoEm: new Date().toISOString(),
    });
    console.log("✅ Acesso liberado com sucesso no Firebase!");
  } catch (error) {
    console.error("Erro ao liberar acesso:", error);
  }
}
