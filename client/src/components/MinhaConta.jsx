import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";

export default function MinhaConta() {
  const user = auth.currentUser;
  const [dados, setDados] = useState({
    nome: "",
    endereco: "",
    cpf: "",
    nascimento: "",
    email: "",
  });

  const [novaSenha, setNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Novos estados do plano
  const [plano, setPlano] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [validade, setValidade] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDados(data);
        setPlano(data.plano || "Nenhum plano");
        setAtivo(data.ativo || false);
        setValidade(data.validade || null);
      }
    };
    carregarDados();
  }, [user]);

  const handleSalvar = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        nome: dados.nome,
        endereco: dados.endereco,
        nascimento: dados.nascimento,
      });
      setMensagem("Dados atualizados com sucesso!");
    } catch (error) {
      setMensagem("Erro ao atualizar: " + error.message);
    }
  };

  const handleTrocarSenha = async () => {
    try {
      if (novaSenha.length < 6) {
        return setMensagem("A nova senha deve ter pelo menos 6 caracteres.");
      }
      await updatePassword(user, novaSenha);
      setMensagem("Senha atualizada com sucesso!");
      setNovaSenha("");
    } catch (error) {
      setMensagem("Erro ao trocar senha: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h2 className="text-3xl font-bold mb-6">👤 Minha Conta</h2>

      {/* Bloco do plano */}
      <div className="mb-6 text-center text-white">
        <p className="text-sm">
          Plano: <span className="font-bold">{plano}</span>
        </p>
        <p className="text-sm">
          Status:{" "}
          <span className={`font-bold ${ativo ? "text-green-400" : "text-red-400"}`}>
            {ativo ? "Ativo ✅" : "Inativo ❌"}
          </span>
        </p>
        {validade && (
          <p className="text-sm text-gray-300">
            Validade até: <strong>{validade}</strong>
          </p>
        )}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
        <input
          type="text"
          value={dados.nome}
          onChange={(e) => setDados({ ...dados, nome: e.target.value })}
          placeholder="Nome completo"
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="text"
          value={dados.endereco}
          onChange={(e) => setDados({ ...dados, endereco: e.target.value })}
          placeholder="Endereço"
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="text"
          value={dados.cpf}
          disabled
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 opacity-50 cursor-not-allowed"
        />
        <input
          type="date"
          value={dados.nascimento}
          onChange={(e) => setDados({ ...dados, nascimento: e.target.value })}
          placeholder="Data de nascimento"
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        />
        <input
          type="email"
          value={dados.email}
          disabled
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 opacity-50 cursor-not-allowed"
        />

        <button
          onClick={handleSalvar}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold"
        >
          Salvar Dados
        </button>

        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-2">🔒 Trocar Senha</h3>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Nova senha"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 mb-2"
          />
          <button
            onClick={handleTrocarSenha}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
          >
            Atualizar Senha
          </button>
        </div>

        {mensagem && <div className="text-sm text-center text-yellow-400 mt-2">{mensagem}</div>}
      </div>
    </div>
  );
}
