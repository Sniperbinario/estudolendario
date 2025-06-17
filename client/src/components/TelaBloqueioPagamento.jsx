// src/components/TelaBloqueioPagamento.jsx
import React, { useEffect, useState } from "react";
import { salvarAcessoTemporario, temAcessoTemporario, acessoLiberadoFirebase } from "../utils/controleAcesso";
import { getAuth } from "firebase/auth";

export default function TelaBloqueioPagamento() {
  const [tempoRestante, setTempoRestante] = useState(120);
  const [bloqueado, setBloqueado] = useState(false);
  const [pixQR, setPixQR] = useState(null);
  const [pixTexto, setPixTexto] = useState(null);
  const [emailPix, setEmailPix] = useState("teste@usuario.com");

  useEffect(() => {
    if (acessoLiberadoFirebase()) return;
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

  const handleCartao = async () => {
    const res = await fetch("/criar-assinatura-cartao", { method: "POST" });
    const data = await res.json();
    window.location.href = data.init_point;
  };

  const handlePix = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = user?.uid || "anon";

    const res = await fetch("/pagar-pix-teste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid })
    });

    const data = await res.json();
    setPixQR(data.qr_code);
    setPixTexto(data.copia_colar);
    setEmailPix(data.email);
  };

  const verificarPagamento = async () => {
    const res = await fetch(`/verificar-pagamento?email=${emailPix}`);
    const data = await res.json();
    if (data.pago) {
      salvarAcessoTemporario();
      setBloqueado(false);
    } else {
      alert("Pagamento ainda não foi confirmado. Aguarde alguns segundos e tente novamente.");
    }
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
            <button
              onClick={verificarPagamento}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-semibold"
            >
              ✅ Já paguei, quero continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
