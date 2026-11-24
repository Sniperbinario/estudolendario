import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import questoes from "../../data/questoes";
import questoesSimulado from "../../data/simulados";
import simuladosPF from "../../data/simuladosPF";
import flashcards from "../../data/flashcards";
import conteudosPF from "../../data/conteudosPF";
import conteudosALEGO from "../../data/conteudosALEGO";
import TelaBloqueioPagamento from "../../components/TelaBloqueioPagamento";
import { getDatabase, ref, get } from "firebase/database";
import { arrayUnion } from "firebase/firestore";
import MinhaConta from "../../components/MinhaConta";
import AuthScreen from "../auth/AuthScreen";
import { defaultEdital, EDITAIS } from "./config/editais";
import { useHashRoute } from "./hooks/useHashRoute";
import { useStudyHistory } from "./hooks/useStudyHistory";
import ExamSelection from "./screens/ExamSelection";
import InternalShell from "./components/InternalShell";
import StudyDashboard from "./screens/StudyDashboard";
import SubjectSelectionScreen from "./screens/SubjectSelectionScreen";
import QuestionSessionScreen from "./screens/QuestionSessionScreen";
import EditalScreen from "./screens/EditalScreen";
import SummariesScreen from "./screens/SummariesScreen";


// === COMPONENTE LOGIN CADASTRO FIREBASE ===
import { auth } from "../../firebase";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

import { motion, AnimatePresence } from "framer-motion";

//COMPONETENTE DO FIREBASE
import { db } from "../../firebase";
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc, onSnapshot, runTransaction } from "firebase/firestore";



export default function App() {
  // Estado do usuário logado
  const [usuario, setUsuario] = useState(null);
  const [editalEscolhido, setEditalEscolhidoState] = useState(() => {
    try { return localStorage.getItem("editalEscolhido") || null; } catch { return null; }
  });
  const [mostrarConteudo, setMostrarConteudo] = useState(false);
  const [acessoLiberado, setAcessoLiberado] = useState(true);
  const [atualizarHistorico, setAtualizarHistorico] = useState(0);
  const [mostrarBriefing, setMostrarBriefing] = useState(false);
  const [dataProvaEdital, setDataProvaEdital] = useState({});
  const [editalNotificacao, setEditalNotificacao] = useState(() => { try { return localStorage.getItem("editalNotificacao") || null; } catch { return null; } });
  const [materiasPendentes, setMateriasPendentes] = useState(() => { try { return JSON.parse(localStorage.getItem("materiasPendentes") || "{}"); } catch { return {}; } });
  const { studies: estudos, loading } = useStudyHistory(usuario?.uid, editalEscolhido, atualizarHistorico);



  // Estado para saber se concluiu o desafio diário
  const [desafioConcluido, setDesafioConcluido] = useState(false);

  useEffect(() => {
  const auth = getAuth();
  let lastUid = null;

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    const anteriorUid = lastUid;
    lastUid = user?.uid || null;
    setUsuario(user);
    setAcessoLiberado(true);

    if (user) {
      // Usuário diferente do anterior (troca de conta ou primeiro login)
      if (anteriorUid !== user.uid) {
        // Verificar se este usuário tem edital salvo no Firebase
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const dados = snap.exists() ? snap.data() : {};
          const editalSalvo = dados.ultimoEdital || null;
          if (editalSalvo && EDITAIS[editalSalvo]) {
            // Usuário já tem edital — restaurar e ir para dashboard
            setEditalEscolhidoState(editalSalvo);
            try { localStorage.setItem("editalEscolhido", editalSalvo); } catch {}
            setTela("modulos");
          } else {
            // Usuário novo ou sem edital — ir para seleção
            setEditalEscolhidoState(null);
            try { localStorage.removeItem("editalEscolhido"); } catch {}
            setTela("concurso");
          }
        } catch {
          setTela("concurso");
        }
      }
    } else {
      // Logout — limpar tudo
      lastUid = null;
      setEditalEscolhidoState(null);
      try { localStorage.removeItem("editalEscolhido"); } catch {}
      setTela("login");
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

  const [tela, setTela] = useHashRoute();

  // Wrapper que persiste no localStorage e sincroniza materias/pesos
  const setEditalEscolhido = (id) => {
    setEditalEscolhidoState(id);
    try { if (id) localStorage.setItem("editalEscolhido", id); else localStorage.removeItem("editalEscolhido"); } catch {}
    const edital = EDITAIS[id];
    if (edital) { setMateriasPorBloco(edital.materias); setPesos(edital.pesos); }
    if (id) {
      const chave = `briefing-${id}-${new Date().toISOString().slice(0,10)}`;
      try { if (!localStorage.getItem(chave)) setMostrarBriefing(true); } catch {}
      // Salvar no Firebase para restaurar na próxima sessão deste usuário
      if (usuario) {
        setDoc(doc(db, "users", usuario.uid), { ultimoEdital: id }, { merge: true }).catch(() => {});
      }
    }
  };

  // Inicializa materias/pesos a partir do edital salvo no localStorage
  const editalInicial = (() => { try { return localStorage.getItem("editalEscolhido"); } catch { return null; } })();
  const [materiasPorBloco, setMateriasPorBloco] = useState(() => EDITAIS[editalInicial]?.materias || defaultEdital.materias);
  const [pesos, setPesos] = useState(() => EDITAIS[editalInicial]?.pesos || defaultEdital.pesos);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState("");
  const [telaEscura, setTelaEscura] = useState(true);
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
  const [loadingExtras, setLoadingExtras] = useState(false);
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
  if (!usuario || !editalEscolhido) return;
  // Busca estado atual do Firestore para não sobrescrever outros resumos
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
  try {
    const snap = await getDoc(ref);
    const resumosAtuais = snap.exists() ? (snap.data().resumosMateria || {}) : {};
    const novoResumos = { ...resumosAtuais, [materia]: dados };
    setResumosMateria(novoResumos);
    await setDoc(ref, { resumosMateria: novoResumos }, { merge: true });
  } catch(e) {
    // Fallback: usar estado local
    const novoResumos = { ...resumosMateria, [materia]: dados };
    setResumosMateria(novoResumos);
    await setDoc(ref, { resumosMateria: novoResumos }, { merge: true });
  }
}
async function salvarCadernoErro(materia, entrada) {
  if (!usuario) return;
  const lista = [...(cadernoErros[materia] || []), { ...entrada, data: new Date().toISOString().slice(0,10) }];
  const novo = { ...cadernoErros, [materia]: lista };
  setCadernoErros(novo);
  if (!editalEscolhido) return;
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
  await setDoc(ref, { cadernoErros: novo }, { merge: true });
}
async function salvarQuestoesManuais(materia, dados) {
  if (!usuario) return;
  const novo = { ...questoesManuais, [materia]: dados };
  setQuestoesManuais(novo);
  if (!editalEscolhido) return;
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
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
  setLoadingExtras(true);
  try {
    const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      if (d.resumosMateria) setResumosMateria(d.resumosMateria);
      else setResumosMateria({});
      if (d.cadernoErros) setCadernoErros(d.cadernoErros);
      if (d.questoesManuais) setQuestoesManuais(d.questoesManuais);
      if (d.dataProva) setDataProvaEdital(prev => ({ ...prev, [editalEscolhido]: d.dataProva }));

      // Matérias marcadas em “Continuar depois” precisam ficar na nuvem para
      // aparecerem em qualquer aparelho. Caso ainda não exista no Firestore,
      // migra automaticamente o valor antigo salvo neste navegador.
      if (Array.isArray(d.materiasPendentes)) {
        setMateriasPendentes(prev => ({ ...prev, [editalEscolhido]: d.materiasPendentes }));
        try {
          const localAtual = JSON.parse(localStorage.getItem("materiasPendentes") || "{}");
          localStorage.setItem("materiasPendentes", JSON.stringify({ ...localAtual, [editalEscolhido]: d.materiasPendentes }));
        } catch {}
      } else {
        let pendentesLocais = [];
        try {
          const localAtual = JSON.parse(localStorage.getItem("materiasPendentes") || "{}");
          pendentesLocais = Array.isArray(localAtual[editalEscolhido]) ? localAtual[editalEscolhido] : [];
        } catch {}
        setMateriasPendentes(prev => ({ ...prev, [editalEscolhido]: pendentesLocais }));
        if (pendentesLocais.length > 0) {
          await setDoc(ref, { materiasPendentes: pendentesLocais }, { merge: true });
        }
      }
    } else {
      setResumosMateria({});
      let pendentesLocais = [];
      try {
        const localAtual = JSON.parse(localStorage.getItem("materiasPendentes") || "{}");
        pendentesLocais = Array.isArray(localAtual[editalEscolhido]) ? localAtual[editalEscolhido] : [];
      } catch {}
      setMateriasPendentes(prev => ({ ...prev, [editalEscolhido]: pendentesLocais }));
      if (pendentesLocais.length > 0) {
        await setDoc(ref, { materiasPendentes: pendentesLocais }, { merge: true });
      }
    }
  } catch(e) { console.error("Erro ao carregar extras:", e); }
  finally { setLoadingExtras(false); }
}

// Sincronização em tempo real das matérias pendentes entre computador,
// tablet e celular conectados à mesma conta.
useEffect(() => {
  if (!usuario || !editalEscolhido) return undefined;

  const extrasRef = doc(db, "users", usuario.uid, "extras", editalEscolhido);
  const unsubscribe = onSnapshot(extrasRef, (snap) => {
    if (!snap.exists()) return;
    const pendentes = snap.data().materiasPendentes;
    if (!Array.isArray(pendentes)) return;

    setMateriasPendentes(prev => {
      const novo = { ...prev, [editalEscolhido]: pendentes };
      try { localStorage.setItem("materiasPendentes", JSON.stringify(novo)); } catch {}
      return novo;
    });
  }, (erro) => {
    console.error("Erro ao sincronizar matérias pendentes:", erro);
  });

  return unsubscribe;
}, [usuario, editalEscolhido]);

async function salvarDataProva(data) {
  if (!usuario || !editalEscolhido) return;
  setDataProvaEdital(prev => ({ ...prev, [editalEscolhido]: data }));
  const ref = doc(db, "users", usuario.uid, "extras", editalEscolhido);
  await setDoc(ref, { dataProva: data }, { merge: true });
}

const salvarMateriaPendente = async (bloco) => {
  if (!usuario || !editalEscolhido || !bloco) return;
  const extrasRef = doc(db, "users", usuario.uid, "extras", editalEscolhido);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(extrasRef);
      const atuais = snap.exists() && Array.isArray(snap.data().materiasPendentes)
        ? snap.data().materiasPendentes
        : [];

      const jaExiste = atuais.some((b) => b.nome === bloco.nome && b.topico === bloco.topico);
      if (jaExiste) return;

      transaction.set(extrasRef, {
        materiasPendentes: [...atuais, { ...bloco, savedAt: new Date().toISOString() }],
      }, { merge: true });
    });
  } catch (erro) {
    console.error("Erro ao salvar matéria pendente no Firebase:", erro);
    alert("Não foi possível sincronizar esta matéria. Verifique sua conexão e tente novamente.");
  }
};

const removerMateriaPendente = async (bloco) => {
  if (!usuario || !editalEscolhido || !bloco) return;
  const extrasRef = doc(db, "users", usuario.uid, "extras", editalEscolhido);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(extrasRef);
      const atuais = snap.exists() && Array.isArray(snap.data().materiasPendentes)
        ? snap.data().materiasPendentes
        : [];
      const atualizadas = atuais.filter((b) => !(b.nome === bloco.nome && b.topico === bloco.topico));
      transaction.set(extrasRef, { materiasPendentes: atualizadas }, { merge: true });
    });
  } catch (erro) {
    console.error("Erro ao remover matéria pendente do Firebase:", erro);
    alert("Não foi possível atualizar a matéria pendente. Verifique sua conexão e tente novamente.");
  }
};

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
    // Inicia o ciclo de revisão espaçada: nível 0, primeira revisão amanhã (D+1)
    detalhesEdital[chave] = {
      materia, assunto, edital: editalEscolhido,
      concluidoEm: agora,
      tempoMin: Number(tempoMin) || 0,
      nivelRevisao: 0,
      proximaRevisao: adicionarDias(agora.slice(0, 10), 1),
    };

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

  // mergeFields substitui os campos inteiros — necessário para o delete funcionar no Firestore
  await setDoc(userRef, {
    estudosPorEdital: { ...estudosPorEdital, [editalEscolhido]: estudosEdital },
    estudosDetalhesPorEdital: { ...detalhesPorEdital, [editalEscolhido]: detalhesEdital },
  }, { mergeFields: ["estudosPorEdital", "estudosDetalhesPorEdital"] });
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
    <div className="study-panel-page">
      <div className="study-panel-card">
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
 const progressoEdital = (id) => {
  if (id === editalEscolhido) return progressoGeralEdital();
  return 0;
 };
 const diasParaProvaEdital = (id) => {
  const data = (dataProvaEdital||{})[id];
  if (!data) return 0;
  try {
    const d = Math.ceil((new Date(data+"T12:00:00") - new Date().setHours(0,0,0,0)) / 86400000);
    return isNaN(d) || d < 0 ? 0 : d;
  } catch { return 0; }
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
  if (!estudosDetalhes || Object.keys(estudosDetalhes).length === 0) return [];
  const hoje = new Date().toISOString().slice(0, 10);
  const alvo = iso || hoje;
  const NOMES_NIVEL = ["D+1", "D+7", "D+15", "D+30", "Manutenção"];
  const ACOES_NIVEL = ["revisão rápida", "questões", "resumo/lei seca", "simulado", "revisão de manutenção"];
  return Object.entries(estudosDetalhes).flatMap(([chave, det]) => {
    if (!det?.concluidoEm) return [];
    if (det.edital && det.edital !== editalEscolhido) return [];
    const partes = chave.split('|||');
    if (partes.length < 2) return [];
    const [materia, assunto] = partes;
    // proximaRevisao do novo sistema; fallback para dados antigos: D+1 do estudo
    const proxima = det.proximaRevisao || adicionarDias(det.concluidoEm.slice(0, 10), 1);
    const nivel = Math.min(det.nivelRevisao || 0, NOMES_NIVEL.length - 1);
    // Para hoje: mostra tudo que venceu (acumula atrasadas). Para datas futuras: só o dia exato (calendário)
    const aparece = alvo === hoje ? proxima <= hoje : proxima === alvo;
    if (!aparece) return [];
    const atrasadaDias = alvo === hoje ? Math.max(0, Math.floor((new Date(hoje) - new Date(proxima)) / 86400000)) : 0;
    return [{ materia, assunto, dias: nivel, nome: NOMES_NIVEL[nivel], acao: ACOES_NIVEL[nivel], atrasadaDias }];
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
   .filter((r) => r.revisaoEm && r.revisaoEm <= iso && r.edital === editalEscolhido)
   .map((r) => ({ tipo: "flashcard", nome: "Flashcard", acao: r.ultimoResultado === "errei" ? "reforço por erro" : "revisão espaçada", materia: r.materia, assunto: r.assunto, id: r.id, frente: r.frente }));
 const revisoesQuestoesErradasPorData = (iso) => {
   const erradas = desempenhoQuestoes?.questoesErradas || {};
   const detalhes = desempenhoQuestoes?.questoesErradasDetalhes || {};
   return Object.entries(erradas).flatMap(([materia, ids]) => (ids || []).map((id) => {
     const d = detalhes[id] || {};
     // Só aparece se tiver revisaoEm definido E vencido, OU se errou há mais de 1 dia sem revisaoEm
     const revisaoEm = d.revisaoEm || adicionarDias(d.erradoEm || iso, 1);
     return { tipo: "questao", nome: "Questão errada", acao: "refazer questão", materia, assunto: d.assunto || "Revisão de erros", id, revisaoEm };
   })).filter((r) => r.revisaoEm <= iso);
 };
 const revisoesInteligentesPorData = (iso = new Date().toISOString().slice(0,10)) => [
   ...revisoesPorData(iso).map((r) => ({ ...r, tipo: "assunto" })),
   ...revisoesQuestoesErradasPorData(iso),
   ...revisoesFlashcardsPorData(iso),
 ];
 const concluirRevisao = async (item) => {
   if (item.tipo === "assunto") {
     if (!usuario || !editalEscolhido) return;
     // Avança o nível de revisão SEM resetar o concluidoEm original
     try {
       const chave = `${item.materia}|||${item.assunto}`;
       const hoje = new Date().toISOString().slice(0, 10);
       const userRef = doc(db, "users", usuario.uid);
       const snap = await getDoc(userRef);
       const dados = snap.exists() ? snap.data() : {};
       const detalhesPorEdital = dados.estudosDetalhesPorEdital || {};
       const detalhesEdital = { ...(detalhesPorEdital[editalEscolhido] || {}) };
       const det = detalhesEdital[chave] || { materia: item.materia, assunto: item.assunto, edital: editalEscolhido, concluidoEm: new Date().toISOString() };
       // Intervalos: após D+1 → +7d; após D+7 → +15d; após D+15 → +30d; depois recorrente +30d
       const INTERVALOS = [7, 15, 30, 30];
       const nivelAtual = det.nivelRevisao || 0;
       const novoNivel = nivelAtual + 1;
       const proximoIntervalo = INTERVALOS[Math.min(nivelAtual, INTERVALOS.length - 1)];
       detalhesEdital[chave] = {
         ...det,
         nivelRevisao: novoNivel,
         ultimaRevisaoEm: hoje,
         proximaRevisao: adicionarDias(hoje, proximoIntervalo),
       };
       await setDoc(userRef, {
         estudosDetalhesPorEdital: { ...detalhesPorEdital, [editalEscolhido]: detalhesEdital },
       }, { merge: true });
       setEstudosDetalhes(detalhesEdital);
     } catch (e) { console.error("Erro ao concluir revisão:", e); }
     return;
   }
   if (item.tipo === "questao") {
     if (!usuario) return;
     try {
       const docRef = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
       const desempenhoAtual = desempenhoQuestoes || {};
       const questoesErradas = { ...(desempenhoAtual.questoesErradas || {}) };
       const questoesErradasDetalhes = { ...(desempenhoAtual.questoesErradasDetalhes || {}) };
       const lista = (questoesErradas[item.materia] || []).filter((id) => String(id) !== String(item.id));
       questoesErradas[item.materia] = lista;
       delete questoesErradasDetalhes[item.id];
       await setDoc(docRef, { desempenhoQuestoes: { ...desempenhoAtual, questoesErradas, questoesErradasDetalhes } }, { merge: true });
       setDesempenhoQuestoes({ ...desempenhoAtual, questoesErradas, questoesErradasDetalhes });
     } catch (e) { console.error("Erro ao concluir revisão de questão:", e); }
     return;
   }
   if (item.tipo === "flashcard") {
     if (!usuario) return;
     try {
       const docRef = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
       const atualizado = { ...(desempenhoFlashcards || {}) };
       if (atualizado[item.id]) {
         atualizado[item.id] = { ...atualizado[item.id], revisaoEm: adicionarDias(new Date().toISOString().slice(0,10), 30) };
       }
       await setDoc(docRef, { desempenhoFlashcards: atualizado }, { merge: true });
       setDesempenhoFlashcards(atualizado);
     } catch (e) { console.error("Erro ao concluir revisão de flashcard:", e); }
     return;
   }
 };
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

  // --- Proteção: login/cadastro obrigatórios ---
  if (!usuario) {
    return <AuthScreen onLogin={setUsuario} />;
  }

  const dashboardTodayTasks = (() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const weekday = normalizarDiaSemana(new Date().toLocaleDateString("pt-BR", { weekday: "long" }));
      const studied = assuntosEstudadosSet();
      return (cronogramasSalvos || [])
        .filter((schedule) => !schedule.id?.includes("edital-todo"))
        .flatMap((schedule) => (schedule.blocos || []).filter((block) => block.data === today || (!block.data && normalizarDiaSemana(block.dia) === weekday)))
        .filter((block, index, list) => list.findIndex((item) => item.nome === block.nome && item.topico === block.topico) === index)
        .map((block) => ({ ...block, done: studied.has(`${block.nome}|||${block.topico}`) }));
    } catch { return []; }
  })();

  const dashboardProgressGroups = Object.entries(materiasPorBloco || {}).map(([block, subjects]) => {
    const total = (subjects || []).reduce((sum, subject) => sum + (subject.topicos?.length || 0), 0);
    const completed = (subjects || []).reduce((sum, subject) => sum + (estudos?.[subject.nome] || []).length, 0);
    const subjectNames = (subjects || []).map((subject) => nomeDisciplinaExibicao(subject.nome)).join(", ");
    return {
      name: subjectNames || block,
      total,
      completed,
      percent: total ? Math.min(100, Math.round((completed / total) * 100)) : 0,
    };
  });

  const dashboardExamDays = (() => {
    try {
      const date = (dataProvaEdital || {})[editalEscolhido];
      if (!date) return 0;
      const difference = Math.ceil((new Date(`${date}T12:00:00`) - new Date().setHours(0, 0, 0, 0)) / 86400000);
      return difference > 0 ? difference : 0;
    } catch { return 0; }
  })();

  const dashboardPerformance = materiaMaisForteEFraca();

  // --- Suas telas exatamente como no original ---
  async function revisarErrosDaMateria(materia) {
    try {
      const progressoRef = doc(db, "users", usuario.uid, "progresso", editalEscolhido);
      const snap = await getDoc(progressoRef);
      const dados = snap.exists() ? snap.data() : {};
      const idsErradas = dados?.desempenhoQuestoes?.questoesErradas?.[materia] || [];
      const filtradas = (questoes[editalEscolhido]?.[materia] || []).filter((item) => idsErradas.includes(item.id));
      if (!filtradas.length) {
        alert("Você ainda não tem questões erradas nesta matéria.");
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
      setQuestoesPuladas(0);
      setTela("questoes");
    } catch (error) {
      console.error("Erro ao buscar questões erradas:", error);
      alert("Não foi possível abrir sua revisão agora.");
    }
  }

  const renderTelas = {
    concurso: (
      <ExamSelection
        selectedExam={editalEscolhido}
        getProgress={progressoEdital}
        getDays={diasParaProvaEdital}
        onSelect={(id, nextScreen) => { setEditalEscolhido(id); setTela(nextScreen); }}
      />
    ),
    minhaConta: <MinhaConta setTela={setTela} />,
      
    desempenho: (
  <div className="min-h-screen" style={{background:"var(--surface-0)"}}>
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setTela("modulos")} className="text-sm px-3 py-1.5 rounded-xl" style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",color:"var(--text-secondary)"}}>← Voltar</button>
        <h2 className="font-medium" style={{fontSize:20,color:"var(--text-primary)"}}>Desempenho</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {label:"Questões feitas", value:(desempenhoQuestoes?.geral?.acertos||0)+(desempenhoQuestoes?.geral?.erros||0), color:"var(--text-primary)"},
          {label:"Taxa de acerto", value:`${totalQuestoesRespondidas()>0?Math.round(((desempenhoQuestoes?.geral?.acertos||0)/totalQuestoesRespondidas())*100):0}%`, color:"var(--text-success)"},
          {label:"Streak atual", value:`${calcularStreak()}d`, color:"var(--text-warning)"},
        ].map(({label,value,color}) => (
          <div key={label} style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:500,color}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Acerto por matéria */}
      <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:500,color:"var(--text-primary)",marginBottom:12}}>Acerto por matéria</div>
        {desempenhoQuestoes?.porMateria && Object.keys(desempenhoQuestoes.porMateria).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(desempenhoQuestoes.porMateria).map(([materia, dados]) => {
              const total = (dados.acertos||0) + (dados.erros||0);
              const pct = total > 0 ? Math.round((dados.acertos / total) * 100) : 0;
              const cor = pct >= 70 ? "var(--fill-success)" : pct >= 50 ? "var(--fill-warning)" : "var(--fill-danger)";
              const corText = pct >= 70 ? "var(--text-success)" : pct >= 50 ? "var(--text-warning)" : "var(--text-danger)";
              return (
                <div key={materia}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:"var(--text-primary)"}}>{materia}</span>
                    <span style={{fontWeight:500,color:corText}}>{pct}% ({dados.acertos}/{total})</span>
                  </div>
                  <div style={{height:5,background:"var(--surface-1)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:cor,borderRadius:99,transition:"width .3s"}}/>
                  </div>
                </div>
              );
            })}

            {/* Mensagem motivacional */}
            {(() => {
              const entries = Object.entries(desempenhoQuestoes.porMateria).map(([m,d]) => {
                const t=(d.acertos||0)+(d.erros||0); return {materia:m,pct:t>0?Math.round((d.acertos/t)*100):0,total:t};
              }).filter(e=>e.total>0);
              const forte = [...entries].sort((a,b)=>b.pct-a.pct)[0];
              const fraca = [...entries].sort((a,b)=>a.pct-b.pct)[0];
              if (!forte) return null;
              return (
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
                  {forte.pct >= 70 && (
                    <div style={{background:"var(--bg-success)",border:"0.5px solid var(--border-success)",borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      ⭐
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:"var(--text-success)"}}>Você está indo bem em {forte.materia}!</div>
                        <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{forte.pct}% de acerto. Continue assim.</div>
                      </div>
                    </div>
                  )}
                  {fraca && fraca.pct < 60 && fraca.materia !== forte.materia && (
                    <div style={{background:"var(--bg-warning)",border:"0.5px solid var(--border-warning)",borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                      🎯
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:"var(--text-warning)"}}>Foco em {fraca.materia}</div>
                        <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>Apenas {fraca.pct}% de acerto — 30 min de questões hoje já fazem diferença.</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            📊
            <div style={{fontSize:13,fontWeight:500,color:"var(--text-secondary)",marginBottom:4}}>Nenhuma questão respondida ainda</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:16}}>Responda questões ou flashcards para ver seu desempenho por matéria.</div>
            <button onClick={() => setTela("escolherMateria")} style={{fontSize:13,padding:"8px 20px"}}>Responder questões</button>
          </div>
        )}
      </div>

      {/* Ações */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={atualizarDesempenho} style={{fontSize:12,padding:"8px 16px",flex:1}}>Atualizar</button>
        <button onClick={async () => {
          if (confirm("Zerar todo o desempenho?")) {
            await setDoc(doc(db,"users",usuario.uid,"progresso",editalEscolhido),{desempenhoQuestoes:{geral:{acertos:0,erros:0},porMateria:{},questoesErradas:{},questoesErradasDetalhes:{}}});
            setDesempenhoQuestoes({geral:{acertos:0,erros:0},porMateria:{},questoesErradas:{},questoesErradasDetalhes:{}});
          }
        }} style={{fontSize:12,padding:"8px 16px",color:"var(--text-danger)",background:"var(--bg-danger)",border:"0.5px solid var(--border-danger)",borderRadius:"var(--radius)"}}>
          Zerar desempenho
        </button>
      </div>
    </div>
  </div>
),

    modulos: (
      <StudyDashboard
        firstName={(usuario?.displayName || usuario?.email || "Estudante").split(/[ @]/)[0]}
        examName={editalAtualNome}
        examProgress={progressoGeralEdital()}
        answered={totalQuestoesRespondidas()}
        accuracy={aproveitamentoGeral()}
        examDays={dashboardExamDays}
        streak={calcularStreak()}
        todayMinutes={tempoEstudadoHoje()}
        weekMinutes={tempoEstudadoSemana()}
        todayTasks={dashboardTodayTasks}
        pendingReviews={revisoesInteligentesPorData()}
        progressGroups={dashboardProgressGroups}
        strength={dashboardPerformance.forte}
        weakness={dashboardPerformance.fraca}
        onNavigate={setTela}
        onStartTask={(task) => { iniciarEstudo(task); setTela("cronograma"); }}
        onStartReview={iniciarRevisao}
      />
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
      <QuestionSessionScreen
        questions={questoesAtual}
        index={questaoIndex}
        selected={respostaSelecionada}
        correctAnswer={respostaCorreta}
        showExplanation={mostrarExplicacao}
        showText={mostrarTexto}
        hits={acertos}
        misses={erros}
        skipped={questoesPuladas}
        filter={filtroQuestoesAtual}
        subject={materiaEscolhida}
        message={mensagemQuestoes}
        onAnswer={responderQuestao}
        onToggleText={() => setMostrarTexto((value) => !value)}
        onPrevious={() => {
          if (questaoIndex === 0) return;
          setQuestaoIndex((value) => value - 1);
          setRespostaSelecionada(null);
          setRespostaCorreta(null);
          setMostrarExplicacao(false);
          setMostrarTexto(false);
        }}
        onSkip={pularQuestao}
        onNext={proximaQuestao}
        onExit={() => setTela(telaAnteriorQuestoes || "escolherMateria")}
        onSaveError={() => salvarCadernoErro(filtroQuestoesAtual?.materia || materiaEscolhida, {
          questao: questoesAtual[questaoIndex]?.enunciado?.slice(0, 180) || "Questão sem enunciado",
          erro: `Resposta marcada: ${String(respostaSelecionada)}`,
          correto: `Resposta correta: ${String(respostaCorreta)}`,
        })}
      />
    ),

resultadoQuestoes: (
  <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#080B12"}}>
    <div className="w-full max-w-md text-center">
      <div className="rounded-3xl p-8" style={{background:"#0E1320",border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontSize:52,marginBottom:12}}>{acertos > erros ? "🎉" : acertos === erros ? "💪" : "📚"}</div>
        <h2 className="font-black text-white mb-1" style={{fontSize:24}}>Sessão concluída!</h2>
        <p style={{fontSize:13,color:"#6B7A99",marginBottom:24}}>
          {acertos > erros ? "Mandou bem! Continue assim." : "Cada erro é aprendizado. Revise e volte!"}
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl p-4" style={{background:"rgba(34,199,122,0.08)",border:"1px solid rgba(34,199,122,0.2)"}}>
            <p style={{fontSize:26,fontWeight:800,color:"#22C77A"}}>{acertos}</p>
            <p style={{fontSize:11,color:"#6B7A99"}}>Acertos</p>
          </div>
          <div className="rounded-2xl p-4" style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)"}}>
            <p style={{fontSize:26,fontWeight:800,color:"#F87171"}}>{erros}</p>
            <p style={{fontSize:11,color:"#6B7A99"}}>Erros</p>
          </div>
          <div className="rounded-2xl p-4" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
            <p style={{fontSize:26,fontWeight:800,color:"#F5A623"}}>{questoesPuladas}</p>
            <p style={{fontSize:11,color:"#6B7A99"}}>Puladas</p>
          </div>
        </div>
        {(acertos + erros) > 0 && (
          <div className="mb-6">
            <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.round((acertos/(acertos+erros))*100)}%`,background:"#22C77A",borderRadius:99}}/>
            </div>
            <p style={{fontSize:12,color:"#6B7A99",marginTop:6}}>{Math.round((acertos/(acertos+erros))*100)}% de aproveitamento</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button onClick={() => setTela("escolherMateria")} className="w-full font-bold py-3 rounded-xl text-sm" style={{background:"#4F8EF7",color:"#fff"}}>📝 Fazer mais questões</button>
          <button onClick={() => setTela("modulos")} className="w-full font-semibold py-3 rounded-xl text-sm" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#9CA3AF"}}>← Voltar ao início</button>
        </div>
      </div>
    </div>
  </div>
),

meusSimulados: (
  <div className="min-h-screen" style={{background:"#080B12"}}>
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setTela("simulados")} className="text-sm px-3 py-1.5 rounded-xl" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",color:"#9CA3AF"}}>← Voltar</button>
        <h2 className="font-black text-white" style={{fontSize:20}}>📊 Meus Simulados</h2>
      </div>
      {resultadosSimulados.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{background:"#0E1320",border:"1px solid rgba(255,255,255,0.08)"}}>
          <p style={{fontSize:36,marginBottom:8}}>🎯</p>
          <p className="text-white font-bold mb-1">Nenhum simulado ainda</p>
          <p style={{fontSize:13,color:"#6B7A99",marginBottom:16}}>Faça seu primeiro simulado para ver o histórico aqui.</p>
          <button onClick={() => setTela("simulados")} className="font-bold px-6 py-2.5 rounded-xl text-sm" style={{background:"#4F8EF7",color:"#fff"}}>Fazer simulado</button>
        </div>
      ) : (
        <div className="space-y-3">
          {resultadosSimulados.map((r) => {
            const total = (r.acertos||0)+(r.erros||0);
            const pct = total>0?Math.round((r.acertos/total)*100):0;
            return (
              <div key={r.id} className="rounded-2xl p-5" style={{background:"#0E1320",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white">{r.titulo || "Simulado"}</p>
                    <p style={{fontSize:11,color:"#6B7A99"}}>{r.dataHora ? new Date(r.dataHora).toLocaleDateString("pt-BR", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</p>
                  </div>
                  <p style={{fontSize:22,fontWeight:800,color:pct>=70?"#22C77A":pct>=50?"#F5A623":"#F87171"}}>{pct}%</p>
                </div>
                <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",marginBottom:8}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct>=70?"#22C77A":pct>=50?"#F5A623":"#EF4444",borderRadius:99}}/>
                </div>
                <p style={{fontSize:12,color:"#6B7A99"}}>✅ {r.acertos||0} acertos · ❌ {r.erros||0} erros · {total} questões</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
          <button onClick={async () => { await buscarResultadosSimulados(); setTela("meusSimulados"); }}
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
  <SubjectSelectionScreen
    examName={editalAtualNome}
    subjects={editalEscolhido ? questoes[editalEscolhido] : {}}
    performance={desempenhoQuestoes}
    onStart={(materia) => iniciarQuestoesDaMateria(materia, "", "escolherMateria")}
    onMaterial={abrirMaterial}
    onReview={revisarErrosDaMateria}
  />
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
          <button onClick={() => setTela("historicoEstudo")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">📚 Histórico</button>
        </div>
      </div>
    </header>

    {!blocoSelecionado ? (
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* Abas */}
        <div className="flex gap-1.5 flex-wrap">
          {[["mensal", "🗓️", "Mensal"], ["semanal", "📅", "Semanal"], ["diario", "☀️", "Diário"], ["editalTodo", "📋", "Edital todo"], ["meus", "💾", "Salvos"], ["revisoes", "🔁", "Revisões"]].map(([id, emoji, label]) => (
            <button key={id} onClick={() => setAbaCronograma(id)}
              style={{
                padding:"7px 14px",
                borderRadius:10,
                fontSize:12,
                fontWeight:600,
                border: abaCronograma===id ? "none" : "1px solid rgba(255,255,255,0.08)",
                background: abaCronograma===id ? "#4F8EF7" : "rgba(255,255,255,0.04)",
                color: abaCronograma===id ? "#fff" : "#9CA3AF",
                transition:"all .15s",
                cursor:"pointer",
              }}>
              {emoji} {label}
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
              <div className="rounded-2xl p-5 space-y-4" style={{background:"#0E1320",border:"1px solid rgba(255,255,255,0.07)"}}>
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
                    const isHoje = bloco.data === new Date().toISOString().slice(0,10);
                    return (
                      <div key={idx} style={{
                        borderRadius:12,
                        padding:"12px 14px",
                        border: concluido ? "0.5px solid var(--border-success)" : isHoje ? "2px solid var(--border-accent)" : "0.5px solid var(--border)",
                        background: concluido ? "var(--bg-success)" : isHoje ? "var(--bg-accent)" : "var(--surface-2)",
                        opacity: concluido ? 0.7 : 1,
                        transition:"all .15s",
                      }}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:10,flex:1,minWidth:0}}>
                            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:concluido?"var(--fill-success)":isHoje?"var(--fill-accent)":"var(--surface-1)",border:"0.5px solid var(--border)",flexShrink:0,marginTop:1,fontSize:12}}>
                              {concluido ? "✓" : isHoje ? "▶" : "○"}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                                <span style={{fontSize:13,fontWeight:500,color:concluido?"var(--text-success)":"var(--text-primary)",textDecoration:concluido?"line-through":"none"}}>{nomeDisciplinaExibicao(bloco.nome)}</span>
                                <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"var(--surface-1)",color:"var(--text-muted)",border:"0.5px solid var(--border)"}}>{bloco.tempo}min</span>
                                {concluido && <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"var(--bg-success)",color:"var(--text-success)",border:"0.5px solid var(--border-success)"}}>Concluído</span>}
                                {isHoje && !concluido && <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:"var(--bg-accent)",color:"var(--text-accent)",border:"0.5px solid var(--border-accent)"}}>Hoje</span>}
                              </div>
                              <p style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.4}}>{bloco.topico}</p>
                            </div>
                          </div>
                          {!concluido && (
                            <button onClick={() => iniciarEstudo(bloco)} style={{flexShrink:0,fontSize:12,padding:"6px 14px",fontWeight:500,background:isHoje?"var(--fill-accent)":"var(--surface-1)",color:isHoje?"var(--on-accent)":"var(--text-secondary)",border:isHoje?"none":"0.5px solid var(--border)",borderRadius:"var(--radius)"}}>
                              Iniciar
                            </button>
                          )}
                        </div>
                        {!concluido && (
                          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                            <button onClick={() => abrirMaterial(bloco.nome, bloco.topico)} style={{fontSize:11,padding:"4px 10px"}}>Material</button>
                            <button onClick={() => iniciarQuestoesDaMateria(bloco.nome, bloco.topico)} style={{fontSize:11,padding:"4px 10px"}}>Questões</button>
                            <button onClick={() => abrirFlashcards(bloco.nome, bloco.topico)} style={{fontSize:11,padding:"4px 10px"}}>Flashcards</button>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p style={{fontSize:12,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em"}}>Cronogramas salvos</p>
              <span style={{fontSize:12,color:"#6B7A99"}}>{cronogramasSalvos.length} no total</span>
            </div>
            {cronogramasSalvos.length === 0
              ? <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"32px",textAlign:"center",color:"#6B7A99",fontSize:13}}>
                  Nenhum cronograma salvo ainda.<br/>Gere um nas abas Diário, Semanal ou Mensal.
                </div>
              : cronogramasSalvos.map((c) => {
                  const ativo = cronogramaAtivoId === c.id;
                  const totalBlocos = c.blocos?.length || 0;
                  const estudados = assuntosEstudadosSet();
                  const concluidos = (c.blocos||[]).filter(b => estudados.has(`${b.nome}|||${b.topico}`)).length;
                  const pctConc = totalBlocos > 0 ? Math.round((concluidos/totalBlocos)*100) : 0;
                  const isEditalTodo = c.id?.includes("edital-todo");
                  const isMensal = c.id?.includes("mensal");
                  const tipo = isEditalTodo ? "📋 Edital completo" : isMensal ? "🗓️ Mensal" : c.tipo === "diario" ? "☀️ Diário" : "📅 Semanal";
                  const materias = [...new Set((c.blocos||[]).slice(0,10).map(b => nomeDisciplinaExibicao(b.nome)).filter(Boolean))].slice(0,4);
                  return (
                    <div key={c.id} style={{
                      borderRadius:14,
                      border: ativo ? "2px solid rgba(79,142,247,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      background: ativo ? "rgba(79,142,247,0.06)" : "rgba(255,255,255,0.03)",
                      overflow:"hidden",
                    }}>
                      <div style={{padding:"14px 16px"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                              <span style={{fontSize:11,color:"#9CA3AF"}}>{tipo}</span>
                              {ativo && <span style={{fontSize:10,background:"rgba(79,142,247,0.2)",color:"#4F8EF7",border:"1px solid rgba(79,142,247,0.3)",padding:"1px 8px",borderRadius:99,fontWeight:600}}>Ativo</span>}
                            </div>
                            <p style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.titulo}</p>
                            <p style={{fontSize:11,color:"#6B7A99"}}>{totalBlocos} blocos · {c.criadoEm ? formatarDataBR(c.criadoEm.slice(0,10)) : "—"}</p>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <p style={{fontSize:20,fontWeight:700,color:pctConc===100?"#22C77A":pctConc>0?"#4F8EF7":"#6B7A99"}}>{pctConc}%</p>
                            <p style={{fontSize:11,color:"#6B7A99"}}>{concluidos}/{totalBlocos}</p>
                          </div>
                        </div>
                        <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",marginTop:10}}>
                          <div style={{height:"100%",width:`${pctConc}%`,background:pctConc===100?"#22C77A":"#4F8EF7",borderRadius:99,transition:"width .3s"}}/>
                        </div>
                        {materias.length > 0 && (
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>
                            {materias.map(m => <span key={m} style={{fontSize:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#9CA3AF",padding:"2px 8px",borderRadius:99,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m}</span>)}
                            {[...new Set((c.blocos||[]).map(b => b.nome).filter(Boolean))].length > 4 && (
                              <span style={{fontSize:10,color:"#6B7A99"}}>+{[...new Set((c.blocos||[]).map(b => b.nome).filter(Boolean))].length - 4} mais</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px 16px",display:"flex",gap:8}}>
                        <button onClick={() => { definirCronogramaAtivo(c); setAbaCronograma(isEditalTodo ? "editalTodo" : isMensal ? "mensal" : c.tipo === "diario" ? "diario" : "semanal"); }}
                          style={{flex:1,fontSize:12,fontWeight:600,padding:"8px",borderRadius:8,background:"rgba(79,142,247,0.12)",border:"1px solid rgba(79,142,247,0.25)",color:"#4F8EF7",cursor:"pointer"}}>
                          {isEditalTodo || isMensal ? "📅 Ver no calendário" : "▶ Carregar cronograma"}
                        </button>
                        <button onClick={async () => {
                          if (!window.confirm(`Excluir "${c.titulo}"?`)) return;
                          const lista = cronogramasSalvos.filter(x => x.id !== c.id);
                          await salvarCronogramasUsuario(lista);
                          if (cronogramaAtivoId === c.id) { setCronogramaAtivoId(null); setBlocos([]); }
                        }} style={{fontSize:12,padding:"8px 12px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#F87171",cursor:"pointer"}}>
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
        <div className="min-h-screen flex flex-col" style={{background:"#080B12"}}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setModoFoco(v => !v)}
              className="text-xs font-bold px-4 py-2 rounded-xl transition-all"
              style={{background:modoFoco?"rgba(79,142,247,0.2)":"rgba(255,255,255,0.06)",border:modoFoco?"1px solid rgba(79,142,247,0.4)":"1px solid rgba(255,255,255,0.08)",color:modoFoco?"#4F8EF7":"#9CA3AF"}}>
              🎯 {modoFoco ? "Sair do foco" : "Modo foco"}
            </button>
            <button onClick={() => { setBlocoSelecionado(null); setModoFoco(false); }}
              className="text-xs font-semibold px-4 py-2 rounded-xl"
              style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",color:"#9CA3AF"}}>
              ← Voltar ao cronograma
            </button>
          </div>

          {/* Card central */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <div className="w-full max-w-xl">
              <div className="rounded-3xl overflow-hidden" style={{background:"#0E1320",border:"1px solid rgba(255,255,255,0.07)"}}>

                {/* Matéria */}
                <div className="text-center px-8 pt-8 pb-6" style={{background:"linear-gradient(180deg,rgba(79,142,247,0.06) 0%,transparent 100%)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-3" style={{background:"rgba(79,142,247,0.15)",color:"#4F8EF7",border:"1px solid rgba(79,142,247,0.25)"}}>
                    {blocoSelecionado.nome}
                  </span>
                  <h2 className="text-xl font-black text-white leading-tight">{blocoSelecionado.topico || blocoSelecionado.nome}</h2>
                  <p className="text-xs mt-2" style={{color:"#6B7A99"}}>{blocoSelecionado.tempo || 30} minutos programados</p>
                </div>

                {/* Cronômetro */}
                <div className="px-8 py-8 text-center">
                  {/* Anel SVG */}
                  <div className="relative inline-block mb-6">
                    {(() => {
                      const circum = 2 * Math.PI * 78;
                      const offset = circum * (1 - Math.min(1, Math.max(0, progresso / 100)));
                      return (
                        <svg width="180" height="180" style={{transform:"rotate(-90deg)"}}>
                          <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                          <circle cx="90" cy="90" r="78" fill="none" stroke="#4F8EF7" strokeWidth="8"
                            strokeDasharray={circum} strokeDashoffset={offset}
                            strokeLinecap="round" style={{transition:"stroke-dashoffset 0.5s ease"}}/>
                        </svg>
                      );
                    })()}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="font-black" style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:42,color:"#4F8EF7",letterSpacing:-2,lineHeight:1}}>{tempoFormatado()}</div>
                      <div className="text-xs mt-1" style={{color:"#6B7A99"}}>restantes</div>
                    </div>
                  </div>

                  {/* Barra linear */}
                  <div className="mb-8">
                    <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{background:"rgba(255,255,255,0.06)"}}>
                      <div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,Math.max(0,progresso))}%`,background:"linear-gradient(90deg,#4F8EF7,#7C5CFC)"}}/>
                    </div>
                    <p className="text-[11px]" style={{color:"#6B7A99"}}>{Math.round(Math.min(100,Math.max(0,progresso)))}% concluído</p>
                  </div>

                  {/* Botões principais */}
                  <div className="flex flex-wrap gap-2 justify-center mb-3">
                    <button onClick={() => setPausado(p => !p)}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:pausado?"#22C77A":"#F5A623",color:"#000"}}>
                      {pausado ? "▶ Retomar" : "⏸ Pausar"}
                    </button>
                    <button onClick={() => setTempoRestante(blocoSelecionado.tempo * 60)}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"#D1D5DB"}}>
                      🔁 Resetar
                    </button>
                    <button onClick={() => iniciarQuestoesDaMateria(blocoSelecionado.nome, blocoSelecionado.topico)}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(34,199,122,0.12)",border:"1px solid rgba(34,199,122,0.25)",color:"#22C77A"}}>
                      📝 Questões
                    </button>
                    <button onClick={() => abrirFlashcards(blocoSelecionado.nome, blocoSelecionado.topico)}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(124,92,252,0.12)",border:"1px solid rgba(124,92,252,0.25)",color:"#7C5CFC"}}>
                      🧠 Flashcards
                    </button>
                  </div>

                  {/* Botões secundários */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button onClick={async () => { await salvarMateriaPendente(blocoSelecionado); setBlocoSelecionado(null); setModoFoco(false); setTelaEscura(false); }}
                      className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.25)",color:"#F5A623"}}>
                      📌 Continuar depois
                    </button>
                    <button onClick={() => { setTelaEscura(true); setMostrarConfirmar("mostrar-buttons"); }}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"#22C77A",color:"#000"}}>
                      ✅ Concluir matéria
                    </button>
                  </div>
                </div>

                {/* Confirmação de conclusão */}
                {telaEscura && mostrarConfirmar === "mostrar-buttons" && (
                  <div className="px-6 py-5 text-center" style={{borderTop:"1px solid rgba(255,255,255,0.06)",background:"rgba(34,199,122,0.04)"}}>
                    <p className="text-base font-black mb-1" style={{color:"#22C77A"}}>Você finalizou mesmo? 🎉</p>
                    <p className="text-xs mb-4" style={{color:"#6B7A99"}}>Marcar <strong className="text-white">{blocoSelecionado.topico||blocoSelecionado.nome}</strong> como estudado no edital?</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={async () => { if (usuario && blocoSelecionado) { await registrarEstudo(usuario.uid, blocoSelecionado.nome, blocoSelecionado.topico, blocoSelecionado.tempo); setAtualizarHistorico(v => v + 1); } setBlocoSelecionado(null); setTelaEscura(false); setMostrarConfirmar(false); setModoFoco(false); }}
                        className="font-bold text-sm px-5 py-2.5 rounded-xl" style={{background:"#4F8EF7",color:"#fff"}}>
                        ✅ Sim, marcar como estudado
                      </button>
                      <button onClick={() => { setTelaEscura(false); setMostrarConfirmar(false); }}
                        className="font-bold text-sm px-5 py-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"#9CA3AF"}}>
                        ⏳ Continuar estudando
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cards info abaixo */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  {label:"Hoje", value:formatarTempo(tempoEstudadoHoje()*60), color:"#4F8EF7"},
                  {label:"Streak", value:`🔥 ${calcularStreak()}d`, color:"#F5A623"},
                  {label:"Progresso", value:`${Math.round(Math.min(100,Math.max(0,progresso)))}%`, color:"#22C77A"},
                ].map(({label,value,color}) => (
                  <div key={label} className="text-center rounded-2xl py-3 px-2" style={{background:"#0E1320",border:"1px solid rgba(255,255,255,0.07)"}}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{color:"#6B7A99"}}>{label}</p>
                    <p className="font-black text-base" style={{color}}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
 ),

editalCompleto: (
  <EditalScreen
    examName={editalAtualNome}
    blocks={materiasPorBloco}
    completedTopics={assuntosEstudadosSet()}
    pendingCount={assuntosPendentesDoEdital().length}
    progress={progressoGeralEdital()}
    getSubjectProgress={calcularProgressoDisciplina}
    performance={desempenhoQuestoes}
    onToggleTopic={alternarAssuntoEdital}
    onStartQuestions={(materia) => iniciarQuestoesDaMateria(materia, "", "editalCompleto")}
  />
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
                <div key={`${r.tipo}-${r.id || idx}`} className="w-full bg-white/4 border border-white/6 rounded-xl p-3.5 transition-all" style={r.atrasadaDias > 0 ? {borderColor:"rgba(239,68,68,0.3)"} : {}}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => iniciarRevisao(r)}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">{r.tipo === "questao" ? "Questão errada" : r.tipo === "flashcard" ? "Flashcard" : r.nome}</span>
                        {r.atrasadaDias > 0 && <span style={{fontSize:9,padding:"1px 7px",borderRadius:99,background:"rgba(239,68,68,0.15)",color:"#F87171",border:"1px solid rgba(239,68,68,0.3)",fontWeight:700}}>⚠ {r.atrasadaDias}d atrasada</span>}
                      </div>
                      <p className="text-sm font-bold text-white mt-0.5">{r.materia}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.assunto}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => iniciarRevisao(r)}
                        className="text-xs border border-amber-400/20 text-amber-300 px-3 py-1.5 rounded-xl"
                        style={{background:"rgba(245,166,35,0.1)"}}>
                        Revisar →
                      </button>
                      <button onClick={() => concluirRevisao(r)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{background:"rgba(34,199,122,0.15)",border:"1px solid rgba(34,199,122,0.3)",color:"#22C77A"}}>
                        ✅ Concluído
                      </button>
                    </div>
                  </div>
                </div>
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


resumos: (
  <SummariesScreen
    examName={editalAtualNome}
    blocks={materiasPorBloco}
    summaries={resumosMateria}
    manualQuestions={questoesManuais}
    errorBook={cadernoErros}
    completedTopics={assuntosEstudadosSet()}
    loading={loadingExtras}
    subject={resumosMateriaFiltro}
    topic={resumosAssuntoFiltro}
    tab={abaMateria}
    saveStatus={resumoSalvoStatus}
    onSelectSubject={setResumosMateriaFiltro}
    onSelectTopic={setResumoAssuntoFiltro}
    onChangeTab={setAbaMateria}
    onSaveSummary={async (chave, dados) => {
      setResumoSalvoStatus("salvando");
      await salvarResumoMateria(chave, dados);
      setResumoSalvoStatus("salvo");
      setTimeout(() => setResumoSalvoStatus(""), 1800);
    }}
    onSaveSession={salvarSessaoQuestoes}
    onSaveError={salvarCadernoErro}
  />
),

};

  // Renderização principal
  const _hojeStr = new Date().toISOString().slice(0,10);
  const _diaSemana = normalizarDiaSemana(new Date().toLocaleDateString("pt-BR", { weekday: "long" }));
  const _dataProva = (dataProvaEdital||{})[editalEscolhido] || null;
  const _diasProva = (() => { if (!_dataProva) return null; try { const d=Math.ceil((new Date(_dataProva+"T12:00:00")-new Date().setHours(0,0,0,0))/86400000); return isNaN(d)?null:d; } catch{return null;} })();
  const _blocosHoje = (() => { try { return (cronogramasSalvos||[]).filter(c=>!c.id?.includes("edital-todo")).flatMap(c=>(c.blocos||[]).filter(b=>b.data===_hojeStr||(!b.data&&normalizarDiaSemana(b.dia)===_diaSemana))).filter((b,i,a)=>a.findIndex(x=>x.nome===b.nome&&x.topico===b.topico)===i).slice(0,6); } catch{return[];} })();
  const _revisoes = (() => { try { const r=[]; Object.entries(estudosDetalhes||{}).forEach(([k,det])=>{ if(!det?.concluidoEm)return; const d=Math.floor((new Date()-new Date(det.concluidoEm))/86400000); if(d===1||d===7||d===30){const[m,a]=k.split("|||");if(m&&a)r.push({materia:m,assunto:a,diff:d});} }); return r.slice(0,4); } catch{return[];} })();

return (
  <>
    {/* Modal Briefing */}
    {mostrarBriefing && editalEscolhido && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-950 border border-white/12 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-900/60 to-purple-900/60 px-6 py-5">
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Bom dia! 👋</p>
            <h2 className="text-xl font-black text-white mt-0.5">Sua agenda de hoje</h2>
            <p className="text-xs text-gray-400 mt-0.5">{editalAtualNome}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {_blocosHoje.length>0&&<span className="bg-black/30 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">📚 {_blocosHoje.length} matéria{_blocosHoje.length>1?"s":""}</span>}
              {_revisoes.length>0&&<span className="bg-black/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">🔁 {_revisoes.length} revisão{_revisoes.length>1?"ões":""}</span>}
              {_diasProva>0&&<span className="bg-black/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">📅 {_diasProva}d</span>}
            </div>
          </div>
          <div className="px-5 py-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {_blocosHoje.map((b,i)=>(
              <div key={"b"+i} className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{b.nome}</p>{b.topico&&<p className="text-[10px] text-gray-500 truncate">{b.topico}</p>}</div>
                <span className="text-[10px] text-gray-500 shrink-0">{b.tempo||30}min</span>
              </div>
            ))}
            {_revisoes.map((r,i)=>(
              <div key={"r"+i} className="flex items-center gap-2 bg-purple-500/8 border border-purple-400/15 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{r.materia}</p><p className="text-[10px] text-gray-500 truncate">{r.assunto}</p></div>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full shrink-0">D+{r.diff}</span>
              </div>
            ))}
            {_blocosHoje.length===0&&_revisoes.length===0&&(
              <div className="text-center py-6"><p className="text-3xl mb-2">🎯</p><p className="text-sm text-gray-400">Nenhuma tarefa programada ainda.</p></div>
            )}
            <div className="bg-black/40 border border-white/8 rounded-xl p-3 mt-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">📅 Data da prova</p>
              <input type="date" value={_dataProva||""} onChange={e=>salvarDataProva(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none"/>
              {_diasProva>0&&<p className="text-xs text-cyan-400 mt-1 font-bold text-center">🔥 {_diasProva} dias restantes!</p>}
            </div>
          </div>
          <div className="px-5 py-4 border-t border-white/8 space-y-2">
            <button onClick={()=>{setMostrarBriefing(false);setTela("modulos");}} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-sm">🚀 Começar a estudar</button>
            <button onClick={()=>{try{localStorage.setItem(`briefing-${editalEscolhido}-${_hojeStr}`,"1");}catch{} setMostrarBriefing(false);setTela("modulos");}} className="w-full text-xs text-gray-500 hover:text-gray-300 py-2">Não mostrar mais hoje</button>
          </div>
        </div>
      </div>
    )}

    {false && !acessoLiberado && tela !== "login" && <TelaBloqueioPagamento />}

    {tela === "concurso" ? renderTelas[tela] : (
      <InternalShell
        screen={tela}
        examName={editalAtualNome}
        user={usuario}
        onNavigate={setTela}
        onChangeExam={() => { setEditalEscolhido(null); setTela("concurso"); }}
        onLogout={() => signOut(auth)}
      >
      {renderTelas[tela] || (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-xl text-white">Tela não encontrada.</p>
      </div>
      )}
      </InternalShell>
    )}
  </>
);
}
