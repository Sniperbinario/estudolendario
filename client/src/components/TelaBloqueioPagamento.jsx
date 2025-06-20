import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(60); // 60 segundos
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

  const handleCartao = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = user?.uid || "desconhecido";

    const res = await fetch("/criar-assinatura-cartao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    });

    const data = await res.json();
    window.location.href = data.init_point;
  };

  if (!bloqueado) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 text-white z-50 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">⏳ Tempo de teste esgotado!</h2>
      <p className="mb-4 text-center max-w-md">
        Para continuar estudando com acesso completo por 30 dias, ative seu plano agora por R$29,90.
        Você tem 3 dias de garantia: se cancelar nesse período, devolvemos 100% do valor.
      </p>
      <button
        onClick={handleCartao}
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-bold text-lg"
      >
        💳 Assinar por R$29,90 (3 dias de garantia)
      </button>
    </div>
  );
}
