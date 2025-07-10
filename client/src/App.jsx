import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";
import questoes from "./data/questoes";
import questoesSimulado from "./data/simulados";
import simuladosPF from "./data/simuladosPF"; 
import LandingPage from "./LandingPage";
import conteudosPF from "./data/conteudosPF";
import TelaBloqueioPagamento from "./components/TelaBloqueioPagamento";
import { getDatabase, ref, get } from "firebase/database";
import { arrayUnion } from "firebase/firestore";
import MinhaConta from "./components/MinhaConta";
import RecuperarSenha from "./RecuperarSenha";


// === COMPONENTE LOGIN CADASTRO FIREBASE ===
import { auth } from "./firebase";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

import { motion, AnimatePresence } from "framer-motion";

//COMPONETENTE DO FIREBASE
import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";



function LoginRegister({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState("login");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Campos adicionais
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [mostrarRecuperarSenha, setMostrarRecuperarSenha] = useState(false);

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  };

  const formatarCPF = (valor) => {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return valor;
  };

  const buscarEnderecoPorCEP = async (cepDigitado) => {
    const cep = cepDigitado.replace(/\D/g, "");
    if (cep.length !== 8) {
      setErro("CEP inválido. Digite os 8 números.");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErro("CEP não encontrado.");
        return;
      }

      const enderecoFormatado = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
      setEndereco(enderecoFormatado);
      setErro("");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setErro("Erro ao buscar o CEP.");
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setErro("");
  setCarregando(true);

  try {
    if (modo === "login") {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      onLogin(userCredential.user);
    } else {
      if (!nome || !endereco || !cpf || !nascimento) {
        setErro("Preencha todos os campos obrigatórios.");
        setCarregando(false);
        return;
      }

      if (!validarCPF(cpf)) {
        setErro("CPF inválido.");
        setCarregando(false);
        return;
      }

      // Cria o usuário primeiro
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      try {
        // Agora que o user está logado, podemos consultar o CPF
        const usuariosRef = collection(db, "users");
        const q = query(usuariosRef, where("cpf", "==", cpf));
        const snap = await getDocs(q);

        if (!snap.empty) {
          // Se já existir o CPF, deleta esse novo usuário
          await user.delete();
          setErro("Este CPF já está cadastrado. Faça login ou use outro.");
          setCarregando(false);
          return;
        }

        // CPF não existe, salva o cadastro
        await setDoc(doc(db, "users", user.uid), {
          nome,
          endereco,
          cpf,
          nascimento,
          email
        });

        onLogin(user);

      } catch (err) {
        console.error("Erro ao verificar CPF:", err.message);
        await user.delete(); // Deleta usuário se der erro
        setErro("Erro ao verificar CPF. Tente novamente.");
        setCarregando(false);
        return;
      }
    }
  } catch (error) {
    setErro(error.message.replace("Firebase:", ""));
  }

  setCarregando(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-xl p-8 space-y-6 border border-gray-600">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {modo === "login" ? "🔐 Acesse sua conta" : "🚀 Crie sua conta gratuita"}
          </h1>
          <p className="text-gray-300 text-sm">
            {modo === "login"
              ? "Entre para continuar sua jornada de estudos"
              : "Preencha os dados abaixo para começar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {modo === "cadastro" && (
            <>
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-cadastro"
                required
              />
              <input
                type="text"
                placeholder="CEP (somente números)"
                maxLength={9}
                onBlur={(e) => buscarEnderecoPorCEP(e.target.value)}
                className="input-cadastro"
                required
              />
              <input
                type="text"
                placeholder="Endereço completo"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="input-cadastro"
                required
              />
              <input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                className="input-cadastro"
                required
                maxLength={14}
              />
              <label className="text-sm text-gray-300 -mb-2">Data de Nascimento</label>
              <input
                type="date"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
                className="p-2 rounded bg-gray-700 border border-gray-600"
                required
              />
            </>
          )}

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-cadastro"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="input-cadastro"
            required
            minLength={6}
          />

          {erro && <div className="text-red-400 text-sm text-center">{erro}</div>}

          <button
            type="submit"
            disabled={carregando}
            className="bg-blue-600 hover:bg-blue-700 transition-all py-3 rounded-lg font-bold text-white shadow"
          >
            {carregando
              ? "Carregando..."
              : modo === "login"
              ? "Entrar"
              : "Cadastrar"}
          </button>

          {/* Botão de recuperação de senha */}
          {modo === "login" && (
            <button
              type="button"
              className="text-blue-400 underline text-sm mt-2"
              onClick={() => setMostrarRecuperarSenha(true)}
              style={{ display: "block", margin: "0 auto" }}
            >
              Esqueci minha senha
            </button>
          )}
        </form>

        <div className="text-sm text-center text-gray-300">
          {modo === "login" ? (
            <>
              Ainda não tem conta?{" "}
              <button
                type="button"
                className="text-blue-400 underline"
                onClick={() => setModo("cadastro")}
              >
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                className="text-blue-400 underline"
                onClick={() => setModo("login")}
              >
                Fazer login
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de recuperação de senha */}
      {mostrarRecuperarSenha && (
        <RecuperarSenha fechar={() => setMostrarRecuperarSenha(false)} />
      )}
    </div>
  );
}
// === FIM LOGIN CADASTRO ===
  // COMPONENTE REFLEXÃO MOTIVACIONAL
  function FraseMotivacionalEDiasProva() {
  const FRASES = [
    "Você pode mais do que imagina. Não desista!",
    "A diferença entre aprovado e reprovado é não desistir.",
    "Essa vaga já tem dono: você. Só continuar caminhando!",
    "Faltam só alguns passos. Bora pra cima!",
    "Todo esforço será recompensado. Continue firme!",
  ];
  const DATA_PROVA = new Date("2024-08-10T00:00:00-03:00"); // TROQUE para a real!
  const [frase, setFrase] = React.useState("");
  const [dias, setDias] = React.useState(0);

  React.useEffect(() => {
    setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]);
    function calcularDias() {
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      const dataProva = new Date("2025-07-27T00:00:00-03:00"); // Corrige bug de referência!
      dataProva.setHours(0,0,0,0);
      const diff = dataProva.getTime() - hoje.getTime();
      const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDias(d > 0 ? d : 0);
    }
    calcularDias();
    const interval = setInterval(calcularDias, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-lg text-cyan-100 mb-1">{frase}</span>
      <div className="flex flex-col items-center mt-1">
        <span className="text-5xl font-extrabold text-cyan-200 flex items-center gap-2 mb-1">
          <svg width={28} height={28} fill="none" viewBox="0 0 24 24"><path fill="#67e8f9" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z"></path></svg>
          {dias > 0 ? dias : <span className="text-green-400 font-bold">É hoje!</span>}
        </span>
        <span className="text-white text-base">dias para a prova</span>
      </div>
    </div>
  );
}

export default function App() {
  // Estado do usuário logado
  const [usuario, setUsuario] = useState(null);
  const [editalEscolhido, setEditalEscolhido] = useState(null);
  const [mostrarLanding, setMostrarLanding] = useState(true);
  const [mostrarConteudo, setMostrarConteudo] = useState(false);
  const [acessoLiberado, setAcessoLiberado] = useState(false);
  const [atualizarHistorico, setAtualizarHistorico] = useState(0);
  const { estudos, loading } = useHistoricoEstudoCronograma(usuario?.uid, atualizarHistorico);



  // Estado para saber se concluiu o desafio diário
  const [desafioConcluido, setDesafioConcluido] = useState(false);

  useEffect(() => {
  const auth = getAuth();
  const db = getDatabase();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUsuario(user);

    if (user) {
      const acessoRef = ref(db, `acessos/${user.uid}/liberado`);

      try {
        const snapshot = await get(acessoRef);
        if (snapshot.exists() && snapshot.val() === true) {
          setAcessoLiberado(true);
          console.log("✅ Acesso liberado via Firebase");
        } else {
          setAcessoLiberado(false);
          console.log("⛔ Acesso bloqueado (sem pagamento)");
        }
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        setAcessoLiberado(false);
      }
    } else {
      setAcessoLiberado(false);
    }
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  async function buscarDesafio() {
    if (!usuario || !editalEscolhido) return;
    const snap = await getDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido));
    if (snap.exists() && snap.data().desafioConcluido) {
      setDesafioConcluido(true);
    } else {
      setDesafioConcluido(false);
    }
  }
  buscarDesafio();
}, [usuario, editalEscolhido]);

useEffect(() => {
  async function buscarDesempenho() {
    if (!usuario || !editalEscolhido) return;
    const snap = await getDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido));
    if (snap.exists() && snap.data().desempenhoQuestoes) {
      const dados = snap.data().desempenhoQuestoes;
      setDesempenhoQuestoes(dados);
    } else {
      setDesempenhoQuestoes({ geral: { acertos: 0, erros: 0 }, porMateria: {} });
    }
  }
  buscarDesempenho();
}, [usuario, editalEscolhido]);


  async function atualizarDesempenho() {
  if (!usuario || !editalEscolhido) return;
  const snap = await getDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido));
  if (snap.exists() && snap.data().desempenhoQuestoes) {
    setDesempenhoQuestoes(snap.data().desempenhoQuestoes);
  } else {
    setDesempenhoQuestoes({ acertos: 0, erros: 0 });
  }
}

  async function zerarHistoricoEstudo() {
  if (!usuario) return;
  if (!window.confirm("Tem certeza que deseja zerar todo o histórico de estudo?")) return;

  const userRef = doc(db, "users", usuario.uid);
  try {
    await updateDoc(userRef, { estudos: {} });
    // Se estiver usando o state atualizarHistorico, chama para atualizar na hora:
    setAtualizarHistorico((x) => x + 1);
    alert("Histórico de estudo zerado com sucesso!");
  } catch (e) {
    alert("Erro ao zerar histórico: " + e.message);
  }
}

  // Estados principais do seu app original:
  const [tela, setTela] = useState("login");
  const [materiasPorBloco, setMateriasPorBloco] = useState(pfMaterias);
  const [pesos, setPesos] = useState(pfPesos);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState("");
  const [telaEscura, setTelaEscura] = useState(true);
  const [respostasMotivacionais, setRespostasMotivacionais] = useState(["", "", "", "", ""]);
  const [corFundo, setCorFundo] = useState("bg-gray-900");

  // Questões - Estados
  const [mostrarSelecao, setMostrarSelecao] = useState(false);
  const [questoesAtual, setQuestoesAtual] = useState([]);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [questoesSimuladoAtual, setQuestoesSimuladoAtual] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostasSimulado, setRespostasSimulado] = useState([]);
  const [notaFinalSimulado, setNotaFinalSimulado] = useState(0);
  const [materiaEscolhida, setMateriaEscolhida] = useState("");
  const [simuladoEscolhido, setSimuladoEscolhido] = useState(null);
  const [respostaCorreta, setRespostaCorreta] = useState(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [desempenhoQuestoes, setDesempenhoQuestoes] = useState({ acertos: 0, erros: 0 });
  const [desempenhoPorMateria, setDesempenhoPorMateria] = useState({});
  const [tempoSimulado, setTempoSimulado] = useState(60 * 60 * 4); // 4h = 14400s
  const [desempenhoSimulado, setDesempenhoSimulado] = useState({ acertos: 0, erros: 0 });
  const [resumoSimulado, setResumoSimulado] = useState({
  acertos: 0,
  erros: 0,
  naoRespondidas: 0,
  total: 0
});
const [mostrarTexto, setMostrarTexto] = useState(false);


  // =========================
  // ESTADO E FUNÇÕES SIMULADOS SALVOS
  // =========================
  const [resultadosSimulados, setResultadosSimulados] = useState([]);
  const [simuladoSelecionado, setSimuladoSelecionado] = useState(null);


async function zerarResultadosSimulados() {
  if (!usuario) return;
  const simuladosRef = collection(db, "users", usuario.uid, "simulados");
  const snap = await getDocs(simuladosRef);
  if (snap.empty) {
    alert("Nenhum resultado para zerar!");
    return;
  }
  const promises = [];
  snap.forEach((docu) => {
    promises.push(deleteDoc(docu.ref));
  });
  await Promise.all(promises);
  setResultadosSimulados([]);
  alert("Todos os resultados dos simulados foram zerados!");
}

async function excluirSimulado(id) {
  if (!usuario) return;
  try {
    await (await import("firebase/firestore")).deleteDoc(
      doc(db, "users", usuario.uid, "simulados", id)
    );
    setResultadosSimulados((prev) => prev.filter((s) => s.id !== id));
    setSimuladoSelecionado(null);
    alert("Simulado removido com sucesso!");
  } catch (e) {
    alert("Erro ao excluir simulado.");
  }
}

async function buscarResultadosSimulados() {
  if (!usuario) return;
  const simuladosRef = collection(db, "users", usuario.uid, "simulados");
  const q = query(simuladosRef, orderBy("dataHora", "desc"));
  const snap = await getDocs(q);
  const lista = [];
  snap.forEach(doc => {
    lista.push({ id: doc.id, ...doc.data() });
  });
  setResultadosSimulados(lista);
}


  async function salvarResultadoSimulado(resultado) {
    if (!usuario) return;
    const simuladosRef = collection(db, "users", usuario.uid, "simulados");
    await addDoc(simuladosRef, {
      ...resultado,
      dataHora: serverTimestamp()
    });
  }

 async function registrarEstudo(uid, materia, assunto) {
  console.log("Chamou registrarEstudo:", { uid, materia, assunto });
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      [`estudos.${materia}`]: arrayUnion(assunto)
    });
    console.log("UpdateDoc feito!");
  } catch (e) {
    console.error("Erro no updateDoc:", e);
    // tenta criar se não existe
    if (e.code === "not-found" || e.message.includes("No document to update")) {
      await setDoc(
        userRef,
        {
          estudos: {
            [materia]: [assunto]
          }
        },
        { merge: true }
      );
      console.log("setDoc criado!");
    } else {
      alert("Erro ao registrar estudo: " + e.message);
    }
  }
}

// Função para formatar o tempo (corrige erro da tela branca)
function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${h}h ${m < 10 ? "0" : ""}${m}min`;
}

// Finaliza o simulado, salva no Firebase e mostra o resultado
function finalizarSimulado() {
  const naoRespondidas =
    questoesSimuladoAtual.length -
    (desempenhoSimulado.acertos + desempenhoSimulado.erros);

  const acertos = respostasSimulado.filter((r) => r === true).length;
  const erros = respostasSimulado.filter((r) => r === false).length;
  const percentual = (acertos / respostasSimulado.length) * 100;

  setResumoSimulado({
    acertos: desempenhoSimulado.acertos,
    erros: desempenhoSimulado.erros,
    naoRespondidas,
    total: questoesSimuladoAtual.length,
  });

  const nota = Math.max(
    0,
    desempenhoSimulado.acertos - desempenhoSimulado.erros
  );
  setNotaFinalSimulado(nota);
  setTela("resultadoSimulado");
  // Salvar no Firebase ao finalizar
  salvarResultadoSimulado({
    acertos: desempenhoSimulado.acertos,
    erros: desempenhoSimulado.erros,
    naoRespondidas,
    total: questoesSimuladoAtual.length,
    notaFinal: Math.max(0, desempenhoSimulado.acertos - desempenhoSimulado.erros),
    percentual: (desempenhoSimulado.acertos / questoesSimuladoAtual.length) * 100
  });
}

// ⏳ Cronômetro: zera ao trocar questão
useEffect(() => {
  setMostrarTexto(false);
}, [questaoAtual]);

// 🕒 Cronômetro regressivo
useEffect(() => {
  const intervalo = setInterval(() => {
    setTempoSimulado((prev) => {
      if (prev <= 1) {
        clearInterval(intervalo);
        finalizarSimulado(); // Tempo acabou
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(intervalo);
}, []);

// ✅ Função para responder questões
function responderSimulado(opcao) {
  const questao = questoesSimuladoAtual[questaoAtual];
  const materia = questao.materia || "Geral";
  const acertou = opcao === questao.correta;

  setResumoSimulado((prev) => ({
    ...prev,
    total: prev.total + 1,
    acertos: prev.acertos + (acertou ? 1 : 0),
    erros: prev.erros + (!acertou ? 1 : 0),
  }));

  setDesempenhoQuestoes((prev) => ({
    acertos: prev.acertos + (acertou ? 1 : 0),
    erros: prev.erros + (!acertou ? 1 : 0),
  }));

  setDesempenhoSimulado((prev) => ({
    acertos: prev.acertos + (acertou ? 1 : 0),
    erros: prev.erros + (!acertou ? 1 : 0),
  }));

  setDesempenhoPorMateria((prev) => {
    const atual = prev[materia] || { acertos: 0, erros: 0 };
    return {
      ...prev,
      [materia]: {
        acertos: atual.acertos + (acertou ? 1 : 0),
        erros: atual.erros + (!acertou ? 1 : 0),
      },
    };
  });

  if (questaoAtual < questoesSimuladoAtual.length - 1) {
    setQuestaoAtual((prev) => prev + 1);
  }
}

  function useHistoricoEstudo(uid) {
  const [estudos, setEstudos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstudos() {
      if (!uid) return;
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists() && docSnap.data().estudos) {
        setEstudos(docSnap.data().estudos);
      } else {
        setEstudos({});
      }
      setLoading(false);
    }
    fetchEstudos();
  }, [uid]);

  return { estudos, loading };
}

  function useHistoricoEstudoCronograma(uid, atualizarHistorico) {
  const [estudos, setEstudos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstudos() {
      if (!uid) {
        setEstudos({});
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists() && docSnap.data().estudos) {
        setEstudos(docSnap.data().estudos);
      } else {
        setEstudos({});
      }
      setLoading(false);
    }
    fetchEstudos();
  }, [uid, atualizarHistorico]);

  return { estudos, loading };
}
  //reflexão
 const perguntasReflexao = [
  {
    pergunta: "Você está realmente se dedicando?",
    opcoes: [
      "✅ Sim, estou dando o meu melhor",
      "😐 Mais ou menos, poderia focar mais",
      "🛑 Não, estou travado"
    ],
  },
  {
    pergunta: "O que mais te motiva hoje?",
    opcoes: [
      "💼 Estabilidade",
      "🔥 Mudar de vida",
      "⏳ Não me arrepender depois"
    ],
  },
  {
    pergunta: "Por que vale a pena continuar estudando mesmo cansado?",
    opcoes: [
      "🏆 Porque vai valer a pena",
      "👊 Porque ninguém vai fazer por mim",
      "🎯 Porque eu quero essa vaga"
    ],
  },
  {
    pergunta: "Se você desistisse hoje, como se sentiria amanhã?",
    opcoes: [
      "😔 Com arrependimento",
      "😡 Com raiva de mim mesmo",
      "🛑 Não quero nem pensar nisso"
    ],
  },
  {
    pergunta: "O que você quer ouvir no dia da aprovação?",
    opcoes: [
      "🎉 Parabéns, você conseguiu!",
      "📢 Seu nome está na lista",
      "🏆 Você venceu!"
    ],
  },
];

const [perguntaIndex, setPerguntaIndex] = useState(0);
const [respostasReflexao, setRespostasReflexao] = useState([]);

// Lista de respostas críticas
const respostasCriticas = [
  "😐 Mais ou menos, poderia focar mais",
  "🛑 Não, estou travado",
  "😔 Com arrependimento",
  "😡 Com raiva de mim mesmo",
  "🛑 Não quero nem pensar nisso"
];

// Reforços específicos
const reforcos = {
  "😐 Mais ou menos, poderia focar mais": "Você não precisa ser perfeito, só precisa continuar.",
  "🛑 Não, estou travado": "Todo mundo trava às vezes. Mas quem vence é quem levanta.",
  "😔 Com arrependimento": "Evite o peso do arrependimento. Faça o que precisa hoje.",
  "😡 Com raiva de mim mesmo": "Use essa raiva como combustível. Prove seu valor.",
  "🛑 Não quero nem pensar nisso": "Então bora fazer hoje valer a pena. Seu futuro agradece.",
};

  
  async function marcarDesafioComoConcluido() {
  if (!usuario) return;
  setDesafioConcluido(true);
 await setDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido), { desafioConcluido: true }, { merge: true });
}
async function salvarDesempenhoQuestoes(acerto, erro) {
  if (!usuario || !questoesAtual[questaoIndex]) return;

  const questao = questoesAtual[questaoIndex];
  const questaoId = questao.id;
  const materia = questao.materia;

  const docRef = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
  const snap = await getDoc(docRef);
  const dadosAtuais = snap.exists() ? snap.data() : {};

  const desempenho = dadosAtuais.desempenhoQuestoes || {};

  const geral = desempenho.geral || { acertos: 0, erros: 0 };
  const porMateria = desempenho.porMateria || {};
  const questoesErradas = desempenho.questoesErradas || {};

  // Atualiza geral
  geral.acertos += acerto;
  geral.erros += erro;

  // Atualiza por matéria
  if (!porMateria[materia]) {
    porMateria[materia] = { acertos: 0, erros: 0 };
  }
  porMateria[materia].acertos += acerto;
  porMateria[materia].erros += erro;

  // Atualiza lista de questões erradas por matéria
  if (!questoesErradas[materia]) {
    questoesErradas[materia] = [];
  }
  if (erro > 0 && !questoesErradas[materia].includes(questaoId)) {
    questoesErradas[materia].push(questaoId);
  }

  await setDoc(docRef, {
    desempenhoQuestoes: {
      geral,
      porMateria,
      questoesErradas,
    },
  });
}

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado && blocoSelecionado) {
      intervalo = setInterval(() => setTempoRestante((t) => t - 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante, pausado]);

  useEffect(() => {
    if (tempoRestante > 0 && blocoSelecionado) {
      const progresso = (blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60);
      if (progresso < 0.3) setCorFundo("bg-gray-900");
      else if (progresso < 0.7) setCorFundo("bg-yellow-900");
      else setCorFundo("bg-green-900");
    }
  }, [tempoRestante, blocoSelecionado]);

  // --- MANTÉM SUA FUNÇÃO DO CONTAINER ORIGINAL ---
  const Container = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white">
      <div className="w-full max-w-screen-sm bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-6 transition-all duration-300 ease-in-out">
        {children}
      </div>
    </div>
  );

  // Função tempoFormatado e demais funções continuam normais...
  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const progresso = blocoSelecionado
    ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100
    : 0;

  const confirmarEncerramento = () => {
    setMostrarConfirmar("mostrar");
    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 2500);
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(false);
    setMostrarConfirmar("");
    setCorFundo("bg-gray-900");
  };

  const finalizarEstudo = () => {
    setPausado(true);
    setTempoRestante(0);
    setMostrarConfirmar("");
    setTelaEscura(false);
    setTimeout(() => {
      setBlocoSelecionado(null);
      setTela("cronograma");
    }, 50);
  };

 const gerarCronograma = () => {
  const totalMin = Math.round(parseFloat(tempoEstudo) * 60 || 60);
  if (isNaN(totalMin) || totalMin < 30 || totalMin > 240) {
    alert("Informe entre 0.5 e 4 horas");
    return;
  }

  const TEMPO_MIN = 18;
  const TEMPO_MAX = 65;

  let blocosGerados = [];
  let tempoDistribuido = 0;

  Object.entries(pesos).forEach(([bloco, peso]) => {
    const materias = embaralharArray([...materiasPorBloco[bloco]]);
    const tempoBlocoTotal = Math.round(totalMin * peso);

    let tempoDistribuidoBloco = 0;
    const blocosBloco = [];

    for (let i = 0; i < materias.length; i++) {
      if (tempoDistribuidoBloco >= tempoBlocoTotal) break;

      const restante = tempoBlocoTotal - tempoDistribuidoBloco;
      let tempoMateria = Math.min(Math.max(TEMPO_MIN, restante), TEMPO_MAX);

      if (restante < TEMPO_MIN) break;

      const topicos = materias[i].topicos;
      const topico = topicos[Math.floor(Math.random() * topicos.length)];

      blocosBloco.push({
        nome: materias[i].nome,
        topico,
        tempo: tempoMateria,
        cor: bloco
      });

      tempoDistribuidoBloco += tempoMateria;
    }

    blocosGerados = [...blocosGerados, ...blocosBloco];
    tempoDistribuido += tempoDistribuidoBloco;
  });

  let sobra = totalMin - tempoDistribuido;
  while (sobra > 0) {
    let adicionou = false;
    for (let i = 0; i < blocosGerados.length && sobra > 0; i++) {
      if (blocosGerados[i].tempo < TEMPO_MAX) {
        blocosGerados[i].tempo += 1;
        sobra--;
        adicionou = true;
      }
    }
    if (!adicionou) break;
  }

  // embaralha o cronograma final
  blocosGerados = embaralharArray(blocosGerados);

  setBlocos(blocosGerados);
};

// Função de embaralhamento padrão
function embaralharArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

  // Questões
  const iniciarQuestoes = () => {
    const todas = Object.values(questoes).flat();
    const embaralhadas = todas.sort(() => 0.5 - Math.random());
    setQuestoesAtual(embaralhadas);
    setQuestaoIndex(0);
    setRespostaSelecionada(null);
    setRespostaCorreta(null);
    setMostrarExplicacao(false);
    setAcertos(0);
    setErros(0);
    setTela("questoes");
  };

 const responderQuestao = async (i) => {
  if (respostaSelecionada !== null) return;

  const questao = questoesAtual[questaoIndex];
  const correta = questao.correta;

  setRespostaSelecionada(i);
  setRespostaCorreta(correta);
  setMostrarExplicacao(true);

  if (i === correta) {
    setAcertos((prev) => prev + 1);
    await salvarDesempenhoQuestoes(1, 0); // salva acerto
  } else {
    setErros((prev) => prev + 1);
    await salvarDesempenhoQuestoes(0, 1); // salva erro
  }
  // 🔥 Novo: salvar por matéria
  try {
   // Atualiza o desempenho por matéria e salva IDs de questões erradas no Firebase
const docRef = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
const snap = await getDoc(docRef);
const dadosAtuais = snap.exists() && snap.data() ? snap.data() : {};

const desempenhoAtual = dadosAtuais?.desempenhoQuestoes || {};
const geralAtual = desempenhoAtual?.geral || { acertos: 0, erros: 0 };
const porMateriaAtual = desempenhoAtual?.porMateria || {};
const questoesErradas = desempenhoAtual?.questoesErradas || {};

const materia = questaoAtual.materia;
const correta = resposta === questaoAtual.correta;

const atualMateria = porMateriaAtual[materia] || { acertos: 0, erros: 0 };
const erradasDaMateria = questoesErradas[materia] || [];

if (correta) {
  atualMateria.acertos++;
  geralAtual.acertos++;
} else {
  atualMateria.erros++;
  geralAtual.erros++;
  // Salvar ID da questão errada, se ainda não estiver salvo
  if (!erradasDaMateria.includes(questaoAtual.id)) {
    erradasDaMateria.push(questaoAtual.id);
  }
}

porMateriaAtual[materia] = atualMateria;
questoesErradas[materia] = erradasDaMateria;

await setDoc(docRef, {
  desempenhoQuestoes: {
    geral: geralAtual,
    porMateria: porMateriaAtual,
    questoesErradas: questoesErradas,
  },
});

  } catch (error) {
    console.error("Erro ao salvar desempenho por matéria:", error);
  }
};

  const proximaQuestao = async () => {
  if (questaoIndex + 1 < questoesAtual.length) {
    setQuestaoIndex((prev) => prev + 1);
    setRespostaSelecionada(null);
    setRespostaCorreta(null);
    setMostrarExplicacao(false);
  } else {
    setMostrarExplicacao(false);
    setTela("resultadoQuestoes");
  }
};

  if (mostrarLanding) {                  // <-- Passo 3
    return <LandingPage onComecar={() => setMostrarLanding(false)} />;
  }

  // --- Proteção: login/cadastro obrigatórios ---
  if (!usuario) {
    return <LoginRegister onLogin={setUsuario} />;
  }

  // --- Botão de logout no topo ---
  const BotaoLogout = () => (
    <div className="flex justify-end p-4">
      <span className="mr-2">Olá, {usuario?.email}</span>
      <button
        onClick={() => signOut(auth)}
        className="bg-red-600 px-3 py-1 rounded"
      >
        Sair
      </button>
    </div>
  );

  // --- Suas telas exatamente como no original ---
  const renderTelas = {
    login: (
      <Container>
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-4xl font-extrabold text-white">EstudoLendário 💡</h1>
          <p className="text-gray-300">Estude com inteligência e propósito</p>
          <button
            onClick={() => setTela("boas-vindas")}
            className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 text-lg rounded-xl shadow-md"
          >
            Entrar
          </button>
        </div>
      </Container>
    ),

    "boas-vindas": (
      <Container>
        <div className="flex flex-col items-center text-center gap-6">
          <h2 className="text-3xl font-bold text-white">Bem-vindo ao EstudoLendário! 🚀</h2>
          <p className="text-gray-300 max-w-md">Aqui você cria sua rotina inteligente, vence a procrastinação e conquista sua vaga.</p>
          <button
            onClick={() => setTela("concurso")}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl shadow"
          >
            Começar agora
          </button>
        </div>
      </Container>
    ),

    concurso: (
      <Container>
  <div className="flex flex-col items-center text-center gap-6">
      <div>
      <h2 className="text-3xl font-bold text-white">🏆 Qual batalha você vai vencer?</h2>
      <p className="text-gray-300 mt-1">Escolha seu concurso e vamos montar sua jornada até a aprovação.</p>
    </div>

    <div className="flex flex-col gap-4 w-full">
      <button
        onClick={() => {
          setMateriasPorBloco(pfMaterias);
          setPesos(pfPesos);
          setEditalEscolhido("pf");
          setTela("beneficios");
        }}
        className="bg-blue-600 hover:bg-blue-700 w-full px-6 py-3 rounded-xl shadow"
      >
        Polícia Federal
      </button>
      <button
        onClick={() => {
          setMateriasPorBloco(inssMaterias);
          setPesos(inssPesos);
          setEditalEscolhido("inss");
          setTela("beneficios");
        }}
        className="bg-yellow-500 hover:bg-yellow-600 w-full px-6 py-3 rounded-xl shadow text-black"
      >
        INSS
      </button>
    </div>
  </div>
</Container>

    ),

  beneficios: (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 px-2 relative">
    {/* Mascote PF sutil no fundo */}
    <img
      src="/assets/ea57dcc4-6747-48e4-b77b-9fc14bc29759.png"
      alt="distintivo.png"
      className="fixed bottom-0 right-0 w-[350px] md:w-[430px] opacity-25 pointer-events-none select-none z-0"
      style={{ filter: "drop-shadow(0 4px 24px #0002)" }}
    />
    <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-3xl shadow-2xl border border-blue-200/60 backdrop-blur-xl p-8 md:p-14 flex flex-col items-center gap-8 z-10">
      <h2 className="text-4xl md:text-5xl font-black text-blue-800 mb-3 drop-shadow text-center">🚔 Benefícios de ser Polícia Federal</h2>
      <p className="text-xl md:text-2xl text-blue-500 mb-6 font-semibold text-center">Motivos reais para você entrar de cabeça nessa carreira!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 w-full text-lg">
        <div className="flex gap-3 items-start">
          <span className="text-yellow-500 text-2xl">💰</span>
          <span><b>Salário inicial:</b> R$ 12.522,50 + benefícios (2024)</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-orange-500 text-2xl">🔒</span>
          <span><b>Estabilidade:</b> Servidor federal (regime estatutário)</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-amber-600 text-2xl">🏆</span>
          <span><b>Prestígio:</b> Respeito nacional, porte de arma e autoridade policial</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-blue-600 text-2xl">⚡</span>
          <span><b>Estrutura:</b> Armas, tecnologia e viaturas de ponta</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-pink-400 text-2xl">🍽️</span>
          <span><b>Auxílio-alimentação:</b> mais de R$ 650/mês</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-green-600 text-2xl">🏖️</span>
          <span><b>Férias:</b> 30 dias + adicional de férias</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-red-400 text-2xl">🛡️</span>
          <span><b>Aposentadoria especial</b> + <b>licença-prêmio</b></span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-yellow-400 text-2xl">📚</span>
          <span><b>Cursos e especializações:</b> pagas pela PF</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-sky-600 text-2xl">🧳</span>
          <span><b>Trabalho em todo o Brasil</b> (e no exterior em operações especiais)</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-lime-600 text-2xl">🔄</span>
          <span><b>Promoção:</b> por antiguidade e merecimento, plano de carreira real</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-gray-600 text-2xl">⚖️</span>
          <span><b>Carreira de Estado:</b> estabilidade de verdade, elite da segurança</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-indigo-500 text-2xl">🏅</span>
          <span><b>Indenização de fronteira</b> e bônus em áreas estratégicas</span>
        </div>
      </div>
      <button
        onClick={() => setTela("motivacao")}
        className="bg-green-500 hover:bg-green-600 px-10 py-5 rounded-2xl shadow-2xl font-extrabold text-white text-2xl mt-8 transition-all z-10"
      >
        Continuar &rarr;
      </button>
    </div>
  </div>
),


 motivacao: (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-gray-900">
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center gap-8 max-w-md w-full border border-gray-800">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow mb-4">
        Você está motivado hoje?
      </h2>
      <div className="flex flex-col md:flex-row gap-6 w-full">
        <button
          onClick={() => setTela("modulos")}
          className="flex-1 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
        >
          <span className="text-2xl">✅</span> Sim!
        </button>
        <button
          onClick={() => setTela("reflexao")}
          className="flex-1 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-700 hover:to-red-900 text-white text-xl font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
        >
          <span className="text-2xl">❌</span> Não estou
        </button>
      </div>
    </div>
  </div>
),

  reflexao: (
  <Container>
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-10 text-white w-full max-w-xl px-4">
      <AnimatePresence mode="wait">
        {perguntaIndex < perguntasReflexao.length ? (
          <motion.div
            key={perguntaIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full space-y-6"
          >
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
              {perguntasReflexao[perguntaIndex].pergunta}
            </h2>

            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              {perguntasReflexao[perguntaIndex].opcoes.map((opcao, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setRespostasReflexao((prev) => [...prev, opcao]);
                    setPerguntaIndex(perguntaIndex + 1);
                  }}
                  className="bg-gray-800 hover:bg-blue-600 px-6 py-3 rounded-xl shadow transition-all text-sm text-white text-left"
                >
                  {opcao}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="resultado-final"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 w-full max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">💭</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-green-400">
                Sua reflexão final
              </h2>
            </div>

            <div className="space-y-4">
              {respostasReflexao.map((resposta, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-gray-900 to-zinc-800 p-5 rounded-2xl text-left shadow-md border border-gray-700"
                >
                  <p className="text-xs text-gray-400 mb-1">Pergunta {i + 1}</p>
                  <p className="text-base font-medium text-white mb-2">
                    {perguntasReflexao[i].pergunta}
                  </p>
                  <p className="text-green-400 font-semibold">{resposta}</p>

                  {reforcos[resposta] && (
                    <p className="mt-2 text-yellow-300 text-sm italic">
                      💬 {reforcos[resposta]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* MENSAGEM FINAL PERSONALIZADA */}
            {(() => {
              const estaMal = [0, 1, 2].some((i) =>
                respostasCriticas.includes(respostasReflexao[i]?.trim())
              );

              if (estaMal) {
                return (
                  <div className="bg-orange-700 text-white p-4 rounded-xl text-center shadow-lg space-y-2">
                    <p className="font-semibold text-lg">🧠 Percebi que você tá passando por um momento difícil.</p>
                    <p className="text-sm leading-relaxed">
                      Isso é normal, faz parte da jornada. Mas você já deu o passo mais importante: <strong>não desistiu</strong>. Bora transformar isso em força?
                    </p>
                  </div>
                );
              } else {
                return (
                  <div className="bg-green-800 text-white p-4 rounded-xl text-center shadow-lg space-y-2">
                    <p className="font-semibold text-lg">✅ Você está no caminho certo!</p>
                    <p className="text-sm leading-relaxed">
                      Sua consistência e foco são sua maior força. Continue assim. Sua aprovação tá cada vez mais próxima!
                    </p>
                  </div>
                );
              }
            })()}

            <button
              onClick={() => setTela("modulos")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg"
            >
              ✅ Bora estudar!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </Container>
),
    minhaConta: <MinhaConta setTela={setTela} />,
      
    desempenho: (
  <Container>
    <div className="flex flex-col items-center text-center gap-6">
      <h2 className="text-3xl font-bold text-purple-400">📊 Seu Desempenho</h2>

      <div className="bg-gray-800 p-6 rounded-2xl shadow space-y-3">
        <div>
          <span className="text-lg text-green-400 font-semibold">Acertos: </span>
          <span className="text-2xl font-bold">{desempenhoQuestoes?.geral?.acertos || 0}</span>
        </div>
        <div>
          <span className="text-lg text-red-400 font-semibold">Erros: </span>
          <span className="text-2xl font-bold">{desempenhoQuestoes?.geral?.erros || 0}</span>
        </div>
      </div>

        {desempenhoQuestoes?.porMateria && (
        <div className="w-full max-w-md text-left bg-gray-800 p-4 rounded-2xl shadow space-y-3">
          <h3 className="text-lg font-bold text-white mb-2">📚 Desempenho por Matéria:</h3>
          <ul className="space-y-2">
            {Object.entries(desempenhoQuestoes.porMateria).map(([materia, dados]) => {
              const total = dados.acertos + dados.erros;
              const aproveitamento = total > 0 ? ((dados.acertos / total) * 100).toFixed(1) : "0.0";
              return (
                <li key={materia} className="bg-gray-900 p-3 rounded-lg shadow text-white">
                  <div className="flex justify-between">
                    <span className="font-semibold">{materia}</span>
                    <span>{aproveitamento}% de aproveitamento</span>
                  </div>
                  <div>
                    ✅ {dados.acertos} acertos | ❌ {dados.erros} erros
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        onClick={atualizarDesempenho}
        className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-xl shadow"
      >
        🔄 Atualizar Desempenho
      </button>

      <button
        onClick={async () => {
          if (confirm("Tem certeza que deseja zerar seu desempenho?")) {
           await setDoc(
  doc(db, "users", usuario.uid, "progresso", editalEscolhido),
  {
    desempenhoQuestoes: {
      geral: { acertos: 0, erros: 0 },
      porMateria: {},
      questoesErradas: {}
    }
  }
);
setDesempenhoQuestoes({
  geral: { acertos: 0, erros: 0 },
  porMateria: {},
  questoesErradas: {}
});
            alert("Desempenho zerado com sucesso!");
          }
        }}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl shadow"
      >
        🧨 Zerar Desempenho
      </button>

      <button
        onClick={() => setTela("modulos")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow"
      >
        🔙 Voltar ao Menu
      </button>
    </div>
  </Container>
),

modulos: (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-tr from-gray-900 via-zinc-900 to-black text-white space-y-6">
    <BotaoLogout />
    <div className="text-center mb-6">
      <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-yellow-400 drop-shadow-xl">
        Estudo<span className="text-white">Lendário</span>
      </h1>
      <p className="mt-2 text-xl text-cyan-100 italic font-medium">
        O app de quem vence provas. Bora conquistar seu lugar!
      </p>
    </div>
    <div className="bg-black/40 border border-cyan-700/20 shadow-2xl rounded-3xl p-8 max-w-lg w-full flex flex-col gap-5 mt-6">
      <button
        onClick={() => setTela("desafio")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-5 text-xl font-bold rounded-2xl flex items-center gap-3 justify-center shadow-lg transition hover:scale-105"
      >
        <span className="text-2xl">🔥</span> Desafio Diário
      </button>
      <button
        onClick={() => setTela("escolherMateria")}
        className="bg-gray-700 hover:bg-gray-800 text-white px-7 py-5 text-xl font-bold rounded-2xl flex items-center gap-3 justify-center shadow-lg transition hover:scale-105"
      >
        <span className="text-2xl">📝</span> Resolução de Questões
      </button>
      <button
        onClick={() => setTela("cronograma")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-5 text-xl font-bold rounded-2xl flex items-center gap-3 justify-center shadow-lg transition hover:scale-105"
      >
        <span className="text-2xl">📅</span> Montar Cronograma
      </button>
      <button
        onClick={() => setTela("desempenho")}
        className="bg-purple-600 hover:bg-purple-700 text-white px-7 py-5 text-xl font-bold rounded-2xl flex items-center gap-3 justify-center shadow-lg transition hover:scale-105"
      >
        <span className="text-2xl">📊</span> Meu Desempenho
      </button>
      <button
        onClick={() => setTela("simulados")}
        className="bg-green-600 hover:bg-green-700 text-white px-7 py-5 text-xl font-bold rounded-2xl flex items-center gap-3 justify-center shadow-lg transition hover:scale-105"
      >
        <span className="text-2xl">📝</span> Simulados
      </button>
      <button
        onClick={() => {
          setEditalEscolhido(null);
          setTela("concurso");
        }}
        className="bg-red-700 hover:bg-red-800 text-white px-7 py-5 text-xl font-bold rounded-2xl flex items-center gap-3 justify-center shadow-lg transition hover:scale-105"
      >
        <span className="text-2xl">🔄</span> Trocar Edital
      </button>
    </div>
  </div>
),
    
    desafio: (
  <Container>
    <div className="flex flex-col items-center text-center gap-6">
      <h2 className="text-2xl font-bold text-yellow-400">🔥 Desafio Diário</h2>
      {desafioConcluido ? (
        <>
          <p className="text-green-400 text-xl font-semibold">Desafio do dia já concluído! 👏</p>
          <button
            onClick={() => setTela("modulos")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-6 py-2 rounded-xl shadow"
          >
            Voltar ao Menu
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-300">
            Ex: Estude 25 minutos sem interrupções. Foque no conteúdo mais desafiador hoje!
          </p>
          <button
            onClick={async () => {
              await marcarDesafioComoConcluido();
              alert("Desafio do dia concluído e salvo!");
              setTela("modulos");
            }}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto px-6 py-2 rounded-xl shadow"
          >
            ✅ Marcar como concluído
          </button>
          <button
            onClick={() => setTela("modulos")}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-6 py-2 rounded-xl shadow"
          >
            🔙 Voltar
          </button>
        </>
      )}
    </div>
  </Container>
),

    questoes: (
  <Container>
    {questoesAtual.length > 0 && questaoIndex < questoesAtual.length ? (
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-2xl font-bold text-blue-400">
          📘 Questão {questaoIndex + 1} de {questoesAtual.length}
        </h2>

        {/* ENUNCIADO SEMPRE VISÍVEL */}
        <p className="text-white text-lg">
          {questoesAtual[questaoIndex]?.enunciado}
        </p>

        {/* BOTÃO SÓ APARECE SE TIVER TEXTO DE APOIO */}
        {questoesAtual[questaoIndex]?.texto &&
          String(questoesAtual[questaoIndex]?.texto).trim() !== "" && (
            <div className="my-2">
              <button
                onClick={() => setMostrarTexto((prev) => !prev)}
                className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-sm"
              >
                {mostrarTexto
                  ? "🔽 Ocultar texto de apoio"
                  : "📖 Mostrar texto de apoio"}
              </button>
              {mostrarTexto && (
                <div className="mt-3 bg-zinc-800 p-4 rounded-xl text-sm text-gray-200 border border-zinc-700 max-h-52 overflow-auto text-left">
                  <p className="font-bold text-gray-300 mb-2">📌 Texto de Apoio:</p>
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {questoesAtual[questaoIndex].texto}
                  </span>
                </div>
              )}
            </div>
          )}

        <p className="text-sm text-gray-400 mt-1">
          <strong>Banca:</strong> {questoesAtual[questaoIndex]?.banca} &nbsp;|&nbsp;
          <strong>Órgão:</strong> {questoesAtual[questaoIndex]?.orgao} &nbsp;|&nbsp;
          <strong>Ano:</strong> {questoesAtual[questaoIndex]?.ano}
        </p>

        <div className="flex flex-col gap-3 w-full">
          {questoesAtual[questaoIndex]?.tipo === "multipla_escolha" ? (
            questoesAtual[questaoIndex]?.alternativas?.map((alt, i) => {
              const letras = ["A", "B", "C", "D", "E"];
              const cor =
                respostaSelecionada === null
                  ? "bg-gray-700"
                  : i === respostaCorreta
                  ? "bg-green-600"
                  : i === respostaSelecionada
                  ? "bg-red-600"
                  : "bg-gray-800";
              return (
                <button
                  key={i}
                  onClick={() => responderQuestao(i)}
                  className={`${cor} text-left px-4 py-3 rounded-xl shadow transition flex gap-2 items-start`}
                >
                  <span className="font-bold">{letras[i]}.</span> <span>{alt}</span>
                </button>
              );
            })
          ) : (
            ["Certo", "Errado"].map((opcao, i) => {
              const correta = questoesAtual[questaoIndex].correta;
              const valor = opcao === "Certo";
              const cor =
                respostaSelecionada === null
                  ? "bg-gray-700"
                  : valor === correta
                  ? "bg-green-600"
                  : valor === respostaSelecionada
                  ? "bg-red-600"
                  : "bg-gray-800";
              return (
                <button
                  key={i}
                  onClick={() => responderQuestao(valor)}
                  className={`${cor} px-4 py-2 rounded-xl shadow transition`}
                >
                  {opcao}
                </button>
              );
            })
          )}
        </div>

        {/* Explicação */}
        {mostrarExplicacao && (
          <div className="text-sm text-gray-300 bg-zinc-800 p-4 rounded-xl border border-gray-600 mt-2">
            <p>
              <strong>Explicação:</strong>{" "}
              {questoesAtual[questaoIndex]?.explicacao}
            </p>
          </div>
        )}
        {mostrarExplicacao && (
          <button
            onClick={proximaQuestao}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow"
          >
            {questaoIndex + 1 === questoesAtual.length ? "Finalizar" : "Próxima"}
          </button>
        )}

        {/* BOTÕES DE NAVEGAÇÃO ENTRE QUESTÕES */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4 w-full">
          <button
            disabled={questaoIndex === 0}
            onClick={() => {
              if (questaoIndex > 0) {
                setQuestaoIndex((prev) => prev - 1);
                setRespostaSelecionada(null);
                setRespostaCorreta(null);
                setMostrarExplicacao(false);
              }
            }}
            className={`bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-xl shadow text-white font-semibold transition-all ${
              questaoIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            ⬅️ Questão anterior
          </button>
          <button
            disabled={questaoIndex === questoesAtual.length - 1}
            onClick={() => {
              if (questaoIndex < questoesAtual.length - 1) {
                setQuestaoIndex((prev) => prev + 1);
                setRespostaSelecionada(null);
                setRespostaCorreta(null);
                setMostrarExplicacao(false);
              }
            }}
            className={`bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow text-white font-semibold transition-all ${
              questaoIndex === questoesAtual.length - 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Próxima questão ➡️
          </button>
        </div>

        <button
          onClick={() => setTela("escolherMateria")}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl text-white font-bold shadow text-base transition-all"
        >
          Voltar ao menu de questões
        </button>
      </div>
    ) : (
      <p className="text-white text-center">Carregando questão...</p>
    )}
  </Container>
),

simulados: (
  !mostrarSelecao ? (
    // === TELA LISTA PRINCIPAL ===
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-white bg-gradient-to-b from-zinc-900 to-zinc-800">
      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl shadow-lg w-full max-w-xl text-center">
        <h2 className="text-3xl font-bold text-green-400 mb-2">📘 Simulados</h2>
        <p className="text-gray-400 mb-8">Teste seu nível com simulados de 120 questões estilo CESPE.</p>
        <div className="flex flex-col gap-4">
          {/* Botão do simulado antigo */}
          <button
            onClick={() => {
              setQuestoesSimuladoAtual(questoesSimulado);
              setQuestaoAtual(0);
              setRespostasSimulado([]);
              setDesempenhoSimulado({ acertos: 0, erros: 0 });
              setResumoSimulado({
                acertos: 0,
                erros: 0,
                naoRespondidas: 0,
                total: 0
              });
              setNotaFinalSimulado(0);
              setDesempenhoPorMateria({});
              setTela("simuladoAndamento");
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black py-3 px-6 rounded-xl font-semibold shadow"
          >
            ➕ Resolver Simulado Antigo
          </button>

          {/* Botão para abrir seleção de simulados novos */}
          <button
            onClick={() => setMostrarSelecao(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-6 rounded-xl font-semibold shadow"
          >
            ➕ Escolher Simulado Novo
          </button>

          <button
            onClick={async () => {
              await buscarResultadosSimulados();
              setTela("meusSimulados");
            }}
            className="bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-xl font-medium"
          >
            📁 Meus Simulados
          </button>

          <button
            onClick={async () => {
              await buscarResultadosSimulados();
              setTela("resultadosSimulados");
            }}
            className="bg-purple-600 hover:bg-purple-700 py-3 px-6 rounded-xl font-medium"
          >
            📊 Ver Resultados
          </button>

          <button
            onClick={() => setTela("modulos")}
            className="bg-zinc-700 hover:bg-zinc-800 mt-4 py-3 px-6 rounded-xl"
          >
            🔙 Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  ) : (
    // === TELA SELEÇÃO DE SIMULADO NOVO ===
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-white bg-gradient-to-b from-zinc-900 to-zinc-800">
      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl shadow-lg w-full max-w-xl text-center">
        <h3 className="text-2xl font-bold mb-6 text-green-400">Escolha o simulado:</h3>
        <div className="flex flex-col gap-4">
          {Array.isArray(simuladosPF) && simuladosPF.length > 0 ? (
            simuladosPF.map(simulado => (
              <button
                key={simulado.id}
                onClick={() => {
                  setSimuladoEscolhido(simulado);
                  setQuestoesSimuladoAtual(simulado.questoes || []);
                  setQuestaoAtual(0);
                  setRespostasSimulado([]);
                  setDesempenhoSimulado({ acertos: 0, erros: 0 });
                  setResumoSimulado({
                    acertos: 0,
                    erros: 0,
                    naoRespondidas: 0,
                    total: 0
                  });
                  setNotaFinalSimulado(0);
                  setDesempenhoPorMateria({});
                  setTela("simuladoAndamento");
                  setMostrarSelecao(false); // volta para tela principal depois
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-6 rounded-xl font-semibold shadow w-64 mx-auto"
              >
                {simulado.nome || "Simulado sem nome"}
              </button>
            ))
          ) : (
            <div className="text-red-400 font-bold py-6">
              Nenhum simulado encontrado!<br />
              Verifique seu arquivo <b>simuladosPF.js</b> na pasta <b>src/data/</b>.<br />
              Ou adicione simulados no formato correto.
            </div>
          )}
          <button
            onClick={() => setMostrarSelecao(false)}
            className="text-gray-400 underline mt-4"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
),

simuladoAndamento: (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
    <div className="bg-zinc-900 border border-zinc-700 p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl text-center">
      <div className="text-sm text-gray-300 mb-2">
        ⏳ Tempo restante: {formatarTempo(tempoSimulado)}
      </div>

      <h2 className="text-3xl font-bold text-yellow-400 mb-1">📄 Simulado em Andamento</h2>
      <p className="text-lg font-semibold text-gray-400 mb-6">
        Questão <span className="text-yellow-300">{questaoAtual + 1}</span> de {questoesSimuladoAtual.length}
      </p>

      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-8">
        <div
          className="bg-yellow-400 h-full transition-all duration-500"
          style={{ width: `${((questaoAtual + 1) / questoesSimuladoAtual.length) * 100}%` }}
        ></div>
      </div>

      {questoesSimuladoAtual[questaoAtual]?.texto && (
        <div className="mb-6 text-left">
          <button
            onClick={() => setMostrarTexto(!mostrarTexto)}
            className="text-sm px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition text-white font-medium"
          >
            {mostrarTexto ? "🔽 Ocultar Texto da Questão" : "📖 Ver Texto da Questão"}
          </button>

          {mostrarTexto && (
            <div className="mt-3 bg-zinc-800 p-4 rounded-xl text-sm text-gray-200 border border-zinc-700 max-h-52 overflow-auto">
              <p className="font-bold text-gray-300 mb-2">📌 Texto de Apoio:</p>
              {questoesSimuladoAtual[questaoAtual].texto}
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={questaoAtual}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-800 border border-zinc-700 p-6 rounded-xl text-left text-[18px] text-white mb-10 shadow-inner font-medium"
        >
          <p>{questoesSimuladoAtual[questaoAtual]?.enunciado}</p>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-6 justify-center mb-10"
      >
        <button
          onClick={() => responderSimulado(true)}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-all"
        >
          ✅ CERTO
        </button>
        <button
          onClick={() => responderSimulado(false)}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-all"
        >
          ❌ ERRADO
        </button>
      </motion.div>

      <div className="flex justify-between gap-4 mb-8">
        <button
          disabled={questaoAtual === 0}
          onClick={() => setQuestaoAtual((prev) => prev - 1)}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 rounded-lg disabled:opacity-50 transition"
        >
          ⬅️ Anterior
        </button>
        <button
          disabled={questaoAtual === questoesSimuladoAtual.length - 1}
          onClick={() => setQuestaoAtual((prev) => prev + 1)}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 rounded-lg disabled:opacity-50 transition"
        >
          Próxima ➡️
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={finalizarSimulado}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-white font-bold shadow"
        >
          ✅ Finalizar Simulado
        </button>
        <button
          onClick={() => setTela("simulados")}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl text-white shadow"
        >
          🔙 Cancelar Simulado
        </button>
      </div>
    </div>
  </div>
),

resultadoSimulado: (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl shadow-lg w-full max-w-2xl text-center">

      <h2 className="text-3xl font-bold text-yellow-400 mb-2">🎉 Resultado do Simulado</h2>
      <p className="text-gray-300 mb-6">
        Você concluiu o simulado completo com {resumoSimulado.total} questões.
      </p>

      {/* TOTAL GERAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-800 p-4 rounded-xl font-semibold text-lg shadow">
          ✅ Acertos: <span className="text-green-300">{resumoSimulado.acertos}</span>
        </div>
        <div className="bg-red-800 p-4 rounded-xl font-semibold text-lg shadow">
          ❌ Erros: <span className="text-red-300">{resumoSimulado.erros}</span>
        </div>
        <div className="bg-yellow-700 p-4 rounded-xl font-semibold text-lg shadow">
          ⏳ Não Respondidas: <span className="text-yellow-300">{resumoSimulado.naoRespondidas}</span>
        </div>
      </div>

      {/* POR MATÉRIA */}
      <div className="bg-zinc-800 p-5 rounded-xl text-left text-sm text-white mb-6 w-full">
        <p className="text-lg font-bold text-yellow-400 mb-3">📚 Desempenho por Matéria</p>
        {Object.entries(desempenhoPorMateria).map(([materia, dados]) => (
          <div key={materia} className="mb-2 border-b border-zinc-700 pb-2">
            <p className="font-semibold text-white">{materia}</p>
            <p className="text-green-400">✅ Acertos: {dados.acertos}</p>
            <p className="text-red-400">❌ Erros: {dados.erros}</p>
          </div>
        ))}
      </div>

      {/* NOTA FINAL CESPE */}
      <div className="bg-zinc-800 p-4 rounded-xl text-center text-xl font-bold text-white shadow mb-6">
        🧠 Nota Final (CESPE):{" "}
        <span className={notaFinalSimulado === 0 ? "text-red-400" : "text-green-400"}>
          {notaFinalSimulado.toFixed(2)} pontos
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Simulado corrigido com base no padrão CESPE: 1 erro anula 1 acerto.
      </p>

      <button
        onClick={() => setTela("simulados")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-bold shadow"
      >
        🔙 Voltar ao Menu de Simulados
      </button>
    </div>
  </div>
),
escolherMateria: (
  <Container>
    <div className="flex flex-col items-center text-center gap-6 w-full">
      <h2 className="text-2xl font-bold text-white">Escolha a Matéria</h2>
      <div className="flex flex-col gap-4 w-full">
        {editalEscolhido && questoes[editalEscolhido] ? (
          Object.keys(questoes[editalEscolhido]).map((materia, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-sm border border-white/10 hover:border-blue-500 cursor-pointer transition-all p-4 rounded-xl shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
              onClick={() => {
                const todas = questoes[editalEscolhido][materia];
                const embaralhadas = todas.sort(() => 0.5 - Math.random());
                setQuestoesAtual(embaralhadas);
                setMateriaEscolhida(materia);
                setQuestaoIndex(0);
                setRespostaSelecionada(null);
                setRespostaCorreta(null);
                setMostrarExplicacao(false);
                setAcertos(0);
                setErros(0);
                setTela("questoes");
              }}
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-blue-400">▶️</span>
                <span className="text-white font-semibold">{materia}</span>
              </div>

             <button
  onClick={async (e) => {
    e.stopPropagation(); // Evita que clique no card

    try {
      const ref = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
      const snap = await getDoc(ref);

      const dados = snap.exists() ? snap.data() : {};
      const questoesErradasPorMateria = dados?.desempenhoQuestoes?.questoesErradas || {};
      const idsErradas = questoesErradasPorMateria[materia] || [];

      if (idsErradas.length === 0) {
        alert("Você não errou nenhuma questão dessa matéria.");
        return;
      }

      const todas = questoes[editalEscolhido][materia];
      const filtradas = todas.filter((q) => idsErradas.includes(q.id));

      if (filtradas.length === 0) {
        alert("Você não errou nenhuma questão dessa matéria.");
        return;
      }

      const embaralhadas = filtradas.sort(() => 0.5 - Math.random());
      setQuestoesAtual(embaralhadas);
      setMateriaEscolhida(materia);
      setQuestaoIndex(0);
      setRespostaSelecionada(null);
      setRespostaCorreta(null);
      setMostrarExplicacao(false);
      setAcertos(0);
      setErros(0);
      setTela("questoes");
    } catch (err) {
      console.error("Erro ao buscar questões erradas:", err);
      alert("Erro ao buscar questões erradas.");
    }
  }}
  className="text-blue-300 hover:text-blue-400 text-sm underline"
>
  Revisar apenas erros
</button>
   </div>
          ))
        ) : (
          <p className="text-white">Nenhuma matéria encontrada para este edital.</p>
        )}
      </div>

      <button
        onClick={() => setTela("modulos")}
        className="mt-6 text-sm text-gray-400 hover:underline"
      >
        🔙 Voltar
      </button>
    </div>
  </Container>
),

cronograma: (
  <div className={`min-h-screen p-6 flex flex-col items-center text-white transition-all duration-500 ${corFundo}`}>
    <div className="w-full max-w-screen-sm space-y-6">
      {!blocoSelecionado ? (
        <>
          <button
            onClick={() => setTela("modulos")}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl shadow"
          >
            🔙 Voltar
          </button>
          <h2 className="text-2xl font-bold text-center">Quanto tempo você vai estudar hoje?</h2>
          <input
            type="text"
            placeholder="Informe o tempo em horas (ex: 1.5)"
            className="w-full px-4 py-2 rounded-xl text-black"
            onChange={(e) => {
              const valor = parseFloat(e.target.value.replace(",", "."));
              setTempoEstudo(isNaN(valor) ? 0 : valor);
            }}
          />
          <button
            onClick={gerarCronograma}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-6 rounded-xl shadow"
          >
            Gerar Cronograma
          </button>

          {/* --- Botão para abrir o histórico completo --- */}
          <button
            onClick={() => setTela("historicoEstudo")}
            className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-xl text-white font-semibold mb-4 shadow mx-auto block"
          >
            📚 Ver Histórico Completo
          </button>

          {/* --- Bloco dos cronogramas --- */}
          {blocos.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-2xl font-bold text-white">Seu cronograma:</h3>
              {blocos.map((bloco, idx) => {
                const cores = {
                  Bloco1: "bg-red-600",
                  Bloco2: "bg-yellow-600",
                  Bloco3: "bg-green-600",
                };
                return (
                  <div
                    key={idx}
                    onClick={() => iniciarEstudo(bloco)}
                    className={`${cores[bloco.cor] || "bg-gray-600"} p-4 rounded-xl shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300`}
                  >
                    <div className="text-lg font-semibold">{bloco.nome} — {bloco.tempo} min</div>
                    <div className="italic text-sm">Tópico: {bloco.topico}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center space-y-4">
          {!telaEscura && (
            <>
              <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
              <p className="text-lg">Tópico: {blocoSelecionado.topico}</p>
              <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
              <div className="w-full bg-white rounded-xl overflow-hidden h-4">
                <div className="bg-blue-500 h-4" style={{ width: `${progresso}%` }}></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                <button
                  onClick={() => setPausado(!pausado)}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl w-full sm:w-auto"
                >
                  {pausado ? "▶️ Retomar" : "⏸ Pausar"}
                </button>
                <button
                  onClick={() => {
                    setTelaEscura(true);
                    setMostrarConfirmar("reset");
                    setTimeout(() => setMostrarConfirmar("reset-buttons"), 2500);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl w-full sm:w-auto"
                >
                  🔁 Resetar
                </button>
                <button
                  onClick={() => {
                    setTelaEscura(true);
                    setMostrarConfirmar("mostrar");
                    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 2500);
                  }}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl w-full sm:w-auto"
                >
                  ✅ Concluir
                </button>
                <button
                  onClick={() => {
                    setTelaEscura(true);
                    setMostrarConfirmar("mostrar");
                    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 2500);
                  }}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl w-full sm:w-auto"
                >
                  ❌ Encerrar
                </button>
              </div>

              {/* 📘 Botão de Material de Apoio */}
              {editalEscolhido === "pf" &&
                conteudosPF[blocoSelecionado.nome] &&
                conteudosPF[blocoSelecionado.nome][blocoSelecionado.topico] && (
                  <div className="mt-6">
                    <button
                      onClick={() => setMostrarConteudo((prev) => !prev)}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow"
                    >
                      📘 Material de Apoio
                    </button>
                   {mostrarConteudo && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
    <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-white/10 relative">
      <button
        className="absolute top-4 right-4 text-2xl font-bold text-white bg-black bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 transition"
        onClick={() => setMostrarConteudo(false)}
        aria-label="Fechar"
      >×</button>
      <div className="
        prose prose-invert max-w-none text-left
        prose-p:mb-3
        prose-li:mb-1
        prose-ul:pl-6
        prose-strong:text-blue-300
        prose-table:text-sm
        prose-table:w-full
        prose-table:mx-auto
        prose-th:bg-gray-800
        prose-th:text-white
        prose-tr:odd:bg-gray-900
        [&>h1]:text-center
        [&>h2]:text-center
        [&>h3]:text-center
        [&>table]:mx-auto
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {conteudosPF[blocoSelecionado.nome][blocoSelecionado.topico]}
        </ReactMarkdown>
      </div>
    </div>
  </div>
  )}
</div>
)}
</>
)}
          {/* TELA ESCURA DE CONFIRMAÇÃO */}
{telaEscura && (
  <div className="text-center mt-8">
    {(mostrarConfirmar.startsWith("reset") || mostrarConfirmar.startsWith("mostrar")) && (
      <p className="text-2xl text-red-500 font-bold animate-pulse">
        {mostrarConfirmar.startsWith("reset")
          ? "Deseja realmente resetar o tempo?"
          : "Você finalizou mesmo ou só está se enganando?"}
      </p>
    )}

    {mostrarConfirmar.endsWith("buttons") && (
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
        {mostrarConfirmar === "mostrar-buttons" && (
          <>
            <button
  onClick={async () => {
    if (usuario && blocoSelecionado) {
      await registrarEstudo(
        usuario.uid,
        blocoSelecionado.nome,
        blocoSelecionado.topico
      );
      setAtualizarHistorico(v => v + 1); // <-- Atualiza histórico automático!
    }
    setBlocoSelecionado(null);
    setTelaEscura(false);
    setMostrarConfirmar(false);
  }}
  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl w-full sm:w-auto"
>
  ✔️ Confirmar
</button>
<button
  onClick={() => {
    setTelaEscura(false);
    setMostrarConfirmar(false);
  }}
  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl w-full sm:w-auto"
>
              ⏳ Continuar estudando
            </button>
          </>
        )}
        {mostrarConfirmar === "reset-buttons" && (
          <>
            <button
              onClick={() => {
                setTempoRestante(blocoSelecionado.tempo * 60);
                setTelaEscura(false);
                setMostrarConfirmar(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl w-full sm:w-auto"
            >
              ✔️ Confirmar Reset
            </button>
            <button
              onClick={() => {
                setTelaEscura(false);
                setMostrarConfirmar(false);
              }}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl w-full sm:w-auto"
            >
              ❌ Cancelar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
),

historicoEstudo: (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
    <div className="max-w-2xl w-full bg-gray-800/90 rounded-2xl p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-400">📚 Histórico Completo de Estudo</h2>
      {loading ? (
        <div className="text-center text-gray-300">Carregando...</div>
      ) : Object.keys(estudos).length === 0 ? (
        <div className="text-center text-gray-400">Nenhuma matéria concluída ainda.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Object.entries(estudos).map(([materia, assuntos]) => (
            <div key={materia} className="mb-3">
              <div className="font-semibold text-blue-300">{materia}</div>
              <ul className="ml-3 text-sm text-gray-100 list-disc">
                {assuntos.map((assunto, idx) => (
                  <li key={idx} className="text-gray-300">{assunto}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* BOTÃO DE ZERAR HISTÓRICO DE ESTUDO */}
      <button
        onClick={zerarHistoricoEstudo}
        className="mt-8 bg-red-700 hover:bg-red-800 px-6 py-2 rounded-xl text-white font-bold shadow transition"
      >
        🧨 Zerar Histórico de Estudo
      </button>

      <button
        onClick={() => setTela("cronograma")}
        className="mt-4 bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-xl text-white font-bold shadow"
      >
        🔙 Voltar ao Cronograma
      </button>
    </div>
  </div>
),

    
resultadosSimulados: (
  <Container>
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold text-purple-400">📊 Resultados dos Simulados</h2>
      {resultadosSimulados.length === 0 ? (
        <p className="text-white">Nenhum resultado salvo ainda.</p>
      ) : (
        <div className="space-y-4 w-full">
          {resultadosSimulados.map((res, idx) => (
            <div key={res.id || idx} className="bg-zinc-800 rounded-xl p-4 shadow text-left w-full">
              <div className="text-sm text-gray-400 mb-1">
                {res.dataHora?.toDate
                  ? res.dataHora.toDate().toLocaleString("pt-BR")
                  : "Data desconhecida"}
              </div>
              <div>✅ Acertos: <span className="text-green-400">{res.acertos}</span></div>
              <div>❌ Erros: <span className="text-red-400">{res.erros}</span></div>
              <div>⏳ Não Respondidas: <span className="text-yellow-400">{res.naoRespondidas}</span></div>
              <div>🧠 Nota Final: <span className="font-bold text-lg">{res.notaFinal}</span></div>
              <div>% Acerto: <span className="text-blue-300">{res.percentual?.toFixed(1)}%</span></div>
            </div>
          ))}
        </div>
      )}
      
      {resultadosSimulados.length > 0 && (
        <button
          onClick={zerarResultadosSimulados}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl shadow mt-4"
        >
          🧨 Zerar Resultados dos Simulados
        </button>
      )}
    <button
        onClick={() => setTela("simulados")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow mt-6"
      >
        🔙 Voltar aos Simulados
      </button>
    </div>
  </Container>
),


meusSimulados: (
  <Container>
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold text-green-400 mb-2">📁 Meus Simulados</h2>
      {resultadosSimulados.length === 0 ? (
        <p className="text-white">Nenhum simulado resolvido ainda.</p>
      ) : (
        <div className="space-y-4 w-full">
          {resultadosSimulados.map((sim) => (
            <div
              key={sim.id}
              className="bg-zinc-800 rounded-xl p-4 shadow text-left w-full cursor-pointer hover:ring-2 ring-green-400 transition"
              onClick={() => setSimuladoSelecionado(sim)}
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  {sim.dataHora && typeof sim.dataHora.toDate === "function"
                    ? sim.dataHora.toDate().toLocaleString("pt-BR")
                    : "Data desconhecida"}
                </div>
                <div className="text-gray-400 text-sm">
                  Nota: <span className="text-green-400 font-bold">{(sim.notaFinal ?? 0).toFixed(2)}</span>
                </div>
              </div>
              <div>✅ {sim.acertos ?? 0} | ❌ {sim.erros ?? 0} | ⏳ {sim.naoRespondidas ?? 0} | % {(sim.percentual ?? 0).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => setTela("simulados")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow mt-6"
      >
        🔙 Voltar aos Simulados
      </button>
    </div>
    {/* Detalhe do simulado selecionado */}
    {simuladoSelecionado && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-2xl max-w-lg w-full shadow-xl border border-green-400 relative text-left">
          <button
            className="absolute top-3 right-4 text-white text-2xl"
            onClick={() => setSimuladoSelecionado(null)}
          >×</button>
          <h3 className="text-2xl font-bold text-green-400 mb-3">📄 Detalhes do Simulado</h3>
          <div className="mb-2 text-gray-300">
            <b>Data:</b> {simuladoSelecionado.dataHora && typeof simuladoSelecionado.dataHora.toDate === "function"
              ? simuladoSelecionado.dataHora.toDate().toLocaleString("pt-BR")
              : "Data desconhecida"}
          </div>
          <div>✅ Acertos: <span className="text-green-400">{simuladoSelecionado.acertos ?? 0}</span></div>
          <div>❌ Erros: <span className="text-red-400">{simuladoSelecionado.erros ?? 0}</span></div>
          <div>⏳ Não Respondidas: <span className="text-yellow-400">{simuladoSelecionado.naoRespondidas ?? 0}</span></div>
          <div>🧠 Nota Final: <span className="font-bold text-lg">{simuladoSelecionado.notaFinal ?? 0}</span></div>
          <div>% Acerto: <span className="text-blue-300">{(simuladoSelecionado.percentual ?? 0).toFixed(1)}%</span></div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl shadow font-semibold"
              onClick={async () => {
                if (window.confirm("Deseja remover esse simulado?")) {
                  await excluirSimulado(simuladoSelecionado.id);
                }
              }}
            >
              🧨 Apagar este Simulado
            </button>
            <button
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-xl shadow"
              onClick={() => setSimuladoSelecionado(null)}
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      </div>
    )}
  </Container>
),

resultadoQuestoes: (
  <Container>
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold text-green-400">✅ Resultado Final</h2>
      <p className="text-white text-lg">Você concluiu todas as questões!</p>
      <div className="text-lg text-white">
        <p>🎯 Acertos: <strong className="text-green-400">{acertos}</strong></p>
        <p>❌ Erros: <strong className="text-red-400">{erros}</strong></p>
      </div>
      <button
        onClick={() => setTela("modulos")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow"
      >
        🔙 Voltar ao Menu
      </button>
    </div>
  </Container>
),
};

  // Renderização principal
return (
  <>
    {/* Botão Minha Conta – visível se usuário estiver logado e já passou da tela de login */}
    {usuario && tela !== "login" && (
      <button
        onClick={() => setTela("minhaConta")}
        className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-xl shadow hover:bg-gray-700 z-50"
      >
        Minha Conta
      </button>
    )}

    {!acessoLiberado && tela !== "login" && <TelaBloqueioPagamento />}

    {renderTelas[tela] || (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-xl text-white">Tela não encontrada.</p>
      </div>
    )}
  </>
);
}
