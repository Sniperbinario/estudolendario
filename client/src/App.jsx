import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";
import { materiasPorBloco as alegoMaterias, pesos as alegoPesos } from "./data/editalALEGO";
import { materiasPorBloco as bbMaterias, pesos as bbPesos } from "./data/editalBB";
import { materiasPorBloco as silvaJardimEnfMaterias, pesos as silvaJardimEnfPesos } from "./data/editalSilvaJardimEnfermagem";
import { materiasPorBloco as sedesEdAsEduSocialMaterias, pesos as sedesEdAsEduSocialPesos } from "./data/editalSEDES_EDAS_EDUCSOCIAL";
import { materiasPorBloco as sedesTecAdmMaterias, pesos as sedesTecAdmPesos } from "./data/editalSEDES_TDAS_TECADM";
import { materiasPorBloco as sedesServicoSocialMaterias, pesos as sedesServicoSocialPesos } from "./data/editalSEDES_EDAS_SERVSOCIAL";
import { materiasPorBloco as camaraALMaterias, pesos as camaraALPesos } from "./data/editalCamaraAL";
import questoes from "./data/questoes";
import questoesSimulado from "./data/simulados";
import simuladosPF from "./data/simuladosPF";
import flashcards from "./data/flashcards"; 
import LandingPage from "./LandingPage";
import conteudosPF from "./data/conteudosPF";
import conteudosALEGO from "./data/conteudosALEGO";
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



// Mapa global de editais — fora do componente para evitar erro de inicialização circular
const EDITAIS_MAP = {
  pf:                   { materias: pfMaterias,                pesos: pfPesos },
  inss:                 { materias: inssMaterias,              pesos: inssPesos },
  alego:                { materias: alegoMaterias,             pesos: alegoPesos },
  camara_al:            { materias: camaraALMaterias,          pesos: camaraALPesos },
  sedes_tdas_tecadm:    { materias: sedesTecAdmMaterias,       pesos: sedesTecAdmPesos },
  sedes_edas_servsocial:{ materias: sedesServicoSocialMaterias,pesos: sedesServicoSocialPesos },
  sedes_edas_educsocial:{ materias: sedesEdAsEduSocialMaterias,pesos: sedesEdAsEduSocialPesos },
  bb_escriturario:      { materias: bbMaterias,                pesos: bbPesos },
  silva_jardim_enf:     { materias: silvaJardimEnfMaterias,    pesos: silvaJardimEnfPesos },
};

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

      // Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Salva os dados do perfil
      await setDoc(doc(db, "users", user.uid), {
        nome,
        endereco,
        cpf,
        nascimento,
        email,
        criadoEm: new Date().toISOString(),
      });

      onLogin(user);
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
  const [editalEscolhido, setEditalEscolhidoState] = useState(() => {
    try { return localStorage.getItem("editalEscolhido") || null; } catch { return null; }
  });
  // Data da prova por edital — salvo no Firebase
  const [dataProvaEdital, setDataProvaEdital] = useState({});
  // Modal de briefing diário
  const [mostrarBriefing, setMostrarBriefing] = useState(false);
  const [mostrarLanding, setMostrarLanding] = useState(() => !window.location.hash || window.location.hash === "#/" || window.location.hash === "#");
  const [mostrarConteudo, setMostrarConteudo] = useState(false);
  const [acessoLiberado, setAcessoLiberado] = useState(true);
  const [atualizarHistorico, setAtualizarHistorico] = useState(0);
  const { estudos, loading } = useHistoricoEstudoCronograma(usuario?.uid, editalEscolhido, atualizarHistorico);



  // Estado para saber se concluiu o desafio diário
  const [desafioConcluido, setDesafioConcluido] = useState(false);

  useEffect(() => {
  const auth = getAuth();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUsuario(user);
    // Bloqueio financeiro temporariamente desativado até alinhar pagamento/backend.
    setAcessoLiberado(true);
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

useEffect(() => {
  async function buscarFlashcards() {
    if (!usuario || !editalEscolhido) {
      setDesempenhoFlashcards({});
      return;
    }
    const snap = await getDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido));
    setDesempenhoFlashcards(snap.exists() ? (snap.data().desempenhoFlashcards || {}) : {});
  }
  buscarFlashcards();
}, [usuario, editalEscolhido, atualizarHistorico]);


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
  const [telaAtual, setTelaAtual] = useState(() => window.location.hash?.replace("#/", "") || "login");
  const tela = telaAtual;
  const setTela = (proximaTela) => {
    setTelaAtual(proximaTela);
    if (typeof window !== "undefined") {
      const destino = `#/${proximaTela}`;
      if (window.location.hash !== destino) window.history.pushState(null, "", destino);
    }
  };

  useEffect(() => {
    const sincronizarRota = () => {
      const rota = window.location.hash?.replace("#/", "") || "login";
      setMostrarLanding(!window.location.hash || window.location.hash === "#/" || window.location.hash === "#");
      setTelaAtual(rota);
    };
    window.addEventListener("hashchange", sincronizarRota);
    window.addEventListener("popstate", sincronizarRota);
    return () => {
      window.removeEventListener("hashchange", sincronizarRota);
      window.removeEventListener("popstate", sincronizarRota);
    };
  }, []);
  // Wrapper que persiste no localStorage e sincroniza materias/pesos
  const setEditalEscolhido = (id) => {
    setEditalEscolhidoState(id);
    try { if (id) localStorage.setItem("editalEscolhido", id); else localStorage.removeItem("editalEscolhido"); } catch {}
    const edital = EDITAIS_MAP[id];
    if (edital) { setMateriasPorBloco(edital.materias); setPesos(edital.pesos); }
    // Mostrar briefing ao selecionar edital (se não foi dispensado hoje)
    if (id) {
      const chave = `briefing-visto-${id}-${new Date().toISOString().slice(0,10)}`;
      try { if (!localStorage.getItem(chave)) setMostrarBriefing(true); } catch {}
    }
  };

  // Inicializa materias/pesos a partir do edital salvo no localStorage
  const editalInicial = (() => { try { return localStorage.getItem("editalEscolhido"); } catch { return null; } })();
  const [materiasPorBloco, setMateriasPorBloco] = useState(() => EDITAIS_MAP[editalInicial]?.materias || pfMaterias);
  const [pesos, setPesos] = useState(() => EDITAIS_MAP[editalInicial]?.pesos || pfPesos);
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
  const [tipoCronograma, setTipoCronograma] = useState("diario");
  const [mensagemCronograma, setMensagemCronograma] = useState("");
  const [horasSemana, setHorasSemana] = useState({
    Segunda: 1,
    Terça: 1,
    Quarta: 1,
    Quinta: 1,
    Sexta: 1,
    Sábado: 1,
    Domingo: 0,
  });
  const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const normalizarDiaSemana = (nome = "") => {
    const n = String(nome).toLowerCase();
    if (n.includes("segunda")) return "Segunda";
    if (n.includes("terça") || n.includes("terca")) return "Terça";
    if (n.includes("quarta")) return "Quarta";
    if (n.includes("quinta")) return "Quinta";
    if (n.includes("sexta")) return "Sexta";
    if (n.includes("sábado") || n.includes("sabado")) return "Sábado";
    if (n.includes("domingo")) return "Domingo";
    return nome;
  };
  const diasDaSemanaAPartirDaData = (iso) => Array.from({ length: 7 }, (_, idx) => {
    const data = adicionarDias(iso, idx);
    const nomeLongo = parseDataLocal(data).toLocaleDateString("pt-BR", { weekday: "long" });
    const diaSemana = normalizarDiaSemana(nomeLongo);
    return { key: diaSemana, label: diaSemana, data };
  });
  const [abaCronograma, setAbaCronograma] = useState("mensal");
  const [dataDiaria, setDataDiaria] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataSemana, setDataSemana] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataMensal, setDataMensal] = useState(() => new Date().toISOString().slice(0, 7));
  const [cronogramasSalvos, setCronogramasSalvos] = useState([]);
  const [cronogramaAtivoId, setCronogramaAtivoId] = useState(null);
  const [estudosDetalhes, setEstudosDetalhes] = useState({});
  const [modoFoco, setModoFoco] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);
  const [questoesPuladas, setQuestoesPuladas] = useState(0);
  const [telaAnteriorQuestoes, setTelaAnteriorQuestoes] = useState("escolherMateria");
  const [mensagemQuestoes, setMensagemQuestoes] = useState("");
  const [filtroQuestoesAtual, setFiltroQuestoesAtual] = useState(null);
  const [materiaFlashcard, setMateriaFlashcard] = useState("");
  const [assuntoFlashcard, setAssuntoFlashcard] = useState("");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardVirado, setFlashcardVirado] = useState(false);
  const [desempenhoFlashcards, setDesempenhoFlashcards] = useState({});
  // Resumos e caderno de erros por matéria
  const [resumosMateria, setResumosMateria] = useState({});
  const [cadernoErros, setCadernoErros] = useState({});
  const [questoesManuais, setQuestoesManuais] = useState({});
  const [materiaAberta, setMateriaAberta] = useState(null);
  const [abaMateria, setAbaMateria] = useState("resumo");
  // Estados para formulário do caderno (não podem ficar dentro de map)
  const [novoErroForm, setNovoErroForm] = useState({ questao: "", erro: "", correto: "" });
  // Estados para cronograma edital todo
  const [horasEditalTodo, setHorasEditalTodo] = useState(2);
  const [diasEditalTodo, setDiasEditalTodo] = useState({ Segunda:1, Terça:1, Quarta:1, Quinta:1, Sexta:1, Sábado:1, Domingo:0 });
  const [diaModalAberto, setDiaModalAberto] = useState(null);
  const [resumosMateriaFiltro, setResumosMateriaFiltro] = useState("");
  const [resumosAssuntoFiltro, setResumoAssuntoFiltro] = useState("");
  const [sessaoQuestoesForm, setSessaoQuestoesForm] = useState({ assunto: "", certas: "", erradas: "" });
  const [resumoSalvoStatus, setResumoSalvoStatus] = useState(""); // "", "salvando", "salvo"




async function salvarResumoMateria(materia, dados) {
  if (!usuario) return;
  const novoResumos = { ...resumosMateria, [materia]: dados };
  setResumosMateria(novoResumos);
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido || "geral");
  await setDoc(ref, { resumosMateria: novoResumos }, { merge: true });
}
async function salvarCadernoErro(materia, entrada) {
  if (!usuario) return;
  const lista = [...(cadernoErros[materia] || []), { ...entrada, data: new Date().toISOString().slice(0,10) }];
  const novo = { ...cadernoErros, [materia]: lista };
  setCadernoErros(novo);
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido || "geral");
  await setDoc(ref, { cadernoErros: novo }, { merge: true });
}
async function salvarQuestoesManuais(materia, dados) {
  if (!usuario) return;
  const novo = { ...questoesManuais, [materia]: dados };
  setQuestoesManuais(novo);
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido || "geral");
  await setDoc(ref, { questoesManuais: novo }, { merge: true });
}
async function salvarSessaoQuestoes(materia, assunto, certas, erradas) {
  if (!usuario || (!certas && !erradas)) return;
  const chave = `${materia}|||${assunto}`;
  const sessaoNova = { assunto, certas: parseInt(certas)||0, erradas: parseInt(erradas)||0, data: new Date().toISOString().slice(0,10) };
  // Acumula por matéria
  const qmAtual = questoesManuais[materia] || { total: 0, certas: 0, erradas: 0, sessoes: [] };
  const novoTotal = { 
    total: (qmAtual.total||0) + (parseInt(certas)||0) + (parseInt(erradas)||0),
    certas: (qmAtual.certas||0) + (parseInt(certas)||0),
    erradas: (qmAtual.erradas||0) + (parseInt(erradas)||0),
    sessoes: [...(qmAtual.sessoes||[]), sessaoNova],
  };
  await salvarQuestoesManuais(materia, novoTotal);
}
async function carregarExtras() {
  if (!usuario || !editalEscolhido) return;
  try {
    const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      if (d.resumosMateria) setResumosMateria(d.resumosMateria);
      if (d.cadernoErros) setCadernoErros(d.cadernoErros);
      if (d.questoesManuais) setQuestoesManuais(d.questoesManuais);
      if (d.dataProva) setDataProvaEdital(prev => ({ ...prev, [editalEscolhido]: d.dataProva }));
    }
  } catch(e) { console.error("Erro ao carregar extras:", e); }
}

async function salvarDataProva(data) {
  if (!usuario || !editalEscolhido) return;
  setDataProvaEdital(prev => ({ ...prev, [editalEscolhido]: data }));
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
  await setDoc(ref, { dataProva: data }, { merge: true });
}

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
    const item = docu.data();
    if (item.edital === editalEscolhido || (!item.edital && editalEscolhido === "pf")) {
      promises.push(deleteDoc(docu.ref));
    }
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
    const item = { id: doc.id, ...doc.data() };
    if (item.edital === editalEscolhido || (!item.edital && editalEscolhido === "pf")) {
      lista.push(item);
    }
  });
  setResultadosSimulados(lista);
}


  async function salvarResultadoSimulado(resultado) {
    if (!usuario) return;
    const simuladosRef = collection(db, "users", usuario.uid, "simulados");
    await addDoc(simuladosRef, {
      ...resultado,
      edital: editalEscolhido || "pf",
      editalNome: editalAtualNome,
      simuladoId: simuladoEscolhido?.id || "simulado_padrao_pf",
      simuladoNome: simuladoEscolhido?.nome || "Simulado padrão",
      dataHora: serverTimestamp()
    });
  }

 async function registrarEstudo(uid, materia, assunto, tempoMin = 0) {
  if (!editalEscolhido) return alert("Escolha um concurso antes de salvar o estudo.");
  const userRef = doc(db, "users", uid);
  const chave = `${materia}|||${assunto}`;
  const agora = new Date().toISOString();
  try {
    const snap = await getDoc(userRef);
    const dados = snap.exists() ? snap.data() : {};
    const estudosPorEdital = dados.estudosPorEdital || {};
    const detalhesPorEdital = dados.estudosDetalhesPorEdital || {};
    const estudosEdital = { ...(estudosPorEdital[editalEscolhido] || {}) };
    const detalhesEdital = { ...(detalhesPorEdital[editalEscolhido] || {}) };

    const listaMateria = Array.isArray(estudosEdital[materia]) ? estudosEdital[materia] : [];
    estudosEdital[materia] = listaMateria.includes(assunto) ? listaMateria : [...listaMateria, assunto];
    detalhesEdital[chave] = { materia, assunto, edital: editalEscolhido, concluidoEm: agora, tempoMin: Number(tempoMin) || 0 };

    await setDoc(userRef, {
      estudosPorEdital: { ...estudosPorEdital, [editalEscolhido]: estudosEdital },
      estudosDetalhesPorEdital: { ...detalhesPorEdital, [editalEscolhido]: detalhesEdital },
    }, { merge: true });

    setEstudosDetalhes(detalhesEdital);
  } catch (e) {
    alert("Erro ao registrar estudo: " + e.message);
  }
}

async function desmarcarEstudo(uid, materia, assunto) {
  if (!editalEscolhido) return;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const dados = snap.exists() ? snap.data() : {};
  const estudosPorEdital = dados.estudosPorEdital || {};
  const detalhesPorEdital = dados.estudosDetalhesPorEdital || {};
  const estudosEdital = { ...(estudosPorEdital[editalEscolhido] || {}) };
  const detalhesEdital = { ...(detalhesPorEdital[editalEscolhido] || {}) };
  const listaAtualizada = (estudosEdital[materia] || []).filter((item) => item !== assunto);
  const chave = `${materia}|||${assunto}`;
  estudosEdital[materia] = listaAtualizada;
  delete detalhesEdital[chave];

  await setDoc(userRef, {
    estudosPorEdital: { ...estudosPorEdital, [editalEscolhido]: estudosEdital },
    estudosDetalhesPorEdital: { ...detalhesPorEdital, [editalEscolhido]: detalhesEdital },
  }, { merge: true });
  setEstudosDetalhes(detalhesEdital);
}

async function alternarAssuntoEdital(materia, topico, estudado) {
  if (!usuario) return alert("Faça login para salvar seu progresso.");
  if (estudado) {
    await desmarcarEstudo(usuario.uid, materia, topico);
  } else {
    await registrarEstudo(usuario.uid, materia, topico);
  }
  setAtualizarHistorico((v) => v + 1);
}

async function salvarCronograma(cronograma) {
  const lista = [cronograma, ...cronogramasSalvos.filter((c) => c.id !== cronograma.id)];
  await salvarCronogramasUsuario(lista);
  setCronogramaAtivoId(cronograma.id);
}



useEffect(() => {
  async function carregarDadosDeEstudo() {
    if (!usuario || !editalEscolhido) {
      setCronogramasSalvos([]);
      setBlocos([]);
      setCronogramaAtivoId(null);
      setEstudosDetalhes({});
      return;
    }
    const snap = await getDoc(doc(db, "users", usuario.uid));
    const dados = snap.exists() ? snap.data() : {};

    const cronogramasDoEdital = dados.cronogramasPorEdital?.[editalEscolhido]
      || (dados.cronogramas || []).filter((c) => c.edital === editalEscolhido)
      || [];

    const detalhesDoEdital = dados.estudosDetalhesPorEdital?.[editalEscolhido]
      || (editalEscolhido === "pf" ? (dados.estudosDetalhes || {}) : {})
      || {};

    setCronogramasSalvos(cronogramasDoEdital);
    setEstudosDetalhes(detalhesDoEdital);

    const ativo = cronogramasDoEdital[0];
    if (ativo) {
      definirCronogramaAtivo(ativo);
    } else {
      setBlocos([]);
      setCronogramaAtivoId(null);
      setMensagemCronograma("Nenhum cronograma salvo para este concurso ainda.");
    }
  }
  carregarDadosDeEstudo();
  carregarExtras();
}, [usuario, editalEscolhido, atualizarHistorico]);

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
    edital: editalEscolhido || "pf",
    editalNome: editalAtualNome,
    simuladoId: simuladoEscolhido?.id || "simulado_padrao_pf",
    simuladoNome: simuladoEscolhido?.nome || "Simulado padrão",
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

  function useHistoricoEstudoCronograma(uid, editalId, atualizarHistorico) {
  const [estudos, setEstudos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstudos() {
      if (!uid || !editalId) {
        setEstudos({});
        setLoading(false);
        return;
      }
      setLoading(true);
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const dados = docSnap.data();
        const estudosEdital = dados.estudosPorEdital?.[editalId] || (editalId === "pf" ? dados.estudos : {}) || {};
        setEstudos(estudosEdital);
      } else {
        setEstudos({});
      }
      setLoading(false);
    }
    fetchEstudos();
  }, [uid, editalId, atualizarHistorico]);

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
      <div className="w-full max-w-screen-sm bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-6 transition-colors duration-200 ease-in-out">
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


 const editalAtualNome = editalEscolhido === "inss" ? "INSS" : editalEscolhido === "alego" ? "ALEGO  -  Analista Administrativo" : editalEscolhido === "sedes_tdas_tecadm" ? "SEDES-DF  -  Técnico Administrativo" : editalEscolhido === "sedes_edas_servsocial" ? "SEDES-DF  -  Assistente Social" : editalEscolhido === "sedes_edas_educsocial" ? "SEDES-DF  -  Educador Social" : editalEscolhido === "camara_al" ? "Câmara dos Deputados  -  Analista Legislativo" : editalEscolhido === "bb_escriturario" ? "Banco do Brasil  -  Agente Comercial" : editalEscolhido === "silva_jardim_enf" ? "Pref. Silva Jardim  -  Técnico em Enfermagem" : "Polícia Federal";

 function dadosEditalAtivo() {
  const total = todosAssuntosDoEdital().length;
  const concluidos = assuntosEstudadosSet().size;
  const percentual = total ? Math.round((concluidos / total) * 100) : 0;
  return { total, concluidos, percentual, pendentes: Math.max(0, total - concluidos) };
 }

 function conteudoApoioMateria(materia) {
  const chaveMateria = nomeDisciplinaExibicao(materia);
  if (editalEscolhido === "alego") return conteudosALEGO[chaveMateria] || conteudosALEGO[materia] || null;
  if (editalEscolhido === "pf") return conteudosPF?.[chaveMateria] || conteudosPF?.[materia] || null;
  return null;
 }

 function abrirMaterial(materia, assunto = "") {
  const conteudo = conteudoApoioMateria(materia);
  setMaterialSelecionado({ materia: nomeDisciplinaExibicao(materia), assunto, conteudo });
  setTela("materialApoio");
 }

 function normalizarTextoFiltro(valor = "") {
  return String(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
 }

 function filtrarQuestoesPorMateriaAssunto(materia, assunto = "") {
  const materiaExibida = nomeDisciplinaExibicao(materia);
  const bancoDoEdital = questoes?.[editalEscolhido] || {};
  const todasDaMateria = bancoDoEdital[materia] || bancoDoEdital[materiaExibida] || [];
  const assuntoNormalizado = normalizarTextoFiltro(assunto);

  if (!assuntoNormalizado) return todasDaMateria;

  return todasDaMateria.filter((q) => {
    const assuntoQuestao = normalizarTextoFiltro(q.assunto || q.topico || "");
    return assuntoQuestao === assuntoNormalizado;
  });
 }

 function iniciarQuestoesDaMateria(materia, assunto = "", origem = "cronograma") {
  const materiaExibida = nomeDisciplinaExibicao(materia);
  const selecionadas = filtrarQuestoesPorMateriaAssunto(materia, assunto);

  if (!selecionadas.length) {
    setQuestoesAtual([]);
    setMateriaEscolhida(materiaExibida);
    setFiltroQuestoesAtual({ materia: materiaExibida, assunto });
    setMensagemQuestoes(assunto
      ? `Ainda não temos questões cadastradas para este assunto: ${assunto}.`
      : `Ainda não temos questões cadastradas para esta matéria.`);
    setTelaAnteriorQuestoes(origem || "cronograma");
    setTela("questoes");
    return;
  }

  setQuestoesAtual([...selecionadas].sort(() => 0.5 - Math.random()));
  setMateriaEscolhida(materiaExibida);
  setFiltroQuestoesAtual({ materia: materiaExibida, assunto });
  setMensagemQuestoes("");
  setTelaAnteriorQuestoes(origem || "cronograma");
  setQuestaoIndex(0);
  setRespostaSelecionada(null);
  setRespostaCorreta(null);
  setMostrarExplicacao(false);
  setMostrarTexto(false);
  setAcertos(0);
  setErros(0);
  setQuestoesPuladas(0);
  setTela("questoes");
 }

 function materiasFlashcardsDoEdital() {
  return flashcards?.[editalEscolhido] || {};
 }
 function listaFlashcardsFiltrada() {
  const banco = materiasFlashcardsDoEdital();
  const listaMateria = materiaFlashcard ? (banco[materiaFlashcard] || []) : [];
  return assuntoFlashcard ? listaMateria.filter((c) => c.assunto === assuntoFlashcard) : listaMateria;
 }
 function abrirFlashcards(materia = "", assunto = "") {
  setMateriaFlashcard(nomeDisciplinaExibicao(materia || ""));
  setAssuntoFlashcard(assunto || "");
  setFlashcardIndex(0);
  setFlashcardVirado(false);
  setTela("flashcards");
 }
 async function registrarFlashcard(resultado) {
  const lista = listaFlashcardsFiltrada();
  const card = lista[flashcardIndex % Math.max(lista.length, 1)];

  if (usuario && editalEscolhido && card?.id) {
    const hoje = new Date().toISOString().slice(0, 10);
    const revisaoEm = resultado === "errei" ? adicionarDias(hoje, 1) : adicionarDias(hoje, 7);
    const atual = desempenhoFlashcards?.[card.id] || { acertos: 0, erros: 0, vezes: 0 };
    const novoRegistro = {
      ...atual,
      id: card.id,
      materia: materiaFlashcard,
      assunto: card.assunto || assuntoFlashcard || "Geral",
      frente: card.frente,
      tipo: card.tipo || "conceito",
      acertos: (atual.acertos || 0) + (resultado === "acertei" ? 1 : 0),
      erros: (atual.erros || 0) + (resultado === "errei" ? 1 : 0),
      vezes: (atual.vezes || 0) + 1,
      ultimoResultado: resultado,
      ultimaRevisao: hoje,
      revisaoEm,
    };
    const atualizado = { ...desempenhoFlashcards, [card.id]: novoRegistro };
    setDesempenhoFlashcards(atualizado);
    await setDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido), { desempenhoFlashcards: atualizado }, { merge: true });
    setAtualizarHistorico((v) => v + 1);
  }

  setFlashcardVirado(false);
  if (flashcardIndex + 1 < lista.length) setFlashcardIndex((v) => v + 1);
  else setFlashcardIndex(0);
 }


 function EditalAtivoResumo({ compacto = false }) {
  const d = dadosEditalAtivo();
  return (
    <div className={`bg-gradient-to-br from-cyan-950/70 via-slate-900/90 to-black border border-cyan-400/25 rounded-3xl shadow-2xl ${compacto ? "p-4" : "p-5"}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300 font-black">Edital ativo</p>
          <h3 className={`${compacto ? "text-xl" : "text-2xl"} font-black text-white mt-1`}>{editalAtualNome}</h3>
          <p className="text-sm text-gray-300 mt-1">Tudo que você fizer aqui fica separado por concurso.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center min-w-[260px]">
          <div className="bg-white/10 rounded-2xl p-3"><b className="text-cyan-200">{d.total}</b><br/><span className="text-[11px] text-gray-300">assuntos</span></div>
          <div className="bg-emerald-500/10 rounded-2xl p-3"><b className="text-emerald-300">{d.concluidos}</b><br/><span className="text-[11px] text-gray-300">concluídos</span></div>
          <div className="bg-yellow-500/10 rounded-2xl p-3"><b className="text-yellow-300">{d.percentual}%</b><br/><span className="text-[11px] text-gray-300">avanço</span></div>
        </div>
      </div>
      <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${d.percentual}%` }} /></div>
      {!compacto && <button onClick={() => { setEditalEscolhido(null); setTela("concurso"); }} className="mt-4 bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-cyan-100">Trocar edital</button>}
    </div>
  );
 }

 const nomeDisciplinaExibicao = (nome) => {
  const n = nome || "";
  if (!n) return "—";
  if (editalEscolhido === "alego" && n === "Analista Administrativo") return "Administração Geral e Pública";
  return n;
 };


 const parseDataLocal = (iso) => {
  const [ano, mes, dia] = String(iso || new Date().toISOString().slice(0, 10)).split("-").map(Number);
  return new Date(ano, (mes || 1) - 1, dia || 1);
 };
 const toISODate = (data) => {
  const d = new Date(data);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
 };
 const formatarDataBR = (iso) => parseDataLocal(iso).toLocaleDateString("pt-BR");
 const inicioSemana = (iso) => {
  const d = parseDataLocal(iso);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
 };
 const adicionarDias = (iso, dias) => {
  const d = parseDataLocal(iso);
  d.setDate(d.getDate() + dias);
  return toISODate(d);
 };
 const rotuloSemana = (iso) => {
  const ini = iso;
  return `${formatarDataBR(ini)} a ${formatarDataBR(adicionarDias(ini, 6))}`;
 };
 const detalhesDoAssunto = (materia, assunto) => estudosDetalhes?.[`${materia}|||${assunto}`] || {};
 const dataConclusaoAssunto = (materia, assunto) => detalhesDoAssunto(materia, assunto).concluidoEm?.slice(0, 10) || null;
 const assuntosEstudadosArray = () => Object.entries(estudos || {}).flatMap(([materia, assuntos]) => (assuntos || []).map((assunto) => ({ materia, assunto })));
 const calcularProgressoDisciplina = (materia) => {
  const total = todosAssuntosDoEdital().filter((i) => i.nome === materia).length || 1;
  const feitos = (estudos?.[materia] || []).length;
  return Math.min(100, Math.round((feitos / total) * 100));
 };
 const progressoGeralEdital = () => {
  const total = todosAssuntosDoEdital().length || 1;
  return Math.min(100, Math.round((assuntosEstudadosSet().size / total) * 100));
 };
 const tempoEstudadoHoje = () => {
  const hoje = new Date().toISOString().slice(0, 10);
  return Object.values(estudosDetalhes || {}).filter((d) => d.concluidoEm?.slice(0,10) === hoje).reduce((acc, d) => acc + (Number(d.tempoMin) || 0), 0);
 };
 const tempoEstudadoSemana = () => {
  const ini = inicioSemana(new Date().toISOString().slice(0, 10));
  const fim = adicionarDias(ini, 6);
  return Object.values(estudosDetalhes || {}).filter((d) => {
    const dia = d.concluidoEm?.slice(0,10);
    return dia && dia >= ini && dia <= fim;
  }).reduce((acc, d) => acc + (Number(d.tempoMin) || 0), 0);
 };
 const calcularStreak = () => {
  const dias = new Set(Object.values(estudosDetalhes || {}).map((d) => d.concluidoEm?.slice(0,10)).filter(Boolean));
  let atual = parseDataLocal(new Date().toISOString().slice(0,10));
  let streak = 0;
  while (dias.has(toISODate(atual))) {
    streak++;
    atual.setDate(atual.getDate() - 1);
  }
  return streak;
 };
 const revisoesPorData = (iso) => {
  const alvo = iso || new Date().toISOString().slice(0,10);
  const marcos = [
    { dias: 1, nome: "D+1", acao: "revisão rápida" },
    { dias: 7, nome: "D+7", acao: "questões" },
    { dias: 15, nome: "D+15", acao: "resumo/lei seca" },
    { dias: 30, nome: "D+30", acao: "simulado" },
  ];
  return assuntosEstudadosArray().flatMap(({ materia, assunto }) => {
    const concluidoEm = dataConclusaoAssunto(materia, assunto);
    if (!concluidoEm) return [];
    return marcos
      .filter((m) => adicionarDias(concluidoEm, m.dias) === alvo)
      .map((m) => ({ materia, assunto, ...m }));
  });
 };

 const dadosQuestoesGeral = () => desempenhoQuestoes?.geral || { acertos: 0, erros: 0 };
 const totalQuestoesRespondidas = () => (dadosQuestoesGeral().acertos || 0) + (dadosQuestoesGeral().erros || 0);
 const aproveitamentoGeral = () => {
   const total = totalQuestoesRespondidas();
   return total ? Math.round(((dadosQuestoesGeral().acertos || 0) / total) * 100) : 0;
 };
 const materiaMaisForteEFraca = () => {
   const entradas = Object.entries(desempenhoQuestoes?.porMateria || {})
     .map(([materia, d]) => {
       const total = (d.acertos || 0) + (d.erros || 0);
       return { materia, total, pct: total ? Math.round(((d.acertos || 0) / total) * 100) : 0, ...d };
     })
     .filter((i) => i.total > 0);
   if (!entradas.length) return { forte: null, fraca: null };
   return {
     forte: [...entradas].sort((a,b) => b.pct - a.pct)[0],
     fraca: [...entradas].sort((a,b) => a.pct - b.pct)[0],
   };
 };
 const flashcardsDoEditalLista = () => Object.values(materiasFlashcardsDoEdital() || {}).flat();
 const totalFlashcardsRespondidos = () => Object.keys(desempenhoFlashcards || {}).length;
 const revisoesFlashcardsPorData = (iso) => Object.values(desempenhoFlashcards || {})
   .filter((r) => r.revisaoEm && r.revisaoEm <= iso)
   .map((r) => ({ tipo: "flashcard", nome: "Flashcard", acao: r.ultimoResultado === "errei" ? "reforço por erro" : "revisão espaçada", materia: r.materia, assunto: r.assunto, id: r.id, frente: r.frente }));
 const revisoesQuestoesErradasPorData = (iso) => {
   const erradas = desempenhoQuestoes?.questoesErradas || {};
   const detalhes = desempenhoQuestoes?.questoesErradasDetalhes || {};
   return Object.entries(erradas).flatMap(([materia, ids]) => (ids || []).map((id) => {
     const d = detalhes[id] || {};
     return { tipo: "questao", nome: "Questão errada", acao: "refazer questão", materia, assunto: d.assunto || "Revisão de erros", id, revisaoEm: d.revisaoEm || iso };
   })).filter((r) => !r.revisaoEm || r.revisaoEm <= iso);
 };
 const revisoesInteligentesPorData = (iso = new Date().toISOString().slice(0,10)) => [
   ...revisoesPorData(iso).map((r) => ({ ...r, tipo: "assunto" })),
   ...revisoesQuestoesErradasPorData(iso),
   ...revisoesFlashcardsPorData(iso),
 ];
 const iniciarRevisao = (item) => {
   if (item.tipo === "questao") {
     const todas = questoes?.[editalEscolhido]?.[item.materia] || [];
     const selecionadas = item.id ? todas.filter((q) => String(q.id) === String(item.id)) : todas;
     if (!selecionadas.length) return alert("Não encontrei essa questão no banco atual.");
     setQuestoesAtual(selecionadas);
     setMateriaEscolhida(item.materia);
     setFiltroQuestoesAtual({ materia: item.materia, assunto: item.assunto || "Revisão" });
     setTelaAnteriorQuestoes("revisao");
     setQuestaoIndex(0);
     setRespostaSelecionada(null);
     setRespostaCorreta(null);
     setMostrarExplicacao(false);
     setAcertos(0);
     setErros(0);
     setTela("questoes");
     return;
   }
   if (item.tipo === "flashcard") {
     abrirFlashcards(item.materia, item.assunto);
     return;
   }
   abrirFlashcards(item.materia, item.assunto);
 };
 const proximosBlocosHoje = () => (blocos || []).filter((b) => b.data === new Date().toISOString().slice(0,10)).slice(0,3);
 const salvarCronogramasUsuario = async (lista) => {
  setCronogramasSalvos(lista);
  if (!usuario || !editalEscolhido) return;
  const userRef = doc(db, "users", usuario.uid);
  const snap = await getDoc(userRef);
  const dados = snap.exists() ? snap.data() : {};
  const cronogramasPorEdital = dados.cronogramasPorEdital || {};
  await setDoc(userRef, { cronogramasPorEdital: { ...cronogramasPorEdital, [editalEscolhido]: lista } }, { merge: true });
 };
 const definirCronogramaAtivo = (cronograma) => {
  setCronogramaAtivoId(cronograma.id);
  setTipoCronograma(cronograma.tipo);
  setBlocos(cronograma.blocos || []);
  setAbaCronograma("meus");
  setMensagemCronograma(`Cronograma carregado: ${cronograma.titulo}`);
 };
 const copiarCronogramaAtivo = async () => {
  const c = cronogramasSalvos.find((item) => item.id === cronogramaAtivoId) || { titulo: tipoCronograma === "semanal" ? "Cronograma semanal" : "Cronograma diário", blocos };
  const texto = [c.titulo, ...(c.blocos || []).map((b) => `${b.data ? formatarDataBR(b.data) + " - " : ""}${b.dia || ""}: ${nomeDisciplinaExibicao(b.nome)}  -  ${b.topico} (${b.tempo} min)${b.revisaoObs ? " | " + b.revisaoObs : ""}`)].join("\n");
  try { await navigator.clipboard.writeText(texto); alert("Cronograma copiado."); } catch { alert(texto); }
 };
 const todosAssuntosDoEdital = () =>
  Object.entries(materiasPorBloco).flatMap(([bloco, materias]) =>
    materias.flatMap((materia) =>
      (materia.topicos || []).map((topico) => ({
        bloco,
        nome: materia.nome,
        topico,
        chave: `${materia.nome}|||${topico}`,
      }))
    )
  );

 const assuntosEstudadosSet = () => {
  const estudados = new Set();
  Object.entries(estudos || {}).forEach(([materia, assuntos]) => {
    (assuntos || []).forEach((assunto) => estudados.add(`${materia}|||${assunto}`));
  });
  return estudados;
 };

 const assuntosPendentesDoEdital = () => {
  const estudados = assuntosEstudadosSet();
  return todosAssuntosDoEdital().filter((item) => !estudados.has(item.chave));
 };

 const gerarBlocosDeEstudo = (totalMin, pendentesBase) => {
  const TEMPO_MIN = 18;
  const TEMPO_MAX = 65;
  const pendentesPorBloco = pendentesBase.reduce((acc, item) => {
    acc[item.bloco] = acc[item.bloco] || [];
    acc[item.bloco].push(item);
    return acc;
  }, {});

  let blocosGerados = [];
  let tempoDistribuido = 0;

  Object.entries(pesos).forEach(([bloco, peso]) => {
    const assuntos = embaralharArray([...(pendentesPorBloco[bloco] || [])]);
    const tempoBlocoTotal = Math.round(totalMin * peso);
    let tempoDistribuidoBloco = 0;

    for (let i = 0; i < assuntos.length; i++) {
      if (tempoDistribuidoBloco >= tempoBlocoTotal) break;
      const restante = tempoBlocoTotal - tempoDistribuidoBloco;
      if (restante < TEMPO_MIN) break;

      const tempoMateria = Math.min(Math.max(TEMPO_MIN, restante), TEMPO_MAX);
      const item = assuntos[i];

      blocosGerados.push({
        nome: item.nome,
        topico: item.topico,
        tempo: tempoMateria,
        cor: item.bloco,
        chave: item.chave,
      });

      tempoDistribuidoBloco += tempoMateria;
    }

    tempoDistribuido += tempoDistribuidoBloco;
  });

  let sobra = totalMin - tempoDistribuido;
  while (sobra > 0 && blocosGerados.length > 0) {
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

  return embaralharArray(blocosGerados);
 };

 const gerarCronograma = async () => {
  const totalMin = Math.round(parseFloat(String(tempoEstudo).replace(",", ".")) * 60 || 60);
  if (isNaN(totalMin) || totalMin < 30 || totalMin > 240) {
    alert("Informe entre 0.5 e 4 horas");
    return;
  }

  const pendentes = assuntosPendentesDoEdital();
  if (pendentes.length === 0) {
    setBlocos([]);
    setMensagemCronograma("Você já marcou todos os assuntos desse edital como estudados. Zere o histórico se quiser montar tudo de novo.");
    return;
  }

  const revisoes = revisoesPorData(dataDiaria);
  const blocosGerados = gerarBlocosDeEstudo(totalMin, pendentes).map((b, idx) => ({
    ...b,
    data: dataDiaria,
    dia: parseDataLocal(dataDiaria).toLocaleDateString("pt-BR", { weekday: "long" }),
    revisaoObs: idx === 0 && revisoes.length ? `Revisão de hoje: ${revisoes[0].materia}  -  ${revisoes[0].assunto} (${revisoes[0].nome})` : "",
  }));
  const cronograma = {
    id: `${editalEscolhido}-diario-${dataDiaria}-${Date.now()}`,
    tipo: "diario",
    edital: editalEscolhido,
    titulo: `Diário  -  ${formatarDataBR(dataDiaria)}`,
    criadoEm: new Date().toISOString(),
    data: dataDiaria,
    blocos: blocosGerados,
  };
  setTipoCronograma("diario");
  setMensagemCronograma(`${blocosGerados.length} assunto(s) selecionado(s) para ${formatarDataBR(dataDiaria)}. Assuntos já estudados não entram em cronogramas novos.`);
  setBlocos(blocosGerados);
  await salvarCronograma(cronograma);
};

 const sugestoesDeRevisao = () => revisoesPorData(new Date().toISOString().slice(0, 10));

 const gerarCronogramaSemanal = async () => {
  let pendentes = assuntosPendentesDoEdital();
  if (pendentes.length === 0) {
    setBlocos([]);
    setMensagemCronograma("Você já marcou todos os assuntos desse edital como estudados. Zere o histórico se quiser montar tudo de novo.");
    return;
  }

  const inicio = dataSemana;
  const diasCronograma = diasDaSemanaAPartirDaData(inicio);
  const semana = [];
  const usados = new Set();

  diasCronograma.forEach((diaInfo) => {
    const data = diaInfo.data;
    const dia = diaInfo.label;
    const chaveHoras = diaInfo.key;
    const horas = parseFloat(String(horasSemana[chaveHoras] ?? 0).replace(",", "."));
    const totalMinPorDia = Math.round((isNaN(horas) ? 0 : horas) * 60);
    if (totalMinPorDia < 30) return;

    const disponiveis = pendentes.filter((item) => !usados.has(item.chave));
    if (disponiveis.length === 0) return;

    const revisoes = revisoesPorData(data);
    const blocosDoDia = gerarBlocosDeEstudo(totalMinPorDia, disponiveis).map((bloco, idx) => ({
      ...bloco,
      dia,
      data,
      revisaoObs: idx === 0 && revisoes.length ? `Revisão: ${revisoes[0].materia}  -  ${revisoes[0].assunto} (${revisoes[0].nome})` : "",
    }));

    blocosDoDia.forEach((bloco) => usados.add(bloco.chave));
    semana.push(...blocosDoDia);
  });

  if (semana.length === 0) {
    setMensagemCronograma("Coloque pelo menos 0.5h em algum dia da semana para montar o cronograma.");
    setBlocos([]);
    return;
  }

  const cronograma = {
    id: `${editalEscolhido}-semanal-${inicio}-${Date.now()}`,
    tipo: "semanal",
    edital: editalEscolhido,
    titulo: `Semanal  -  ${rotuloSemana(inicio)}`,
    criadoEm: new Date().toISOString(),
    dataInicio: inicio,
    dataFim: adicionarDias(inicio, 6),
    horasSemana,
    blocos: semana,
  };
  setTipoCronograma("semanal");
  setMensagemCronograma(`${semana.length} bloco(s) montado(s) para a semana ${rotuloSemana(inicio)}. Assuntos já estudados não entram em cronogramas novos.`);
  setBlocos(semana);
  await salvarCronograma(cronograma);
};

// Função de embaralhamento padrão
function embaralharArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

 const gerarCronogramaMensal = async () => {
  let pendentes = assuntosPendentesDoEdital();
  if (pendentes.length === 0) {
    setMensagemCronograma("Você já marcou todos os assuntos desse edital como estudados.");
    return;
  }

  const [ano, mes] = dataMensal.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const blocosMes = [];
  const usados = new Set();

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataStr = `${dataMensal}-${String(dia).padStart(2, "0")}`;
    const nomeDia = normalizarDiaSemana(parseDataLocal(dataStr).toLocaleDateString("pt-BR", { weekday: "long" }));
    const horas = parseFloat(String(horasSemana[nomeDia] ?? 0).replace(",", "."));
    const totalMin = Math.round((isNaN(horas) ? 0 : horas) * 60);
    if (totalMin < 30) continue;
    const disponiveis = pendentes.filter((item) => !usados.has(item.chave));
    if (disponiveis.length === 0) break;
    const blocosDoDia = gerarBlocosDeEstudo(totalMin, disponiveis).map((bloco) => ({
      ...bloco,
      dia: nomeDia,
      data: dataStr,
    }));
    blocosDoDia.forEach((b) => usados.add(b.chave));
    blocosMes.push(...blocosDoDia);
  }

  if (blocosMes.length === 0) {
    setMensagemCronograma("Configure horas por dia na aba Semanal antes de gerar o cronograma mensal.");
    return;
  }

  const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const cronograma = {
    id: `${editalEscolhido}-mensal-${dataMensal}-${Date.now()}`,
    tipo: "semanal",
    edital: editalEscolhido,
    titulo: `Mensal  -  ${nomesMes[mes-1]} ${ano}`,
    criadoEm: new Date().toISOString(),
    blocos: blocosMes,
  };
  setMensagemCronograma(`${blocosMes.length} blocos gerados para ${nomesMes[mes-1]} ${ano}!`);
  await salvarCronograma(cronograma);
};

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
    setQuestoesPuladas(0);
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
  } else {
    setErros((prev) => prev + 1);
  }
  // Salva desempenho por matéria e registra questões erradas no Firebase
  try {
    const docRef = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
    const snap = await getDoc(docRef);
    const dadosAtuais = snap.exists() && snap.data() ? snap.data() : {};

    const desempenhoAtual = dadosAtuais?.desempenhoQuestoes || {};
    const geralAtual = desempenhoAtual?.geral || { acertos: 0, erros: 0 };
    const porMateriaAtual = desempenhoAtual?.porMateria || {};
    const questoesErradas = desempenhoAtual?.questoesErradas || {};
    const questoesErradasDetalhes = desempenhoAtual?.questoesErradasDetalhes || {};

    const materia = questao.materia || materiaEscolhida || "Geral";
    const acertou = i === correta;
    const atualMateria = porMateriaAtual[materia] || { acertos: 0, erros: 0 };
    const erradasDaMateria = questoesErradas[materia] || [];

    if (acertou) {
      atualMateria.acertos = (atualMateria.acertos || 0) + 1;
      geralAtual.acertos = (geralAtual.acertos || 0) + 1;
      if (questao.id) {
        const idxErro = erradasDaMateria.findIndex((id) => String(id) === String(questao.id));
        if (idxErro >= 0) erradasDaMateria.splice(idxErro, 1);
        delete questoesErradasDetalhes[questao.id];
      }
    } else {
      atualMateria.erros = (atualMateria.erros || 0) + 1;
      geralAtual.erros = (geralAtual.erros || 0) + 1;
      if (questao.id && !erradasDaMateria.some((id) => String(id) === String(questao.id))) erradasDaMateria.push(questao.id);
      if (questao.id) {
        questoesErradasDetalhes[questao.id] = {
          id: questao.id,
          materia,
          assunto: questao.assunto || filtroQuestoesAtual?.assunto || "Geral",
          enunciado: questao.enunciado,
          revisaoEm: adicionarDias(new Date().toISOString().slice(0,10), 1),
          ultimaTentativa: new Date().toISOString().slice(0,10),
        };
      }
    }

    porMateriaAtual[materia] = atualMateria;
    questoesErradas[materia] = erradasDaMateria;

    await setDoc(docRef, {
      desempenhoQuestoes: {
        geral: geralAtual,
        porMateria: porMateriaAtual,
        questoesErradas,
        questoesErradasDetalhes,
      },
    }, { merge: true });

    setDesempenhoQuestoes({ geral: geralAtual, porMateria: porMateriaAtual, questoesErradas, questoesErradasDetalhes });
  } catch (error) {
    console.error("Erro ao salvar desempenho por matéria:", error);
  }
};;

  const proximaQuestao = async () => {
  if (questaoIndex + 1 < questoesAtual.length) {
    setQuestaoIndex((prev) => prev + 1);
    setRespostaSelecionada(null);
    setRespostaCorreta(null);
    setMostrarExplicacao(false);
    setMostrarTexto(false);
  } else {
    setMostrarExplicacao(false);
    setMostrarTexto(false);
    setTela("resultadoQuestoes");
  }
};

  const pularQuestao = () => {
  setQuestoesPuladas((prev) => prev + 1);
  proximaQuestao();
};

  if (mostrarLanding) {
    return <LandingPage onComecar={() => { setMostrarLanding(false); setTela("login"); }} />;
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
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white px-4 py-10 flex flex-col items-center">
    <div className="w-full max-w-2xl">
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-400 font-black mb-2">EstudoLendário</p>
        <h2 className="text-4xl font-black text-white">Qual é o seu concurso?</h2>
        <p className="text-gray-400 mt-2">Escolha e todo seu progresso ficará separado por edital.</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* DESTAQUE: Câmara dos Deputados */}
        <button
          onClick={() => {
            setMateriasPorBloco(camaraALMaterias);
            setPesos(camaraALPesos);
            setEditalEscolhido("camara_al");
            setTela("modulos");
          }}
          className="relative overflow-hidden group bg-gradient-to-r from-green-800 via-emerald-700 to-teal-700 hover:from-green-700 hover:to-teal-600 border border-emerald-500/40 w-full px-6 py-5 rounded-2xl shadow-xl transition-all duration-200 text-left"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">🏛️</div>
          <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">🆕 Novo edital</span>
          <div className="font-black text-white text-lg mt-0.5">Câmara dos Deputados</div>
          <div className="text-emerald-200 text-sm">Analista Legislativo  -  Processo Legislativo e Gestão</div>
        </button>

        <button
          onClick={() => {
            setMateriasPorBloco(pfMaterias);
            setPesos(pfPesos);
            setEditalEscolhido("pf");
            setTela("beneficios");
          }}
          className="relative overflow-hidden group bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 border border-blue-500/30 w-full px-6 py-5 rounded-2xl shadow-lg transition-all duration-200 text-left"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">🚔</div>
          <div className="font-black text-white text-lg">Polícia Federal</div>
          <div className="text-blue-200 text-sm">Agente, Delegado, Escrivão e outros cargos</div>
        </button>

        <button
          onClick={() => {
            setMateriasPorBloco(inssMaterias);
            setPesos(inssPesos);
            setEditalEscolhido("inss");
            setTela("beneficios");
          }}
          className="relative overflow-hidden group bg-gradient-to-r from-yellow-900 to-amber-800 hover:from-yellow-800 hover:to-amber-700 border border-yellow-500/30 w-full px-6 py-5 rounded-2xl shadow-lg transition-all duration-200 text-left"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">🏥</div>
          <div className="font-black text-white text-lg">INSS</div>
          <div className="text-yellow-200 text-sm">Técnico do Seguro Social</div>
        </button>

        <button
          onClick={() => {
            setMateriasPorBloco(alegoMaterias);
            setPesos(alegoPesos);
            setEditalEscolhido("alego");
            setTela("modulos");
          }}
          className="relative overflow-hidden group bg-gradient-to-r from-emerald-900 to-green-800 hover:from-emerald-800 hover:to-green-700 border border-emerald-500/30 w-full px-6 py-5 rounded-2xl shadow-lg transition-all duration-200 text-left"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">🏢</div>
          <div className="font-black text-white text-lg">ALEGO</div>
          <div className="text-emerald-200 text-sm">Analista Administrativo</div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setMateriasPorBloco(sedesTecAdmMaterias);
              setPesos(sedesTecAdmPesos);
              setEditalEscolhido("sedes_tdas_tecadm");
              setTela("modulos");
            }}
            className="relative overflow-hidden group bg-gradient-to-r from-cyan-900 to-sky-800 hover:from-cyan-800 hover:to-sky-700 border border-cyan-500/30 w-full px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 text-left"
          >
            <div className="font-black text-white text-sm">SEDES-DF</div>
            <div className="text-cyan-200 text-xs mt-0.5">Técnico Administrativo (TDAS)</div>
          </button>

          <button
            onClick={() => {
              setMateriasPorBloco(sedesServicoSocialMaterias);
              setPesos(sedesServicoSocialPesos);
              setEditalEscolhido("sedes_edas_servsocial");
              setTela("modulos");
            }}
            className="relative overflow-hidden group bg-gradient-to-r from-purple-900 to-violet-800 hover:from-purple-800 hover:to-violet-700 border border-purple-500/30 w-full px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 text-left"
          >
            <div className="font-black text-white text-sm">SEDES-DF</div>
            <div className="text-purple-200 text-xs mt-0.5">Assistente Social (EDAS)</div>
          </button>

          <button
            onClick={() => {
              setMateriasPorBloco(sedesEdAsEduSocialMaterias);
              setPesos(sedesEdAsEduSocialPesos);
              setEditalEscolhido("sedes_edas_educsocial");
              setTela("modulos");
            }}
            className="relative overflow-hidden group bg-gradient-to-r from-teal-900 to-emerald-800 hover:from-teal-800 hover:to-emerald-700 border border-teal-500/30 w-full px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 text-left"
          >
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">🤝</div>
            <div className="font-black text-white text-sm">SEDES-DF</div>
            <div className="text-teal-200 text-xs mt-0.5">Educador Social (EDAS)</div>
          </button>

          <button
            onClick={() => {
              setMateriasPorBloco(bbMaterias);
              setPesos(bbPesos);
              setEditalEscolhido("bb_escriturario");
              setTela("modulos");
            }}
            className="relative overflow-hidden group bg-gradient-to-r from-yellow-800 to-amber-700 hover:from-yellow-700 hover:to-amber-600 border border-yellow-400/30 w-full px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 text-left"
          >
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">🏦</div>
            <div className="font-black text-white text-sm">Banco do Brasil</div>
            <div className="text-yellow-200 text-xs mt-0.5">Escriturário  -  Agente Comercial</div>
          </button>

          <button
            onClick={() => {
              setMateriasPorBloco(silvaJardimEnfMaterias);
              setPesos(silvaJardimEnfPesos);
              setEditalEscolhido("silva_jardim_enf");
              setTela("modulos");
            }}
            className="relative overflow-hidden group bg-gradient-to-r from-rose-900 to-pink-800 hover:from-rose-800 hover:to-pink-700 border border-rose-500/30 w-full px-5 py-4 rounded-2xl shadow-lg transition-all duration-200 text-left"
          >
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">🏥</div>
            <div className="font-black text-white text-sm">Pref. Silva Jardim - RJ</div>
            <div className="text-rose-200 text-xs mt-0.5">Técnico em Enfermagem</div>
          </button>
        </div>
      </div>
    </div>
  </div>
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
        onClick={() => setTela("modulos")}
        className="bg-green-500 hover:bg-green-600 px-10 py-5 rounded-2xl shadow-2xl font-extrabold text-white text-2xl mt-8 transition-all z-10"
      >
        Entrar no painel &rarr;
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
      questoesErradas: {},
      questoesErradasDetalhes: {}
    }
  }
);
setDesempenhoQuestoes({
  geral: { acertos: 0, erros: 0 },
  porMateria: {},
  questoesErradas: {},
  questoesErradasDetalhes: {}
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
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">

    {/* ── HEADER ── */}
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base font-black text-white shrink-0">EstudoLendário</span>
          <span className="hidden sm:block text-xs bg-white/8 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full truncate max-w-[220px]">{editalAtualNome}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setTela("minhaConta")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">👤 Conta</button>
          <button onClick={() => { setEditalEscolhido(null); setTela("concurso"); }} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors hidden sm:block">🔄 Trocar edital</button>
          <button onClick={() => signOut(auth)} className="text-xs bg-red-900/50 hover:bg-red-800/70 border border-red-700/30 px-3 py-1.5 rounded-full transition-colors">Sair</button>
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-4 py-5">

      {/* ── GRADE PRINCIPAL: esquerda (missão) + direita (ferramentas) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* ════ COLUNA ESQUERDA ════ */}
        <div className="space-y-4">

          {/* Missão de hoje */}
          <section className="bg-black/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Missão de hoje</p>
                <h2 className="text-xl font-black text-white mt-0.5">O que fazer agora</h2>
              </div>
              <button onClick={() => { setBlocoSelecionado(null); setModoFoco(false); setTela("cronograma"); }} className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-400/40 px-3 py-1.5 rounded-xl transition-all">
                + Montar cronograma
              </button>
            </div>

            {/* Item: Desafio diário */}
            <div className={`flex items-center gap-4 px-5 py-4 border-t border-white/6 ${desafioConcluido ? "opacity-50" : ""}`}>
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${desafioConcluido ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                {desafioConcluido && <span className="text-white text-xs font-black">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Desafio diário</p>
                <p className="text-xs text-gray-400 mt-0.5">{desafioConcluido ? "Concluído hoje 🎉" : "25 min de foco  -  sem distrações"}</p>
              </div>
              {!desafioConcluido && (
                <button onClick={() => setTela("desafio")} className="text-xs bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 px-3 py-1.5 rounded-xl transition-colors shrink-0">
                  🔥 Iniciar
                </button>
              )}
            </div>

            {/* Revisões vencidas */}
            {revisoesInteligentesPorData().length > 0 && (
              <div className="flex items-center gap-4 px-5 py-4 border-t border-white/6">
                <div className="w-7 h-7 rounded-full border-2 border-red-400/60 flex items-center justify-center shrink-0">
                  <span className="text-red-400 text-[10px] font-black">{revisoesInteligentesPorData().length}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Revisões vencidas</p>
                  <p className="text-xs text-red-400 mt-0.5 font-medium">⚠️ {revisoesInteligentesPorData().length} {revisoesInteligentesPorData().length === 1 ? "item vencido" : "itens vencidos"}  -  revisar agora</p>
                </div>
                <button onClick={() => setTela("revisao")} className="text-xs bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 px-3 py-1.5 rounded-xl transition-colors shrink-0">
                  Revisar
                </button>
              </div>
            )}

            {/* Blocos do cronograma de hoje  -  busca em todos os cronogramas salvos */}
            {(() => {
              const hoje = new Date().toISOString().slice(0, 10);
              const diaSemanaHoje = normalizarDiaSemana(new Date().toLocaleDateString("pt-BR", { weekday: "long" }));
              // Coleta blocos de cronogramas salvos (exceto edital-todo que é muito grande)
              const blocosHoje = (cronogramasSalvos || [])
                .filter(c => !c.id?.includes("edital-todo"))
                .flatMap(c =>
                  (c.blocos || []).filter(b =>
                    b.data === hoje ||
                    (b.dia && normalizarDiaSemana(b.dia) === diaSemanaHoje && !b.data)
                  )
                );
              if (blocosHojeBriefing.length === 0) return (
                <div className="flex items-center gap-4 px-5 py-4 border-t border-white/6">
                  <div className="w-7 h-7 rounded-full border-2 border-white/10 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Nenhum bloco de estudo hoje</p>
                    <button onClick={() => { setBlocoSelecionado(null); setModoFoco(false); setTela("cronograma"); }} className="text-xs text-cyan-400 hover:underline mt-0.5">Montar cronograma →</button>
                  </div>
                </div>
              );
              return blocosHoje.slice(0, 5).map((bloco, idx) => {
                const feito = assuntosEstudadosSet().has(`${bloco.nome}|||${bloco.topico}`);
                return (
                  <div key={idx} className={`flex items-center gap-4 px-5 py-4 border-t border-white/6 ${feito ? "opacity-45" : ""}`}>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${feito ? "bg-emerald-500 border-emerald-500" : "border-cyan-500/50"}`}>
                      {feito && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${feito ? "line-through text-gray-500" : "text-white"}`}>{nomeDisciplinaExibicao(bloco.nome)}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{bloco.topico} · {bloco.tempo} min</p>
                    </div>
                    {!feito && (
                      <button onClick={() => { iniciarEstudo(bloco); setTela("cronograma"); }} className="text-xs bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/25 text-cyan-300 px-3 py-1.5 rounded-xl transition-colors shrink-0">
                        ▶ Iniciar
                      </button>
                    )}
                  </div>
                );
              });
            })()}
          </section>

          {/* Stats em linha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Edital concluído", value: `${progressoGeralEdital()}%`, color: "text-emerald-400" },
              { label: "Questões feitas", value: totalQuestoesRespondidas(), color: "text-cyan-400" },
              { label: "Taxa de acerto", value: `${aproveitamentoGeral()}%`, color: "text-yellow-400" },
              { label: "Streak atual", value: `🔥 ${calcularStreak()}d`, color: "text-orange-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-black/30 border border-white/8 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold">{label}</p>
                <b className={`text-xl ${color} block mt-1`}>{value}</b>
              </div>
            ))}
          </div>

          {/* Mini calendário do mês */}
          {(() => {
            const hoje = new Date().toISOString().slice(0, 10);
            const mesAtual = hoje.slice(0, 7);
            const [ano, mes] = mesAtual.split("-").map(Number);
            const primeiroDia = new Date(ano, mes - 1, 1);
            const ultimoDia = new Date(ano, mes, 0).getDate();
            const inicioSem = primeiroDia.getDay();
            const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const blocosMes = (cronogramasSalvos || [])
              .filter(c => !c.id?.includes("edital-todo"))
              .flatMap(c =>
                (c.blocos || []).filter(b => b.data && b.data.startsWith(mesAtual))
              );
            const porDia = {};
            blocosMes.forEach(b => { if (!porDia[b.data]) porDia[b.data] = []; porDia[b.data].push(b); });
            const estudados = assuntosEstudadosSet();
            return (
              <section className="bg-black/30 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Calendário</p>
                    <h3 className="text-sm font-black text-white mt-0.5">{nomesMes[mes-1]} {ano}</h3>
                  </div>
                  <button onClick={() => { setBlocoSelecionado(null); setModoFoco(false); setAbaCronograma("mensal"); setTela("cronograma"); }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 px-3 py-1.5 rounded-xl transition-all">
                    Ver completo →
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {["D","S","T","Q","Q","S","S"].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-gray-600 uppercase py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: inicioSem }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: ultimoDia }).map((_, i) => {
                    const dia = i + 1;
                    const dataStr = `${mesAtual}-${String(dia).padStart(2,'0')}`;
                    const blocosDia = porDia[dataStr] || [];
                    const isHoje = dataStr === hoje;
                    const total = blocosDia.length;
                    const concluidos = blocosDia.filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length;
                    const tudo = total > 0 && concluidos === total;
                    const algum = total > 0 && concluidos > 0 && concluidos < total;
                    const nenhum = total > 0 && concluidos === 0;
                    return (
                      <div key={dia}
                        onClick={() => total > 0 && setDiaModalAberto({ data: dataStr, blocos: blocosDia })}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all
                          ${isHoje ? "ring-1 ring-cyan-400" : ""}
                          ${tudo ? "bg-emerald-500/20 text-emerald-400" : ""}
                          ${algum ? "bg-cyan-500/20 text-cyan-300" : ""}
                          ${nenhum ? "bg-orange-500/10 text-orange-400" : ""}
                          ${!total ? "text-gray-700" : ""}
                          ${total > 0 ? "cursor-pointer hover:brightness-125" : ""}`}>
                        {dia}
                        {total > 0 && <div className={`w-1 h-1 rounded-full mt-0.5 ${tudo ? "bg-emerald-400" : algum ? "bg-cyan-400" : "bg-orange-400"}`} />}
                      </div>
                    );
                  })}
                </div>
                {/* Modal de dia também funciona no dashboard */}
                {diaModalAberto && (() => {
                  const { data, blocos: blocosDoDia } = diaModalAberto;
                  const dataBR = parseDataLocal(data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                      onClick={e => { if (e.target === e.currentTarget) setDiaModalAberto(null); }}>
                      <div className="bg-gray-900 border border-white/12 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Cronograma do dia</p>
                            <h3 className="text-base font-black text-white capitalize">{dataBR}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{blocosDoDia.length} blocos</p>
                          </div>
                          <button onClick={() => setDiaModalAberto(null)} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                          {blocosDoDia.map((b, idx) => {
                            const feito = assuntosEstudadosSet().has(`${b.nome}|||${b.topico}`);
                            return (
                              <div key={idx} className={`rounded-xl border p-3 ${feito ? "bg-emerald-900/20 border-emerald-500/20 opacity-70" : "bg-black/40 border-white/8"}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-sm font-black ${feito ? "line-through text-gray-400" : "text-white"}`}>{nomeDisciplinaExibicao(b.nome)}</span>
                                      <span className="text-[10px] bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{b.tempo} min</span>
                                      {feito && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{b.topico}</p>
                                  </div>
                                  {!feito && (
                                    <button onClick={() => { iniciarEstudo(b); setDiaModalAberto(null); setTela("cronograma"); }}
                                      className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                                      ▶ Iniciar
                                    </button>
                                  )}
                                </div>
                                {!feito && (
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => { iniciarQuestoesDaMateria(b.nome, b.topico); setDiaModalAberto(null); }}
                                      className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/15 text-cyan-300 px-2 py-1 rounded-lg">📝 Questões</button>
                                    <button onClick={() => { abrirFlashcards(b.nome, b.topico); setDiaModalAberto(null); }}
                                      className="text-[10px] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/15 text-teal-300 px-2 py-1 rounded-lg">🧠 Flashcards</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>
            );
          })()}

          {/* Progresso do edital por bloco */}
          <section className="bg-black/30 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Progresso</p>
                <h3 className="text-base font-black text-white mt-0.5">Edital por blocos</h3>
              </div>
              <button onClick={() => setTela("editalCompleto")} className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 px-3 py-1.5 rounded-xl transition-all">Ver completo →</button>
            </div>
            <div className="space-y-3">
              {Object.entries(materiasPorBloco || {}).map(([bloco, materias]) => {
                const totalAssuntos = (materias || []).reduce((acc, m) => acc + (m.topicos?.length || 0), 0);
                const estudadosBloco = (materias || []).reduce((acc, m) => acc + (estudos?.[m.nome] || []).length, 0);
                const pct = totalAssuntos ? Math.round((estudadosBloco / totalAssuntos) * 100) : 0;
                const nomeBloco = (materias || []).map(m => m.nome).join(", ");
                const nomeCurto = nomeBloco.length > 52 ? nomeBloco.slice(0, 52) + "..." : nomeBloco;
                return (
                  <div key={bloco}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-300 truncate mr-2">{nomeCurto}</span>
                      <span className="text-gray-500 shrink-0">{estudadosBloco} de {totalAssuntos} · <b className="text-cyan-400">{pct}%</b></span>
                    </div>
                    <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Matéria forte / fraca */}
          {(() => {
            const { forte, fraca } = materiaMaisForteEFraca();
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-500/8 border border-emerald-400/15 rounded-2xl p-4">
                  <p className="text-[10px] uppercase text-emerald-400 font-bold mb-1">💪 Ponto forte</p>
                  <p className="text-sm font-bold text-white">{forte ? `${forte.materia}` : "Resolva questões para ver aqui"}</p>
                  {forte && <p className="text-xs text-emerald-400 mt-0.5">{forte.pct}% de acerto</p>}
                </div>
                <div className="bg-red-500/8 border border-red-400/15 rounded-2xl p-4">
                  <p className="text-[10px] uppercase text-red-400 font-bold mb-1">⚠️ Ponto de atenção</p>
                  <p className="text-sm font-bold text-white">{fraca ? `${fraca.materia}` : "Sem dados ainda"}</p>
                  {fraca && <p className="text-xs text-red-400 mt-0.5">{fraca.pct}% de acerto</p>}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ════ COLUNA DIREITA ════ */}
        <div className="space-y-4">

          {/* Ferramentas */}
          <section className="bg-black/40 border border-white/8 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Ferramentas</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "📝", label: "Questões", sub: "Resolver por matéria", fn: () => setTela("escolherMateria") },
                { icon: "🧠", label: "Flashcards", sub: "Memorização ativa", fn: () => abrirFlashcards() },
                { icon: "🎯", label: "Simulados", sub: "Treinar com provas", fn: () => setTela("simulados") },
                { icon: "📋", label: "Edital", sub: "Ver tópicos", fn: () => setTela("editalCompleto") },
                { icon: "📊", label: "Desempenho", sub: "Meu progresso", fn: () => setTela("desempenho") },
                { icon: "📅", label: "Cronograma", sub: "Planejar estudos", fn: () => { setBlocoSelecionado(null); setModoFoco(false); setTela("cronograma"); } },
                { icon: "🔁", label: "Revisão", sub: "D+1, D+7, D+30", fn: () => setTela("revisao") },
                { icon: "🔥", label: "Desafio", sub: "Meta do dia", fn: () => setTela("desafio") },
                { icon: "📓", label: "Resumos", sub: "Por matéria e assunto", fn: () => setTela("resumos") },
              ].map(({ icon, label, sub, fn }) => (
                <button key={label} onClick={fn}
                  className="bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-xl p-3 text-left transition-all active:scale-95">
                  <span className="text-lg block mb-1">{icon}</span>
                  <div className="text-xs font-bold text-white leading-tight">{label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{sub}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Fila de revisão compacta */}
          <section className="bg-black/40 border border-amber-400/12 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Revisões pendentes</p>
              <button onClick={() => setTela("revisao")} className="text-[10px] text-amber-400 hover:text-amber-300">Ver todas →</button>
            </div>
            {revisoesInteligentesPorData().length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-3">✅ Nada vencido hoje!</p>
            ) : (
              <div className="space-y-2">
                {revisoesInteligentesPorData().slice(0, 4).map((r, idx) => (
                  <button key={`${r.tipo}-${r.id || idx}`} onClick={() => iniciarRevisao(r)}
                    className="w-full text-left bg-white/4 hover:bg-amber-500/10 border border-white/6 hover:border-amber-500/25 rounded-xl p-2.5 transition-all">
                    <div className="text-[9px] text-amber-400 font-bold uppercase">{r.tipo === "questao" ? "Questão" : r.tipo === "flashcard" ? "Flashcard" : r.nome}</div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">{r.materia}</div>
                    <div className="text-[10px] text-gray-500 truncate">{r.assunto}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Tempo de estudo */}
          <section className="bg-black/30 border border-white/8 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Tempo estudado</p>
            <div className="space-y-2">
              {[
                { label: "Hoje", value: formatarTempo(tempoEstudadoHoje() * 60), bar: Math.min(100, (tempoEstudadoHoje() / 120) * 100) },
                { label: "Esta semana", value: formatarTempo(tempoEstudadoSemana() * 60), bar: Math.min(100, (tempoEstudadoSemana() / 600) * 100) },
              ].map(({ label, value, bar }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-bold">{value}</span>
                  </div>
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${bar}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-400">Flashcards</span>
                <span className="text-white font-bold">{totalFlashcardsRespondidos()} de {flashcardsDoEditalLista().length}</span>
              </div>
            </div>
          </section>

          {/* Trocar edital (mobile) */}
          <button onClick={() => { setEditalEscolhido(null); setTela("concurso"); }}
            className="w-full text-xs bg-white/4 hover:bg-white/8 border border-white/8 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors sm:hidden">
            🔄 Trocar edital
          </button>

        </div>
      </div>
    </main>
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

    flashcards: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white px-4 py-8">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-teal-300 font-black">Memorização ativa</p>
          <h2 className="text-3xl md:text-4xl font-black">Flashcards</h2>
          <p className="text-gray-300 mt-2">Escolha a matéria e, se quiser, filtre por assunto. O card tem pergunta objetiva e resposta curta.</p>
        </div>
        <button onClick={() => setTela("modulos")} className="bg-gray-800 hover:bg-gray-700 border border-white/10 px-4 py-3 rounded-xl font-bold">🔙 Voltar ao menu</button>
      </div>

      <EditalAtivoResumo compacto />

      {Object.keys(materiasFlashcardsDoEdital()).length === 0 ? (
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 text-center">
          <p className="text-4xl mb-3">🧠</p>
          <h3 className="text-2xl font-black">Ainda não temos flashcards para este edital.</h3>
          <p className="text-gray-300 mt-2">A estrutura já está pronta para receber os cards por matéria e assunto.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-300 font-bold">Matéria
              <select value={materiaFlashcard} onChange={(e) => { setMateriaFlashcard(e.target.value); setAssuntoFlashcard(""); setFlashcardIndex(0); setFlashcardVirado(false); }} className="mt-2 w-full rounded-xl bg-gray-950 border border-white/10 px-4 py-3 text-white">
                <option value="">Selecione uma matéria</option>
                {Object.keys(materiasFlashcardsDoEdital()).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-300 font-bold">Assunto
              <select value={assuntoFlashcard} disabled={!materiaFlashcard} onChange={(e) => { setAssuntoFlashcard(e.target.value); setFlashcardIndex(0); setFlashcardVirado(false); }} className="mt-2 w-full rounded-xl bg-gray-950 border border-white/10 px-4 py-3 text-white disabled:opacity-50">
                <option value="">Todos os assuntos da matéria</option>
                {[...new Set((materiasFlashcardsDoEdital()[materiaFlashcard] || []).map((c) => c.assunto))].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </div>

          {!materiaFlashcard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(materiasFlashcardsDoEdital()).map(([materia, cards]) => (
                <button key={materia} onClick={() => { setMateriaFlashcard(materia); setAssuntoFlashcard(""); setFlashcardIndex(0); setFlashcardVirado(false); }} className="text-left bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-teal-400/50 rounded-3xl p-5 transition-colors">
                  <p className="text-teal-300 text-sm font-black">{cards.length} flashcards</p>
                  <h3 className="text-xl font-black mt-1">{materia}</h3>
                  <p className="text-gray-400 text-sm mt-2">Clique para estudar esta matéria.</p>
                </button>
              ))}
            </div>
          ) : listaFlashcardsFiltrada().length === 0 ? (
            <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 text-center">
              <h3 className="text-2xl font-black">Ainda não temos flashcards para este assunto.</h3>
              <p className="text-gray-300 mt-2">{assuntoFlashcard || materiaFlashcard}</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {(() => {
                const lista = listaFlashcardsFiltrada();
                const card = lista[flashcardIndex % lista.length];
                const tipoClasse = card.tipo === "pegadinha" ? "text-red-200 bg-red-500/15 border-red-300/20" : card.tipo === "decoreba" ? "text-amber-200 bg-amber-500/15 border-amber-300/20" : "text-teal-200 bg-teal-500/15 border-teal-300/20";
                return (
                  <>
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <span>{flashcardIndex + 1} de {lista.length}</span>
                      <span className={`px-3 py-1 rounded-full border font-black ${tipoClasse}`}>{card.tipo || "conceito"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 justify-center">
                      <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-white/10">{materiaFlashcard}</span>
                      {card.assunto && <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-white/10">{card.assunto}</span>}
                    </div>
                    <button onClick={() => setFlashcardVirado((v) => !v)} className="w-full min-h-[280px] bg-gradient-to-br from-slate-900 via-slate-900 to-black border border-teal-400/30 rounded-[2rem] p-8 shadow-2xl text-left transition-colors hover:border-teal-300/70">
                      <p className="text-xs uppercase tracking-[0.35em] text-teal-300 font-black">{flashcardVirado ? "Verso" : "Frente"}</p>
                      <h3 className="text-2xl md:text-3xl font-black mt-5 leading-snug">{flashcardVirado ? card.verso : card.frente}</h3>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button onClick={() => setFlashcardVirado((v) => !v)} className="bg-teal-500 hover:bg-teal-400 text-black rounded-xl px-4 py-3 font-black">Virar card</button>
                      <button onClick={() => registrarFlashcard("errei")} className="bg-red-600 hover:bg-red-700 rounded-xl px-4 py-3 font-black">Errei</button>
                      <button onClick={() => registrarFlashcard("acertei")} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-3 font-black">Acertei</button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  </div>
),

    questoes: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white px-4 py-8">
    {questoesAtual.length > 0 && questaoIndex < questoesAtual.length ? (
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-gray-900/90 border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-cyan-950/70 to-blue-950/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-bold">Resolução de questões</p>
                <h2 className="text-2xl md:text-3xl font-black mt-1">Questão {questaoIndex + 1} de {questoesAtual.length}</h2>
                {filtroQuestoesAtual?.assunto && <p className="text-xs text-gray-400 mt-1">Assunto: {filtroQuestoesAtual.assunto}</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => setTela(telaAnteriorQuestoes || "escolherMateria")} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-full px-3 py-2 text-cyan-100 font-bold">🔙 Voltar</button>
                <span className="bg-black/35 border border-white/10 rounded-full px-3 py-2">{materiaEscolhida || questoesAtual[questaoIndex]?.materia || "Matéria"}</span>
                <span className="bg-black/35 border border-white/10 rounded-full px-3 py-2">{questoesAtual[questaoIndex]?.banca || "Banca"}</span>
                <span className="bg-black/35 border border-white/10 rounded-full px-3 py-2">{questoesAtual[questaoIndex]?.ano || "Ano"}</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-black/40 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-cyan-400" style={{ width: `${((questaoIndex + 1) / questoesAtual.length) * 100}%` }} />
            </div>
          </div>

          <div className="p-5 md:p-7 space-y-5">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 text-left">
              <p className="text-lg md:text-xl leading-relaxed text-white whitespace-pre-wrap">{questoesAtual[questaoIndex]?.enunciado}</p>
            </div>

            {questoesAtual[questaoIndex]?.texto && String(questoesAtual[questaoIndex]?.texto).trim() !== "" && (
              <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4">
                <button onClick={() => setMostrarTexto((prev) => !prev)} className="w-full flex justify-between items-center text-left font-bold text-cyan-200">
                  <span>📖 Texto de apoio</span><span>{mostrarTexto ? "Ocultar" : "Mostrar"}</span>
                </button>
                {mostrarTexto && <div className="mt-4 max-h-72 overflow-auto text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{questoesAtual[questaoIndex].texto}</div>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {questoesAtual[questaoIndex]?.tipo === "multipla_escolha" ? (
                questoesAtual[questaoIndex]?.alternativas?.map((alt, i) => {
                  const letras = ["A", "B", "C", "D", "E"];
                  const estado = respostaSelecionada === null ? "neutra" : i === respostaCorreta ? "certa" : i === respostaSelecionada ? "errada" : "apagada";
                  const classe = estado === "certa" ? "border-emerald-400 bg-emerald-900/50" : estado === "errada" ? "border-red-400 bg-red-900/50" : estado === "apagada" ? "border-gray-800 bg-gray-900/40 opacity-70" : "border-gray-700 bg-gray-800/80 hover:border-cyan-400 hover:bg-gray-800";
                  return (
                    <button key={i} onClick={() => responderQuestao(i)} disabled={respostaSelecionada !== null} className={`${classe} text-left p-4 rounded-2xl border shadow transition flex gap-4 items-start`}>
                      <span className="min-w-9 h-9 rounded-xl bg-black/35 border border-white/10 flex items-center justify-center font-black text-cyan-200">{letras[i]}</span>
                      <span className="leading-relaxed">{alt}</span>
                    </button>
                  );
                })
              ) : (
                ["Certo", "Errado"].map((opcao, i) => {
                  const correta = questoesAtual[questaoIndex].correta;
                  const valor = opcao === "Certo";
                  const estado = respostaSelecionada === null ? "neutra" : valor === correta ? "certa" : valor === respostaSelecionada ? "errada" : "apagada";
                  const classe = estado === "certa" ? "border-emerald-400 bg-emerald-900/50" : estado === "errada" ? "border-red-400 bg-red-900/50" : estado === "apagada" ? "border-gray-800 bg-gray-900/40 opacity-70" : "border-gray-700 bg-gray-800/80 hover:border-cyan-400";
                  return <button key={i} onClick={() => responderQuestao(valor)} disabled={respostaSelecionada !== null} className={`${classe} px-5 py-4 rounded-2xl border shadow font-bold text-lg`}>{opcao}</button>;
                })
              )}
            </div>

            {mostrarExplicacao && (
              <div className="bg-gradient-to-br from-blue-950/70 to-slate-900 border border-blue-500/30 p-5 rounded-2xl text-left space-y-3">
                <p className="text-blue-200 font-black mb-2">Comentário da questão</p>
                <p className="text-gray-200 leading-relaxed">{questoesAtual[questaoIndex]?.explicacao || "Sem explicação cadastrada para esta questão."}</p>
                {respostaSelecionada !== null && respostaSelecionada !== questoesAtual[questaoIndex]?.resposta && (
                  <div className="border-t border-white/8 pt-3">
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-2">📒 Registrar no caderno de erros</p>
                    <button onClick={() => salvarCadernoErro(filtroQuestoesAtual?.materia || materiaEscolhida, {
                      questao: questoesAtual[questaoIndex]?.enunciado?.slice(0,120) || "Questão sem enunciado",
                      erro: `Marquei: ${respostaSelecionada}`,
                      correto: `Resposta correta: ${questoesAtual[questaoIndex]?.resposta}`
                    })}
                      className="text-xs bg-red-500/15 hover:bg-red-500/25 border border-red-400/20 text-red-300 px-3 py-2 rounded-xl transition-colors font-bold">
                      📒 Salvar no caderno desta matéria
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
              <button disabled={questaoIndex === 0} onClick={() => { if (questaoIndex > 0) { setQuestaoIndex((prev) => prev - 1); setRespostaSelecionada(null); setRespostaCorreta(null); setMostrarExplicacao(false); setMostrarTexto(false); } }} className={`px-5 py-3 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 ${questaoIndex === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>⬅️ Anterior</button>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                {respostaSelecionada === null && (
                  <button onClick={pularQuestao} className="px-5 py-3 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 border border-white/10">Pular questão ⏭️</button>
                )}
                {mostrarExplicacao ? (
                  <button onClick={proximaQuestao} className="px-6 py-3 rounded-xl font-black bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg">{questaoIndex + 1 === questoesAtual.length ? "Finalizar" : "Próxima questão ➡️"}</button>
                ) : (
                  <button onClick={() => setTela(telaAnteriorQuestoes || "escolherMateria")} className="px-5 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700">Sair da resolução</button>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-gray-900/90 border border-white/10 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xl font-black text-cyan-300 mb-4">📊 Desempenho</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 text-center"><div className="text-3xl font-black">{acertos}</div><div className="text-xs text-gray-300">acertos nesta rodada</div></div>
              <div className="bg-red-900/40 border border-red-500/30 rounded-2xl p-4 text-center"><div className="text-3xl font-black">{erros}</div><div className="text-xs text-gray-300">erros nesta rodada</div></div>
            </div>
            <div className="mt-3 bg-slate-800/70 border border-white/10 rounded-2xl p-3 text-center text-sm text-gray-300">Puladas nesta rodada: <b className="text-cyan-200">{questoesPuladas}</b></div>
            <div className="mt-4 text-sm text-gray-300">
              Resolvidas: <b>{questaoIndex + (respostaSelecionada !== null ? 1 : 0)}</b> de {questoesAtual.length}
            </div>
          </div>
          <div className="bg-gray-900/90 border border-white/10 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xl font-black text-yellow-300 mb-3">🎯 Modo prova</h3>
            <p className="text-sm text-gray-300 leading-relaxed">Responda, leia o comentário e avance. As questões erradas ficam salvas para treino posterior.</p>
            <button onClick={() => setTela(telaAnteriorQuestoes || "escolherMateria")} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 rounded-xl py-3 font-bold">Voltar</button>
          </div>
        </aside>
      </div>
    ) : (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-slate-900/90 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-4xl mb-3">📝</p>
          <h2 className="text-2xl font-black text-white">Sem questões por enquanto</h2>
          <p className="text-gray-300 mt-3">{mensagemQuestoes || "Ainda não temos questões cadastradas para este filtro."}</p>
          {filtroQuestoesAtual?.materia && <p className="text-sm text-cyan-200 mt-3"><b>{filtroQuestoesAtual.materia}</b>{filtroQuestoesAtual.assunto ? `  -  ${filtroQuestoesAtual.assunto}` : ""}</p>}
          <button onClick={() => setTela(telaAnteriorQuestoes || "escolherMateria")} className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-3 rounded-xl font-black">🔙 Voltar</button>
        </div>
      </div>
    )}
  </div>
),

simulados: (
  !mostrarSelecao ? (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setTela("modulos")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">← Voltar</button>
            <span className="text-base font-black text-white">Simulados</span>
          </div>
          <span className="text-xs bg-white/8 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full hidden sm:block">{editalAtualNome}</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Treino</p>
          <h2 className="text-2xl font-black text-white mt-0.5">Escolha o modo</h2>
        </div>
        <div className="space-y-3">
          {editalEscolhido === "pf" && (
            <button onClick={() => { setSimuladoEscolhido({ id: "simulado_padrao_pf", nome: "Simulado PF padrão" }); setQuestoesSimuladoAtual(questoesSimulado); setQuestaoAtual(0); setRespostasSimulado([]); setDesempenhoSimulado({ acertos: 0, erros: 0 }); setResumoSimulado({ acertos: 0, erros: 0, naoRespondidas: 0, total: 0 }); setNotaFinalSimulado(0); setDesempenhoPorMateria({}); setTela("simuladoAndamento"); }}
              className="w-full bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-400/25 text-left px-5 py-4 rounded-2xl transition-all">
              <div className="text-base font-black text-yellow-300">🎯 Simulado PF padrão</div>
              <div className="text-xs text-gray-400 mt-0.5">Simulado completo da Polícia Federal</div>
            </button>
          )}
          <button onClick={() => setMostrarSelecao(true)}
            className="w-full bg-green-500/15 hover:bg-green-500/25 border border-green-400/25 text-left px-5 py-4 rounded-2xl transition-all">
            <div className="text-base font-black text-green-300">➕ Escolher simulado</div>
            <div className="text-xs text-gray-400 mt-0.5">Selecione entre os simulados disponíveis</div>
          </button>
          <button onClick={async () => { await buscarResultadosSimulados(); setTela("meusSimulados"); }}
            className="w-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/25 text-left px-5 py-4 rounded-2xl transition-all">
            <div className="text-base font-black text-blue-300">📁 Meus simulados</div>
            <div className="text-xs text-gray-400 mt-0.5">Simulados que você já fez</div>
          </button>
          <button onClick={async () => { await buscarResultadosSimulados(); setTela("resultadosSimulados"); }}
            className="w-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/25 text-left px-5 py-4 rounded-2xl transition-all">
            <div className="text-base font-black text-purple-300">📊 Ver resultados</div>
            <div className="text-xs text-gray-400 mt-0.5">Histórico de desempenho nos simulados</div>
          </button>
        </div>
      </main>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => setMostrarSelecao(false)} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full">← Voltar</button>
          <span className="text-base font-black">Escolher simulado</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        {editalEscolhido === "pf" && Array.isArray(simuladosPF) && simuladosPF.length > 0 ? (
          simuladosPF.map(simulado => (
            <button key={simulado.id} onClick={() => { setSimuladoEscolhido(simulado); setQuestoesSimuladoAtual(simulado.questoes || []); setQuestaoAtual(0); setRespostasSimulado([]); setDesempenhoSimulado({ acertos: 0, erros: 0 }); setResumoSimulado({ acertos: 0, erros: 0, naoRespondidas: 0, total: 0 }); setNotaFinalSimulado(0); setDesempenhoPorMateria({}); setTela("simuladoAndamento"); setMostrarSelecao(false); }}
              className="w-full text-left bg-white/5 hover:bg-yellow-500/10 border border-white/8 hover:border-yellow-400/30 px-5 py-4 rounded-2xl transition-all">
              <div className="text-base font-black text-white">{simulado.nome || "Simulado sem nome"}</div>
              <div className="text-xs text-gray-500 mt-0.5">{simulado.questoes?.length || 0} questões</div>
            </button>
          ))
        ) : (
          <div className="bg-black/30 border border-white/8 rounded-2xl p-8 text-center text-gray-400 text-sm">
            Nenhum simulado disponível para o edital ativo.
          </div>
        )}
      </main>
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
    <div className="w-full space-y-6">
      <EditalAtivoResumo compacto />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 font-black">Banco de questões</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-2">Escolha a matéria</h2>
          <p className="text-gray-300 mt-2 max-w-2xl">Escolha uma disciplina para treinar. Seu desempenho e seus erros ficam salvos separadamente por concurso.</p>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-left min-w-[220px]">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Concurso ativo</p>
          <p className="text-white font-black mt-1">{editalAtualNome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl mx-auto">
        {editalEscolhido && questoes[editalEscolhido] ? (
          Object.keys(questoes[editalEscolhido]).map((materia, idx) => {
            const totalQuestoes = questoes[editalEscolhido][materia]?.length || 0;
            const estat = desempenhoQuestoes?.porMateria?.[materia] || desempenhoQuestoes?.[materia] || { acertos: 0, erros: 0 };
            const totalRespondidas = (estat.acertos || 0) + (estat.erros || 0);
            const percentual = totalRespondidas ? Math.round(((estat.acertos || 0) / totalRespondidas) * 100) : 0;
            const questoesErradas = desempenhoQuestoes?.questoesErradas?.[materia]?.length || 0;
            const iniciarMateria = () => {
              const todas = questoes[editalEscolhido][materia] || [];
              const embaralhadas = [...todas].sort(() => 0.5 - Math.random());
              setQuestoesAtual(embaralhadas);
              setTelaAnteriorQuestoes("escolherMateria");
              setMensagemQuestoes("");
              setFiltroQuestoesAtual({ materia, assunto: "" });
              setMateriaEscolhida(materia);
              setQuestaoIndex(0);
              setRespostaSelecionada(null);
              setRespostaCorreta(null);
              setMostrarExplicacao(false);
              setAcertos(0);
              setErros(0);
              setQuestoesPuladas(0);
              setTela("questoes");
            };

            return (
              <div key={materia} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-950/95 p-6 shadow-2xl hover:border-cyan-400/50 transition-colors duration-150">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl transition-colors duration-150" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-400/15 border border-cyan-300/20 flex items-center justify-center text-2xl shadow-inner">
                    {idx % 5 === 0 ? "🧠" : idx % 5 === 1 ? "⚖️" : idx % 5 === 2 ? "💻" : idx % 5 === 3 ? "📚" : "🎯"}
                  </div>
                  <span className="text-xs font-bold text-cyan-200 bg-cyan-400/10 border border-cyan-300/20 px-3 py-1 rounded-full">{totalQuestoes} questões</span>
                </div>

                <div className="relative mt-5 text-left">
                  <h3 className="text-xl font-black text-white leading-snug">{materia}</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-white/8 border border-white/10 p-2">
                      <p className="text-[10px] text-gray-400 uppercase">Acertos</p>
                      <p className="text-green-300 font-black">{estat.acertos || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 border border-white/10 p-2">
                      <p className="text-[10px] text-gray-400 uppercase">Erros</p>
                      <p className="text-red-300 font-black">{estat.erros || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 border border-white/10 p-2">
                      <p className="text-[10px] text-gray-400 uppercase">Média</p>
                      <p className="text-cyan-200 font-black">{percentual}%</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${percentual}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{totalRespondidas ? `${totalRespondidas} respondidas nesta matéria` : "Você ainda não treinou esta matéria."}</p>
                  </div>
                </div>

                <div className="relative mt-5 grid grid-cols-1 gap-2">
                  <button onClick={iniciarMateria} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-lg transition-all">
                    Resolver questões
                  </button>
                  <button onClick={() => abrirMaterial(materia)} className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300/20 text-amber-200 font-bold px-4 py-3 rounded-2xl transition-all">
                    Ver material de apoio
                  </button>
                  <button
                    onClick={async () => {
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
                        const todas = questoes[editalEscolhido][materia] || [];
                        const filtradas = todas.filter((q) => idsErradas.includes(q.id));
                        if (filtradas.length === 0) {
                          alert("Você não errou nenhuma questão dessa matéria.");
                          return;
                        }
                        setQuestoesAtual([...filtradas].sort(() => 0.5 - Math.random()));
                        setTelaAnteriorQuestoes("escolherMateria");
                        setMensagemQuestoes("");
                        setFiltroQuestoesAtual({ materia, assunto: "Revisão de erros" });
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
                    className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-cyan-200 font-bold px-4 py-3 rounded-2xl transition-all"
                  >
                    Revisar erros {questoesErradas ? `(${questoesErradas})` : ""}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white/10 border border-white/10 rounded-3xl p-8 text-center text-gray-300">Nenhuma matéria de questões cadastrada para este concurso ainda.</div>
        )}
      </div>

      <button onClick={() => setTela("modulos")} className="text-sm text-gray-400 hover:text-cyan-300 hover:underline">🔙 Voltar</button>
    </div>
  </Container>
),

materialApoio: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white px-4 py-8">
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => setTela(materiaEscolhida ? "escolherMateria" : "modulos")} className="bg-gray-800 hover:bg-gray-700 border border-white/10 px-4 py-2 rounded-xl shadow">🔙 Voltar</button>
      <EditalAtivoResumo compacto />
      <section className="bg-gray-900/90 border border-amber-400/20 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-56 w-56 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300 font-black">Material de apoio</p>
          <h2 className="text-3xl md:text-4xl font-black mt-2">{materialSelecionado?.materia || "Matéria"}</h2>
          {materialSelecionado?.assunto && <p className="mt-2 text-gray-300"><b>Tópico:</b> {materialSelecionado.assunto}</p>}
          <div className="mt-6 bg-black/30 border border-white/10 rounded-2xl p-5">
            <h3 className="text-xl font-black text-cyan-200 mb-2">Resumo estratégico</h3>
            <p className="text-gray-200 leading-relaxed">{materialSelecionado?.conteudo?.resumo || "Material inicial ainda não cadastrado para esta matéria. Use o edital verticalizado e as questões como base enquanto novos resumos são adicionados."}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-emerald-300 mb-3">Pontos-chave</h3>
              <ul className="space-y-2 text-gray-200">
                {(materialSelecionado?.conteudo?.pontosChave || ["Leia o tópico no edital", "Resolva questões", "Anote erros", "Revise em D+1 e D+7"]).map((item, idx) => <li key={idx}>✅ {item}</li>)}
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-yellow-300 mb-3">Roteiro sugerido</h3>
              <ol className="space-y-2 text-gray-200 list-decimal list-inside">
                {(materialSelecionado?.conteudo?.roteiro || ["Estudar teoria curta", "Fazer bateria de questões", "Registrar erros", "Revisar no cronograma"]).map((item, idx) => <li key={idx}>{item}</li>)}
              </ol>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={() => iniciarQuestoesDaMateria(materialSelecionado?.materia, materialSelecionado?.assunto)} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg">Resolver questões dessa matéria</button>
            <button onClick={() => setTela("editalCompleto")} className="bg-white/10 hover:bg-white/15 border border-white/10 font-bold px-5 py-3 rounded-2xl">Abrir edital verticalizado</button>
          </div>
        </div>
      </section>
    </div>
  </div>
),

cronograma: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">

    {/* Header */}
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setTela("modulos")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">← Voltar</button>
          <span className="text-base font-black text-white">Cronograma</span>
          <span className="hidden sm:block text-xs bg-white/8 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{editalAtualNome}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 hidden sm:block">Edital: <b className="text-cyan-400">{progressoGeralEdital()}%</b></div>
          <div className="text-xs text-gray-500 hidden sm:block">Hoje: <b className="text-white">{formatarTempo(tempoEstudadoHoje() * 60)}</b></div>
          <div className="text-xs text-gray-500 hidden sm:block">🔥 <b className="text-orange-400">{calcularStreak()}d</b></div>
          {diasParaProva !== null && diasParaProva > 0 && (
            <div className="text-xs hidden sm:block bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 px-2 py-1 rounded-lg font-bold">📅 {diasParaProva}d</div>
          )}
          <button onClick={() => setTela("historicoEstudo")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">📚 Histórico</button>
        </div>
      </div>
    </header>

    {!blocoSelecionado ? (
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* Abas */}
        <div className="flex gap-2 flex-wrap">
          {[["mensal", "📆 Mensal"], ["semanal", "🗓️ Semanal"], ["diario", "📅 Diário"], ["editalTodo", "📋 Edital todo"], ["meus", "📚 Salvos"], ["revisoes", "🔁 Revisões"]].map(([id, label]) => (
            <button key={id} onClick={() => setAbaCronograma(id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${abaCronograma === id ? "bg-cyan-600 text-white" : "bg-black/30 border border-white/8 text-gray-400 hover:text-white hover:bg-white/8"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ABA MENSAL ── */}
        {abaCronograma === "mensal" && (() => {
          const hoje = new Date().toISOString().slice(0, 10);
          const [ano, mes] = dataMensal.split("-").map(Number);
          const primeiroDia = new Date(ano, mes - 1, 1);
          const ultimoDia = new Date(ano, mes, 0).getDate();
          const diaSemanaInicio = primeiroDia.getDay();
          const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
          const blocosMes = (cronogramasSalvos || [])
            .filter(c => !c.id?.includes("edital-todo"))
            .flatMap(c =>
              (c.blocos || []).filter(b => b.data && b.data.startsWith(dataMensal))
            );
          const blocosPorDia = {};
          blocosMes.forEach(b => {
            if (!blocosPorDia[b.data]) blocosPorDia[b.data] = [];
            blocosPorDia[b.data].push(b);
          });
          const estudados = assuntosEstudadosSet();
          return (
            <div className="space-y-4">
              {/* Header do calendário */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => { const d = new Date(ano, mes-2, 1); setDataMensal(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                  className="bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-colors">←</button>
                <h3 className="text-lg font-black text-white">{nomesMes[mes-1]} {ano}</h3>
                <button onClick={() => { const d = new Date(ano, mes, 1); setDataMensal(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                  className="bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-colors">→</button>
                <button onClick={gerarCronogramaMensal}
                  className="ml-auto bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors">
                  ✨ Gerar mês
                </button>
              </div>
              {mensagemCronograma && <p className="text-xs text-cyan-300 text-center">{mensagemCronograma}</p>}

              {/* Grade clicável */}
              <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-white/8">
                  {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-500 uppercase">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: diaSemanaInicio }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-white/4" />
                  ))}
                  {Array.from({ length: ultimoDia }).map((_, i) => {
                    const dia = i + 1;
                    const dataStr = `${dataMensal}-${String(dia).padStart(2,'0')}`;
                    const blocosDia = blocosPorDia[dataStr] || [];
                    const isHoje = dataStr === hoje;
                    const concluidos = blocosDia.filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length;
                    const total = blocosDia.length;
                    const temBlocos = total > 0;
                    return (
                      <div key={dia}
                        onClick={() => temBlocos && setDiaModalAberto({ data: dataStr, blocos: blocosDia })}
                        className={`min-h-[90px] border-b border-r border-white/4 p-1.5 transition-all
                          ${isHoje ? "bg-cyan-500/8" : ""}
                          ${temBlocos ? "cursor-pointer hover:bg-white/4 hover:border-cyan-500/30" : ""}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isHoje ? "text-cyan-400" : "text-gray-500"}`}>{dia}</span>
                          {temBlocos && (
                            <span className={`text-[9px] font-bold px-1 rounded ${concluidos === total ? "text-emerald-400" : "text-cyan-400"}`}>
                              {concluidos}/{total}
                            </span>
                          )}
                        </div>
                        {temBlocos && (
                          <div className="space-y-0.5">
                            {blocosDia.slice(0,3).map((b, idx) => {
                              const feito = estudados.has(`${b.nome}|||${b.topico}`);
                              return (
                                <div key={idx}
                                  className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${feito ? "bg-emerald-500/20 text-emerald-400 line-through" : "bg-cyan-500/20 text-cyan-300"}`}>
                                  {nomeDisciplinaExibicao(b.nome)}
                                </div>
                              );
                            })}
                            {total > 3 && <div className="text-[9px] text-gray-500 font-bold">+{total - 3} mais</div>}
                          </div>
                        )}
                        {!temBlocos && dataStr <= hoje && (
                          <div className="text-[9px] text-gray-700 italic mt-1">livre</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: blocosMes.length, label: "blocos no mês", color: "text-white" },
                  { val: blocosMes.filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length, label: "concluídos", color: "text-emerald-400" },
                  { val: blocosMes.filter(b => !estudados.has(`${b.nome}|||${b.topico}`)).length, label: "pendentes", color: "text-amber-400" },
                ].map(({ val, label, color }) => (
                  <div key={label} className="bg-black/30 border border-white/8 rounded-xl p-3 text-center">
                    <b className={color}>{val}</b>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Modal do dia */}
              {diaModalAberto && (() => {
                const { data, blocos: blocosDoDia } = diaModalAberto;
                const dataBR = parseDataLocal(data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) setDiaModalAberto(null); }}>
                    <div className="bg-gray-900 border border-white/12 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                      {/* Header do modal */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Cronograma do dia</p>
                          <h3 className="text-base font-black text-white capitalize">{dataBR}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{blocosDoDia.length} bloco{blocosDoDia.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button onClick={() => setDiaModalAberto(null)}
                          className="text-gray-400 hover:text-white text-xl leading-none px-2">✕</button>
                      </div>
                      {/* Lista de blocos */}
                      <div className="overflow-y-auto flex-1 p-4 space-y-2">
                        {blocosDoDia.map((b, idx) => {
                          const feito = assuntosEstudadosSet().has(`${b.nome}|||${b.topico}`);
                          return (
                            <div key={idx} className={`rounded-xl border p-3 transition-all ${feito ? "bg-emerald-900/20 border-emerald-500/20 opacity-70" : "bg-black/40 border-white/8"}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-black ${feito ? "line-through text-gray-400" : "text-white"}`}>
                                      {nomeDisciplinaExibicao(b.nome)}
                                    </span>
                                    <span className="text-[10px] bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{b.tempo} min</span>
                                    {feito && <span className="text-[10px] text-emerald-400 font-bold">✓ Feito</span>}
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{b.topico}</p>
                                </div>
                                {!feito && (
                                  <button onClick={() => { iniciarEstudo(b); setDiaModalAberto(null); setTela("cronograma"); }}
                                    className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                                    ▶ Iniciar
                                  </button>
                                )}
                              </div>
                              {!feito && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <button onClick={() => { iniciarQuestoesDaMateria(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/15 text-cyan-300 px-2 py-1 rounded-lg transition-colors">📝 Questões</button>
                                  <button onClick={() => { abrirFlashcards(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="text-[10px] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/15 text-teal-300 px-2 py-1 rounded-lg transition-colors">🧠 Flashcards</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ── ABA EDITAL TODO ── */}
        {abaCronograma === "editalTodo" && (() => {
          const pendentes = assuntosPendentesDoEdital() || [];
          const totalHorasSemana = Object.values(diasEditalTodo).reduce((a,b) => a + parseFloat(b || 0), 0);
          const minutosPorTopico = 30;
          const totalMin = pendentes.length * minutosPorTopico;
          const semanasNecessarias = totalHorasSemana > 0 ? Math.ceil(totalMin / 60 / totalHorasSemana) : "∞";
          // Blocos do edital completo em todos os cronogramas salvos (qualquer cronograma com "edital-todo" no id)
          const cronogramaEdital = (cronogramasSalvos || []).find(c => c.id?.includes("edital-todo"));
          const todosOsBlocos = cronogramaEdital?.blocos || [];
          // Para o calendário: mês selecionado
          const [anoET, mesET] = dataMensal.split("-").map(Number);
          const primeiroDiaET = new Date(anoET, mesET - 1, 1);
          const ultimoDiaET = new Date(anoET, mesET, 0).getDate();
          const diaSemanaInicioET = primeiroDiaET.getDay();
          const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
          const blocosMesET = todosOsBlocos.filter(b => b.data && b.data.startsWith(dataMensal));
          const blocosPorDiaET = {};
          blocosMesET.forEach(b => {
            if (!blocosPorDiaET[b.data]) blocosPorDiaET[b.data] = [];
            blocosPorDiaET[b.data].push(b);
          });
          const hoje = new Date().toISOString().slice(0, 10);
          const estudados = assuntosEstudadosSet();
          return (
            <div className="space-y-5">
              {/* Painel de configuração */}
              <div className="bg-black/40 border border-white/8 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1">Plano do edital completo</p>
                    <h3 className="text-lg font-black text-white">Distribuir todos os tópicos</h3>
                    <p className="text-xs text-gray-400 mt-1">{pendentes.length} tópicos pendentes · {Math.round(totalMin/60)}h total · {semanasNecessarias} semanas</p>
                  </div>
                  {cronogramaEdital && (
                    <span className="text-[10px] bg-purple-500/20 border border-purple-400/20 text-purple-300 px-3 py-1 rounded-full font-bold">
                      ✓ Gerado em {cronogramaEdital.criadoEm?.slice(0,10) || ""}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {DIAS_SEMANA.map(dia => (
                    <div key={dia} className="text-center">
                      <p className="text-[10px] text-gray-500 mb-1">{dia.slice(0,3)}</p>
                      <input type="number" min="0" step="0.5" value={diasEditalTodo[dia] ?? 0}
                        onChange={e => setDiasEditalTodo(prev => ({ ...prev, [dia]: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-black/40 border border-white/10 text-white text-sm text-center px-1 py-1.5 rounded-lg" />
                      <p className="text-[9px] text-gray-600 mt-0.5">h</p>
                    </div>
                  ))}
                </div>
                <button onClick={async () => {
                  const minutosPorTopico = 30;
                  const blocosTodos = [];
                  let diaAtual = parseDataLocal(new Date().toISOString().slice(0,10));
                  let pendentesRestantes = [...(assuntosPendentesDoEdital() || [])];
                  let seguranca = 0;
                  while (pendentesRestantes.length > 0 && seguranca < 5000) {
                    seguranca++;
                    const nomeDia = normalizarDiaSemana(diaAtual.toLocaleDateString("pt-BR", { weekday: "long" }));
                    const horas = parseFloat(diasEditalTodo[nomeDia] || 0);
                    const minutosDisponiveis = horas * 60;
                    diaAtual = new Date(diaAtual.getTime() + 86400000);
                    if (minutosDisponiveis < 30) continue;
                    let minUsados = 0;
                    while (minUsados + minutosPorTopico <= minutosDisponiveis && pendentesRestantes.length > 0) {
                      const p = pendentesRestantes.shift();
                      blocosTodos.push({ nome: p.nome, topico: p.topico, tempo: minutosPorTopico, dia: nomeDia, data: new Date(diaAtual.getTime() - 86400000).toISOString().slice(0,10) });
                      minUsados += minutosPorTopico;
                    }
                  }
                  const cronograma = {
                    id: `${editalEscolhido}-edital-todo-${Date.now()}`,
                    tipo: "semanal",
                    titulo: `Edital completo  -  ${editalAtualNome}`,
                    blocos: blocosTodos,
                    criadoEm: new Date().toISOString().slice(0,10),
                  };
                  await salvarCronograma(cronograma);
                  setMensagemCronograma(`✅ ${blocosTodos.length} blocos gerados para o edital completo!`);
                }} className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  {cronogramaEdital ? "🔄 Regerar plano do edital" : "🗓️ Gerar plano do edital completo"}
                </button>
                {mensagemCronograma && <p className="text-xs text-cyan-300 text-center">{mensagemCronograma}</p>}
              </div>

              {/* Calendário do edital completo */}
              {todosOsBlocos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Visualizar por mês</p>
                    <div className="flex items-center gap-2 ml-auto">
                      <button onClick={() => { const d = new Date(anoET, mesET-2, 1); setDataMensal(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                        className="bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-colors">←</button>
                      <span className="text-sm font-black text-white">{nomesMes[mesET-1]} {anoET}</span>
                      <button onClick={() => { const d = new Date(anoET, mesET, 1); setDataMensal(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                        className="bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-colors">→</button>
                    </div>
                  </div>
                  <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-white/8">
                      {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
                        <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-500 uppercase">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {Array.from({ length: diaSemanaInicioET }).map((_, i) => (
                        <div key={`e-${i}`} className="min-h-[90px] border-b border-r border-white/4" />
                      ))}
                      {Array.from({ length: ultimoDiaET }).map((_, i) => {
                        const dia = i + 1;
                        const dataStr = `${dataMensal}-${String(dia).padStart(2,'0')}`;
                        const blocosDia = blocosPorDiaET[dataStr] || [];
                        const isHoje = dataStr === hoje;
                        const concluidos = blocosDia.filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length;
                        const total = blocosDia.length;
                        return (
                          <div key={dia}
                            onClick={() => total > 0 && setDiaModalAberto({ data: dataStr, blocos: blocosDia })}
                            className={`min-h-[90px] border-b border-r border-white/4 p-1.5 transition-all
                              ${isHoje ? "bg-purple-500/8" : ""}
                              ${total > 0 ? "cursor-pointer hover:bg-white/4" : ""}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold ${isHoje ? "text-purple-400" : "text-gray-500"}`}>{dia}</span>
                              {total > 0 && (
                                <span className={`text-[9px] font-bold ${concluidos === total ? "text-emerald-400" : "text-purple-400"}`}>
                                  {concluidos}/{total}
                                </span>
                              )}
                            </div>
                            {blocosDia.slice(0,3).map((b, idx) => {
                              const feito = estudados.has(`${b.nome}|||${b.topico}`);
                              return (
                                <div key={idx} className={`text-[9px] truncate px-1 py-0.5 rounded font-medium mb-0.5 ${feito ? "bg-emerald-500/20 text-emerald-400 line-through" : "bg-purple-500/20 text-purple-300"}`}>
                                  {nomeDisciplinaExibicao(b.nome)}
                                </div>
                              );
                            })}
                            {total > 3 && <div className="text-[9px] text-gray-500 font-bold">+{total - 3} mais</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: todosOsBlocos.length, label: "total de blocos", color: "text-purple-400" },
                      { val: todosOsBlocos.filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length, label: "concluídos", color: "text-emerald-400" },
                      { val: todosOsBlocos.filter(b => !estudados.has(`${b.nome}|||${b.topico}`)).length, label: "pendentes", color: "text-amber-400" },
                    ].map(({ val, label, color }) => (
                      <div key={label} className="bg-black/30 border border-white/8 rounded-xl p-3 text-center">
                        <b className={color}>{val}</b>
                        <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal compartilhado do dia */}
              {diaModalAberto && (() => {
                const { data, blocos: blocosDoDia } = diaModalAberto;
                const dataBR = parseDataLocal(data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) setDiaModalAberto(null); }}>
                    <div className="bg-gray-900 border border-white/12 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Cronograma do dia</p>
                          <h3 className="text-base font-black text-white capitalize">{dataBR}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{blocosDoDia.length} blocos</p>
                        </div>
                        <button onClick={() => setDiaModalAberto(null)} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
                      </div>
                      <div className="overflow-y-auto flex-1 p-4 space-y-2">
                        {blocosDoDia.map((b, idx) => {
                          const feito = assuntosEstudadosSet().has(`${b.nome}|||${b.topico}`);
                          return (
                            <div key={idx} className={`rounded-xl border p-3 ${feito ? "bg-emerald-900/20 border-emerald-500/20 opacity-70" : "bg-black/40 border-white/8"}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-black ${feito ? "line-through text-gray-400" : "text-white"}`}>{nomeDisciplinaExibicao(b.nome)}</span>
                                    <span className="text-[10px] bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{b.tempo} min</span>
                                    {feito && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{b.topico}</p>
                                </div>
                                {!feito && (
                                  <button onClick={() => { iniciarEstudo(b); setDiaModalAberto(null); setTela("cronograma"); }}
                                    className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                                    ▶ Iniciar
                                  </button>
                                )}
                              </div>
                              {!feito && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => { iniciarQuestoesDaMateria(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/15 text-cyan-300 px-2 py-1 rounded-lg">📝 Questões</button>
                                  <button onClick={() => { abrirFlashcards(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="text-[10px] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/15 text-teal-300 px-2 py-1 rounded-lg">🧠 Flashcards</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ── ABA DIÁRIO ── */}
        {abaCronograma === "diario" && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
            {/* form */}
            <div className="bg-black/40 border border-white/8 rounded-2xl p-5 space-y-4 h-fit">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">Gerar cronograma</p>
                <h3 className="text-lg font-black text-white">Dia específico</h3>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Data do estudo</label>
                <input type="date" value={dataDiaria} onChange={(e) => setDataDiaria(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Horas disponíveis (ex: 2.5)</label>
                <input type="text" placeholder="Ex: 1.5" className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder-gray-600"
                  onChange={(e) => { const v = parseFloat(e.target.value.replace(",", ".")); setTempoEstudo(isNaN(v) ? 0 : v); }} />
              </div>
              <button onClick={gerarCronograma} className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-bold text-sm transition-colors">Gerar e salvar</button>
              {mensagemCronograma && abaCronograma === "diario" && <p className="text-xs text-cyan-300 text-center">{mensagemCronograma}</p>}
            </div>

            {/* blocos do dia */}
            <div>
              {blocos.filter(b => tipoCronograma === "diario").length === 0 ? (
                <div className="bg-black/20 border border-white/6 rounded-2xl p-10 text-center">
                  <p className="text-gray-500 text-sm">Nenhum bloco gerado ainda.<br />Configure o formulário ao lado e clique em "Gerar e salvar".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {blocos[0]?.dia || formatarDataBR(dataDiaria)}  -  {blocos.length} bloco{blocos.length !== 1 ? "s" : ""}
                  </h4>
                  {blocos.map((bloco, idx) => {
                    const concluido = assuntosEstudadosSet().has(`${bloco.nome}|||${bloco.topico}`);
                    return (
                      <div key={idx} className={`border rounded-2xl p-4 transition-all ${concluido ? "bg-emerald-900/20 border-emerald-500/25 opacity-60" : "bg-black/30 border-white/8 hover:border-cyan-500/30"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-black ${concluido ? "line-through text-gray-400" : "text-white"}`}>{nomeDisciplinaExibicao(bloco.nome)}</span>
                              <span className="text-[10px] bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{bloco.tempo} min</span>
                              {concluido && <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/20 text-emerald-400 px-2 py-0.5 rounded-full">✓ Concluído</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{bloco.topico}</p>
                          </div>
                          {!concluido && (
                            <button onClick={() => iniciarEstudo(bloco)} className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                              ▶ Iniciar
                            </button>
                          )}
                        </div>
                        {!concluido && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <button onClick={() => abrirMaterial(bloco.nome, bloco.topico)} className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/15 text-amber-300 px-3 py-1.5 rounded-lg transition-colors">📚 Material</button>
                            <button onClick={() => iniciarQuestoesDaMateria(bloco.nome, bloco.topico)} className="text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/15 text-cyan-300 px-3 py-1.5 rounded-lg transition-colors">📝 Questões</button>
                            <button onClick={() => abrirFlashcards(bloco.nome, bloco.topico)} className="text-[11px] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/15 text-teal-300 px-3 py-1.5 rounded-lg transition-colors">🧠 Flashcards</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA SEMANAL ── */}
        {abaCronograma === "semanal" && (
          <div className="space-y-5">
            {/* form de geração */}
            <div className="bg-black/40 border border-white/8 rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Cronograma semanal</p>
                  <p className="text-xs text-gray-400 mt-1">Semana: <b className="text-white">{rotuloSemana(dataSemana)}</b></p>
                  <input type="date" value={dataSemana} onChange={(e) => setDataSemana(e.target.value)} className="mt-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                </div>
                <button onClick={gerarCronogramaSemanal} className="bg-cyan-600 hover:bg-cyan-500 py-2.5 px-6 rounded-xl font-bold text-sm transition-colors whitespace-nowrap">Gerar semana</button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-4">
                {diasDaSemanaAPartirDaData(dataSemana).map((diaInfo) => (
                  <div key={diaInfo.data} className="text-center">
                    <p className="text-[11px] text-gray-400 font-bold mb-1">{diaInfo.label.slice(0,3)}</p>
                    <p className="text-[10px] text-gray-600 mb-1.5">{formatarDataBR(diaInfo.data).slice(0,5)}</p>
                    <input type="number" min="0" step="0.5"
                      value={horasSemana[diaInfo.key] ?? 0}
                      onChange={(e) => setHorasSemana((prev) => ({ ...prev, [diaInfo.key]: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-sm text-center" />
                    <p className="text-[9px] text-gray-600 mt-0.5">horas</p>
                  </div>
                ))}
              </div>
              {mensagemCronograma && abaCronograma === "semanal" && <p className="text-xs text-cyan-300 text-center mt-3">{mensagemCronograma}</p>}
            </div>

            {/* Calendário semanal */}
            {blocos.length > 0 && tipoCronograma === "semanal" && (() => {
              const diasUnicos = [...new Set(blocos.map(b => b.data).filter(Boolean))].sort();
              const hoje = new Date().toISOString().slice(0, 10);
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      {cronogramasSalvos.find(c => c.id === cronogramaAtivoId)?.titulo || "Cronograma semanal"}
                    </h3>
                    <button onClick={copiarCronogramaAtivo} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl transition-colors">📤 Copiar</button>
                  </div>

                  {/* Vista mobile: lista por dia */}
                  <div className="block lg:hidden space-y-4">
                    {diasUnicos.map(data => {
                      const blocosDia = blocos.filter(b => b.data === data);
                      const isHoje = data === hoje;
                      return (
                        <div key={data} className={`border rounded-2xl overflow-hidden ${isHoje ? "border-cyan-500/40" : "border-white/8"}`}>
                          <div className={`px-4 py-2.5 flex items-center justify-between ${isHoje ? "bg-cyan-900/30" : "bg-black/40"}`}>
                            <div>
                              <span className="text-xs font-black text-white">{blocosDia[0]?.dia || data}</span>
                              <span className="text-[10px] text-gray-500 ml-2">{formatarDataBR(data)}</span>
                            </div>
                            {isHoje && <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full font-bold">HOJE</span>}
                          </div>
                          <div className="divide-y divide-white/5">
                            {blocosDia.map((bloco, idx) => {
                              const concluido = assuntosEstudadosSet().has(`${bloco.nome}|||${bloco.topico}`);
                              return (
                                <div key={idx} className={`px-4 py-3 ${concluido ? "opacity-50" : ""}`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${concluido ? "line-through text-gray-500" : "text-white"}`}>{nomeDisciplinaExibicao(bloco.nome)}</p>
                                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{bloco.topico} · {bloco.tempo}min</p>
                                    </div>
                                    {!concluido
                                      ? <button onClick={() => iniciarEstudo(bloco)} className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">▶ Iniciar</button>
                                      : <span className="text-[10px] text-emerald-400">✓ Feito</span>
                                    }
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vista desktop: colunas por dia */}
                  <div className="hidden lg:grid gap-3" style={{ gridTemplateColumns: `repeat(${diasUnicos.length}, minmax(0, 1fr))` }}>
                    {diasUnicos.map(data => {
                      const blocosDia = blocos.filter(b => b.data === data);
                      const isHoje = data === hoje;
                      return (
                        <div key={data} className={`border rounded-2xl overflow-hidden flex flex-col ${isHoje ? "border-cyan-500/40" : "border-white/8"}`}>
                          {/* cabeçalho do dia */}
                          <div className={`px-3 py-2.5 text-center ${isHoje ? "bg-cyan-900/40" : "bg-black/40"}`}>
                            <p className="text-[11px] font-black text-white">{blocosDia[0]?.dia?.slice(0,3) || data.slice(8)}</p>
                            <p className="text-[10px] text-gray-500">{formatarDataBR(data).slice(0,5)}</p>
                            {isHoje && <span className="text-[9px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded-full font-bold mt-0.5 inline-block">HOJE</span>}
                          </div>
                          {/* blocos */}
                          <div className="flex-1 p-2 space-y-2">
                            {blocosDia.map((bloco, idx) => {
                              const concluido = assuntosEstudadosSet().has(`${bloco.nome}|||${bloco.topico}`);
                              return (
                                <div key={idx}
                                  onClick={() => !concluido && iniciarEstudo(bloco)}
                                  className={`rounded-xl p-2.5 cursor-pointer transition-all ${concluido ? "bg-emerald-900/20 border border-emerald-500/20 opacity-60" : "bg-white/5 hover:bg-cyan-500/10 border border-white/6 hover:border-cyan-500/30"}`}>
                                  <p className={`text-[11px] font-bold leading-tight ${concluido ? "line-through text-gray-500" : "text-white"}`}>{nomeDisciplinaExibicao(bloco.nome)}</p>
                                  <p className="text-[10px] text-gray-500 mt-1 leading-tight line-clamp-2">{bloco.topico}</p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-[9px] text-gray-600">{bloco.tempo}min</span>
                                    {concluido ? <span className="text-[9px] text-emerald-400">✓</span> : <span className="text-[9px] text-cyan-400">▶</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── ABA MEUS CRONOGRAMAS ── */}
        {abaCronograma === "meus" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cronogramas salvos</h3>
              <span className="text-xs text-gray-600">{cronogramasSalvos.length} no total</span>
            </div>
            {cronogramasSalvos.length === 0
              ? <div className="bg-black/20 border border-white/6 rounded-2xl p-8 text-center text-gray-500 text-sm">Nenhum cronograma salvo ainda. Gere um na aba Diário, Semanal ou Mensal.</div>
              : cronogramasSalvos.map((c) => {
                  const ativo = cronogramaAtivoId === c.id;
                  const totalBlocos = c.blocos?.length || 0;
                  const estudados = assuntosEstudadosSet();
                  const concluidos = (c.blocos||[]).filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length;
                  const pctConc = totalBlocos > 0 ? Math.round((concluidos/totalBlocos)*100) : 0;
                  const isEditalTodo = c.id?.includes("edital-todo");
                  const isMensal = c.id?.includes("mensal");
                  const tipo = isEditalTodo ? "📋 Edital completo" : isMensal ? "📆 Mensal" : c.tipo === "diario" ? "📅 Diário" : "🗓️ Semanal";
                  // Primeiras matérias únicas
                  const materias = [...new Set((c.blocos||[]).slice(0,10).map(b => nomeDisciplinaExibicao(b.nome)).filter(Boolean))].slice(0,4);
                  return (
                    <div key={c.id} className={`rounded-2xl border transition-all ${ativo ? "bg-cyan-900/20 border-cyan-500/40" : "bg-black/30 border-white/8"}`}>
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-gray-500 font-bold">{tipo}</span>
                              {ativo && <span className="text-[9px] bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">ATIVO</span>}
                            </div>
                            <h4 className="text-sm font-black text-white mt-1 truncate">{c.titulo}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {totalBlocos} blocos · criado em {c.criadoEm ? formatarDataBR(c.criadoEm.slice(0,10)) : "—"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-black ${pctConc===100?"text-emerald-400":pctConc>0?"text-cyan-400":"text-gray-500"}`}>{pctConc}%</p>
                            <p className="text-[10px] text-gray-500">{concluidos}/{totalBlocos}</p>
                          </div>
                        </div>
                        {/* Barra de progresso */}
                        <div className="mt-3 h-1 bg-white/6 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pctConc===100?"bg-emerald-500":"bg-cyan-500"}`} style={{width:`${pctConc}%`}} />
                        </div>
                        {/* Matérias preview */}
                        {materias.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {materias.map(m => <span key={m} className="text-[9px] bg-white/6 border border-white/8 text-gray-400 px-2 py-0.5 rounded-full truncate max-w-[140px]">{m}</span>)}
                            {[...new Set((c.blocos||[]).map(b => b.nome).filter(Boolean))].length > 4 && (
                              <span className="text-[9px] text-gray-600">+{[...new Set((c.blocos||[]).map(b => b.nome).filter(Boolean))].length - 4} mais</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Ações */}
                      <div className="border-t border-white/6 px-5 py-3 flex gap-2">
                        {isEditalTodo || isMensal ? (
                          <button onClick={() => { definirCronogramaAtivo(c); setAbaCronograma(isEditalTodo ? "editalTodo" : "mensal"); }}
                            className="flex-1 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/25 text-cyan-300 font-bold py-2 rounded-xl transition-colors">
                            📅 Ver no calendário
                          </button>
                        ) : (
                          <button onClick={() => { definirCronogramaAtivo(c); setAbaCronograma(c.tipo === "diario" ? "diario" : "semanal"); }}
                            className="flex-1 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/25 text-cyan-300 font-bold py-2 rounded-xl transition-colors">
                            ▶ Carregar cronograma
                          </button>
                        )}
                        <button onClick={async () => {
                          if (!window.confirm(`Excluir "${c.titulo}"?`)) return;
                          const lista = cronogramasSalvos.filter(x => x.id !== c.id);
                          await salvarCronogramasUsuario(lista);
                          if (cronogramaAtivoId === c.id) { setCronogramaAtivoId(null); setBlocos([]); }
                        }} className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-3 py-2 rounded-xl transition-colors">
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── ABA REVISÕES ── */}
        {abaCronograma === "revisoes" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Revisões inteligentes de hoje</h3>
            {revisoesInteligentesPorData().length === 0
              ? <div className="bg-black/20 border border-white/6 rounded-2xl p-8 text-center text-gray-500 text-sm">✅ Nenhuma revisão vencendo hoje. Boa!</div>
              : revisoesInteligentesPorData().map((r, idx) => (
                <button key={`${r.tipo}-${r.id || idx}`} onClick={() => iniciarRevisao(r)}
                  className="w-full text-left bg-black/30 hover:bg-amber-500/10 border border-white/8 hover:border-amber-500/30 rounded-2xl p-4 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-amber-400 font-black uppercase">{r.tipo === "questao" ? "Questão errada" : r.tipo === "flashcard" ? "Flashcard" : r.nome}</span>
                      <p className="text-sm font-bold text-white mt-0.5">{r.materia}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.assunto}</p>
                    </div>
                    <span className="text-xs bg-amber-500/20 border border-amber-400/20 text-amber-300 px-3 py-1.5 rounded-xl font-bold shrink-0">Revisar →</span>
                  </div>
                </button>
              ))
            }
          </div>
        )}

      </main>
    ) : (
        <div className={`flex flex-col items-center text-center gap-6 ${modoFoco ? "max-w-2xl mx-auto" : ""}`}>
          <div className="flex justify-between w-full gap-3">
            <button onClick={() => setModoFoco((v) => !v)} className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-xl">{modoFoco ? "Sair do foco" : "🎯 Modo foco"}</button>
            <button onClick={() => { setBlocoSelecionado(null); setModoFoco(false); }} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl">Voltar ao cronograma</button>
          </div>
          <h2 className="text-3xl font-bold">{blocoSelecionado.nome}</h2>
          <p className="text-gray-300">{blocoSelecionado.topico}</p>
          <div className="text-7xl font-black text-cyan-300">{tempoFormatado()}</div>
          <div className="w-full bg-gray-800 rounded-full h-4"><div className="bg-cyan-500 h-4 rounded-full" style={{ width: `${Math.min(100, Math.max(0, progresso))}%` }} /></div>
          {!modoFoco && <p className="text-sm text-gray-400">Clique em concluir para marcar no edital e tirar dos próximos cronogramas. Ele continua aparecendo aqui como histórico.</p>}
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => setPausado((p) => !p)} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl">{pausado ? "▶️ Retomar" : "⏸ Pausar"}</button>
            <button onClick={() => { setTempoRestante(blocoSelecionado.tempo * 60); }} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl">🔁 Resetar</button>
            <button onClick={() => iniciarQuestoesDaMateria(blocoSelecionado.nome, blocoSelecionado.topico)} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl">📝 Fazer questões</button>
            <button onClick={() => abrirFlashcards(blocoSelecionado.nome, blocoSelecionado.topico)} className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl">🧠 Flashcards</button>
            <button onClick={() => { setTelaEscura(true); setMostrarConfirmar("mostrar-buttons"); }} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl">✅ Concluir</button>
          </div>
          {telaEscura && mostrarConfirmar === "mostrar-buttons" && (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-xl text-red-300 font-bold">Você finalizou mesmo ou só está se enganando?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={async () => { if (usuario && blocoSelecionado) { await registrarEstudo(usuario.uid, blocoSelecionado.nome, blocoSelecionado.topico, blocoSelecionado.tempo); setAtualizarHistorico(v => v + 1); } setBlocoSelecionado(null); setTelaEscura(false); setMostrarConfirmar(false); setModoFoco(false); }} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl">✔️ Confirmar</button>
                <button onClick={() => { setTelaEscura(false); setMostrarConfirmar(false); }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl">⏳ Continuar estudando</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
 ),

editalCompleto: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setTela("modulos")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full">← Voltar</button>
          <span className="text-base font-black">Edital completo</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>✅ <b className="text-white">{assuntosEstudadosSet().size}</b> estudados</span>
          <span>📋 <b className="text-white">{assuntosPendentesDoEdital().length}</b> pendentes</span>
          <span className="text-cyan-400 font-bold">{progressoGeralEdital()}%</span>
        </div>
      </div>
    </header>

    <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      {/* Barra de progresso geral */}
      <div className="bg-black/30 border border-white/8 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400">{editalAtualNome}</span>
          <span className="text-cyan-400 font-bold">{progressoGeralEdital()}% concluído</span>
        </div>
        <div className="h-2 bg-white/6 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${progressoGeralEdital()}%` }} />
        </div>
      </div>

      {Object.entries(materiasPorBloco).map(([bloco, materias]) => (
        <div key={bloco} className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-1">{bloco}</p>
          {materias.map((materia) => {
            const pct = calcularProgressoDisciplina(materia.nome);
            const estatM = desempenhoQuestoes?.porMateria?.[materia.nome] || { acertos: 0, erros: 0 };
            const totalRespondM = (estatM.acertos || 0) + (estatM.erros || 0);
            const questManual = questoesManuais[materia.nome] || { total: 0, certas: 0, erradas: 0 };
            const isAberta = materiaAberta === materia.nome;
            return (
              <div key={materia.nome} className="bg-black/40 border border-white/8 rounded-2xl overflow-hidden">
                {/* Cabeçalho da matéria */}
                <button onClick={() => { setMateriaAberta(isAberta ? null : materia.nome); setAbaMateria("topicos"); }}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/4 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-sm font-black text-white">{materia.nome}</h4>
                      <span className="text-[10px] bg-white/8 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{pct}% concluído</span>
                      {totalRespondM > 0 && <span className="text-[10px] bg-cyan-500/10 border border-cyan-400/15 text-cyan-400 px-2 py-0.5 rounded-full">{Math.round((estatM.acertos/totalRespondM)*100)}% acerto</span>}
                    </div>
                    <div className="mt-2 h-1 bg-white/6 rounded-full overflow-hidden w-full">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm shrink-0">{isAberta ? "▲" : "▼"}</span>
                </button>

                {/* Conteúdo expandido */}
                {isAberta && (
                  <div className="border-t border-white/6">
                    {/* Abas internas */}
                    <div className="flex gap-1 px-4 pt-3 pb-0 flex-wrap">
                      {[["topicos","📋 Tópicos"], ["resumo","📝 Resumo"], ["caderno","📒 Caderno"], ["questoes","🔢 Questões"]].map(([id, label]) => (
                        <button key={id} onClick={() => setAbaMateria(id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${abaMateria === id ? "bg-cyan-600 text-white" : "bg-white/6 text-gray-400 hover:text-white"}`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* ABA TÓPICOS */}
                    {abaMateria === "topicos" && (
                      <div className="p-4 space-y-2">
                        {materia.topicos.map((topico) => {
                          const estudado = assuntosEstudadosSet().has(`${materia.nome}|||${topico}`);
                          return (
                            <button key={topico} onClick={() => alternarAssuntoEdital(materia.nome, topico, estudado)}
                              className={`w-full text-left flex items-start gap-3 rounded-xl p-3 border transition-all ${estudado ? "bg-emerald-900/20 border-emerald-500/20" : "bg-white/4 border-white/6 hover:border-cyan-400/30"}`}>
                              <span className="text-base shrink-0 mt-0.5">{estudado ? "✅" : "⬜"}</span>
                              <span className={`text-sm ${estudado ? "line-through text-gray-500" : "text-gray-200"}`}>{topico}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ABA RESUMO */}
                    {abaMateria === "resumo" && (() => {
                      const r = resumosMateria[materia.nome] || {};
                      return (
                        <div className="p-4 space-y-4">
                          <p className="text-xs text-gray-500">Preencha seu resumo desta matéria. Fica salvo na nuvem.</p>
                          {[
                            { key: "conceito", label: "📖 Conceito central", placeholder: "O que é essa matéria? Escreva com suas palavras..." },
                            { key: "pontosChave", label: "🎯 Pontos-chave para a prova", placeholder: "O que mais cai? Palavras-chave, artigos importantes..." },
                            { key: "dicasProva", label: "💡 Dicas e macetes", placeholder: "Pegadinhas, diferenças importantes, erros comuns..." },
                            { key: "legislacao", label: "⚖️ Legislação relevante", placeholder: "Leis, decretos, artigos que você precisa dominar..." },
                          ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
                              <textarea rows={3} value={r[key] || ""} placeholder={placeholder}
                                onChange={(e) => salvarResumoMateria(materia.nome, { ...r, [key]: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:border-cyan-500/40 focus:outline-none transition-colors" />
                            </div>
                          ))}
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">📓 Anotações livres</label>
                            <textarea rows={5} value={r.livre || ""} placeholder="Espaço livre para qualquer anotação sua..."
                              onChange={(e) => salvarResumoMateria(materia.nome, { ...r, livre: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:border-cyan-500/40 focus:outline-none transition-colors" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* ABA CADERNO DE ERROS */}
                    {abaMateria === "caderno" && (() => {
                      const erros = cadernoErros[materia.nome] || [];
                      return (
                        <div className="p-4 space-y-4">
                          <div className="bg-black/30 border border-red-400/15 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-bold text-red-400 uppercase">+ Registrar erro</p>
                            <textarea rows={2} placeholder="O que a questão perguntava?" value={novoErroForm.questao}
                              onChange={e => setNovoErroForm(v => ({...v, questao: e.target.value}))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:border-red-400/30 focus:outline-none" />
                            <textarea rows={2} placeholder="Por que você errou?" value={novoErroForm.erro}
                              onChange={e => setNovoErroForm(v => ({...v, erro: e.target.value}))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:border-red-400/30 focus:outline-none" />
                            <textarea rows={2} placeholder="A resposta correta era..." value={novoErroForm.correto}
                              onChange={e => setNovoErroForm(v => ({...v, correto: e.target.value}))}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:border-emerald-400/30 focus:outline-none" />
                            <button onClick={async () => { if (!novoErroForm.questao && !novoErroForm.erro) return; await salvarCadernoErro(materia.nome, novoErroForm); setNovoErroForm({ questao: "", erro: "", correto: "" }); }}
                              className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                              Salvar erro
                            </button>
                          </div>
                          {erros.length === 0
                            ? <p className="text-xs text-gray-500 text-center py-4">Nenhum erro registrado ainda nesta matéria.</p>
                            : <div className="space-y-2">
                                {[...erros].reverse().map((e, idx) => (
                                  <div key={idx} className="bg-black/30 border border-white/6 rounded-xl p-3">
                                    <div className="text-[10px] text-gray-500 mb-1">{e.data}</div>
                                    {e.questao && <p className="text-xs text-gray-300"><span className="text-gray-500">Questão:</span> {e.questao}</p>}
                                    {e.erro && <p className="text-xs text-red-400 mt-1"><span className="text-gray-500">Erro:</span> {e.erro}</p>}
                                    {e.correto && <p className="text-xs text-emerald-400 mt-1"><span className="text-gray-500">Correto:</span> {e.correto}</p>}
                                  </div>
                                ))}
                              </div>
                          }
                        </div>
                      );
                    })()}

                    {/* ABA QUESTÕES MANUAIS */}
                    {abaMateria === "questoes" && (() => {
                      const qm = questoesManuais[materia.nome] || { total: 0, certas: 0, erradas: 0 };
                      const pctAcerto = qm.total > 0 ? Math.round((qm.certas / qm.total) * 100) : 0;
                      return (
                        <div className="p-4 space-y-4">
                          <p className="text-xs text-gray-500">Registre questões que você fez fora do app (livros, PDFs, outras plataformas).</p>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { key: "total", label: "Total feitas", color: "text-white" },
                              { key: "certas", label: "Certas ✅", color: "text-emerald-400" },
                              { key: "erradas", label: "Erradas ❌", color: "text-red-400" },
                            ].map(({ key, label, color }) => (
                              <div key={key} className="bg-black/30 border border-white/8 rounded-xl p-3 text-center">
                                <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                                <input type="number" min="0" value={qm[key] || 0}
                                  onChange={e => salvarQuestoesManuais(materia.nome, { ...qm, [key]: parseInt(e.target.value) || 0 })}
                                  className={`w-full bg-transparent text-center text-xl font-black ${color} focus:outline-none`} />
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-400">Taxa de acerto manual</span>
                              <span className={pctAcerto >= 70 ? "text-emerald-400 font-bold" : pctAcerto >= 50 ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>{pctAcerto}%</span>
                            </div>
                            <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${pctAcerto >= 70 ? "bg-emerald-500" : pctAcerto >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pctAcerto}%` }} />
                            </div>
                          </div>
                          {/* Questões automáticas do app */}
                          {totalRespondM > 0 && (
                            <div className="bg-cyan-500/8 border border-cyan-400/12 rounded-xl p-3">
                              <p className="text-[10px] text-cyan-400 font-bold uppercase mb-2">Questões do app</p>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div><p className="text-[10px] text-gray-500">Respondidas</p><b className="text-white">{totalRespondM}</b></div>
                                <div><p className="text-[10px] text-gray-500">Certas</p><b className="text-emerald-400">{estatM.acertos || 0}</b></div>
                                <div><p className="text-[10px] text-gray-500">Erros</p><b className="text-red-400">{estatM.erros || 0}</b></div>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => { iniciarQuestoesDaMateria(materia.nome); }}
                              className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/20 text-cyan-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                              📝 Resolver questões do app
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </main>
  </div>
),


historicoEstudo: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setTela("cronograma")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full">← Cronograma</button>
          <span className="text-base font-black">Histórico de estudos</span>
        </div>
        <button onClick={zerarHistoricoEstudo} className="text-xs bg-red-900/40 hover:bg-red-800/60 border border-red-700/30 text-red-300 px-3 py-1.5 rounded-full transition-colors">🗑 Limpar</button>
      </div>
    </header>
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Assuntos estudados", value: assuntosEstudadosArray().length, color: "text-cyan-400" },
          { label: "Matérias com progresso", value: Object.keys(estudos || {}).length, color: "text-emerald-400" },
          { label: "Cronogramas salvos", value: cronogramasSalvos.length, color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-black/40 border border-white/8 rounded-2xl p-4 text-center">
            <b className={`text-2xl ${color}`}>{value}</b>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">{label}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="bg-black/30 rounded-2xl p-8 text-center text-gray-400">Carregando...</div>
      ) : assuntosEstudadosArray().length === 0 ? (
        <div className="bg-black/30 rounded-2xl p-8 text-center text-gray-400">Nenhuma matéria estudada ainda.</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(estudos || {}).map(([materia, lista]) => (
            <div key={materia} className="bg-black/40 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-white text-sm">{materia}</h3>
                <span className="text-[10px] bg-white/8 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{Array.isArray(lista) ? lista.length : 0} assuntos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Array.isArray(lista) ? lista : []).map((assunto, idx) => (
                  <div key={idx} className="bg-emerald-900/15 border border-emerald-500/15 rounded-xl px-3 py-2.5">
                    <div className="text-xs font-bold text-white">✅ {assunto}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      {dataConclusaoAssunto(materia, assunto) ? formatarDataBR(dataConclusaoAssunto(materia, assunto)) : "data não registrada"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  </div>
),

revisao: (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <button onClick={() => setTela("modulos")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full">← Voltar</button>
        <span className="text-base font-black">Revisão inteligente</span>
      </div>
    </header>
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Esquema */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[["D+1","Revisão rápida","text-cyan-400","border-cyan-400/20"],["D+7","Questões","text-blue-400","border-blue-400/20"],["D+15","Resumo / lei seca","text-purple-400","border-purple-400/20"],["D+30","Simulado","text-amber-400","border-amber-400/20"]].map(([d, a, c, b]) => (
          <div key={d} className={`bg-black/30 border ${b} rounded-2xl p-4 text-center`}>
            <b className={`text-lg ${c}`}>{d}</b>
            <p className="text-xs text-gray-400 mt-1">{a}</p>
          </div>
        ))}
      </div>

      {/* Revisões de hoje */}
      <div className="bg-black/40 border border-amber-400/12 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-white">📌 Revisões de hoje</h3>
          <span className="text-xs text-gray-500">{revisoesInteligentesPorData().length} item(s)</span>
        </div>
        {revisoesInteligentesPorData().length === 0
          ? <p className="text-sm text-gray-500 text-center py-4">✅ Nenhuma revisão vencendo hoje. Boa!</p>
          : <div className="space-y-2">
              {revisoesInteligentesPorData().map((r, idx) => (
                <button key={`${r.tipo}-${r.id || idx}`} onClick={() => iniciarRevisao(r)}
                  className="w-full text-left bg-white/4 hover:bg-amber-500/10 border border-white/6 hover:border-amber-400/25 rounded-xl p-3.5 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">{r.tipo === "questao" ? "Questão errada" : r.tipo === "flashcard" ? "Flashcard" : r.nome}</span>
                      <p className="text-sm font-bold text-white mt-0.5">{r.materia}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.assunto}</p>
                    </div>
                    <span className="text-xs bg-amber-500/15 border border-amber-400/20 text-amber-300 px-3 py-1.5 rounded-xl shrink-0">Revisar →</span>
                  </div>
                </button>
              ))}
            </div>
        }
      </div>

      {/* Todos os assuntos */}
      <div className="bg-black/40 border border-white/8 rounded-2xl p-5">
        <h3 className="font-black text-white mb-4">📚 Todos os assuntos concluídos</h3>
        {assuntosEstudadosArray().length === 0
          ? <p className="text-sm text-gray-500 text-center py-4">Você ainda não concluiu nenhum assunto.</p>
          : <div className="space-y-2">
              {assuntosEstudadosArray().map(({ materia, assunto }, idx) => (
                <div key={idx} className="bg-white/4 border border-white/6 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{materia}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{assunto}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0 mt-0.5">
                      {dataConclusaoAssunto(materia, assunto) ? formatarDataBR(dataConclusaoAssunto(materia, assunto)) : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </main>
  </div>
),


resumos: (() => {
  const todasMaterias = Object.values(materiasPorBloco || {}).flat();
  const materiaAtual = todasMaterias.find(m => m.nome === resumosMateriaFiltro);
  const topicos = materiaAtual?.topicos || [];

  // Chave única por assunto — dados separados por tópico
  const chaveResumo = resumosAssuntoFiltro
    ? `${resumosMateriaFiltro}|||${resumosAssuntoFiltro}`
    : resumosMateriaFiltro;
  const rAtualResumo = resumosMateria[chaveResumo] || {};

  const qmAtual = questoesManuais[chaveResumo] || { total: 0, certas: 0, erradas: 0, sessoes: [] };
  const pctAcerto = qmAtual.total > 0 ? Math.round((qmAtual.certas / qmAtual.total) * 100) : 0;
  const sessoes = (qmAtual.sessoes || []).slice().reverse();
  const erros = (cadernoErros[chaveResumo] || []).slice().reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => setTela("modulos")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">← Voltar</button>
          <span className="text-base font-black text-white">📓 Caderno de Estudos</span>
          <span className="hidden sm:block text-xs bg-white/8 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{editalAtualNome}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">

        {/* Grid matérias */}
        <div className="bg-black/40 border border-white/8 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-3">Selecionar matéria</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {todasMaterias.map(m => (
              <button key={m.nome} onClick={() => { setResumosMateriaFiltro(m.nome); setResumoAssuntoFiltro(""); }}
                className={`text-left px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${resumosMateriaFiltro === m.nome ? "bg-amber-500/20 border-amber-400/40 text-amber-300" : "bg-white/4 border-white/8 text-gray-300 hover:bg-white/8"}`}>
                <span className="block truncate">{m.nome}</span>
                <span className={`text-[9px] ${calcularProgressoDisciplina(m.nome) === 100 ? "text-emerald-400" : calcularProgressoDisciplina(m.nome) > 0 ? "text-cyan-400" : "text-gray-600"}`}>
                  {calcularProgressoDisciplina(m.nome)}% ✓
                </span>
              </button>
            ))}
          </div>
        </div>

        {resumosMateriaFiltro && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

            {/* Lateral: tópicos */}
            <div className="bg-black/40 border border-white/8 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Tópicos de {resumosMateriaFiltro}</p>
              <p className="text-[9px] text-gray-600 mb-3">Clique num tópico para abrir resumo, questões e erros</p>
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                {topicos.map(t => {
                  const estudado = assuntosEstudadosSet().has(`${resumosMateriaFiltro}|||${t}`);
                  const chaveT = `${resumosMateriaFiltro}|||${t}`;
                  const temR = !!(resumosMateria[chaveT]?.conceito || resumosMateria[chaveT]?.pontosChave || resumosMateria[chaveT]?.livre);
                  const temQ = (questoesManuais[chaveT]?.total || 0) > 0;
                  const temE = (cadernoErros[chaveT]?.length || 0) > 0;
                  const ativo = resumosAssuntoFiltro === t;
                  return (
                    <button key={t} onClick={() => { setResumoAssuntoFiltro(t); setAbaMateria("resumo"); setResumoSalvoStatus(""); }}
                      className={`w-full text-left text-xs px-3 py-2.5 rounded-xl transition-all flex items-start gap-2 border ${ativo ? "bg-amber-500/20 text-amber-300 border-amber-400/30" : "text-gray-400 hover:text-white hover:bg-white/6 border-transparent"}`}>
                      <span className="shrink-0 mt-0.5">{estudado ? "✅" : "⬜"}</span>
                      <span className="flex-1 leading-tight">{t}</span>
                      <span className="flex gap-0.5 shrink-0 mt-0.5">
                        {temR && <span title="Tem resumo">📝</span>}
                        {temQ && <span title="Tem questões">📊</span>}
                        {temE && <span title="Tem erros">❌</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="space-y-4">
              {!resumosAssuntoFiltro ? (
                <div className="bg-black/20 border border-white/6 rounded-2xl p-12 text-center">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-white font-bold">Selecione um tópico</p>
                  <p className="text-gray-500 text-xs mt-1">Cada tópico tem seu próprio resumo, questões e caderno de erros</p>
                </div>
              ) : (
                <>
                  {/* Breadcrumb */}
                  <div className="bg-black/40 border border-amber-400/20 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">{resumosMateriaFiltro}</p>
                    <p className="text-sm font-black text-white mt-0.5">{resumosAssuntoFiltro}</p>
                  </div>

                  {/* Abas */}
                  <div className="flex gap-2">
                    {[["resumo","📝 Resumo"],["questoes","🔢 Questões"],["caderno","📒 Erros"]].map(([id,label]) => (
                      <button key={id} onClick={() => setAbaMateria(id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${abaMateria === id ? "bg-amber-500 text-black" : "bg-black/30 border border-white/8 text-gray-400 hover:text-white"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ABA RESUMO */}
                  {abaMateria === "resumo" && (() => {
                    const campos = [
                      { key: "conceito",    label: "📖 Conceito central",          ph: "O que é esse tópico? Escreva com suas palavras..." },
                      { key: "pontosChave", label: "🎯 Pontos-chave para a prova", ph: "O que mais cai? Palavras-chave, artigos importantes..." },
                      { key: "dicasProva",  label: "💡 Dicas e macetes",           ph: "Pegadinhas, diferenças, erros comuns..." },
                      { key: "legislacao",  label: "⚖️ Legislação relevante",      ph: "Leis, decretos, artigos importantes..." },
                      { key: "livre",       label: "📓 Anotações livres",          ph: "Espaço livre para qualquer anotação..." },
                    ];
                    const applyCmd = (cmd, val=null) => {
                      const el = window.__richEditorActive;
                      const r = window.__richEditorRange;
                      if (!el) return;
                      el.focus();
                      if (r) { const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); }
                      document.execCommand(cmd, false, val);
                      setTimeout(() => { const s=window.getSelection(); if(s?.rangeCount>0) window.__richEditorRange=s.getRangeAt(0).cloneRange(); }, 0);
                    };
                    const salvar = async () => {
                      setResumoSalvoStatus("salvando");
                      const novo = {};
                      campos.forEach(({ key }) => {
                        const el = document.getElementById(`rf-${key}`);
                        novo[key] = el ? el.innerHTML : (rAtualResumo[key] || "");
                      });
                      await salvarResumoMateria(chaveResumo, novo);
                      setResumoSalvoStatus("salvo");
                      setTimeout(() => setResumoSalvoStatus(""), 2500);
                    };
                    return (
                      <div className="bg-black/40 border border-white/8 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">Escreva e clique em Salvar.</p>
                          <button onClick={salvar} className={`font-bold text-sm px-5 py-2 rounded-xl transition-all ${resumoSalvoStatus==="salvo"?"bg-emerald-600 text-white":resumoSalvoStatus==="salvando"?"bg-white/10 text-gray-400":"bg-amber-500 hover:bg-amber-400 text-black"}`}>
                            {resumoSalvoStatus==="salvo"?"✓ Salvo!":resumoSalvoStatus==="salvando"?"Salvando...":"💾 Salvar"}
                          </button>
                        </div>
                        {/* Toolbar */}
                        <div className="sticky top-[52px] z-10 bg-gray-900/98 backdrop-blur border border-white/10 rounded-xl px-3 py-2 flex flex-wrap items-center gap-1">
                          {[{c:"bold",i:"B",cl:"font-black"},{c:"italic",i:"I",cl:"italic"},{c:"underline",i:"U",cl:"underline"},{c:"strikeThrough",i:"S",cl:"line-through"}].map(({c,i,cl})=>(
                            <button key={c} onMouseDown={e=>{e.preventDefault();applyCmd(c);}} className={`w-7 h-7 rounded-lg text-xs font-black text-white hover:bg-white/15 ${cl}`}>{i}</button>
                          ))}
                          <div className="w-px h-5 bg-white/10 mx-1"/>
                          <select defaultValue="" onMouseDown={()=>{const s=window.getSelection();if(s?.rangeCount>0)window.__richEditorRange=s.getRangeAt(0).cloneRange();}} onChange={e=>{applyCmd("fontSize",e.target.value);e.target.value="";}} className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded-lg px-1.5 py-1 focus:outline-none">
                            <option value="" disabled>Tam.</option>
                            {[["1","XS"],["2","S"],["3","M"],["4","G"],["5","XG"],["6","XXG"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                          </select>
                          <div className="w-px h-5 bg-white/10 mx-1"/>
                          {[{c:"insertUnorderedList",i:"≡"},{c:"insertOrderedList",i:"1≡"}].map(({c,i})=>(
                            <button key={c} onMouseDown={e=>{e.preventDefault();applyCmd(c);}} className="w-7 h-7 rounded-lg text-xs text-white hover:bg-white/15">{i}</button>
                          ))}
                          <div className="w-px h-5 bg-white/10 mx-1"/>
                          <span className="text-[9px] text-gray-500">Mark</span>
                          {[["rgba(6,182,212,0.30)","🔵"],["rgba(168,85,247,0.35)","🟣"],["rgba(234,179,8,0.40)","🟡"],["rgba(34,197,94,0.32)","🟢"],["rgba(239,68,68,0.32)","🔴"]].map(([bg,lb])=>(
                            <button key={bg} onMouseDown={e=>{e.preventDefault();applyCmd("hiliteColor",bg);}} className="w-6 h-6 rounded-md text-xs hover:scale-110 border border-white/10" style={{background:bg}}>{lb}</button>
                          ))}
                          <button onMouseDown={e=>{e.preventDefault();applyCmd("hiliteColor","transparent");}} className="w-6 h-6 rounded-md text-[9px] text-gray-500 hover:text-white hover:bg-white/10 border border-white/10">✕</button>
                          <div className="w-px h-5 bg-white/10 mx-1"/>
                          <span className="text-[9px] text-gray-500">Cor</span>
                          {["#22d3ee","#a78bfa","#fbbf24","#4ade80","#f87171","#ffffff"].map(cl=>(
                            <button key={cl} onMouseDown={e=>{e.preventDefault();applyCmd("foreColor",cl);}} className="w-6 h-6 rounded-md text-xs font-black hover:scale-110 border border-white/10" style={{color:cl,background:"rgba(255,255,255,0.05)"}}>C</button>
                          ))}
                          <button onMouseDown={e=>{e.preventDefault();applyCmd("foreColor","#e5e7eb");}} className="w-6 h-6 rounded-md text-[9px] text-gray-500 hover:text-white hover:bg-white/10 border border-white/10">✕</button>
                          <div className="w-px h-5 bg-white/10 mx-1"/>
                          <button onMouseDown={e=>{e.preventDefault();applyCmd("removeFormat");}} className="text-[9px] text-gray-500 hover:text-white hover:bg-white/10 border border-white/10 px-2 h-7 rounded-lg">✕fmt</button>
                        </div>
                        {/* Campos — id único por chave garante elemento novo ao trocar tópico */}
                        {campos.map(({ key, label, ph }) => (
                          <div key={`${chaveResumo}-${key}`}>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
                            <div
                              id={`rf-${key}`}
                              contentEditable suppressContentEditableWarning
                              data-placeholder={ph}
                              dangerouslySetInnerHTML={{ __html: rAtualResumo[key] || "" }}
                              onFocus={e => { window.__richEditorActive = e.currentTarget; }}
                              onMouseUp={() => { const s=window.getSelection(); if(s?.rangeCount>0) window.__richEditorRange=s.getRangeAt(0).cloneRange(); }}
                              onKeyUp={() => { const s=window.getSelection(); if(s?.rangeCount>0) window.__richEditorRange=s.getRangeAt(0).cloneRange(); }}
                              className="w-full min-h-[80px] bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 focus:border-amber-400/40 focus:outline-none leading-relaxed"
                              style={{caretColor:"#22d3ee"}}
                            />
                          </div>
                        ))}
                        <button onClick={salvar} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${resumoSalvoStatus==="salvo"?"bg-emerald-600 text-white":resumoSalvoStatus==="salvando"?"bg-white/10 text-gray-400":"bg-amber-500 hover:bg-amber-400 text-black"}`}>
                          {resumoSalvoStatus==="salvo"?"✓ Resumo salvo!":resumoSalvoStatus==="salvando"?"Salvando...":"💾 Salvar resumo"}
                        </button>
                        <style>{`
                          [contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#374151;pointer-events:none;font-style:italic;}
                          [contenteditable] ul{list-style:disc;padding-left:1.5em;margin:4px 0;}
                          [contenteditable] ol{list-style:decimal;padding-left:1.5em;margin:4px 0;}
                          [contenteditable]:focus{outline:none;}
                          [contenteditable] b,[contenteditable] strong{font-weight:900;}
                        `}</style>
                      </div>
                    );
                  })()}

                  {/* ABA QUESTÕES */}
                  {abaMateria === "questoes" && (
                    <div className="space-y-4">
                      <div className="bg-black/40 border border-purple-400/20 rounded-2xl p-5 space-y-4">
                        <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">+ Registrar questões — {resumosAssuntoFiltro}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">📊 Total feitas</label>
                            <input type="number" min="0" value={sessaoQuestoesForm.erradas} onChange={e => setSessaoQuestoesForm(v => ({...v, erradas: e.target.value}))}
                              className="w-full bg-black/40 border border-white/20 text-white text-center text-xl font-black px-3 py-2 rounded-xl focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">✅ Acertei</label>
                            <input type="number" min="0" value={sessaoQuestoesForm.certas} onChange={e => setSessaoQuestoesForm(v => ({...v, certas: e.target.value}))}
                              className="w-full bg-black/40 border border-emerald-500/20 text-emerald-400 text-center text-xl font-black px-3 py-2 rounded-xl focus:outline-none" />
                          </div>
                        </div>
                        {(parseInt(sessaoQuestoesForm.erradas)||0) > 0 && (() => {
                          const total = parseInt(sessaoQuestoesForm.erradas)||0;
                          const certas = Math.min(parseInt(sessaoQuestoesForm.certas)||0, total);
                          const pct = Math.round((certas/total)*100);
                          return (
                            <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-400">Taxa de acerto</span>
                                <span className={`text-sm font-black ${pct>=70?"text-emerald-400":pct>=50?"text-yellow-400":"text-red-400"}`}>{pct}%</span>
                              </div>
                              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct>=70?"bg-emerald-500":pct>=50?"bg-yellow-500":"bg-red-500"}`} style={{width:`${pct}%`}}/>
                              </div>
                              <div className="flex justify-between text-[10px] mt-1.5 text-gray-500">
                                <span>✅ <b className="text-emerald-400">{certas}</b></span>
                                <span>❌ <b className="text-red-400">{total-certas}</b></span>
                                <span>📊 <b className="text-white">{total}</b></span>
                              </div>
                            </div>
                          );
                        })()}
                        <button onClick={async () => {
                          const total = parseInt(sessaoQuestoesForm.erradas)||0;
                          const certas = Math.min(parseInt(sessaoQuestoesForm.certas)||0, total);
                          if (!total) return;
                          await salvarSessaoQuestoes(chaveResumo, resumosAssuntoFiltro, certas, total-certas);
                          setSessaoQuestoesForm({ assunto:"", certas:"", erradas:"" });
                        }} className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-xl font-bold text-sm transition-colors">
                          Salvar sessão
                        </button>
                      </div>
                      {sessoes.length > 0 && (
                        <div className="bg-black/40 border border-white/8 rounded-2xl p-5">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Histórico</p>
                          <div className="space-y-2">
                            {sessoes.map((s, idx) => {
                              const tot = (s.certas||0)+(s.erradas||0);
                              const p = tot > 0 ? Math.round((s.certas/tot)*100) : 0;
                              return (
                                <div key={idx} className="bg-black/30 border border-white/6 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                  <p className="text-[10px] text-gray-500">{s.data} · {tot} questões</p>
                                  <div className="flex gap-3 text-xs">
                                    <span className="text-emerald-400 font-bold">✅ {s.certas}</span>
                                    <span className="text-red-400 font-bold">❌ {s.erradas}</span>
                                    <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${p>=70?"bg-emerald-500/20 text-emerald-400":p>=50?"bg-yellow-500/20 text-yellow-400":"bg-red-500/20 text-red-400"}`}>{p}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/6 flex justify-between text-xs">
                            <span className="text-gray-400">Total acumulado</span>
                            <div className="flex gap-3">
                              <span>📊 <b className="text-white">{qmAtual.total}</b></span>
                              <span>✅ <b className="text-emerald-400">{qmAtual.certas}</b></span>
                              <span>❌ <b className="text-red-400">{qmAtual.erradas}</b></span>
                              <span className={`font-black ${pctAcerto>=70?"text-emerald-400":pctAcerto>=50?"text-yellow-400":"text-red-400"}`}>{pctAcerto}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABA CADERNO DE ERROS */}
                  {abaMateria === "caderno" && (
                    <div className="space-y-4">
                      <div className="bg-black/40 border border-red-400/15 rounded-2xl p-5 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">+ Registrar erro — {resumosAssuntoFiltro}</p>
                        <textarea rows={2} placeholder="O que a questão perguntava?" value={novoErroForm.questao} onChange={e => setNovoErroForm(v => ({...v, questao: e.target.value}))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none" />
                        <textarea rows={2} placeholder="Por que você errou?" value={novoErroForm.erro} onChange={e => setNovoErroForm(v => ({...v, erro: e.target.value}))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none" />
                        <textarea rows={2} placeholder="A resposta correta era..." value={novoErroForm.correto} onChange={e => setNovoErroForm(v => ({...v, correto: e.target.value}))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none" />
                        <button onClick={async () => {
                          if (!novoErroForm.questao && !novoErroForm.erro) return;
                          await salvarCadernoErro(chaveResumo, { ...novoErroForm, assunto: resumosAssuntoFiltro });
                          setNovoErroForm({ questao:"", erro:"", correto:"" });
                        }} className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                          Salvar no caderno
                        </button>
                      </div>
                      {erros.length === 0
                        ? <div className="bg-black/20 border border-white/6 rounded-2xl p-8 text-center text-gray-500 text-sm">Nenhum erro registrado ainda.</div>
                        : erros.map((e, idx) => (
                          <div key={idx} className="bg-black/40 border border-white/6 rounded-2xl p-4 space-y-2">
                            <span className="text-[10px] text-gray-500">{e.data}</span>
                            {e.questao && <p className="text-xs text-gray-300"><b className="text-gray-500">Questão: </b>{e.questao}</p>}
                            {e.erro && <p className="text-xs text-red-400"><b className="text-gray-500">Erro: </b>{e.erro}</p>}
                            {e.correto && <p className="text-xs text-emerald-400"><b className="text-gray-500">Correto: </b>{e.correto}</p>}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
})(),
};

  // Renderização principal
  // Dados para o briefing — todos com fallback seguro
  const dataProvaDia = (dataProvaEdital || {})[editalEscolhido] || null;
  const diasParaProva = (() => {
    if (!dataProvaDia) return null;
    try {
      const diff = Math.ceil((new Date(dataProvaDia + "T12:00:00").getTime() - new Date().setHours(0,0,0,0)) / 86400000);
      return isNaN(diff) ? null : diff;
    } catch { return null; }
  })();
  const hojeStr = new Date().toISOString().slice(0,10);
  const blocosHojeBriefing = (() => {
    try {
      return (cronogramasSalvos || [])
        .filter(c => !c.id?.includes("edital-todo"))
        .flatMap(c => (c.blocos || []).filter(b => b.data === hojeStr))
        .slice(0, 5);
    } catch { return []; }
  })();
  const revisoesPendBriefing = (() => {
    try {
      return Object.entries(estudos || {}).flatMap(([mat, assuntos]) =>
        (assuntos || []).filter(a => {
          const chave = `${mat}|||${a}`;
          const det = (estudosDetalhes || {})[chave];
          if (!det?.concluidoEm) return false;
          const diff = Math.floor((new Date() - new Date(det.concluidoEm)) / 86400000);
          return diff === 1 || diff === 7 || diff === 30;
        }).map(a => ({ materia: mat, assunto: a }))
      ).slice(0, 3);
    } catch { return []; }
  })();

return (
  <>
    {/* Modal Briefing Diário */}
    {mostrarBriefing && editalEscolhido && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-950 border border-white/12 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-900/60 to-purple-900/60 px-6 py-5 border-b border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Bom dia, estudante! 👋</p>
                <h2 className="text-lg font-black text-white mt-0.5">Sua agenda de hoje</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editalAtualNome}</p>
              </div>
              {diasParaProva !== null && (
                <div className="text-center bg-black/40 border border-cyan-500/20 rounded-2xl px-4 py-2">
                  <p className="text-2xl font-black text-cyan-400">{diasParaProva}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">dias<br/>para a prova</p>
                </div>
              )}
            </div>
          </div>

          {/* Corpo */}
          <div className="px-6 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
            {/* Estudar hoje */}
            {blocosHojeBriefing.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2">📚 Para estudar hoje</p>
                <div className="space-y-1.5">
                  {blocosHojeBriefing.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{b.nome || "Matéria"}</p>
                        {b.topico && <p className="text-[10px] text-gray-500 truncate">{b.topico}</p>}
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0">{b.tempo || 30}min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revisões */}
            {revisoesPendBriefing.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-2">🔁 Revisões pendentes</p>
                <div className="space-y-1.5">
                  {revisoesPendBriefing.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 bg-purple-500/8 border border-purple-400/15 rounded-xl px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{r.materia}</p>
                        <p className="text-[10px] text-gray-500 truncate">{r.assunto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sem nada */}
            {blocosHojeBriefing.length === 0 && revisoesPendBriefing.length === 0 && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-sm text-gray-400">Nenhuma tarefa programada ainda.</p>
                <p className="text-xs text-gray-600 mt-1">Gere um cronograma para começar!</p>
              </div>
            )}

            {/* Data da prova */}
            <div className="bg-black/40 border border-white/8 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">📅 Data da sua prova</p>
              <input
                type="date"
                value={dataProvaDia || ""}
                onChange={e => salvarDataProva(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400/40"
              />
              {diasParaProva !== null && diasParaProva > 0 && (
                <p className="text-xs text-cyan-400 mt-1.5 text-center font-bold">🔥 {diasParaProva} dias restantes!</p>
              )}
              {diasParaProva !== null && diasParaProva <= 0 && (
                <p className="text-xs text-red-400 mt-1.5 text-center font-bold">⚠️ Data da prova já passou!</p>
              )}
            </div>
          </div>

          {/* Rodapé */}
          <div className="px-6 py-4 border-t border-white/8 space-y-2">
            <button onClick={() => {
              setMostrarBriefing(false);
              setTela("modulos");
            }} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              🚀 Começar a estudar
            </button>
            <button onClick={() => {
              // Dispensa o briefing por hoje para este edital
              try { localStorage.setItem(`briefing-visto-${editalEscolhido}-${hojeStr}`, "1"); } catch {}
              setMostrarBriefing(false);
              setTela("modulos");
            }} className="w-full text-xs text-gray-500 hover:text-gray-300 py-2 transition-colors">
              Não mostrar mais hoje
            </button>
          </div>
        </div>
      </div>
    )}

    {false && !acessoLiberado && tela !== "login" && <TelaBloqueioPagamento />}

    {renderTelas[tela] || (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-xl text-white">Tela não encontrada.</p>
      </div>
    )}
  </>
);
}
