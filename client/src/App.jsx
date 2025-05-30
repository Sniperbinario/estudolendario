import React, { useState, useEffect } from "react";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";
import { questoes } from "./data/questoes";

export default function App() {
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
  const [respostaCorreta, setRespostaCorreta] = useState(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

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

  const Container = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-tr from-zinc-900 via-gray-900 to-black text-white">
      <div className="w-full max-w-screen-sm bg-gradient-to-br from-gray-800 to-zinc-700 border border-gray-600 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-6 transition-all duration-300 ease-in-out">
        {children}
      </div>
    </div>
  );

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

  // Funções para Questões
  const iniciarQuestoes = () => {
    const todas = Object.values(questoes).flat();
    const embaralhadas = todas.sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestoesAtual(embaralhadas);
    setQuestaoIndex(0);
    setRespostaSelecionada(null);
    setRespostaCorreta(null);
    setMostrarExplicacao(false);
    setAcertos(0);
    setErros(0);
    setTela("questoes");
  };

  const responderQuestao = (i) => {
    if (respostaSelecionada !== null) return;
    const correta = questoesAtual[questaoIndex].correta;
    setRespostaSelecionada(i);
    setRespostaCorreta(correta);
    setMostrarExplicacao(true);
    if (i === correta) setAcertos((prev) => prev + 1);
    else setErros((prev) => prev + 1);
  };

  const proximaQuestao = () => {
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
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold">Qual concurso você vai vencer?</h2>
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => {
                setMateriasPorBloco(pfMaterias);
                setPesos(pfPesos);
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

    modulos: (
      <Container>
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-xl font-bold text-white">Escolha um módulo para hoje:</h2>
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => setTela("desafio")}
              className="bg-yellow-600 hover:bg-yellow-700 w-full px-6 py-3 rounded-xl shadow"
            >
              🔥 Desafio Diário
            </button>
            <button
              onClick={iniciarQuestoes}
              className="bg-gray-600 hover:bg-gray-700 w-full px-6 py-3 rounded-xl shadow"
            >
              📘 Resolução de Questões
            </button>
            <button
              onClick={() => setTela("cronograma")}
              className="bg-blue-600 hover:bg-blue-700 w-full px-6 py-3 rounded-xl shadow"
            >
              📅 Montar Cronograma
            </button>
          </div>
        </div>
      </Container>
    ),

    desafio: (
      <Container>
        <div className="flex flex-col items-center text-center gap-6">
          <h2 className="text-2xl font-bold text-yellow-400">🔥 Desafio Diário</h2>
          <p className="text-gray-300">
            Ex: Estude 25 minutos sem interrupções. Foque no conteúdo mais desafiador hoje!
          </p>
          <button
            onClick={() => setTela("modulos")}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-6 py-2 rounded-xl shadow"
          >
            🔙 Voltar
          </button>
        </div>
      </Container>
    ),

    questoes: (
      <Container>
       {questoesAtual.length > 0 && questoesAtual[questaoIndex] ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-2xl font-bold text-blue-400">📘 Questão {questaoIndex + 1} de {questoesAtual.length}</h2>
            <p className="text-white text-lg">{questoesAtual[questaoIndex].enunciado}</p>
            <div className="flex flex-col gap-3 w-full">
              {questoesAtual[questaoIndex].alternativas.map((alt, i) => {
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
                    className={`${cor} px-4 py-2 rounded-xl shadow transition`}
                  >
                    {alt}
                  </button>
                );
              })}
            </div>
            {mostrarExplicacao && (
              <div className="text-sm text-gray-300 bg-zinc-800 p-4 rounded-xl border border-gray-600">
                <p><strong>Explicação:</strong> {questoesAtual[questaoIndex].explicacao}</p>
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
    )
  };

  return renderTelas[tela] || (
    <Container>
      <p className="text-center text-xl text-white">Tela não encontrada.</p>
    </Container>
  );
}
