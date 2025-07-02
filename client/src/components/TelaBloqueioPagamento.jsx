
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
      console.log("✅ Usuário autenticado:", user.email);
    } else {
      console.warn("⚠️ Nenhum usuário autenticado.");
    }
  }, []);

  const pagarPlano = async (tipo) => {
    if (!uid) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      const res = await fetch("https://sniperbet4.onrender.com/criar-assinatura-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, tipo })
      });

      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        console.error("❌ Erro no response:", data);
        alert("Erro ao processar pagamento.");
      }
    } catch (err) {
      console.error("❌ Erro ao tentar criar assinatura:", err);
      alert("Erro ao processar pagamento.");
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0, 0, 0, 0.8)", color: "white", zIndex: 9999,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
    }}>
      <h2 style={{ color: "red", fontSize: "2rem", marginBottom: "1rem" }}>⛔ Acesso bloqueado</h2>
      <p style={{ textAlign: "center", marginBottom: "2rem" }}>
        Para continuar com acesso total à plataforma, escolha um dos planos abaixo.
        Você tem 3 dias de garantia!
      </p>
      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={() => pagarPlano("mensal")}
          style={{ padding: "1rem", fontSize: "1rem", backgroundColor: "green", color: "white", border: "none", borderRadius: "8px" }}
        >
          💳 Mensal — R$29,90
        </button>
        <button
          onClick={() => pagarPlano("anual")}
          style={{ padding: "1rem", fontSize: "1rem", backgroundColor: "goldenrod", color: "black", border: "none", borderRadius: "8px" }}
        >
          🏆 Anual — R$239,90
        </button>
      </div>
    </div>
  );
}
