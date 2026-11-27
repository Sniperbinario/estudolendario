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
import { StudyIcon } from "./components/StudyIcon";
import StudyDashboard from "./screens/StudyDashboard";
import SubjectSelectionScreen from "./screens/SubjectSelectionScreen";
import QuestionSessionScreen from "./screens/QuestionSessionScreen";
import EditalScreen from "./screens/EditalScreen";
import SummariesScreen from "./screens/SummariesScreen";
import FlashcardsScreen from "./screens/FlashcardsScreen";
import FocusTimerScreen from "./screens/FocusTimerScreen";
import PerformanceScreen from "./screens/PerformanceScreen";
import MaterialSupportScreen from "./screens/MaterialSupportScreen";
import SessionResultScreen from "./screens/SessionResultScreen";
import { SimulationsHubScreen, SimulationSessionScreen, SimulationResultScreen, SimulationHistoryScreen } from "./screens/SimulationScreens";
import ReviewScreen from "./screens/ReviewScreen";
import StudyHistoryScreen from "./screens/StudyHistoryScreen";
import DailyChallengeScreen from "./screens/DailyChallengeScreen";
import LiaSchedulePlanner from "./components/LiaSchedulePlanner";
import { askLia } from "./services/studyApi";
import { buildIntelligentSchedule } from "./services/liaScheduleEngine";
import { downloadSchedulePdf, printSchedule } from "./services/scheduleExport";
import { ScheduleGeneratorScreen, MyScheduleScreen, PendingScheduleScreen } from "./screens/ScheduleHubScreens";
import { activityKey, archivePlan, blockStatus, createReviewCycle, derivePending, extractDeferredStartSubjects, normalizePlans, planPeriod, rescheduleReview, upsertPlanSlot } from "./services/studyPlanning";


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
  const [nomeUsuario, setNomeUsuarioState] = useState("");
  const setNomeUsuario = (value) => {
    const normalized = String(value || "").trim();
    if (normalized) setNomeUsuarioState(normalized);
  };
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
          setNomeUsuario(dados.nome || dados.nomeCompleto || dados.name || dados.primeiroNome || user.displayName);
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
    setDesempenhoQuestoes({ geral: { acertos: 0, erros: 0 }, porMateria: {}, questoesErradas: {}, questoesErradasDetalhes: {} });
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
  const [cronometroIniciado, setCronometroIniciado] = useState(false);
  const [faseCronometro, setFaseCronometro] = useState("focus");
  const [conclusaoCronometro, setConclusaoCronometro] = useState("");
  const [duracaoCiclo, setDuracaoCiclo] = useState(0);
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
  const [desempenhoQuestoes, setDesempenhoQuestoes] = useState({
    geral: { acertos: 0, erros: 0 },
    porMateria: {},
    questoesErradas: {},
    questoesErradasDetalhes: {},
  });
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
  const [liaCronogramaLoading, setLiaCronogramaLoading] = useState(false);
  const [liaCronogramaError, setLiaCronogramaError] = useState("");
  const [liaCronogramaPreview, setLiaCronogramaPreview] = useState(null);
  const [horasSemana, setHorasSemana] = useState({
    Segunda: 0,
    Terça: 0,
    Quarta: 0,
    Quinta: 0,
    Sexta: 0,
    Sábado: 0,
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
  const [abaCronograma, setAbaCronograma] = useState("lia");
  const [dataDiaria, setDataDiaria] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataSemana, setDataSemana] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataMensal, setDataMensal] = useState(() => new Date().toISOString().slice(0, 7));
  const [cronogramasSalvos, setCronogramasSalvos] = useState([]);
  const [cronogramasHistorico, setCronogramasHistorico] = useState([]);
  const [atividadesConcluidas, setAtividadesConcluidas] = useState({});
  const [ciclosRevisao, setCiclosRevisao] = useState({});
  const [pendenciasCronograma, setPendenciasCronograma] = useState([]);
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
  const [flashcardsPersonalizados, setFlashcardsPersonalizados] = useState([]);
  // Resumos e caderno de erros por matéria
  const [resumosMateria, setResumosMateria] = useState({});
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [cadernoErros, setCadernoErros] = useState({});
  const [questoesManuais, setQuestoesManuais] = useState({});
  const [indicadoresManuais, setIndicadoresManuais] = useState([]);
  const [materiaAberta, setMateriaAberta] = useState(null);
  const [abaMateria, setAbaMateria] = useState("resumo");
  // Estados para formulário do caderno (não podem ficar dentro de map)
  const [novoErroForm, setNovoErroForm] = useState({ questao: "", erro: "", correto: "" });
  // Estados para cronograma edital todo
  const [horasEditalTodo, setHorasEditalTodo] = useState(2);
  const [diasEditalTodo, setDiasEditalTodo] = useState({ Segunda:0, Terça:0, Quarta:0, Quinta:0, Sexta:0, Sábado:0, Domingo:0 });
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
async function salvarIndicadorManual(entrada) {
  if (!usuario || !editalEscolhido) return;
  const registro = { ...entrada, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() };
  const lista = [...indicadoresManuais, registro];
  setIndicadoresManuais(lista);
  await setDoc(doc(db, "users", usuario.uid, "extras", editalEscolhido), { indicadoresManuais: lista }, { merge: true });
}
async function excluirIndicadorManual(id) {
  if (!usuario || !editalEscolhido) return;
  const lista = indicadoresManuais.filter((item) => item.id !== id);
  setIndicadoresManuais(lista);
  await setDoc(doc(db, "users", usuario.uid, "extras", editalEscolhido), { indicadoresManuais: lista }, { merge: true });
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
      setFlashcardsPersonalizados(Array.isArray(d.flashcardsPersonalizados) ? d.flashcardsPersonalizados : []);
      setIndicadoresManuais(Array.isArray(d.indicadoresManuais) ? d.indicadoresManuais : []);
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
      setCadernoErros({});
      setQuestoesManuais({});
      setFlashcardsPersonalizados([]);
      setIndicadoresManuais([]);
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
    setNomeUsuario(dados.nome || dados.nomeCompleto || dados.name || dados.primeiroNome || dados.displayName || usuario.displayName);
    const estudosPorEdital = dados.estudosPorEdital || {};
    const detalhesPorEdital = dados.estudosDetalhesPorEdital || {};
    const estudosEdital = { ...(estudosPorEdital[editalEscolhido] || {}) };
    const detalhesEdital = { ...(detalhesPorEdital[editalEscolhido] || {}) };
    const ciclosPorEdital = dados.ciclosRevisaoPorEdital || {};
    const ciclosEdital = { ...(ciclosPorEdital[editalEscolhido] || {}) };
    const jaConcluido = Boolean(detalhesEdital[chave]?.concluidoEm);

    const listaMateria = Array.isArray(estudosEdital[materia]) ? estudosEdital[materia] : [];
    estudosEdital[materia] = listaMateria.includes(assunto) ? listaMateria : [...listaMateria, assunto];
    // Inicia o ciclo de revisão espaçada: nível 0, primeira revisão amanhã (D+1)
    detalhesEdital[chave] = {
      ...(detalhesEdital[chave] || {}),
      materia, assunto, edital: editalEscolhido,
      concluidoEm: detalhesEdital[chave]?.concluidoEm || agora,
      tempoMin: (Number(detalhesEdital[chave]?.tempoMin) || 0) + (Number(tempoMin) || 0),
    };
    if (!jaConcluido) ciclosEdital[chave] = createReviewCycle({ examId: editalEscolhido, subject: materia, topic: assunto, completedAt: agora });

    await setDoc(userRef, {
      estudosPorEdital: { ...estudosPorEdital, [editalEscolhido]: estudosEdital },
      estudosDetalhesPorEdital: { ...detalhesPorEdital, [editalEscolhido]: detalhesEdital },
      ciclosRevisaoPorEdital: { ...ciclosPorEdital, [editalEscolhido]: ciclosEdital },
    }, { merge: true });

    setEstudosDetalhes(detalhesEdital);
    setCiclosRevisao(ciclosEdital);
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
  try {
    const lista = upsertPlanSlot(cronogramasSalvos, cronograma);
    await salvarCronogramasUsuario(lista);
    setCronogramaAtivoId(cronograma.id);
  } catch (error) {
    setLiaCronogramaError(error.message);
    throw error;
  }
}



useEffect(() => {
  async function carregarDadosDeEstudo() {
    if (!usuario || !editalEscolhido) {
      setCronogramasSalvos([]);
      setCronogramasHistorico([]);
      setAtividadesConcluidas({});
      setCiclosRevisao({});
      setPendenciasCronograma([]);
      setBlocos([]);
      setCronogramaAtivoId(null);
      setEstudosDetalhes({});
      return;
    }
    const snap = await getDoc(doc(db, "users", usuario.uid));
    const dados = snap.exists() ? snap.data() : {};
    setNomeUsuario(dados.nome || dados.nomeCompleto || dados.name || dados.primeiroNome || usuario.displayName);

    const cronogramasDoEdital = dados.cronogramasPorEdital?.[editalEscolhido]
      || (dados.cronogramas || []).filter((c) => c.edital === editalEscolhido)
      || [];

    const detalhesDoEdital = dados.estudosDetalhesPorEdital?.[editalEscolhido]
      || (editalEscolhido === "pf" ? (dados.estudosDetalhes || {}) : {})
      || {};

    const todosNormalizados = normalizePlans(cronogramasDoEdital);
    const hoje = new Date().toISOString().slice(0, 10);
    const expirados = todosNormalizados.filter((plan) => planPeriod(plan).end && planPeriod(plan).end < hoje);
    const cronogramasNormalizados = todosNormalizados.filter((plan) => !expirados.some((expired) => expired.id === plan.id));
    const atividadesDoEdital = dados.atividadesCronogramaPorEdital?.[editalEscolhido] || {};
    const topicosConcluidos = new Set(Object.keys(detalhesDoEdital));
    const atividadesSet = new Set(Object.keys(atividadesDoEdital));
    const historicoAnterior = dados.cronogramasHistoricoPorEdital?.[editalEscolhido] || [];
    const pendenciasAnteriores = dados.pendenciasCronogramaPorEdital?.[editalEscolhido] || [];
    const pendenciasExpiradas = expirados.flatMap((plan) => (plan.blocos || []).filter((block) => blockStatus(block, topicosConcluidos, atividadesSet, hoje) !== "concluido").map((block) => ({ ...block, pendingId: `${plan.id}::${block.id}`, planId: plan.id, planType: plan.tipo, planTitle: plan.titulo, originalDate: block.data, archived: true })));
    const historicoAtual = [...expirados.map((plan) => ({ ...plan, status: "expirado", expiradoEm: new Date().toISOString() })), ...historicoAnterior].filter((plan, index, list) => list.findIndex((item) => item.id === plan.id) === index).slice(0, 30);
    const pendenciasAtuais = [...pendenciasExpiradas, ...pendenciasAnteriores].filter((item, index, list) => list.findIndex((candidate) => candidate.pendingId === item.pendingId) === index);
    setCronogramasSalvos(cronogramasNormalizados);
    setCronogramasHistorico(historicoAtual);
    setAtividadesConcluidas(atividadesDoEdital);
    setCiclosRevisao(dados.ciclosRevisaoPorEdital?.[editalEscolhido] || {});
    setPendenciasCronograma(pendenciasAtuais);
    setEstudosDetalhes(detalhesDoEdital);
    if (expirados.length) {
      await setDoc(doc(db, "users", usuario.uid), {
        cronogramasPorEdital: { ...(dados.cronogramasPorEdital || {}), [editalEscolhido]: cronogramasNormalizados },
        cronogramasHistoricoPorEdital: { ...(dados.cronogramasHistoricoPorEdital || {}), [editalEscolhido]: historicoAtual },
        pendenciasCronogramaPorEdital: { ...(dados.pendenciasCronogramaPorEdital || {}), [editalEscolhido]: pendenciasAtuais },
      }, { merge: true });
    }

    const ativo = cronogramasNormalizados[0];
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
  if (tela !== "simuladoAndamento") return undefined;
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
}, [tela]);

// ✅ Função para responder questões
function responderSimulado(opcao) {
  const questao = questoesSimuladoAtual[questaoAtual];
  if (!questao) return;
  const materia = questao.materia || "Geral";
  const acertou = opcao === questao.correta;

  setRespostasSimulado((prev) => {
    const respostas = [...prev];
    respostas[questaoAtual] = acertou;
    return respostas;
  });

  setResumoSimulado((prev) => ({
    ...prev,
    total: prev.total + 1,
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
    if (tempoRestante > 0 && cronometroIniciado && !pausado && blocoSelecionado) {
      intervalo = setInterval(() => setTempoRestante((t) => t - 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante, cronometroIniciado, pausado, blocoSelecionado]);

  useEffect(() => {
    if (tempoRestante !== 0 || !cronometroIniciado || !blocoSelecionado) return;
    setCronometroIniciado(false);
    setPausado(true);
    setConclusaoCronometro(faseCronometro === "break" ? "break" : "focus");
  }, [tempoRestante, cronometroIniciado, blocoSelecionado, faseCronometro]);

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

  const progresso = blocoSelecionado && duracaoCiclo > 0
    ? ((duracaoCiclo - tempoRestante) / duracaoCiclo) * 100
    : 0;

  const confirmarEncerramento = () => {
    setMostrarConfirmar("mostrar");
    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 2500);
  };

  const iniciarEstudo = (bloco) => {
    if (!bloco) return;
    const sessao = { ...bloco, tempo: Number(bloco.tempo) || 30 };
    setBlocoSelecionado(sessao);
    setTempoRestante(sessao.tempo * 60);
    setDuracaoCiclo(sessao.tempo * 60);
    setCronometroIniciado(false);
    setPausado(true);
    setFaseCronometro("focus");
    setConclusaoCronometro("");
    setTelaEscura(false);
    setMostrarConfirmar("");
    setCorFundo("bg-gray-900");
    setTela("cronometro");
  };
  const iniciarBlocoPlanejado = (bloco) => {
    if (bloco?.activityType === "questions") {
      iniciarQuestoesDaMateria(bloco.nome, bloco.topico, "cronograma");
      return;
    }
    if (bloco?.activityType === "flashcards") {
      abrirFlashcards(bloco.nome, bloco.topico);
      return;
    }
    iniciarEstudo(bloco);
  };

  const concluirSessaoFoco = async () => {
    if (usuario && blocoSelecionado) {
      await registrarEstudo(
        usuario.uid,
        blocoSelecionado.nome,
        blocoSelecionado.topico,
        blocoSelecionado.tempo,
      );
      setAtualizarHistorico((valor) => valor + 1);
    }
    setBlocoSelecionado(null);
    setCronometroIniciado(false);
    setPausado(false);
    setTempoRestante(0);
    setDuracaoCiclo(0);
    setFaseCronometro("focus");
    setConclusaoCronometro("");
    setTela("meuCronograma");
  };

  const finalizarEstudo = () => {
    setPausado(true);
    setTempoRestante(0);
    setMostrarConfirmar("");
    setTelaEscura(false);
    setTimeout(() => {
      setBlocoSelecionado(null);
      setTela("meuCronograma");
    }, 50);
  };


 const editalAtualNome = editalEscolhido === "inss" ? "INSS" : editalEscolhido === "alego" ? "ALEGO  -  Analista Administrativo" : editalEscolhido === "sedes_tdas_tecadm" ? "SEDES-DF  -  Técnico Administrativo" : editalEscolhido === "sedes_edas_servsocial" ? "SEDES-DF  -  Assistente Social" : editalEscolhido === "sedes_edas_educsocial" ? "SEDES-DF  -  Educador Social" : editalEscolhido === "camara_al" ? "Câmara dos Deputados  -  Analista Legislativo" : editalEscolhido === "bb_escriturario" ? "Banco do Brasil  -  Agente Comercial" : editalEscolhido === "silva_jardim_enf" ? "Pref. Silva Jardim  -  Técnico em Enfermagem" : editalEscolhido === "receita_auditor" ? "Receita Federal  -  Auditor-Fiscal" : editalEscolhido === "cofen_analista_tecnico" ? "Cofen  -  Analista Técnico" : "Polícia Federal";

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
  const base = flashcards?.[editalEscolhido] || {};
  const combinado = Object.fromEntries(Object.entries(base).map(([materia, cards]) => [materia, [...cards]]));
  catalogoFlashcardsDoEdital().forEach((materia) => {
    if (!combinado[materia.nome]) combinado[materia.nome] = [];
  });
  flashcardsPersonalizados.forEach((card) => {
    const materia = card.materia || "Meus flashcards";
    combinado[materia] = [...(combinado[materia] || []), card];
  });
  return combinado;
 }

 function catalogoFlashcardsDoEdital() {
  const catalogo = new Map();
  Object.values(materiasPorBloco || {}).flat().forEach((materia) => {
    if (!materia?.nome) return;
    const topicosAtuais = catalogo.get(materia.nome) || [];
    (materia.topicos || []).forEach((topico) => {
      if (topico && !topicosAtuais.includes(topico)) topicosAtuais.push(topico);
    });
    catalogo.set(materia.nome, topicosAtuais);
  });
  return [...catalogo.entries()].map(([nome, topicos]) => ({ nome, topicos }));
 }

 async function salvarFlashcardsCriados(cards, materia, assunto, origem = "Criado pelo aluno") {
  if (!usuario || !editalEscolhido || !materia || !assunto || !Array.isArray(cards)) return;
  const timestamp = Date.now();
  const novosCards = cards
    .filter((card) => card?.front?.trim() && card?.back?.trim())
    .map((card, index) => ({
      id: `personal-${timestamp}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      materia,
      assunto,
      frente: card.front.trim(),
      verso: card.back.trim(),
      tipo: origem,
      criadoEm: new Date().toISOString(),
    }));
  if (!novosCards.length) return;
  const lista = [...flashcardsPersonalizados, ...novosCards];
  setFlashcardsPersonalizados(lista);
  await setDoc(doc(db, "users", usuario.uid, "extras", editalEscolhido), { flashcardsPersonalizados: lista }, { merge: true });
  setMateriaFlashcard(materia);
  setAssuntoFlashcard(assunto);
  setFlashcardIndex(0);
  setFlashcardVirado(false);
  return novosCards.length;
 }

 async function salvarFlashcardLia(flashcard, materia, assunto) {
  return salvarFlashcardsCriados([flashcard], materia || "Meus flashcards", assunto || "Revisão de questões", "Criado com a LIA");
 }

 async function salvarExplicacaoLiaNoResumo(texto, materia, assunto) {
  if (!texto || !materia) return;
  const chave = assunto ? `${materia}|||${assunto}` : materia;
  const atual = resumosMateria[chave] || {};
  const titulo = `LIA · ${new Date().toLocaleDateString("pt-BR")}`;
  const livre = [atual.livre, `${titulo}\n${texto}`].filter(Boolean).join("\n\n").slice(0, 20000);
  await salvarResumoMateria(chave, { ...atual, livre });
 }
 async function salvarAnotacaoQuestao(texto, questao, materia, assunto) {
  if (!texto || !materia) return;
  const chave = assunto ? `${materia}|||${assunto}` : materia;
  const atual = resumosMateria[chave] || {};
  const anotacao = {
    id: `${questao?.id || "questao"}-${Date.now()}`,
    questionId: questao?.id || null,
    texto,
    enunciado: String(questao?.enunciado || "").slice(0, 280),
    banca: questao?.banca || "",
    ano: questao?.ano || "",
    materia,
    assunto,
    criadoEm: new Date().toISOString(),
  };
  const anotacoesQuestoes = [anotacao, ...(atual.anotacoesQuestoes || [])].slice(0, 200);
  await salvarResumoMateria(chave, { ...atual, anotacoesQuestoes });
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
  const hoje = new Date().toISOString().slice(0, 10);
  const alvo = iso || hoje;
  const ciclos = Object.values(ciclosRevisao || {}).filter((ciclo) => ciclo?.status !== "concluido");
  if (ciclos.length || Object.keys(ciclosRevisao || {}).length) {
    return ciclos.flatMap((ciclo) => {
      const stage = (ciclo.stages || []).find((item) => item.status === "pendente");
      if (!stage) return [];
      const aparece = alvo === hoje ? stage.dueDate <= hoje : stage.dueDate === alvo;
      if (!aparece) return [];
      const atrasadaDias = alvo === hoje ? Math.max(0, Math.floor((new Date(`${hoje}T12:00:00`) - new Date(`${stage.dueDate}T12:00:00`)) / 86400000)) : 0;
      return [{ materia: ciclo.subject, assunto: ciclo.topic, nome: stage.label, acao: stage.activity, atrasadaDias, cycleId: ciclo.topicKey, reviewStage: stage.stage, dueDate: stage.dueDate }];
    });
  }
  if (!estudosDetalhes || Object.keys(estudosDetalhes).length === 0) return [];
  const NOMES_NIVEL = ["Revisar amanhã", "Revisar daqui a 7 dias", "Revisar daqui a 15 dias", "Revisar daqui a 30 dias", "Revisão de manutenção"];
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
 const concluirRevisao = async (item, resultado = "normal") => {
   if (item.tipo === "assunto") {
     if (!usuario || !editalEscolhido) return;
     if (item.cycleId && ciclosRevisao[item.cycleId]) {
       const atualizado = { ...ciclosRevisao, [item.cycleId]: rescheduleReview(ciclosRevisao[item.cycleId], resultado) };
       setCiclosRevisao(atualizado);
       const userRef = doc(db, "users", usuario.uid);
       const snap = await getDoc(userRef);
       const dados = snap.exists() ? snap.data() : {};
       await setDoc(userRef, { ciclosRevisaoPorEdital: { ...(dados.ciclosRevisaoPorEdital || {}), [editalEscolhido]: atualizado } }, { merge: true });
       return;
     }
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
 const concluirAtividadeCronograma = async (bloco) => {
  if (!bloco || !usuario || !editalEscolhido) return;
  if (!bloco.activityType || bloco.activityType === "theory") {
    await registrarEstudo(usuario.uid, bloco.nome, bloco.topico, bloco.tempo);
    setAtualizarHistorico((value) => value + 1);
    return;
  }
  const key = activityKey(bloco);
  const atualizado = { ...atividadesConcluidas, [key]: { concluidoEm: new Date().toISOString(), blocoId: bloco.id } };
  setAtividadesConcluidas(atualizado);
  const userRef = doc(db, "users", usuario.uid);
  const snap = await getDoc(userRef);
  const dados = snap.exists() ? snap.data() : {};
  const porEdital = dados.atividadesCronogramaPorEdital || {};
  await setDoc(userRef, { atividadesCronogramaPorEdital: { ...porEdital, [editalEscolhido]: atualizado } }, { merge: true });
 };
 const excluirCronogramaAtivo = async (tipo) => {
  const rotulo = tipo === "diario" ? "diário" : tipo === "mensal" ? "mensal" : "semanal";
  if (!window.confirm(`Excluir o cronograma ${rotulo} atual? O progresso será preservado e o que falta irá para Pendências.`)) return;
  const completedTopics = assuntosEstudadosSet();
  const completedActivities = new Set(Object.keys(atividadesConcluidas || {}));
  const resultado = archivePlan(cronogramasSalvos, tipo);
  if (!resultado.active) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const novasPendencias = (resultado.active.blocos || [])
    .filter((bloco) => blockStatus(bloco, completedTopics, completedActivities, hoje) !== "concluido")
    .map((bloco) => ({ ...bloco, pendingId: `${resultado.active.id}::${bloco.id}`, planId: resultado.active.id, planType: resultado.active.tipo, planTitle: resultado.active.titulo, originalDate: bloco.data, archived: true }));
  const historico = [resultado.archived, ...cronogramasHistorico].filter(Boolean).slice(0, 30);
  const pendencias = [...novasPendencias, ...pendenciasCronograma.filter((item) => !novasPendencias.some((novo) => novo.pendingId === item.pendingId))];
  setCronogramasHistorico(historico);
  setPendenciasCronograma(pendencias);
  await salvarCronogramasUsuario(resultado.plans);
  const userRef = doc(db, "users", usuario.uid);
  const snap = await getDoc(userRef);
  const dados = snap.exists() ? snap.data() : {};
  await setDoc(userRef, {
    cronogramasHistoricoPorEdital: { ...(dados.cronogramasHistoricoPorEdital || {}), [editalEscolhido]: historico },
    pendenciasCronogramaPorEdital: { ...(dados.pendenciasCronogramaPorEdital || {}), [editalEscolhido]: pendencias },
  }, { merge: true });
  setTela("gerarCronograma");
 };
 const reagendarPendencia = async (item) => {
  const novaData = window.prompt("Nova data (AAAA-MM-DD):", new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData || "")) return;
  const planos = cronogramasSalvos.map((plan) => plan.id !== item.planId ? plan : { ...plan, blocos: plan.blocos.map((bloco) => bloco.id === item.id ? { ...bloco, data: novaData } : bloco) });
  const pendencias = pendenciasCronograma.map((pending) => pending.pendingId === item.pendingId ? { ...pending, data: novaData, originalDate: novaData } : pending);
  await salvarCronogramasUsuario(planos);
  setPendenciasCronograma(pendencias);
  const userRef = doc(db, "users", usuario.uid);
  const snap = await getDoc(userRef);
  const dados = snap.exists() ? snap.data() : {};
  await setDoc(userRef, { pendenciasCronogramaPorEdital: { ...(dados.pendenciasCronogramaPorEdital || {}), [editalEscolhido]: pendencias } }, { merge: true });
 };
 const concluirPendencia = async (item) => {
  await concluirAtividadeCronograma(item);
  const pendencias = pendenciasCronograma.filter((pending) => pending.pendingId !== item.pendingId);
  setPendenciasCronograma(pendencias);
  const userRef = doc(db, "users", usuario.uid);
  const snap = await getDoc(userRef);
  const dados = snap.exists() ? snap.data() : {};
  await setDoc(userRef, { pendenciasCronogramaPorEdital: { ...(dados.pendenciasCronogramaPorEdital || {}), [editalEscolhido]: pendencias } }, { merge: true });
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
 const cronogramaParaExportar = () => cronogramasSalvos.find((item) => item.id === cronogramaAtivoId)
  || { titulo: tipoCronograma === "semanal" ? "Cronograma semanal" : "Cronograma diário", blocos };
 const exportarCronogramaPdf = async (cronograma = cronogramaParaExportar()) => {
  try {
    await downloadSchedulePdf(cronograma, editalAtualNome);
  } catch (error) {
    console.error("Erro ao exportar cronograma", error);
    alert("Não foi possível gerar o PDF deste cronograma.");
  }
 };
 const imprimirCronograma = (cronograma = cronogramaParaExportar()) => {
  try {
    printSchedule(cronograma, editalAtualNome);
  } catch (error) {
    console.error("Erro ao imprimir cronograma", error);
    alert(error.message || "Não foi possível abrir a impressão deste cronograma.");
  }
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
 const blocoPlanejadoConcluido = (bloco, estudados = assuntosEstudadosSet()) => {
  if (bloco?.activityType && bloco.activityType !== "theory") return false;
  return estudados.has(`${bloco?.nome}|||${bloco?.topico}`);
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
  const hoje = toISODate(new Date());
  const mesAtual = hoje.slice(0, 7);
  if (dataMensal < mesAtual) {
    setMensagemCronograma("Não é possível gerar um cronograma novo para um mês que já terminou.");
    return;
  }
  const primeiroDiaPlanejado = dataMensal === mesAtual ? Number(hoje.slice(8, 10)) : 1;
  const blocosMes = [];
  const usados = new Set();

  for (let dia = primeiroDiaPlanejado; dia <= ultimoDia; dia++) {
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
    setMensagemCronograma("Defina abaixo quantas horas deseja estudar em pelo menos um dia da semana.");
    return;
  }

  const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const cronograma = {
    id: `${editalEscolhido}-mensal-${dataMensal}`,
    tipo: "mensal",
    edital: editalEscolhido,
    titulo: `Mensal  -  ${nomesMes[mes-1]} ${ano}`,
    criadoEm: new Date().toISOString(),
    blocos: blocosMes,
  };
  const prefixoMes = `${editalEscolhido}-mensal-${dataMensal}`;
  const listaAtualizada = [cronograma, ...cronogramasSalvos.filter((item) => !item.id?.startsWith(prefixoMes))];
  setCronogramaAtivoId(cronograma.id);
  setBlocos(blocosMes);
  setMensagemCronograma(`${blocosMes.length} blocos gerados de ${String(primeiroDiaPlanejado).padStart(2, "0")}/${String(mes).padStart(2, "0")} até o fim do mês.`);
  await salvarCronogramasUsuario(listaAtualizada);
};

 const gerarCronogramaComLia = async (config) => {
  setLiaCronogramaError("");
  setLiaCronogramaPreview(null);
  const planType = ["diario", "semanal", "mensal"].includes(config.planType) ? config.planType : "semanal";
  if (cronogramasSalvos.some((item) => item.tipo === planType && item.status !== "excluido")) {
    setLiaCronogramaError(`Você já possui um cronograma ${planType} ativo. Exclua o atual antes de gerar outro.`);
    return;
  }
  let pendentes = assuntosPendentesDoEdital();
  if (config.strategy === "somente_prioridades") {
    pendentes = pendentes.filter((item) => config.focusSubjects.includes(item.nome));
  }
  if (!pendentes.length) {
    setLiaCronogramaError("Não há tópicos pendentes dentro da seleção escolhida.");
    return;
  }
  const totalHoras = Object.values(horasSemana).reduce((sum, value) => sum + (Number(value) || 0), 0);
  if (totalHoras < 0.5) {
    setLiaCronogramaError("Defina pelo menos 30 minutos em algum dia da semana.");
    return;
  }

  const topics = pendentes.map((item, index) => ({
    id: `t${index + 1}`,
    subject: item.nome,
    topic: item.topico,
    block: item.bloco,
  }));
  const byId = new Map(topics.map((item, index) => [item.id, pendentes[index]]));
  const deferStartSubjects = extractDeferredStartSubjects(config.notes, topics.map((topic) => topic.subject));

  setLiaCronogramaLoading(true);
  try {
    const result = await askLia("schedule", {
      exam: editalAtualNome,
      level: config.level,
      strategy: config.strategy,
      focusSubjects: config.focusSubjects,
      notes: config.notes,
      weights: pesos,
      weeklyHours: horasSemana,
      includeFlashcards: config.includeFlashcards,
      deferStartSubjects,
      topics,
    });
    const path = result.schedule;
    if (!path?.orderedTopicIds?.length) throw new Error("A LIA não conseguiu ordenar os tópicos deste edital.");
    const reasons = new Map((path.reasons || []).map((item) => [item.topicId, item.reason]));
    const engineTopics = topics.map((topic) => ({
      ...topic,
      key: byId.get(topic.id)?.chave,
      block: byId.get(topic.id)?.bloco,
      reason: reasons.get(topic.id) || "",
    }));
    const endDate = planType === "diario"
      ? config.startDate
      : planType === "semanal"
        ? adicionarDias(config.startDate, 6)
        : new Date(Number(config.startDate.slice(0, 4)), Number(config.startDate.slice(5, 7)), 0, 12).toISOString().slice(0, 10);
    const { blocks: generatedBlocks } = buildIntelligentSchedule({
      topics: engineTopics,
      orderedTopicIds: path.orderedTopicIds,
      subjectProfiles: path.subjectProfiles,
      complexTopicIds: path.complexTopicIds,
      dependencies: path.dependencies,
      weeklyHours: horasSemana,
      startDate: config.startDate,
      endDate,
      level: config.level,
      includeFlashcards: config.includeFlashcards,
      deferStartSubjects,
    });
    const reviewBlocks = Object.values(ciclosRevisao || {}).flatMap((cycle) => {
      const stage = (cycle.stages || []).find((item) => item.status === "pendente");
      if (!stage || stage.dueDate < config.startDate || stage.dueDate > endDate) return [];
      return [{
        id: `review-${cycle.topicKey}-${stage.stage}`,
        nome: cycle.subject,
        topico: cycle.topic,
        chave: `${cycle.topicKey}|||review-${stage.stage}`,
        tempo: Math.min(25, Math.max(10, Number(stage.minutes) || 15)),
        data: stage.dueDate,
        dia: normalizarDiaSemana(parseDataLocal(stage.dueDate).toLocaleDateString("pt-BR", { weekday: "long" })),
        activityType: "review",
        activityLabel: stage.activity,
        reviewCycleId: cycle.topicKey,
      }];
    });
    reviewBlocks.forEach((review) => {
      const dayCapacity = Math.round((Number(horasSemana[review.dia]) || 0) * 60);
      const current = generatedBlocks.filter((block) => block.data === review.data).reduce((sum, block) => sum + Number(block.tempo || 0), 0);
      const reviews = reviewBlocks.filter((block) => block.data === review.data).reduce((sum, block) => sum + Number(block.tempo || 0), 0);
      if (reviews > Math.max(15, Math.floor(dayCapacity * 0.25)) || current + reviews > dayCapacity) {
        throw new Error(`A carga de revisões de ${formatarDataBR(review.data)} não cabe com segurança. Reduza conteúdo novo ou aumente a disponibilidade; nada foi movido automaticamente.`);
      }
    });
    const blocks = [...generatedBlocks, ...reviewBlocks].sort((a, b) => `${a.data}-${a.activityType === "review" ? 0 : 1}`.localeCompare(`${b.data}-${b.activityType === "review" ? 0 : 1}`));
    if (!blocks.length) throw new Error("A disponibilidade escolhida não comporta nenhum bloco de estudo.");

    const cronograma = {
      id: `${editalEscolhido}-${planType}-lia-${Date.now()}`,
      tipo: planType,
      edital: editalEscolhido,
      titulo: `LIA - ${path.title}`,
      criadoEm: new Date().toISOString(),
      dataInicio: config.startDate,
      dataFim: endDate,
      origem: "lia",
      liaResumo: path.summary,
      liaConfig: config,
      horasSemana: { ...horasSemana },
      blocos: blocks,
    };
    setLiaCronogramaPreview({ title: path.title, summary: path.summary, blocks, cronograma });
  } catch (error) {
    setLiaCronogramaError(error.message || "Não foi possível criar o cronograma inteligente.");
  } finally {
    setLiaCronogramaLoading(false);
  }
 };

 const aprovarCronogramaLia = async () => {
  if (!liaCronogramaPreview?.cronograma) return;
  await salvarCronograma(liaCronogramaPreview.cronograma);
  setBlocos(liaCronogramaPreview.blocks);
  setMensagemCronograma(`Cronograma inteligente salvo com ${liaCronogramaPreview.blocks.length} blocos.`);
  setLiaCronogramaPreview(null);
  setTela("meuCronograma");
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
  const dashboardSubjectNames = [...new Set(Object.values(materiasPorBloco || {}).flat().map((item) => item.nome))];
  const manualQuestionCount = indicadoresManuais.reduce((sum, item) => sum + (Number(item.questions) || 0), 0);
  const manualHitCount = indicadoresManuais.reduce((sum, item) => sum + Math.min(Number(item.questions) || 0, Number(item.hits) || 0), 0);
  const combinedQuestionCount = totalQuestoesRespondidas() + manualQuestionCount;
  const combinedAccuracy = combinedQuestionCount
    ? Math.round((((dadosQuestoesGeral().acertos || 0) + manualHitCount) / combinedQuestionCount) * 100)
    : 0;
  const manualMinutesForDate = (date) => indicadoresManuais
    .filter((item) => item.date === date)
    .reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const dashboardToday = new Date().toISOString().slice(0, 10);
  const dashboardWeekStart = inicioSemana(dashboardToday);
  const dashboardWeekEnd = adicionarDias(dashboardWeekStart, 6);
  const manualWeekMinutes = indicadoresManuais
    .filter((item) => item.date >= dashboardWeekStart && item.date <= dashboardWeekEnd)
    .reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const latestManualExam = [...indicadoresManuais].reverse().find((item) => item.examPercent !== "" && Number.isFinite(Number(item.examPercent)));
  const combinedExamProgress = Math.max(progressoGeralEdital(), Number(latestManualExam?.examPercent) || 0);
  const dashboardDiscursiveEvolution = (() => {
    const automaticScores = (resultadosSimulados || [])
      .filter((item) => item.tipo === "discursiva" || item.modalidade === "discursiva" || item.discursiva === true)
      .map((item) => Number(item.nota ?? item.pontuacao ?? item.notaFinal))
      .filter(Number.isFinite)
      .reverse();
    const manualScores = indicadoresManuais
      .filter((item) => item.discursiveScore !== "")
      .map((item) => Number(item.discursiveScore))
      .filter(Number.isFinite);
    const scores = [...automaticScores, ...manualScores];
    if (scores.length < 2) return null;
    return Math.round((scores[scores.length - 1] - scores[0]) * 10) / 10;
  })();

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

  function iniciarSimuladoSelecionado(simulado) {
    setSimuladoEscolhido(simulado);
    setQuestoesSimuladoAtual(simulado?.questoes || []);
    setQuestaoAtual(0);
    setRespostasSimulado([]);
    setDesempenhoSimulado({ acertos: 0, erros: 0 });
    setResumoSimulado({ acertos: 0, erros: 0, naoRespondidas: 0, total: 0 });
    setNotaFinalSimulado(0);
    setDesempenhoPorMateria({});
    setTempoSimulado(60 * 60 * 4);
    setMostrarTexto(false);
    setTela("simuladoAndamento");
    setMostrarSelecao(false);
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
    minhaConta: <MinhaConta setTela={setTela} onNameChange={setNomeUsuario} />,
      
    desempenho: (
      <PerformanceScreen
        performance={desempenhoQuestoes}
        streak={calcularStreak()}
        examProgress={combinedExamProgress}
        automaticMinutes={Object.values(estudosDetalhes || {}).reduce((sum, item) => sum + (Number(item.tempoMin) || 0), 0)}
        discursiveEvolution={dashboardDiscursiveEvolution}
        manualEntries={indicadoresManuais}
        subjects={dashboardSubjectNames}
        onSaveManual={salvarIndicadorManual}
        onDeleteManual={excluirIndicadorManual}
        onQuestions={() => setTela("escolherMateria")}
        onRefresh={atualizarDesempenho}
        onReset={async () => {
          if (!confirm("Zerar todo o desempenho?")) return;
          const vazio = { geral: { acertos: 0, erros: 0 }, porMateria: {}, questoesErradas: {}, questoesErradasDetalhes: {} };
          await setDoc(doc(db, "users", usuario.uid, "progresso", editalEscolhido), { desempenhoQuestoes: vazio }, { merge: true });
          setDesempenhoQuestoes(vazio);
        }}
      />
    ),

    modulos: (
      <StudyDashboard
        firstName={(nomeUsuario || usuario?.displayName || "Estudante").trim().split(/\s+/)[0]}
        examName={editalAtualNome}
        examProgress={combinedExamProgress}
        answered={combinedQuestionCount}
        accuracy={combinedAccuracy}
        examDays={dashboardExamDays}
        streak={calcularStreak()}
        todayMinutes={tempoEstudadoHoje() + manualMinutesForDate(dashboardToday)}
        weekMinutes={tempoEstudadoSemana() + manualWeekMinutes}
        todayTasks={dashboardTodayTasks}
        pendingReviews={revisoesInteligentesPorData()}
        progressGroups={dashboardProgressGroups}
        strength={dashboardPerformance.forte}
        weakness={dashboardPerformance.fraca}
        discursiveEvolution={dashboardDiscursiveEvolution}
        onNavigate={setTela}
        onStartTask={iniciarEstudo}
        onStartReview={iniciarRevisao}
      />
    ),

    desafio: (
      <DailyChallengeScreen
        completed={desafioConcluido}
        onFocus={() => setTela("cronometro")}
        onComplete={async () => {
          await marcarDesafioComoConcluido();
          setTela("modulos");
        }}
      />
    ),

    gerarCronograma: (
      <ScheduleGeneratorScreen
        activePlans={cronogramasSalvos}
        subjects={todosAssuntosDoEdital().map((item) => item.nome).filter((value, index, values) => values.indexOf(value) === index)}
        hours={horasSemana}
        weekdays={DIAS_SEMANA}
        preview={liaCronogramaPreview}
        loading={liaCronogramaLoading}
        error={liaCronogramaError}
        onHoursChange={(day, value) => setHorasSemana((current) => ({ ...current, [day]: value }))}
        onGenerate={gerarCronogramaComLia}
        onApprove={aprovarCronogramaLia}
        onDiscard={() => setLiaCronogramaPreview(null)}
        onOpenPlan={(plan) => { definirCronogramaAtivo(plan); setTela("meuCronograma"); }}
        onDelete={excluirCronogramaAtivo}
      />
    ),

    meuCronograma: (
      <MyScheduleScreen
        plans={cronogramasSalvos}
        completedTopics={assuntosEstudadosSet()}
        completedActivities={new Set(Object.keys(atividadesConcluidas || {}))}
        selectedId={cronogramaAtivoId}
        onSelect={definirCronogramaAtivo}
        onStart={iniciarBlocoPlanejado}
        onExport={exportarCronogramaPdf}
        onPrint={imprimirCronograma}
        onDelete={excluirCronogramaAtivo}
        onGenerate={() => setTela("gerarCronograma")}
      />
    ),

    pendencias: (
      <PendingScheduleScreen
        plans={cronogramasSalvos}
        extraPending={pendenciasCronograma}
        completedTopics={assuntosEstudadosSet()}
        completedActivities={new Set(Object.keys(atividadesConcluidas || {}))}
        onStart={iniciarBlocoPlanejado}
        onReschedule={reagendarPendencia}
        onComplete={concluirPendencia}
      />
    ),

    cronometro: (
      <FocusTimerScreen
        task={blocoSelecionado}
        time={tempoFormatado()}
        progress={progresso}
        paused={pausado}
        started={cronometroIniciado}
        phase={faseCronometro}
        completion={conclusaoCronometro}
        suggestions={dashboardTodayTasks}
        onStart={iniciarEstudo}
        onToggle={() => {
          if (!cronometroIniciado) {
            setCronometroIniciado(true);
            setPausado(false);
            return;
          }
          setPausado((value) => !value);
        }}
        onReset={() => {
          const seconds = faseCronometro === "break" ? (blocoSelecionado?.breakMinutes || 5) * 60 : (blocoSelecionado?.tempo || 25) * 60;
          setTempoRestante(seconds);
          setDuracaoCiclo(seconds);
          setCronometroIniciado(false);
          setPausado(true);
          setConclusaoCronometro("");
        }}
        onQuestions={() => iniciarQuestoesDaMateria(blocoSelecionado?.nome, blocoSelecionado?.topico, "cronometro")}
        onFlashcards={() => abrirFlashcards(blocoSelecionado?.nome, blocoSelecionado?.topico)}
        onFinish={concluirSessaoFoco}
        onStartBreak={() => {
          const seconds = (blocoSelecionado?.breakMinutes || 5) * 60;
          setFaseCronometro("break");
          setTempoRestante(seconds);
          setDuracaoCiclo(seconds);
          setConclusaoCronometro("");
          setCronometroIniciado(true);
          setPausado(false);
        }}
        onContinueFocus={() => {
          const seconds = (blocoSelecionado?.tempo || 25) * 60;
          setFaseCronometro("focus");
          setTempoRestante(seconds);
          setDuracaoCiclo(seconds);
          setConclusaoCronometro("");
          setCronometroIniciado(true);
          setPausado(false);
        }}
        onDefer={async () => {
          await salvarMateriaPendente(blocoSelecionado);
          setBlocoSelecionado(null);
          setCronometroIniciado(false);
          setPausado(false);
          setDuracaoCiclo(0);
          setConclusaoCronometro("");
          setFaseCronometro("focus");
        }}
      />
    ),

    flashcards: (
      <FlashcardsScreen
        bank={materiasFlashcardsDoEdital()}
        catalog={catalogoFlashcardsDoEdital()}
        subject={materiaFlashcard}
        topic={assuntoFlashcard}
        cards={listaFlashcardsFiltrada()}
        index={flashcardIndex}
        flipped={flashcardVirado}
        performance={desempenhoFlashcards}
        onSelectSubject={(value) => {
          setMateriaFlashcard(value);
          setAssuntoFlashcard("");
          setFlashcardIndex(0);
          setFlashcardVirado(false);
        }}
        onSelectTopic={(value) => {
          setAssuntoFlashcard(value);
          setFlashcardIndex(0);
          setFlashcardVirado(false);
        }}
        onFlip={() => setFlashcardVirado((value) => !value)}
        onRate={registrarFlashcard}
        onCreateCards={(cards, materia, assunto, origem) => salvarFlashcardsCriados(cards, materia, assunto, origem)}
      />
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
        onSaveLiaNote={(texto) => salvarExplicacaoLiaNoResumo(
          texto,
          filtroQuestoesAtual?.materia || materiaEscolhida,
          filtroQuestoesAtual?.assunto || questoesAtual[questaoIndex]?.assunto || questoesAtual[questaoIndex]?.topico || "Revisão de questões",
        )}
        onSaveQuestionNote={(texto, questao) => salvarAnotacaoQuestao(
          texto,
          questao,
          filtroQuestoesAtual?.materia || materiaEscolhida || questao?.materia || "Geral",
          filtroQuestoesAtual?.assunto || questao?.assunto || questao?.topico || "Anotações de questões",
        )}
        onSaveFlashcard={(flashcard) => salvarFlashcardLia(
          flashcard,
          filtroQuestoesAtual?.materia || materiaEscolhida,
          filtroQuestoesAtual?.assunto || questoesAtual[questaoIndex]?.assunto || questoesAtual[questaoIndex]?.topico || "Revisão de questões",
        )}
      />
    ),

resultadoQuestoes: (
  <SessionResultScreen
    hits={acertos}
    misses={erros}
    skipped={questoesPuladas}
    onMore={() => setTela("escolherMateria")}
    onDashboard={() => setTela("modulos")}
    onReview={() => setTela("revisao")}
  />
),

meusSimulados: (
  <SimulationHistoryScreen
    results={resultadosSimulados}
    onBack={() => setTela("simulados")}
  />
),

simulados: (
  <SimulationsHubScreen
    examName={editalAtualNome}
    selecting={mostrarSelecao}
    simulations={editalEscolhido === "pf" ? simuladosPF : []}
    hasDefault={editalEscolhido === "pf"}
    onDefault={() => iniciarSimuladoSelecionado({ id: "simulado_padrao_pf", nome: "Simulado PF padrão", questoes: questoesSimulado })}
    onOpenSelection={() => setMostrarSelecao(true)}
    onCloseSelection={() => setMostrarSelecao(false)}
    onSelect={iniciarSimuladoSelecionado}
    onHistory={async () => { await buscarResultadosSimulados(); setTela("meusSimulados"); }}
  />
),

simuladoAndamento: (
  <SimulationSessionScreen
    question={questoesSimuladoAtual[questaoAtual]}
    index={questaoAtual}
    total={questoesSimuladoAtual.length}
    time={formatarTempo(tempoSimulado)}
    showText={mostrarTexto}
    onToggleText={() => setMostrarTexto((value) => !value)}
    onAnswer={responderSimulado}
    onPrevious={() => setQuestaoAtual((value) => Math.max(0, value - 1))}
    onNext={() => setQuestaoAtual((value) => Math.min(questoesSimuladoAtual.length - 1, value + 1))}
    onFinish={finalizarSimulado}
    onCancel={() => setTela("simulados")}
  />
),

resultadoSimulado: (
  <SimulationResultScreen
    summary={resumoSimulado}
    score={notaFinalSimulado}
    bySubject={desempenhoPorMateria}
    onBack={() => setTela("simulados")}
  />
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
  <MaterialSupportScreen
    material={materialSelecionado}
    onQuestions={() => iniciarQuestoesDaMateria(materialSelecionado?.materia, materialSelecionado?.assunto, "materialApoio")}
    onEdital={() => setTela("editalCompleto")}
  />
),

cronograma: (
  <div className="study-legacy-page study-plan-page min-h-screen bg-gradient-to-br from-gray-950 via-zinc-900 to-black text-white">

    {/* Header */}
    <header className="study-legacy-header sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setTela("modulos")} className="text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors">← Voltar</button>
          <span className="text-base font-black text-white">Cronograma</span>
          <span className="hidden sm:block text-xs bg-white/8 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{editalAtualNome}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 hidden sm:block">Edital: <b className="text-cyan-400">{progressoGeralEdital()}%</b></div>
          <div className="text-xs text-gray-500 hidden sm:block">Hoje: <b className="text-white">{formatarTempo(tempoEstudadoHoje() * 60)}</b></div>
          <div className="text-xs text-gray-500 hidden sm:block">Sequência: <b className="text-orange-400">{calcularStreak()}d</b></div>
          <button onClick={() => setTela("historicoEstudo")} className="study-plan-action text-xs bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-full transition-colors"><StudyIcon name="clock" size={14} /> Histórico</button>
        </div>
      </div>
    </header>

    {true ? (
      <main className="study-plan-content max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* Abas */}
        <div className="flex gap-1.5 flex-wrap">
          {[["lia", "sparkles", "Planejar com a LIA"], ["mensal", "calendar", "Mensal"], ["semanal", "calendar", "Semanal"], ["diario", "clock", "Diário"], ["editalTodo", "file", "Edital todo"], ["meus", "save", "Salvos"], ["revisoes", "repeat", "Revisões"]].map(([id, icon, label]) => (
            <button key={id} onClick={() => setAbaCronograma(id)} className={`study-plan-tab ${abaCronograma === id ? "is-active" : ""}`}>
              <StudyIcon name={icon} size={14} /> {label}
            </button>
          ))}
        </div>

        {abaCronograma === "lia" && <LiaSchedulePlanner
          subjects={[...new Set(assuntosPendentesDoEdital().map((item) => item.nome))]}
          hours={horasSemana}
          weekdays={DIAS_SEMANA}
          preview={liaCronogramaPreview}
          loading={liaCronogramaLoading}
          error={liaCronogramaError}
          onHoursChange={(day, value) => setHorasSemana((current) => ({ ...current, [day]: value }))}
          onGenerate={gerarCronogramaComLia}
          onApprove={aprovarCronogramaLia}
          onDiscard={() => setLiaCronogramaPreview(null)}
        />}

        {/* ── ABA MENSAL ── */}
        {abaCronograma === "mensal" && (() => {
          const hoje = toISODate(new Date());
          const [ano, mes] = dataMensal.split("-").map(Number);
          const primeiroDia = new Date(ano, mes - 1, 1);
          const ultimoDia = new Date(ano, mes, 0).getDate();
          const diaSemanaInicio = primeiroDia.getDay();
          const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
          const blocosMes = (cronogramasSalvos || [])
            .filter(c => !c.id?.includes("edital-todo"))
            .flatMap(c =>
              (c.blocos || []).filter(b => b.data && b.data.startsWith(dataMensal) && (dataMensal !== hoje.slice(0, 7) || b.data >= hoje))
            );
          const blocosPorDia = {};
          blocosMes.forEach(b => {
            if (!blocosPorDia[b.data]) blocosPorDia[b.data] = [];
            blocosPorDia[b.data].push(b);
          });
          const estudados = assuntosEstudadosSet();
          return (
            <div className="space-y-4">
              <section className="study-plan-config-panel study-plan-config-panel--monthly">
                <div className="study-plan-config-panel__heading">
                  <div><span>Carga de estudo</span><h3>Você escolhe quantas horas estudar</h3><p>Defina a carga de cada dia. Use 0 para deixar o dia livre.</p></div>
                </div>
                <div className="study-plan-hours-grid">
                  {DIAS_SEMANA.map((dia) => (
                    <label key={dia}><span>{dia.slice(0, 3)}</span><input type="number" min="0" max="12" step="0.5" value={horasSemana[dia] ?? 0} onChange={(event) => setHorasSemana((value) => ({ ...value, [dia]: Math.max(0, Number(event.target.value) || 0) }))} /><small>horas</small></label>
                  ))}
                </div>
              </section>
              {/* Header do calendário */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => { const d = new Date(ano, mes-2, 1); setDataMensal(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                  className="bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-colors">←</button>
                <h3 className="text-lg font-black text-white">{nomesMes[mes-1]} {ano}</h3>
                <button onClick={() => { const d = new Date(ano, mes, 1); setDataMensal(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                  className="bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-1.5 rounded-xl text-sm transition-colors">→</button>
                <button onClick={gerarCronogramaMensal}
                  className="ml-auto bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors">
                  <StudyIcon name="calendar" size={15} /> Gerar mês
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
                    const concluidos = blocosDia.filter(b => blocoPlanejadoConcluido(b, estudados)).length;
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
                  { val: blocosMes.filter(b => blocoPlanejadoConcluido(b, estudados)).length, label: "concluídos", color: "text-emerald-400" },
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
                          const feito = blocoPlanejadoConcluido(b);
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
                                  <button onClick={() => { setDiaModalAberto(null); iniciarBlocoPlanejado(b); }}
                                    className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                                    ▶ Iniciar
                                  </button>
                                )}
                              </div>
                              {!feito && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <button onClick={() => { iniciarQuestoesDaMateria(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="study-plan-action text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/15 text-cyan-300 px-2 py-1 rounded-lg transition-colors"><StudyIcon name="questions" size={13} /> Questões</button>
                                  <button onClick={() => { abrirFlashcards(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="study-plan-action text-[10px] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/15 text-teal-300 px-2 py-1 rounded-lg transition-colors"><StudyIcon name="cards" size={13} /> Flashcards</button>
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
              <div className="study-plan-config-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="study-plan-config-panel__eyebrow text-[10px] uppercase tracking-widest font-bold mb-1">Plano do edital completo</p>
                    <h3 className="text-lg font-black text-white">Distribuir todos os tópicos</h3>
                    <p className="text-xs text-gray-400 mt-1">{pendentes.length} tópicos pendentes · {Math.round(totalMin/60)}h total · {semanasNecessarias} semanas</p>
                  </div>
                  {cronogramaEdital && (
                    <span className="study-plan-config-panel__status text-[10px] px-3 py-1 rounded-full font-bold">
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
                }} className="study-plan-generate w-full py-2.5 rounded-xl font-bold text-sm transition-colors">
                  {cronogramaEdital ? "Regerar plano do edital" : "Gerar plano do edital completo"}
                </button>
                {mensagemCronograma && <p className="text-xs text-cyan-300 text-center">{mensagemCronograma}</p>}
              </div>

              {/* Calendário do edital completo */}
              {todosOsBlocos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Visualizar por mês</p>
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
                        const concluidos = blocosDia.filter(b => blocoPlanejadoConcluido(b, estudados)).length;
                        const total = blocosDia.length;
                        return (
                          <div key={dia}
                            onClick={() => total > 0 && setDiaModalAberto({ data: dataStr, blocos: blocosDia })}
                            className={`min-h-[90px] border-b border-r border-white/4 p-1.5 transition-all
                              ${isHoje ? "bg-cyan-500/8" : ""}
                              ${total > 0 ? "cursor-pointer hover:bg-white/4" : ""}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold ${isHoje ? "text-cyan-400" : "text-gray-500"}`}>{dia}</span>
                              {total > 0 && (
                                <span className={`text-[9px] font-bold ${concluidos === total ? "text-emerald-400" : "text-cyan-400"}`}>
                                  {concluidos}/{total}
                                </span>
                              )}
                            </div>
                            {blocosDia.slice(0,3).map((b, idx) => {
                              const feito = estudados.has(`${b.nome}|||${b.topico}`);
                              return (
                                <div key={idx} className={`text-[9px] truncate px-1 py-0.5 rounded font-medium mb-0.5 ${feito ? "bg-emerald-500/20 text-emerald-400 line-through" : "bg-cyan-500/15 text-cyan-300"}`}>
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
                      { val: todosOsBlocos.length, label: "total de blocos", color: "text-cyan-400" },
                      { val: todosOsBlocos.filter(b => blocoPlanejadoConcluido(b, estudados)).length, label: "concluídos", color: "text-emerald-400" },
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
                          <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Cronograma do dia</p>
                          <h3 className="text-base font-black text-white capitalize">{dataBR}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{blocosDoDia.length} blocos</p>
                        </div>
                        <button onClick={() => setDiaModalAberto(null)} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
                      </div>
                      <div className="overflow-y-auto flex-1 p-4 space-y-2">
                        {blocosDoDia.map((b, idx) => {
                          const feito = blocoPlanejadoConcluido(b);
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
                                  <button onClick={() => { setDiaModalAberto(null); iniciarBlocoPlanejado(b); }}
                                    className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                                    ▶ Iniciar
                                  </button>
                                )}
                              </div>
                              {!feito && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => { iniciarQuestoesDaMateria(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="study-plan-action text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/15 text-cyan-300 px-2 py-1 rounded-lg"><StudyIcon name="questions" size={13} /> Questões</button>
                                  <button onClick={() => { abrirFlashcards(b.nome, b.topico); setDiaModalAberto(null); }}
                                    className="study-plan-action text-[10px] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/15 text-teal-300 px-2 py-1 rounded-lg"><StudyIcon name="cards" size={13} /> Flashcards</button>
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
                    const concluido = blocoPlanejadoConcluido(bloco);
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
                            <button onClick={() => iniciarBlocoPlanejado(bloco)} style={{flexShrink:0,fontSize:12,padding:"6px 14px",fontWeight:500,background:isHoje?"var(--fill-accent)":"var(--surface-1)",color:isHoje?"var(--on-accent)":"var(--text-secondary)",border:isHoje?"none":"0.5px solid var(--border)",borderRadius:"var(--radius)"}}>
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
              const semanaInicio = inicioSemana(dataSemana);
              const diasUnicos = Array.from({ length: 7 }, (_, index) => adicionarDias(semanaInicio, index));
              const hoje = new Date().toISOString().slice(0, 10);
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      {cronogramasSalvos.find(c => c.id === cronogramaAtivoId)?.titulo || "Cronograma semanal"}
                    </h3>
                    <div className="schedule-export-actions">
                      <button onClick={() => setDataSemana(adicionarDias(semanaInicio, -7))} className="study-plan-action" aria-label="Semana anterior">←</button>
                      <button onClick={() => setDataSemana(adicionarDias(semanaInicio, 7))} className="study-plan-action" aria-label="Próxima semana">→</button>
                      <button onClick={copiarCronogramaAtivo} className="study-plan-action"><StudyIcon name="save" size={14} /> Copiar</button>
                      <button onClick={() => exportarCronogramaPdf()} className="study-plan-action"><StudyIcon name="download" size={14} /> Exportar PDF</button>
                      <button onClick={() => imprimirCronograma()} className="study-plan-action"><StudyIcon name="print" size={14} /> Imprimir</button>
                    </div>
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
                              const concluido = blocoPlanejadoConcluido(bloco);
                              return (
                                <div key={idx} className={`px-4 py-3 ${concluido ? "opacity-50" : ""}`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${concluido ? "line-through text-gray-500" : "text-white"}`}>{nomeDisciplinaExibicao(bloco.nome)}</p>
                                      <p className="text-[10px] text-cyan-500 mt-0.5">{bloco.activityLabel || "Estudar"}</p>
                                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{bloco.topico} · {bloco.tempo}min</p>
                                    </div>
                                    {!concluido
                                      ? <button onClick={() => iniciarBlocoPlanejado(bloco)} className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">▶ Iniciar</button>
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
                              const concluido = blocoPlanejadoConcluido(bloco);
                              return (
                                <div key={idx}
                                  onClick={() => !concluido && iniciarBlocoPlanejado(bloco)}
                                  className={`rounded-xl p-2.5 cursor-pointer transition-all ${concluido ? "bg-emerald-900/20 border border-emerald-500/20 opacity-60" : "bg-white/5 hover:bg-cyan-500/10 border border-white/6 hover:border-cyan-500/30"}`}>
                                  <p className="text-[9px] font-bold text-cyan-500 mb-1">{bloco.activityLabel || "Estudar"}</p>
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
            <div className="saved-schedules__header">
              <p>Cronogramas salvos</p>
              <span>{cronogramasSalvos.length} no total</span>
            </div>
            {cronogramasSalvos.length === 0
              ? <div className="saved-schedules__empty">
                  Nenhum cronograma salvo ainda.<br/>Gere um nas abas Diário, Semanal ou Mensal.
                </div>
              : cronogramasSalvos.map((c) => {
                  const ativo = cronogramaAtivoId === c.id;
                  const totalBlocos = c.origem === "lia" ? (c.blocos || []).filter((b) => b.activityType === "theory").length : c.blocos?.length || 0;
                  const estudados = assuntosEstudadosSet();
                  const concluidos = (c.blocos||[]).filter(b => blocoPlanejadoConcluido(b, estudados)).length;
                  const pctConc = totalBlocos > 0 ? Math.round((concluidos/totalBlocos)*100) : 0;
                  const isEditalTodo = c.id?.includes("edital-todo");
                  const isMensal = c.id?.includes("mensal");
                  const tipo = c.origem === "lia" ? "Inteligente" : isEditalTodo ? "Edital completo" : isMensal ? "Mensal" : c.tipo === "diario" ? "Diário" : "Semanal";
                  const materias = [...new Set((c.blocos||[]).slice(0,10).map(b => nomeDisciplinaExibicao(b.nome)).filter(Boolean))].slice(0,4);
                  return (
                    <div className={`saved-schedule ${ativo ? "is-active" : ""}`} key={c.id}>
                      <div className="saved-schedule__body">
                        <div className="saved-schedule__top">
                          <div className="saved-schedule__copy">
                            <div className="saved-schedule__meta">
                              <span>{tipo}</span>
                              {ativo && <b>Ativo</b>}
                            </div>
                            <h3>{c.titulo}</h3>
                            <p>{totalBlocos} blocos · {c.criadoEm ? formatarDataBR(c.criadoEm.slice(0,10)) : "—"}</p>
                          </div>
                          <div className={`saved-schedule__score ${pctConc === 100 ? "is-complete" : ""}`}>
                            <strong>{pctConc}%</strong><span>{concluidos}/{totalBlocos}</span>
                          </div>
                        </div>
                        <div className="saved-schedule__progress">
                          <i className={pctConc === 100 ? "is-complete" : ""} style={{width:`${pctConc}%`}} />
                        </div>
                        {materias.length > 0 && (
                          <div className="saved-schedule__subjects">
                            {materias.map(m => <span key={m}>{m}</span>)}
                            {[...new Set((c.blocos||[]).map(b => b.nome).filter(Boolean))].length > 4 && (
                              <em>+{[...new Set((c.blocos||[]).map(b => b.nome).filter(Boolean))].length - 4} mais</em>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="saved-schedule__actions">
                        <button onClick={() => { definirCronogramaAtivo(c); setAbaCronograma(isEditalTodo ? "editalTodo" : isMensal ? "mensal" : c.tipo === "diario" ? "diario" : "semanal"); }}
                          className="saved-schedule__load">
                          {isEditalTodo || isMensal ? "Ver no calendário" : "Carregar cronograma"}
                        </button>
                        <button onClick={() => exportarCronogramaPdf(c)} className="saved-schedule__utility" title="Exportar PDF"><StudyIcon name="download" size={15} /></button>
                        <button onClick={() => imprimirCronograma(c)} className="saved-schedule__utility" title="Imprimir"><StudyIcon name="print" size={15} /></button>
                        <button onClick={async () => {
                          if (!window.confirm(`Excluir "${c.titulo}"?`)) return;
                          const lista = cronogramasSalvos.filter(x => x.id !== c.id);
                          await salvarCronogramasUsuario(lista);
                          if (cronogramaAtivoId === c.id) { setCronogramaAtivoId(null); setBlocos([]); }
                        }} className="saved-schedule__delete">
                          <StudyIcon name="trash" size={15} />
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
              <StudyIcon name="target" size={14} /> {modoFoco ? "Sair do foco" : "Modo foco"}
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
                      <StudyIcon name="repeat" size={14} /> Resetar
                    </button>
                    <button onClick={() => iniciarQuestoesDaMateria(blocoSelecionado.nome, blocoSelecionado.topico)}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(34,199,122,0.12)",border:"1px solid rgba(34,199,122,0.25)",color:"#22C77A"}}>
                      <StudyIcon name="questions" size={14} /> Questões
                    </button>
                    <button onClick={() => abrirFlashcards(blocoSelecionado.nome, blocoSelecionado.topico)}
                      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(124,92,252,0.12)",border:"1px solid rgba(124,92,252,0.25)",color:"#7C5CFC"}}>
                      <StudyIcon name="cards" size={14} /> Flashcards
                    </button>
                  </div>

                  {/* Botões secundários */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button onClick={async () => { await salvarMateriaPendente(blocoSelecionado); setBlocoSelecionado(null); setModoFoco(false); setTelaEscura(false); }}
                      className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl"
                      style={{background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.25)",color:"#F5A623"}}>
                      Continuar depois
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
                    <p className="text-base font-black mb-1" style={{color:"#22C77A"}}>Você finalizou este bloco?</p>
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
                  {label:"Sequência", value:`${calcularStreak()}d`, color:"#35D4AD"},
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
  <StudyHistoryScreen
    studies={estudos}
    schedules={cronogramasSalvos}
    loading={loading}
    getDate={(materia, assunto) => {
      const data = dataConclusaoAssunto(materia, assunto);
      return data ? formatarDataBR(data) : "";
    }}
    onClear={zerarHistoricoEstudo}
    onPlan={() => setTela("meuCronograma")}
  />
),

revisao: (
  <ReviewScreen
    reviews={revisoesInteligentesPorData()}
    studiedTopics={assuntosEstudadosArray()}
    getDate={(materia, assunto) => {
      const data = dataConclusaoAssunto(materia, assunto);
      return data ? formatarDataBR(data) : "";
    }}
    onStart={iniciarRevisao}
    onComplete={concluirRevisao}
  />
),


resumos: (
  <SummariesScreen
    examId={editalEscolhido}
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
      <div className="daily-briefing fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="daily-briefing__card bg-gray-950 border border-white/12 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="daily-briefing__hero px-6 py-5">
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Resumo do dia</p>
            <h2 className="daily-briefing__title text-xl font-black mt-0.5">Sua agenda de hoje</h2>
            <p className="daily-briefing__subtitle text-xs mt-0.5">{editalAtualNome}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {_blocosHoje.length>0&&<span className="bg-black/30 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">{_blocosHoje.length} matéria{_blocosHoje.length>1?"s":""}</span>}
              {_revisoes.length>0&&<span className="bg-black/30 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">{_revisoes.length} revisão{_revisoes.length>1?"ões":""}</span>}
              {_diasProva>0&&<span className="bg-black/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">{_diasProva} dias</span>}
            </div>
          </div>
          <div className="px-5 py-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {_blocosHoje.map((b,i)=>(
              <div key={"b"+i} className="daily-briefing__item flex items-center gap-2 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="daily-briefing__item-title text-xs font-bold truncate">{b.nome}</p>{b.topico&&<p className="text-[10px] text-gray-500 truncate">{b.topico}</p>}</div>
                <span className="text-[10px] text-gray-500 shrink-0">{b.tempo||30}min</span>
              </div>
            ))}
            {_revisoes.map((r,i)=>(
              <div key={"r"+i} className="daily-briefing__item flex items-center gap-2 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="daily-briefing__item-title text-xs font-bold truncate">{r.materia}</p><p className="text-[10px] text-gray-500 truncate">{r.assunto}</p></div>
                <span className="daily-briefing__badge text-[9px] px-1.5 py-0.5 rounded-full shrink-0">D+{r.diff}</span>
              </div>
            ))}
            {_blocosHoje.length===0&&_revisoes.length===0&&(
              <div className="text-center py-6"><StudyIcon name="target" size={26} /><p className="text-sm text-gray-400">Nenhuma tarefa programada ainda.</p></div>
            )}
            <div className="daily-briefing__date rounded-xl p-3 mt-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Data da prova</p>
              <input type="date" value={_dataProva||""} onChange={e=>salvarDataProva(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none"/>
              {_diasProva>0&&<p className="text-xs text-cyan-400 mt-1 font-bold text-center">{_diasProva} dias restantes</p>}
            </div>
          </div>
          <div className="px-5 py-4 border-t border-white/8 space-y-2">
            <button onClick={()=>{setMostrarBriefing(false);setTela("modulos");}} className="daily-briefing__action w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-sm">Começar a estudar</button>
            <button onClick={()=>{try{localStorage.setItem(`briefing-${editalEscolhido}-${_hojeStr}`,"1");}catch{} setMostrarBriefing(false);setTela("modulos");}} className="daily-briefing__dismiss w-full text-xs py-2">Não mostrar mais hoje</button>
          </div>
        </div>
      </div>
    )}

    {false && !acessoLiberado && tela !== "login" && <TelaBloqueioPagamento />}

    {tela === "concurso" ? renderTelas[tela] : (
      <InternalShell
        screen={tela === "cronograma" ? "meuCronograma" : tela}
        examName={editalAtualNome}
        user={usuario}
        profileName={nomeUsuario}
        pendingCount={derivePending(cronogramasSalvos, assuntosEstudadosSet(), new Set(Object.keys(atividadesConcluidas || {})), _hojeStr).length + pendenciasCronograma.length}
        onNavigate={setTela}
        onChangeExam={() => { setEditalEscolhido(null); setTela("concurso"); }}
        onLogout={() => signOut(auth)}
      >
      {renderTelas[tela === "cronograma" ? "meuCronograma" : tela] || (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-xl text-white">Tela não encontrada.</p>
      </div>
      )}
      </InternalShell>
    )}
  </>
);
}
