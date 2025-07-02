
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const auth = getAuth();
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
      console.log("✅ Usuário logado, UID:", user.uid);
    } else {
      console.log("⚠️ Nenhum usuário logado.");
    }
  }, []);

  const handleAssinatura = async (tipo) => {
    if (!uid) {
      alert("Você precisa estar logado para assinar.");
      return;
    }

    try {
      const res = await fetch("https://sniperbet4.onrender.com/criar-assinatura-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, tipo }),
      });

      const data = await res.json();
      console.log("🔁 Resposta do backend:", data);

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Falha ao processar pagamento.");
      }
    } catch (err) {
      console.error("Erro ao criar assinatura:", err);
      alert("Erro ao processar pagamento.");
    }
  };

  return (
    <div className="text-center p-6 bg-black bg-opacity-80 text-white rounded-lg shadow-lg max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">⛔ Acesso bloqueado</h2>
      <p className="mb-6">
        Para continuar com acesso total à plataforma, escolha um dos planos abaixo.
        Você tem 3 dias de garantia!
      </p>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => handleAssinatura("mensal")}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center space-x-2"
        >
          <span>💳 Mensal — R$29,90</span>
        </button>

        <button
          onClick={() => handleAssinatura("anual")}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg flex items-center space-x-2"
        >
          <span>🏆 Anual — R$239,90</span>
        </button>
      </div>
    </div>
  );
}
