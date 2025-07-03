
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(60); // 60 segundos de uso antes do bloqueio
  const [bloqueado, setBloqueado] = useState(false);
  const [uid, setUid] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
    }
  }, []);

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

  const pagarPlano = async (tipo) => {
    if (!uid) {
      alert("Usuário não identificado.");
      return;
    }

    try {
      const res = await fetch("https://sniperbet4.onrender.com/criar-assinatura-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, tipo }),
      });

      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Resposta inválida do servidor.");
      }
    } catch (err) {
      console.error("Erro ao iniciar pagamento:", err);
      alert("Erro ao processar pagamento.");
    }
  };

  if (!bloqueado) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-4">⏳ Tempo de uso grátis</h1>
        <p className="text-lg">Aproveite a plataforma. Faltam <strong>{tempoRestante}</strong> segundos para o bloqueio.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 text-center">
      <h1 className="text-3xl font-bold mb-6">⛔ Acesso Bloqueado</h1>
      <p className="mb-6 max-w-md">Para continuar usando a plataforma, escolha um plano abaixo e ative seu acesso agora mesmo.</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => pagarPlano("mensal")}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-white shadow"
        >
          ✅ Assinar Mensal (R$29,90)
        </button>

        <button
          onClick={() => pagarPlano("anual")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold text-white shadow"
        >
          💎 Assinar Anual (R$299,90)
        </button>
      </div>
    </div>
  );
}
