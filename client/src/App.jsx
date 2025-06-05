import React, { useState, useEffect } from "react";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";
import questoes from "./data/questoes";
import LandingPage from "./LandingPage";
// === COMPONENTE LOGIN CADASTRO FIREBASE ===
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

//COMPONETENTE DO FIREBASE
import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc  } from "firebase/firestore";


function LoginRegister({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState("login");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      if (modo === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        onLogin(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        onLogin(userCredential.user);
      }
    } catch (error) {
      setErro(error.message.replace("Firebase:", ""));
    }
    setCarregando(false);
  };

  return (
   <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
  
  {/* Texto chamativo */}
  <div className="text-center mb-8">
    <h1 className="text-3xl font-bold">🎯 Sua aprovação começa aqui</h1>
    <p className="text-gray-300">Acesse sua conta e conquiste sua rotina vencedora</p>
  </div>

  {/* Formulário */}
  <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-xs flex flex-col gap-4">
    <h2 className="text-xl font-bold text-center">
      {modo === "login" ? "Entrar" : "Criar Conta"}
    </h2>
    <input
      type="email"
      placeholder="E-mail"
      value={email}
      required
      onChange={(e) => setEmail(e.target.value)}
      className="p-2 rounded bg-gray-700 border border-gray-600"
    />
    <input
      type="password"
      placeholder="Senha"
      value={senha}
      required
      minLength={6}
      onChange={(e) => setSenha(e.target.value)}
      className="p-2 rounded bg-gray-700 border border-gray-600"
    />
    {erro && <div className="text-red-400 text-sm">{erro}</div>}
    <button
      type="submit"
      disabled={carregando}
      className="bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
    >
      {carregando ? "Carregando..." : (modo === "login" ? "Entrar" : "Cadastrar")}
    </button>
    <div className="text-sm text-center mt-2">
      {modo === "login" ? (
        <>
          Não tem conta?{" "}
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
            Entrar
          </button>
        </>
      )}
    </div>
  </form>
</div>
);
}
// === FIM LOGIN CADASTRO ===
export default function App() {
  const [tela, setTela] = useState("inicio");

  // COMPONENTE REFLEXÃO MOTIVACIONAL
  function FraseMotivacionalEDiasProva() {
    const FRASES = [
      "Cada dia de estudo te deixa mais próximo da vaga.",
      "Você pode mais do que imagina. Não desista!",
      "Só desiste quem não nasceu pra vencer. Esse não é seu caso!",
      "A diferença entre aprovado e reprovado é não desistir.",
      "Levanta a cabeça! O seu futuro depende de você.",
      "Essa vaga já tem dono: você. Só continuar caminhando!",
      "Faltam só alguns passos. Bora pra cima!",
      "Concurso se ganha no detalhe. Você já tá na frente.",
    ];
    const DATA_PROVA = new Date("2024-07-28T00:00:00-03:00"); // Troque pela sua data real!
    const [frase, setFrase] = React.useState("");
    const [dias, setDias] = React.useState(0);

    React.useEffect(() => {
      setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]);
      function calcularDias() {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        DATA_PROVA.setHours(0,0,0,0);
        const diff = DATA_PROVA.getTime() - hoje.getTime();
        const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setDias(d > 0 ? d : 0);
      }
      calcularDias();
      const interval = setInterval(calcularDias, 60 * 60 * 1000); // Atualiza a cada hora
      return () => clearInterval(interval);
    }, []);

    return (
      <>
        <p className="text-2xl text-indigo-100 font-semibold italic animate-fade mb-3">{frase}</p>
        <div className="flex flex-col items-center my-3">
          <span className="text-6xl font-extrabold text-yellow-400 animate-pulse flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} fill="none" viewBox="0 0 24 24"><path fill="#facc15" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z"></path></svg>
            {dias}
          </span>
          <span className="text-white text-lg -mt-2">dias para a prova</span>
        </div>
      </>
    );
  }
export default function App() {
  // Estado do usuário logado
  const [usuario, setUsuario] = useState(null);
  const [editalEscolhido, setEditalEscolhido] = useState(null);
  const [mostrarLanding, setMostrarLanding] = useState(true);

  // Estado para saber se concluiu o desafio diário
  const [desafioConcluido, setDesafioConcluido] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsub();
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
  const [questoesAtual, setQuestoesAtual] = useState([]);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [materiaEscolhida, setMateriaEscolhida] = useState("");
  const [respostaCorreta, setRespostaCorreta] = useState(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [desempenhoQuestoes, setDesempenhoQuestoes] = useState({ acertos: 0, erros: 0 });
 
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
      const materias = materiasPorBloco[bloco];
      const tempoBlocoTotal = Math.round(totalMin * peso);

      let tempoDistribuidoBloco = 0;
      const blocosBloco = [];

      for (let i = 0; i < materias.length; i++) {
        if (tempoDistribuidoBloco >= tempoBlocoTotal) break;

        const restante = tempoBlocoTotal - tempoDistribuidoBloco;
        let tempoMateria = Math.min(Math.max(TEMPO_MIN, restante), TEMPO_MAX);

        if (restante < TEMPO_MIN) break;

        const topico = materias[i].topicos[Math.floor(Math.random() * materias[i].topicos.length)];

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

    setBlocos(blocosGerados);
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
          <h1 className="text-4xl font-extrabold text-white">MetaConcurseiro 💡</h1>
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
          <h2 className="text-3xl font-bold text-white">Bem-vindo ao MetaConcurseiro! 🚀</h2>
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
      <Container>
        <div className="flex flex-col items-start gap-4 text-white">
          <h2 className="text-xl font-bold">Benefícios de ser aprovado:</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-200">
            <li>💸 Salário inicial competitivo</li>
            <li>🔒 Estabilidade garantida</li>
            <li>⏱ Jornada de 40h semanais</li>
          </ul>
          <button
            onClick={() => setTela("motivacao")}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl mt-4 shadow"
          >
            Continuar
          </button>
        </div>
      </Container>
    ),

motivacao: (
  <Container>
    <div className="flex flex-col items-center gap-8 text-center py-12 px-2 bg-black/60 rounded-2xl shadow-2xl">
      <img
        src="/distintivo.png" // Troque pelo caminho da sua imagem
        alt="Mascote"
        className="w-36 h-36 rounded-full border-4 border-indigo-400 shadow-lg animate-bounce"
      />
      <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg animate-fade">
        Pronto para sua aprovação?
      </h2>
      <p className="text-lg text-indigo-200 mb-4 max-w-lg">
        O seu futuro começa agora! Só depende de você.
      </p>
      <button
        onClick={() => setTela("modulos")}
        className="bg-green-600 hover:bg-green-700 px-12 py-5 rounded-xl text-2xl font-bold mt-4 shadow-lg animate-pulse"
      >
        🚀 Começar agora!
      </button>
    </div>
  </Container>
),

reflexao: (
  <Container>
    <div className="flex flex-col items-center gap-8 text-center px-2 py-8 bg-black/60 rounded-2xl shadow-2xl">
      <img
        src="/distintivo.png" // ajuste o caminho para sua mascote, ou mascote que preferir!
        alt="Mascote"
        className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-lg mb-2 animate-bounce"
      />
      <h2 className="text-3xl font-extrabold text-yellow-400 drop-shadow-lg">Todo mundo tem dias difíceis!</h2>
      <FraseMotivacionalEDiasProva />
      <p className="text-base text-gray-300 max-w-lg">Você é um dos poucos que não desistiu. Continue! <span className="text-green-400">A aprovação está chegando.</span></p>
      <button
        onClick={() => setTela("modulos")}
        className="bg-green-600 hover:bg-green-700 px-10 py-4 rounded-xl text-2xl font-bold shadow-xl mt-4 animate-pulse"
      >
        Voltar para o início
      </button>
    </div>
  </Container>
),

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
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white space-y-6">
    <BotaoLogout />
      <div className="text-center mt-[-40px] sm:mt-0">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-500">
        MetaConcurseiro
      </h1>
      <p className="text-base sm:text-lg text-gray-300 mt-1">
        Estude com inteligência. Vença com propósito.
      </p>
    </div>
     <div className="w-full max-w-md bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 rounded-3xl p-6 shadow-xl space-y-5 mt-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-white text-center">
        Escolha um módulo para hoje:
      </h2>
      <button
        onClick={() => setTela("desafio")}
        className="w-full bg-yellow-800 hover:bg-yellow-900 px-6 py-4 rounded-xl shadow text-white text-base sm:text-lg font-medium"
      >
        🔥 Desafio Diário
      </button>
      <button
        onClick={() => setTela("escolherMateria")}
        className="w-full bg-gray-600 hover:bg-gray-700 px-6 py-4 rounded-xl shadow text-white text-base sm:text-lg font-medium"
      >
        📘 Resolução de Questões
      </button>
      <button
        onClick={() => setTela("cronograma")}
        className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-xl shadow text-white text-base sm:text-lg font-medium"
      >
        🗓️ Montar Cronograma
      </button>
      <button
        onClick={() => setTela("desempenho")}
        className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-xl shadow text-white text-base sm:text-lg font-medium"
      >
        📊 Meu Desempenho
      </button>
      <button
        onClick={() => {
          setEditalEscolhido(null);
          setTela("concurso");
        }}
        className="w-full bg-red-700 hover:bg-red-800 px-6 py-4 rounded-xl shadow text-white text-base sm:text-lg font-medium"
      >
        🔄 Trocar Edital
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
            <p className="text-white text-lg">
              {questoesAtual[questaoIndex]?.enunciado}
            </p>
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
            <button
              onClick={() => setTela("modulos")}
              className="mt-2 text-sm text-gray-400 hover:underline"
            >
              Sair das questões
            </button>
          </div>
        ) : (
          <p className="text-white text-center">Carregando questão...</p>
        )}
      </Container>
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
                </>
              )}

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
                            onClick={() => setBlocoSelecionado(null)}
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
  return renderTelas[tela] || (
    <Container>
      <p className="text-center text-xl text-white">Tela não encontrada.</p>
    </Container>
  );
}
