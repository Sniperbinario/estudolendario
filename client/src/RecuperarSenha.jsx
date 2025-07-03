import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function RecuperarSenha({ fechar }) {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const handleRecuperar = async () => {
    setMensagem("");
    setErro("");
    const auth = getAuth();
    if (!email) {
      setErro("Digite seu e-mail!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMensagem("Email de recuperação enviado! Confira sua caixa de entrada e spam.");
    } catch (err) {
      setErro("Erro ao enviar email. Confira o endereço digitado.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-gray-900 flex flex-col">
        <h2 className="text-xl font-bold mb-3">🔑 Recuperar senha</h2>
        <input
          className="border p-2 mb-3 rounded"
          placeholder="Seu e-mail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button
          onClick={handleRecuperar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2 font-bold"
        >
          Enviar link de recuperação
        </button>
        {mensagem && <div className="text-green-700 text-sm mb-2">{mensagem}</div>}
        {erro && <div className="text-red-600 text-sm mb-2">{erro}</div>}
        <button onClick={fechar} className="text-sm text-blue-800 underline">Fechar</button>
      </div>
    </div>
  );
}
