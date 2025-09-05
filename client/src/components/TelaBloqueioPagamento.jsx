import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(360); // 60 segundos
  const [bloqueado, setBloqueado] = useState(false);
  const [plano, setPlano] = useState("mensal"); // novo estado

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
      body: JSON.stringify({ uid, plano }), // manda o plano junto!
    });

    const data = await res.json();
    window.location.href = data.init_point;
  };

  if (!bloqueado) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 text-white z-50 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">⏳ Tempo de teste esgotado!</h2>
      <p className="mb-4 text-center max-w-md">
        Escolha seu plano e continue estudando sem limites. Você tem 3 dias de garantia: se cancelar nesse período, devolvemos 100% do valor.
      </p>

      {/* Seletor de plano */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-4 rounded-lg font-bold text-lg border-2 ${
            plano === "mensal"
              ? "bg-green-600 border-green-400"
              : "bg-gray-800 border-gray-600"
          }`}
          onClick={() => setPlano("mensal")}
        >
          Mensal<br />
          <span className="text-base font-normal">R$29,90 / 30 dias</span>
        </button>
        <button
          className={`px-6 py-4 rounded-lg font-bold text-lg border-2 ${
            plano === "anual"
              ? "bg-yellow-500 text-black border-yellow-300"
              : "bg-gray-800 border-gray-600"
          }`}
          onClick={() => setPlano("anual")}
        >
          Anual<br />
          <span className="text-base font-normal">R$230,00 / 365 dias</span>
        </button>
      </div>

      <button
        onClick={handleCartao}
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-bold text-lg"
      >
        💳 Assinar {plano === "mensal" ? "por R$29,90" : "por R$230,00"} (3 dias de garantia)
      </button>
    </div>
  );
}
