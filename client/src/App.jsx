// MetaConcurseiro App Completo - Todas as telas integradas com cronograma funcional
import React, { useState, useEffect } from "react";
import { materiasPorBloco } from "./Data/editalPF";

export default function App() {
  const [tela, setTela] = useState("login");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [motivacao, setMotivacao] = useState(null);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [telaEscura, setTelaEscura] = useState(false);

  const pesos = {
    Bloco1: 0.5,
    Bloco2: 0.3,
    Bloco3: 0.2
  };

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado) {
      intervalo = setInterval(() => {
        setTempoRestante(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante, pausado]);

  const gerarCronograma = () => {
    const totalMin = Math.round(parseFloat(tempoEstudo) * 60 || 60);
    if (isNaN(totalMin) || totalMin < 30 || totalMin > 240) {
      alert("Informe um tempo entre 0.5 e 4 horas (30 a 240 minutos)");
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
        const tempoMateria = restante >= 60 ? 45 : restante >= 30 ? 30 : 15;
        const topicosSorteados = materias[i].topicos.sort(() => 0.5 - Math.random()).slice(0, tempoMateria >= 60 ? 3 : tempoMateria >= 30 ? 2 : 1);
        blocosGerados.push({ nome: materias[i].nome, topicos: topicosSorteados, tempo: tempoMateria });
        tempoDistribuidoBloco += tempoMateria;
      }
      tempoDistribuido += tempoDistribuidoBloco;
    });

    const sobra = totalMin - tempoDistribuido;
    if (sobra > 0 && blocosGerados.length > 0) {
      blocosGerados[0].tempo += sobra;
    }
    setBlocos(blocosGerados);
    setTela("modulos");
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(false);
    setMostrarConfirmar(false);
    setTela("cronograma");
  };

  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const confirmarEncerramento = () => {
    setTelaEscura(true);
    setMostrarConfirmar(false);
    setMostrarConfirmar('mostrar');
    setTimeout(() => setMostrarConfirmar('mostrar-buttons'), 3000);
  };

  const progresso = blocoSelecionado ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100 : 0;

  return (
    <div className={`min-h-screen ${telaEscura ? 'bg-black' : 'bg-gray-900'} text-white p-6 flex flex-col items-center justify-center`}>
      <style>{`
        .piscar { animation: piscar 1s infinite; }
        @keyframes piscar { 0% {opacity: 1;} 50% {opacity: 0;} 100% {opacity: 1;} }
      `}</style>

      {tela === "login" && (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-center">Bem-vindo ao MetaConcurseiro</h1>
          <button onClick={() => setTela("boasvindas")} className="bg-blue-600 px-6 py-2 rounded-xl">Entrar</button>
        </div>
      )}

      {tela === "boasvindas" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Olá, futuro aprovado!</h2>
          <p className="text-center">Este é o seu sistema antiprocrastinação premium.</p>
          <button onClick={() => setTela("escolherConcurso")} className="bg-green-600 px-6 py-2 rounded-xl">Continuar</button>
        </div>
      )}

      {tela === "escolherConcurso" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Escolha seu concurso:</h2>
          <button onClick={() => setTela("vantagens")} className="bg-purple-600 px-6 py-2 rounded-xl">Polícia Federal</button>
        </div>
      )}

      {tela === "vantagens" && (
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-bold">Motivos para continuar:</h2>
          <p>Salário, estabilidade, e carreira sólida. Bora focar!</p>
          <button onClick={() => setTela("motivacional")} className="bg-blue-600 px-6 py-2 rounded-xl">Avançar</button>
        </div>
      )}

      {tela === "motivacional" && (
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-bold">Você está motivado para estudar hoje?</h2>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setTela("modulos")} className="bg-green-600 px-4 py-2 rounded-xl">Sim</button>
            <button onClick={() => setTela("perguntas")} className="bg-red-600 px-4 py-2 rounded-xl">Não</button>
          </div>
        </div>
      )}

      {tela === "perguntas" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center">Vamos te ajudar a lembrar do seu porquê:</h2>
          {[1, 2, 3, 4, 5].map(i => (
            <input key={i} type="text" placeholder={`Motivo ${i}`} className="w-full p-2 rounded text-black" />
          ))}
          <button onClick={() => setTela("modulos")} className="bg-blue-600 px-6 py-2 rounded-xl">Continuar</button>
        </div>
      )}

      {tela === "modulos" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Escolha um módulo para hoje:</h2>
          <div className="flex flex-col gap-4 items-center">
            <button onClick={() => setTela("cronogramaInput")} className="bg-yellow-600 px-6 py-2 rounded-xl">🔥 Desafio Diário</button>
            <button disabled className="bg-gray-600 px-6 py-2 rounded-xl">📘 Resolução de Questões (em breve)</button>
          </div>
        </div>
      )}

      {tela === "cronogramaInput" && (
        <div className="space-y-4 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center">Quanto tempo você vai estudar hoje?</h2>
          <input
            type="text"
            placeholder="Informe o tempo em horas (ex: 1.5)"
            className="w-full px-4 py-2 rounded text-black"
            onChange={(e) => {
              const valor = parseFloat(e.target.value.replace(',', '.'));
              setTempoEstudo(isNaN(valor) ? 0 : valor);
            }}
          />
          <button
            onClick={gerarCronograma}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl"
          >
            Gerar Cronograma
          </button>
        </div>
      )}

      {tela === "cronograma" && blocoSelecionado && (
        <div className="text-center space-y-4">
          {!telaEscura && (
            <>
              <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
              <p className="text-lg italic">Tópicos: {blocoSelecionado.topicos.join(', ')}</p>
              <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
              <div className="w-full bg-white rounded overflow-hidden h-4">
                <div className="bg-blue-500 h-4" style={{ width: `${progresso}%` }}></div>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setPausado(!pausado)} className="bg-yellow-600 px-4 py-2 rounded-xl">
                  {pausado ? "▶️ Retomar" : "⏸ Pausar"}
                </button>
                <button onClick={() => setTela("modulos")} className="bg-gray-600 px-4 py-2 rounded-xl">🔙 Voltar</button>
                <button onClick={() => setTelaEscura(true)} className="bg-green-600 px-4 py-2 rounded-xl">✅ Concluir</button>
              </div>
            </>
          )}
          {telaEscura && (
            <>
              <p className="text-2xl font-bold text-red-500 piscar">Você finalizou mesmo ou só está se enganando?</p>
              {mostrarConfirmar === 'mostrar-buttons' && (
                <div className="flex gap-4 justify-center mt-4">
                  <button onClick={() => setBlocoSelecionado(null)} className="bg-blue-600 px-4 py-2 rounded-xl">✔️ Confirmar</button>
                  <button onClick={() => { setTelaEscura(false); setMostrarConfirmar(false); }} className="bg-gray-600 px-4 py-2 rounded-xl">⏳ Continuar estudando</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tela === "modulos" && blocos.length > 0 && (
        <div className="mt-8 space-y-4">
          {blocos.map((bloco, idx) => (
            <button
              key={idx}
              onClick={() => iniciarEstudo(bloco)}
              className="w-full max-w-md bg-blue-700 text-white text-left p-4 rounded-xl"
            >
              <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
              <span className="italic text-sm">Tópicos: {bloco.topicos.join(', ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
