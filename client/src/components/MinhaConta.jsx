import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";

export default function MinhaConta({ setTela }) {
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

  // Dados do plano
  const [plano, setPlano] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [validade, setValidade] = useState(null);
  const [tempoRestante, setTempoRestante] = useState("");

  const [acessoLiberado, setAcessoLiberado] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDados(data);
        setPlano(data.plano || "");
        setAtivo(data.ativo || false);
        setValidade(data.validade || null);
        setAcessoLiberado(data.acessoLiberado || false);
      }
    };
    carregarDados();
  }, [user]);

  useEffect(() => {
    const ativarPlanoTeste = async () => {
      if (!user || !acessoLiberado || plano) return;
      const dataValidade = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        plano: "teste",
        ativo: true,
        origem: "teste_gratis",
        validade: dataValidade,
      });

      setPlano("teste");
      setAtivo(true);
      setValidade(dataValidade);
    };

    ativarPlanoTeste();
  }, [user, acessoLiberado, plano]);

  useEffect(() => {
    if (!validade) return;

    const intervalo = setInterval(() => {
      const agora = new Date();
      const validadeDate = new Date(validade);
      const diff = validadeDate - agora;

      if (diff <= 0) {
        setTempoRestante("Expirado");
        clearInterval(intervalo);
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diff / (1000 * 60)) % 60);

      setTempoRestante(`${dias}d ${horas}h ${minutos}min`);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [validade]);

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
      if (error.code === "auth/requires-recent-login") {
        setMensagem("⚠️ Faça logout e login novamente para trocar sua senha.");
      } else {
        setMensagem("Erro ao trocar senha: " + error.message);
      }
    }
  };

  const gerarLinkWhatsApp = () => {
    const msg = `Olá, quero cancelar meu teste grátis.\nNome: ${dados.nome}\nEmail: ${dados.email}\nCPF: ${dados.cpf}`;
    return `https://wa.me/55SEUNUMEROAQUI?text=${encodeURIComponent(msg)}`;
  };

  const estaEmTeste = plano === "teste" && ativo && tempoRestante !== "Expirado";

  const nomePlano = () => {
    switch (plano?.toLowerCase()) {
      case "mensal":
        return "Mensal";
      case "anual":
        return "Anual";
      default:
        return "Plano Ativo";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <h2 className="text-3xl font-bold mb-6">👤 Minha Conta</h2>
      <button
        onClick={() => setTela("modulos")}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow"
      >
        🔙 Voltar para o Menu Principal
      </button>

      <div className="mb-6 text-center text-white">
        <p className="text-sm">
          Plano: <span className="font-bold">{nomePlano()}</span>
        </p>
        <p className="text-sm">
          Status:{" "}
          <span className={`font-bold ${ativo ? "text-green-400" : "text-red-400"}`}>
            {ativo ? "Ativo ✅" : "Inativo ❌"}
          </span>
        </p>
        {tempoRestante && tempoRestante !== "Expirado" && (
          <p className="text-sm text-gray-300">⏳ Faltam: {tempoRestante}</p>
        )}
        {estaEmTeste && (
          <a
            href={gerarLinkWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            Cancelar teste / Pedir reembolso via WhatsApp
          </a>
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
