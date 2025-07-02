
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(60);
  const [uid, setUid] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
    } else {
      alert("Usuário não autenticado. Faça login novamente.");
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
      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Erro ao processar pagamento.");
      }
    } catch (err) {
      console.error("Erro no pagamento:", err);
      alert("Erro ao processar pagamento.");
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex flex-col justify-center items-center text-white px-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-xl text-center shadow-lg">
        <h2 className="text-2xl font-bold text-red-500 mb-2">⛔ Acesso bloqueado</h2>
        <p className="mb-4">
          Para continuar com acesso total à plataforma, escolha um dos planos abaixo.
          Você tem 3 dias de garantia!
        </p>

        {!bloqueado ? (
          <p className="mb-4 text-sm text-yellow-400">
            ⏳ Tempo restante para teste: <strong>{tempoRestante}s</strong>
          </p>
        ) : (
          <p className="mb-4 text-sm text-red-400">
            Tempo expirado. É necessário assinar para continuar.
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => pagarPlano("mensal")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold shadow inline-flex items-center justify-center"
          >
            💳 Mensal — R$29,90
          </button>
          <button
            onClick={() => pagarPlano("anual")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-bold shadow inline-flex items-center justify-center"
          >
            🏆 Anual — R$239,90
          </button>
        </div>
      </div>
    </div>
  );
}
