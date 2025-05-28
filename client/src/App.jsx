import React, { useState, useEffect } from "react";
import { materiasPorBloco as pfMaterias, pesos as pfPesos } from "./data/editalPF";
import { materiasPorBloco as inssMaterias, pesos as inssPesos } from "./data/editalINSS";

export default function App() {
  const [tela, setTela] = useState("login");
  const [materiasPorBloco, setMateriasPorBloco] = useState(pfMaterias);
  const [pesos, setPesos] = useState(pfPesos);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [telaEscura, setTelaEscura] = useState(true);
  const [respostasMotivacionais, setRespostasMotivacionais] = useState(["", "", "", "", ""]);
  const [corFundo, setCorFundo] = useState("bg-gray-900");

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado) {
      intervalo = setInterval(() => setTempoRestante(t => t - 1), 1000);
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
  const gerarCronograma = () => {
    const totalMin = Math.round(parseFloat(tempoEstudo) * 60 || 60);
    if (isNaN(totalMin) || totalMin < 30 || totalMin > 240) {
      alert("Informe entre 0.5 e 4 horas");
      return;
    }

    let blocosGerados = [];
    let tempoDistribuido = 0;
    Object.entries(pesos).forEach(([bloco, peso]) => {
      const materias = materiasPorBloco[bloco];
      const tempoBloco = Math.round(totalMin * peso);
      let tempoDistribuidoBloco = 0;
      for (let i = 0; i < materias.length; i++) {
        const restante = tempoBloco - tempoDistribuidoBloco;
        if (restante < 15) break;
        const tempoMateria = restante >= 30 ? 20 : 15;
        const topico = materias[i].topicos[Math.floor(Math.random() * materias[i].topicos.length)];
        blocosGerados.push({ nome: materias[i].nome, topico, tempo: tempoMateria, cor: bloco });
        tempoDistribuidoBloco += tempoMateria;
      }
      tempoDistribuido += tempoDistribuidoBloco;
    });

    const sobra = totalMin - tempoDistribuido;
    if (sobra > 0 && blocosGerados.length > 0) {
      blocosGerados[0].tempo += sobra;
    }

    setBlocos(blocosGerados);
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(true);
    setMostrarConfirmar(false);
    setCorFundo("bg-gray-900");
  };

  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const confirmarEncerramento = () => {
    setMostrarConfirmar("mostrar");
    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 2500);
  };

  const progresso = blocoSelecionado
    ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100
    : 0;

  const Container = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white transition-all duration-500 ease-in-out">
      <div className="w-full max-w-screen-sm">{children}</div>
    </div>
  );
  const renderTelas = {
    login: (
      <Container>
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold">MetaConcurseiro App</h1>
          <button onClick={() => setTela("boas-vindas")} className="bg-blue-600 w-full sm:w-auto px-6 py-3 rounded-xl">Entrar</button>
        </div>
      </Container>
    ),

    "boas-vindas": (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold">Bem-vindo ao MetaConcurseiro!</h2>
          <p>Vamos transformar sua rotina de estudos e te levar até a aprovação!</p>
          <button onClick={() => setTela("concurso")} className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-xl">Começar</button>
        </div>
      </Container>
    ),

    concurso: (
      <Container>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold">Escolha o concurso</h2>
          <button
            onClick={() => {
              setMateriasPorBloco(pfMaterias);
              setPesos(pfPesos);
              setTela("beneficios");
            }}
            className="bg-blue-600 w-full sm:w-auto px-6 py-3 rounded-xl"
          >
            Polícia Federal
          </button>
          <button
            onClick={() => {
              setMateriasPorBloco(inssMaterias);
              setPesos(inssPesos);
              setTela("beneficios");
            }}
            className="bg-yellow-500 w-full sm:w-auto px-6 py-3 rounded-xl"
          >
            INSS
          </button>
        </div>
      </Container>
    ),

    beneficios: (
      <Container>
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-xl font-bold">Benefícios do Concurso</h2>
          <ul className="list-disc pl-4">
            <li>Salário inicial competitivo</li>
            <li>Estabilidade garantida</li>
            <li>Jornada de 40h semanais</li>
          </ul>
          <button onClick={() => setTela("motivacao")} className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-xl">Próximo</button>
        </div>
      </Container>
    ),

    motivacao: (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-xl font-bold">Você está motivado para estudar hoje?</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button onClick={() => setTela("modulos")} className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-xl">Sim</button>
            <button onClick={() => setTela("reflexao")} className="bg-red-600 w-full sm:w-auto px-6 py-3 rounded-xl">Não</button>
          </div>
        </div>
      </Container>
    ),

    reflexao: (
      <Container>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Reflexão</h2>
          <p>Responda essas perguntas para recuperar sua motivação:</p>
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
              className="w-full text-black p-2 rounded"
            />
          ))}
          <button onClick={() => setTela("modulos")} className="bg-blue-600 w-full sm:w-auto px-6 py-3 rounded-xl">Continuar motivado!</button>
        </div>
      </Container>
    ),
    modulos: (
      <Container>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Escolha um módulo para hoje:</h2>
          <div className="flex flex-col gap-4 w-full">
            <button onClick={() => setTela("desafio")} className="bg-yellow-600 w-full px-6 py-3 rounded-xl">🔥 Desafio Diário</button>
            <button onClick={() => setTela("questoes")} className="bg-gray-600 w-full px-6 py-3 rounded-xl">📘 Resolução de Questões</button>
            <button onClick={() => setTela("cronograma")} className="bg-blue-600 w-full px-6 py-3 rounded-xl">📅 Montar Cronograma</button>
          </div>
        </div>
      </Container>
    ),

    desafio: (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold">Desafio Diário</h2>
          <p>Ex: Estude 25 minutos sem interrupções. Foque no conteúdo que você mais tem dificuldade!</p>
          <button onClick={() => setTela("modulos")} className="bg-red-600 w-full sm:w-auto px-6 py-2 rounded-xl">🔙 Voltar</button>
        </div>
      </Container>
    ),

    questoes: (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold">Resolução de Questões</h2>
          <p>Em breve você poderá resolver questões aqui, diretamente do edital escolhido!</p>
          <button onClick={() => setTela("modulos")} className="bg-red-600 w-full sm:w-auto px-6 py-2 rounded-xl">🔙 Voltar</button>
        </div>
      </Container>
    ),

    cronograma: (
  <div className={`min-h-screen ${telaEscura ? 'bg-black' : 'bg-gray-900'} text-white p-4 flex flex-col items-center transition-all duration-500 ease-in-out`}>
    <div className="w-full max-w-screen-sm">
      <style>{`.piscar { animation: piscar 1s infinite; } @keyframes piscar { 0% {opacity: 1;} 50% {opacity: 0;} 100% {opacity: 1;} }`}</style>

      {blocoSelecionado && (
  <div className="text-center space-y-4 transition-all duration-500 ease-in-out">
    {(!telaEscura || (mostrarConfirmar && mostrarConfirmar.endsWith("buttons"))) && (
      <>
        <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
        <p className="text-lg">Tópico: {blocoSelecionado.topico}</p>
        <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
        <div className="w-full bg-white rounded overflow-hidden h-4">
          <div className="bg-blue-500 h-4" style={{ width: `${progresso}%` }}></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => setPausado(!pausado)} className="bg-yellow-600 px-4 py-2 rounded-xl w-full sm:w-auto">
            {pausado ? "▶️ Retomar" : "⏸ Pausar"}
          </button>
          <button
            onClick={() => {
              setTelaEscura(true);
              setMostrarConfirmar("reset");
              setTimeout(() => setMostrarConfirmar("reset-buttons"), 2500);
            }}
            className="bg-purple-600 px-4 py-2 rounded-xl w-full sm:w-auto"
          >
            🔁 Resetar
          </button>
          <button
            onClick={confirmarEncerramento}
            className="bg-green-600 px-4 py-2 rounded-xl w-full sm:w-auto"
          >
            ✅ Concluir
          </button>
          <button
            onClick={confirmarEncerramento}
            className="bg-red-600 px-4 py-2 rounded-xl w-full sm:w-auto"
          >
            ❌ Encerrar
          </button>
        </div>
      </>
    )}

    {telaEscura && (
      <div className="text-center mt-8">
        {typeof mostrarConfirmar === "string" && mostrarConfirmar.startsWith("reset") && (
          <p className="text-2xl text-red-500 font-bold piscar">Deseja realmente resetar o tempo?</p>
        )}
        {typeof mostrarConfirmar === "string" && mostrarConfirmar.startsWith("mostrar") && (
          <p className="text-2xl text-red-500 font-bold piscar">Você finalizou mesmo ou só está se enganando?</p>
        )}

        {typeof mostrarConfirmar === "string" && mostrarConfirmar.endsWith("buttons") && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            {mostrarConfirmar === "mostrar-buttons" && (
              <>
                <button
                  onClick={() => setBlocoSelecionado(null)}
                  className="bg-blue-600 px-4 py-2 rounded-xl w-full sm:w-auto"
                >
                  ✔️ Confirmar
                </button>
                <button
                  onClick={() => {
                    setTelaEscura(false);
                    setMostrarConfirmar(false);
                  }}
                  className="bg-gray-600 px-4 py-2 rounded-xl w-full sm:w-auto"
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
                  className="bg-blue-600 px-4 py-2 rounded-xl w-full sm:w-auto"
                >
                  ✔️ Confirmar Reset
                </button>
                <button
                  onClick={() => {
                    setTelaEscura(false);
                    setMostrarConfirmar(false);
                  }}
                  className="bg-gray-600 px-4 py-2 rounded-xl w-full sm:w-auto"
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
    </div>
  );
}


  return renderTelas[tela] || (
    <Container>
      <p className="text-center text-xl">Tela não encontrada.</p>
    </Container>
  );
}
