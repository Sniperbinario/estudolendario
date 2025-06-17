import React, { useEffect, useState } from "react";
import { salvarAcessoTemporario, temAcessoTemporario } from "../utils/controleAcesso";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(420); // 7 minutos
  const [bloqueado, setBloqueado] = useState(false);
  const [pixQR, setPixQR] = useState(null);
  const [pixTexto, setPixTexto] = useState(null);

  useEffect(() => {
    // Se já tiver acesso temporário, não exibe bloqueio
    if (temAcessoTemporario()) return;

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

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60).toString().padStart(2, '0');
    const sec = (segundos % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleCartao = async () => {
    const res = await fetch("/criar-assinatura-cartao", { method: "POST" });
    const data = await res.json();
    window.location.href = data.init_point;
  };

  const handlePix = async () => {
    const res = await fetch("/pagar-pix-teste", { method: "POST" });
    const data = await res.json();
    setPixQR(data.qr_code);
    setPixTexto(data.copia_colar);
    
  };

  if (!bloqueado) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 text-white z-50 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">⏳ Tempo de teste esgotado!</h2>
      <p className="mb-4 text-center max-w-md">
        Para continuar aproveitando a plataforma, escolha uma opção abaixo:
      </p>
      <div className="flex flex-col gap-4">
        <button
          onClick={handleCartao}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-semibold"
        >
          💳 Testar 3 dias grátis (Cartão)
        </button>

        <button
          onClick={handlePix}
          className="bg-yellow-500 hover:bg-yellow-600 px-6 py-2 rounded-lg text-black font-semibold"
        >
          📲 Pagar R$5 via Pix (teste de 2 horas)
        </button>

        {pixQR && (
          <div className="mt-6 text-center">
            <p className="mb-2 font-semibold">Escaneie o QR Code:</p>
            <img src={`data:image/png;base64,${pixQR}`} alt="QR Code Pix" className="mx-auto max-w-xs" />
            <p className="mt-2 break-words text-sm text-gray-300">{pixTexto}</p>
          </div>
        )}
      </div>
    </div>
  );
}
