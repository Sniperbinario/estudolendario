import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(60);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBloqueado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAssinatura = async (tipo) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = user?.uid || "desconhecido";

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
        alert("Erro ao criar link de pagamento.");
      }
    } catch (error) {
      console.error("Erro na assinatura:", error);
      alert("Falha ao processar pagamento.");
    }
  };

  if (!bloqueado) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 text-white z-50 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">⛔ Acesso bloqueado</h2>
      <p className="mb-4 text-center max-w-md">
        Para continuar com acesso total à plataforma, escolha um dos planos abaixo. Você tem 3 dias de garantia!
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => handleAssinatura("mensal")}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-bold text-lg"
        >
          💳 Mensal — R$29,90
        </button>
        <button
          onClick={() => handleAssinatura("anual")}
          className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg text-white font-bold text-lg"
        >
          🏆 Anual — R$239,90
        </button>
      </div>
    </div>
  );
}
