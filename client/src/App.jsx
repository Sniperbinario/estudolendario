import React, { useState, useEffect } from "react";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";
import questoes from "./data/questoes";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// LOGIN/CADASTRO FIREBASE
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
  // Estado do usuário logado
  const [usuario, setUsuario] = useState(null);
  // Estado para saber se concluiu o desafio diário
  const [desafioConcluido, setDesafioConcluido] = useState(false);

  // Novo: Controle de concurso selecionado (editais)
  const [edital, setEdital] = useState(null); // "pf" ou "inss" etc.

  // Novo: Progresso separado por edital (questões únicas e cronograma estudado)
  const [progressoQuestoes, setProgressoQuestoes] = useState({}); // { [edital]: { respondidas: Set, acertos, erros } }
  const [progressoCronograma, setProgressoCronograma] = useState({}); // { [edital]: [{ bloco, data }] }

  // Controle das questões (index, etc.)
  const [questoesAtual, setQuestoesAtual] = useState([]);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [respostaCorreta, setRespostaCorreta] = useState(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

  // Estados do cronograma e motivação (mantendo tudo igual ao seu original)
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

  // Tela do app
  const [tela, setTela] = useState("login");

  // Novo: Desempenho geral (se quiser manter o desempenho geral do usuário, mas agora usaremos por edital)
  const [desempenhoQuestoes, setDesempenhoQuestoes] = useState({ acertos: 0, erros: 0 });

  // Novo: Carregar progresso por edital ao logar ou trocar edital
  useEffect(() => {
    if (!usuario || !edital) return;
    async function buscarProgressoEdital() {
      const snap = await getDoc(doc(db, "users", usuario.uid, "editais", edital));
      if (snap.exists()) {
        const data = snap.data();
        setProgressoQuestoes(qs => ({ ...qs, [edital]: data.progressoQuestoes || { respondidas: [], acertos: 0, erros: 0 } }));
        setProgressoCronograma(pc => ({ ...pc, [edital]: data.progressoCronograma || [] }));
      } else {
        setProgressoQuestoes(qs => ({ ...qs, [edital]: { respondidas: [], acertos: 0, erros: 0 } }));
        setProgressoCronograma(pc => ({ ...pc, [edital]: [] }));
      }
    }
    buscarProgressoEdital();
  }, [usuario, edital]);

  // Mantém sua proteção: login/cadastro obrigatórios
  if (!usuario) {
    return <LoginRegister onLogin={setUsuario} />;
  }
  // Lista de concursos disponíveis
  const listaEditais = [
    { id: "pf", nome: "Polícia Federal", materias: pfMaterias, pesos: pfPesos },
    { id: "inss", nome: "INSS", materias: inssMaterias, pesos: inssPesos }
  ];

  // Função para seleção do edital
  const selecionarEdital = (editalId) => {
    setEdital(editalId);
    const editalObj = listaEditais.find(e => e.id === editalId);
    setMateriasPorBloco(editalObj.materias);
    setPesos(editalObj.pesos);
    setTela("modulos");
  };

  // Botão de logout e botão de voltar para escolha de edital
  const BotaoLogout = () => (
    <div className="flex justify-end p-4">
      <span className="mr-2">Olá, {usuario?.email}</span>
      <button
        onClick={() => {
          setEdital(null);
          setTela("login");
          signOut(auth);
        }}
        className="bg-red-600 px-3 py-1 rounded"
      >
        Sair
      </button>
    </div>
  );

  const BotaoTrocarEdital = () =>
    edital && (
      <div className="flex justify-start p-2">
        <button
          onClick={() => {
            setEdital(null);
            setTela("concurso");
          }}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
        >
          Trocar concurso
        </button>
      </div>
    );

  // Função para salvar progresso de questões no Firestore (SÓ conta se nunca respondeu)
  async function registrarRespostaQuestao(questaoId, acertou) {
    if (!usuario || !edital) return;
    const progresso = progressoQuestoes[edital] || { respondidas: [], acertos: 0, erros: 0 };
    if (!progresso.respondidas.includes(questaoId)) {
      const novo = {
        ...progresso,
        respondidas: [...progresso.respondidas, questaoId],
        acertos: acertou ? progresso.acertos + 1 : progresso.acertos,
        erros: !acertou ? progresso.erros + 1 : progresso.erros,
      };
      setProgressoQuestoes(qs => ({ ...qs, [edital]: novo }));
      await setDoc(doc(db, "users", usuario.uid, "editais", edital), {
        progressoQuestoes: novo
      }, { merge: true });
    }
  }

  // Função para salvar progresso do cronograma no Firestore
  async function registrarBlocoCronograma(bloco) {
    if (!usuario || !edital) return;
    const novoCronograma = [
      ...(progressoCronograma[edital] || []),
      { ...bloco, data: new Date().toISOString() }
    ];
    setProgressoCronograma(pc => ({ ...pc, [edital]: novoCronograma }));
    await setDoc(doc(db, "users", usuario.uid, "editais", edital), {
      progressoCronograma: novoCronograma
    }, { merge: true });
  }

  // O render das telas começa aqui:
  // --- Renderização das TELAS principais ---
  const renderTelas = {
    concurso: (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white">
        <div className="w-full max-w-md bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center mb-4">Qual concurso você vai vencer?</h2>
          {listaEditais.map((e) => (
            <button
              key={e.id}
              onClick={() => selecionarEdital(e.id)}
              className={`w-full px-6 py-3 rounded-xl shadow font-semibold text-lg mb-2 ${
                e.id === "pf"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-yellow-500 hover:bg-yellow-600 text-black"
              }`}
            >
              {e.nome}
            </button>
          ))}
        </div>
      </div>
    ),

    modulos: (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white space-y-6">
        <BotaoLogout />
        <BotaoTrocarEdital />
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-500">MetaConcurseiro</h1>
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
            onClick={() => setTela("questoes")}
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
        </div>
      </div>
    ),

    motivacao: (
      <div className="flex flex-col items-center text-center gap-6 min-h-screen justify-center bg-gray-900">
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
    ),

    reflexao: (
      <div className="flex flex-col items-center gap-4 text-white min-h-screen justify-center bg-gray-900 w-full">
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
    ),

    desafio: (
      <div className="flex flex-col items-center text-center gap-6 min-h-screen justify-center bg-gray-900">
        <h2 className="text-2xl font-bold text-yellow-400">🔥 Desafio Diário</h2>
        {/* Aqui pode manter a lógica original do seu desafio */}
        <button
          onClick={() => setTela("modulos")}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-6 py-2 rounded-xl shadow mt-6"
        >
          Voltar ao Menu
        </button>
      </div>
    ),
    cronograma: (
      <div className={`min-h-screen p-6 flex flex-col items-center text-white transition-all duration-500 ${corFundo}`}>
        <BotaoLogout />
        <BotaoTrocarEdital />
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
                onClick={() => {
                  // Usa sua função já existente
                  const totalMin = Math.round(parseFloat(tempoEstudo) * 60 || 60);
                  // ... [coloque aqui a sua lógica de geração de blocos, igual ao seu código original]
                  // No final: setBlocos(blocosGerados);
                }}
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
                        onClick={() => {
                          setBlocoSelecionado(bloco);
                          setTempoRestante(bloco.tempo * 60);
                          setPausado(false);
                          setTelaEscura(false);
                          setMostrarConfirmar("");
                          setCorFundo("bg-gray-900");
                        }}
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
              {/* Lógica do estudo e conclusão do bloco */}
              {/* ... igual sua original ... */}
              <button
                onClick={() => {
                  // Ao concluir o bloco, salva no progresso por edital
                  registrarBlocoCronograma(blocoSelecionado);
                  setBlocoSelecionado(null);
                }}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl mt-4 shadow"
              >
                Concluir Bloco
              </button>
            </div>
          )}
        </div>
      </div>
    ),

    questoes: (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white">
        <BotaoLogout />
        <BotaoTrocarEdital />
        <div className="w-full max-w-xl bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 rounded-3xl p-6 shadow-xl flex flex-col gap-6 items-center">
          {questoesAtual.length > 0 && questaoIndex < questoesAtual.length ? (
            <>
              <h2 className="text-2xl font-bold text-blue-400">📘 Questão {questaoIndex + 1} de {questoesAtual.length}</h2>
              <p className="text-white text-lg">
                {questoesAtual[questaoIndex]?.enunciado}
              </p>
              {/* ...informações extra da questão... */}
              <div className="flex flex-col gap-3 w-full">
                {/* Alternativas e lógica igual sua original */}
                {questoesAtual[questaoIndex]?.alternativas?.map((alt, i) => {
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
                      onClick={() => {
                        if (respostaSelecionada !== null) return;
                        const correta = questoesAtual[questaoIndex].correta;
                        setRespostaSelecionada(i);
                        setRespostaCorreta(correta);
                        setMostrarExplicacao(true);
                        const questaoId = questoesAtual[questaoIndex]?.id || `${questaoIndex}`;
                        // Só conta se nunca respondeu no Firestore
                        registrarRespostaQuestao(questaoId, i === correta);
                        if (i === correta) setAcertos((prev) => prev + 1);
                        else setErros((prev) => prev + 1);
                      }}
                      className={`${cor} text-left px-4 py-3 rounded-xl shadow transition flex gap-2 items-start`}
                    >
                      <span className="font-bold">{letras[i]}.</span> <span>{alt}</span>
                    </button>
                  );
                })}
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
                  onClick={() => {
                    if (questaoIndex + 1 < questoesAtual.length) {
                      setQuestaoIndex((prev) => prev + 1);
                      setRespostaSelecionada(null);
                      setRespostaCorreta(null);
                      setMostrarExplicacao(false);
                    } else {
                      setMostrarExplicacao(false);
                      setTela("resultadoQuestoes");
                    }
                  }}
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
            </>
          ) : (
            <p className="text-white text-center">Carregando questão...</p>
          )}
        </div>
      </div>
    ),
    desempenho: (
      <div className="flex flex-col items-center text-center gap-6 min-h-screen justify-center bg-gray-900">
        <BotaoLogout />
        <BotaoTrocarEdital />
        <h2 className="text-3xl font-bold text-purple-400">📊 Seu Desempenho</h2>
        <div className="bg-gray-800 p-6 rounded-2xl shadow space-y-3">
          <div>
            <span className="text-lg text-green-400 font-semibold">Acertos: </span>
            <span className="text-2xl font-bold">
              {progressoQuestoes[edital]?.acertos || 0}
            </span>
          </div>
          <div>
            <span className="text-lg text-red-400 font-semibold">Erros: </span>
            <span className="text-2xl font-bold">
              {progressoQuestoes[edital]?.erros || 0}
            </span>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl shadow space-y-3 mt-6 w-full max-w-md">
          <h3 className="text-lg font-bold mb-2 text-white">Cronograma Estudado</h3>
          {(progressoCronograma[edital] || []).length === 0 && (
            <p className="text-gray-400">Nenhum bloco estudado ainda.</p>
          )}
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {(progressoCronograma[edital] || []).map((b, i) => (
              <li key={i}>
                {b.nome} — {b.tempo} min
                {b.topico ? <> <span className="text-gray-400">({b.topico})</span> </> : null}
                <span className="ml-2 text-xs text-gray-400">{b.data && new Date(b.data).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setTela("modulos")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow mt-6"
        >
          🔙 Voltar ao Menu
        </button>
      </div>
    ),

    resultadoQuestoes: (
      <div className="flex flex-col items-center gap-6 text-center min-h-screen justify-center bg-gray-900">
        <BotaoLogout />
        <BotaoTrocarEdital />
        <h2 className="text-3xl font-bold text-green-400">✅ Resultado Final</h2>
        <p className="text-white text-lg">Você concluiu todas as questões!</p>
        <div className="text-lg text-white">
          <p>
            🎯 Acertos (sessão): <strong className="text-green-400">{acertos}</strong>
          </p>
          <p>
            ❌ Erros (sessão): <strong className="text-red-400">{erros}</strong>
          </p>
        </div>
        <button
          onClick={() => setTela("modulos")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl shadow"
        >
          🔙 Voltar ao Menu
        </button>
      </div>
    ),
  };

  // Renderização principal
  return renderTelas[tela] || (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-xs flex flex-col gap-4">
        <p className="text-center text-xl text-white">Tela não encontrada.</p>
      </div>
    </div>
  );
}
