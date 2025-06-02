import React, { useState, useEffect } from "react";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";
import questoes from "./data/questoes";

import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

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

export default function App() {
  // ESTADOS BASE
  const [usuario, setUsuario] = useState(null);
  const [editalSelecionado, setEditalSelecionado] = useState(null); // NOVO
  const [progressoQuestoes, setProgressoQuestoes] = useState({
    acertos: 0,
    erros: 0,
    questoesRespondidas: []
  }); // NOVO
  const [historicoCronograma, setHistoricoCronograma] = useState([]); // NOVO

  const [desafioConcluido, setDesafioConcluido] = useState(false);
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

  const [questoesAtual, setQuestoesAtual] = useState([]);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [respostaCorreta, setRespostaCorreta] = useState(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

  // ==== LOGIN AUTOMÁTICO ====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsub();
  }, []);

  // ==== BUSCA DESAFIO ====
  useEffect(() => {
    async function buscarDesafio() {
      if (!usuario) return;
      const snap = await getDoc(doc(db, "users", usuario.uid));
      if (snap.exists() && snap.data().desafioConcluido) {
        setDesafioConcluido(true);
      } else {
        setDesafioConcluido(false);
      }
    }
    buscarDesafio();
  }, [usuario]);

  // ==== BUSCA PROGRESSO POR EDITAL ====
  useEffect(() => {
    async function buscarProgresso() {
      if (!usuario || !editalSelecionado) return;
      const snap = await getDoc(doc(db, "users", usuario.uid, "progressos", editalSelecionado));
      if (snap.exists()) {
        const data = snap.data();
        setProgressoQuestoes({
          acertos: data.acertos || 0,
          erros: data.erros || 0,
          questoesRespondidas: data.questoesRespondidas || []
        });
        setHistoricoCronograma(data.cronograma || []);
      } else {
        setProgressoQuestoes({ acertos: 0, erros: 0, questoesRespondidas: [] });
        setHistoricoCronograma([]);
        await setDoc(doc(db, "users", usuario.uid, "progressos", editalSelecionado), {
          acertos: 0, erros: 0, questoesRespondidas: [], cronograma: []
        });
      }
    }
    buscarProgresso();
  }, [usuario, editalSelecionado]);

  // ===== HANDLERS DE SELEÇÃO DE EDITAL ====
  const selecionarEdital = (edital) => {
    setEditalSelecionado(edital);
    if (edital === "PF") {
      setMateriasPorBloco(pfMaterias);
      setPesos(pfPesos);
    }
    if (edital === "INSS") {
      setMateriasPorBloco(inssMaterias);
      setPesos(inssPesos);
    }
    setTela("modulos");
    setBlocos([]);
    setBlocoSelecionado(null);
  };
  const voltarParaEscolhaEdital = () => {
    setEditalSelecionado(null);
    setProgressoQuestoes({ acertos: 0, erros: 0, questoesRespondidas: [] });
    setHistoricoCronograma([]);
    setTela("concurso");
  };
  // ===== PROGRESSO QUESTÕES (EDITAL SEPARADO, NÃO DUPLICA) =====
  async function salvarProgressoQuestoes(idQuestao, acertou) {
    if (!usuario || !editalSelecionado) return;
    const ref = doc(db, "users", usuario.uid, "progressos", editalSelecionado);
    const snap = await getDoc(ref);
    let data = snap.exists()
      ? snap.data()
      : { acertos: 0, erros: 0, questoesRespondidas: [], cronograma: [] };
    if (!data.questoesRespondidas.includes(idQuestao)) {
      data.questoesRespondidas.push(idQuestao);
      data.acertos += acertou ? 1 : 0;
      data.erros += acertou ? 0 : 1;
      await setDoc(ref, data, { merge: true });
      setProgressoQuestoes({
        acertos: data.acertos,
        erros: data.erros,
        questoesRespondidas: data.questoesRespondidas
      });
    }
  }

  // ===== CRONOGRAMA (EDITAL SEPARADO) =====
  async function salvarBlocoCronograma(bloco) {
    if (!usuario || !editalSelecionado) return;
    const ref = doc(db, "users", usuario.uid, "progressos", editalSelecionado);
    const snap = await getDoc(ref);
    let data = snap.exists()
      ? snap.data()
      : { acertos: 0, erros: 0, questoesRespondidas: [], cronograma: [] };
    data.cronograma = data.cronograma || [];
    data.cronograma.push({ ...bloco, data: Date.now() });
    await setDoc(ref, data, { merge: true });
    setHistoricoCronograma([...data.cronograma]);
  }

  // ===== DESAFIO DIÁRIO =====
  async function marcarDesafioComoConcluido() {
    if (!usuario) return;
    setDesafioConcluido(true);
    await setDoc(doc(db, "users", usuario.uid), { desafioConcluido: true }, { merge: true });
  }

  // ===== TIMER CRONOGRAMA, CORES DE FUNDO, ETC (seu original) =====
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

  // ===== FUNÇÃO CONTAINER =====
  const Container = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white">
      <div className="w-full max-w-screen-sm bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-6 transition-all duration-300 ease-in-out">
        {children}
      </div>
    </div>
  );

  // ===== UTILITÁRIOS =====
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
    // Salva cronograma deste edital!
    salvarBlocoCronograma(blocoSelecionado);
    setTimeout(() => {
      setBlocoSelecionado(null);
      setTela("cronograma");
    }, 50);
  };

  // ===== GERAÇÃO DE CRONOGRAMA (mantém igual ao seu original) =====
  // (Seu código de gerarCronograma segue igual aqui...)

  // ===== HANDLERS DE QUESTÕES (adaptação do progresso por edital) =====
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

  // SEGUE SUA LÓGICA DE RESPOSTA/PROGRESSO/RENDER NORMAL ABAIXO...
  const renderTelas = {
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
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold">Qual concurso você vai vencer?</h2>
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => {
                setMateriasPorBloco(pfMaterias);
                setPesos(pfPesos);
                setEditalSelecionado("pf");
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
                setEditalSelecionado("inss");
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
        <div className="flex flex-col items-center text-center gap-6">
          <h2 className="text-xl font-bold text-white">Você está motivado hoje?</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => setTela("modulos")}
              className="bg-green-600 hover:bg-green-700 w-full px-6 py-3 rounded-xl shadow"
            >
              ✅ Sim!
            </button>
            <button
              onClick={() => setTela("reflexao")}
              className="bg-red-600 hover:bg-red-700 w-full px-6 py-3 rounded-xl shadow"
            >
              ❌ Não estou
            </button>
          </div>
        </div>
      </Container>
    ),

    reflexao: (
      <Container>
        <div className="flex flex-col items-center gap-4 text-white w-full">
          <h2 className="text-xl font-bold">Resgate sua motivação 🧠</h2>
          <p className="text-center text-gray-300">Responda essas perguntas com sinceridade:</p>
          {respostasMotivacionais.map((r, i) => (
            <input
              key={i}
              value={r}
              onChange={(e) => {
                const novas = [...respostasMotivacionais];
                novas[i] = e.target.value;
                setRespostasMotivacionais(novas);
              }}
              placeholder={`Pergunta ${i + 1}`}
              className="w-full bg-white text-black p-2 rounded-xl"
            />
          ))}
          <button
            onClick={() => setTela("modulos")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-6 py-3 rounded-xl shadow mt-4"
          >
            Continuar motivado!
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
              <span className="text-2xl font-bold">{progressoQuestoes.acertos}</span>
            </div>
            <div>
              <span className="text-lg text-red-400 font-semibold">Erros: </span>
              <span className="text-2xl font-bold">{progressoQuestoes.erros}</span>
            </div>
          </div>
          <button
            onClick={() => setTela("modulos")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow"
          >
            🔙 Voltar ao Menu
          </button>
        </div>
      </Container>
    )
  };
    modulos: (
      <Container>
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold text-white">Menu Principal 📚</h2>
          <p className="text-gray-300">Escolha o que você quer fazer agora:</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => setTela("questoes")}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow w-full"
            >
              🧠 Responder questões
            </button>
            <button
              onClick={() => setTela("cronograma")}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl shadow w-full"
            >
              🕒 Estudar com cronograma
            </button>
          </div>
          <button
            onClick={() => setTela("desempenho")}
            className="mt-4 text-sm text-gray-400 hover:underline"
          >
            Ver desempenho
          </button>
        </div>
      </Container>
    ),

    questoes: (
      <Container>
        {questoesAtual.length > 0 && questaoIndex < questoesAtual.length ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white text-center">Questão {questaoIndex + 1}</h2>
            <p className="text-white">{questoesAtual[questaoIndex]?.pergunta}</p>
            <div className="flex flex-col gap-2">
              {questoesAtual[questaoIndex]?.alternativas.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => responderQuestao(i)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-xl border border-zinc-500"
                >
                  {alt}
                </button>
              ))}
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
    )
  };

  // Renderização principal
  return renderTelas[tela] || (
    <Container>
      <p className="text-center text-xl text-white">Tela não encontrada.</p>
    </Container>
  );
}

