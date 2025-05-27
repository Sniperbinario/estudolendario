// MetaConcurseiro App - Todas as telas organizadas com fluxo correto
import React, { useState, useEffect } from "react";
import { materiasPorBloco } from "./data/editalPF";

export default function App() {
  const [tela, setTela] = useState("login");
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
        const tempoMateria = restante >= 45 ? 45 : restante >= 30 ? 30 : 15;
        const quantidadeTopicos = tempoMateria >= 60 ? 3 : tempoMateria >= 30 ? 2 : 1;

        const topicosSorteados = [...materias[i].topicos]
          .sort(() => 0.5 - Math.random())
          .slice(0, quantidadeTopicos);

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
    setTela("modulo");
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(false);
    setMostrarConfirmar(false);
    setTela("estudo");
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
        <button className="bg-blue-600 px-6 py-3 rounded-xl" onClick={() => setTela("boasvindas")}>Entrar</button>
      )}

      {tela === "boasvindas" && (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Bem-vindo ao MetaConcurseiro</h1>
          <p>O app anti-procrastinação mais completo para concursos!</p>
          <button className="bg-green-600 px-6 py-2 rounded-xl" onClick={() => setTela("concurso")}>Começar</button>
        </div>
      )}

      {tela === "concurso" && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Escolha o concurso</h2>
          <button className="bg-blue-600 px-6 py-2 rounded-xl" onClick={() => setTela("motivacao")}>Polícia Federal</button>
        </div>
      )}

      {tela === "motivacao" && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Você está motivado para estudar?</h2>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setTela("tempo")} className="bg-green-600 px-4 py-2 rounded-xl">Sim</button>
            <button onClick={() => alert("Preencha as perguntas motivacionais (futuro)")} className="bg-red-600 px-4 py-2 rounded-xl">Não</button>
          </div>
        </div>
      )}

      {tela === "tempo" && (
        <div className="max-w-xl w-full space-y-6">
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

      {tela === "modulo" && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Escolha um módulo para hoje:</h2>
          <button onClick={() => setTela("cronograma") } className="bg-yellow-600 px-6 py-2 rounded-xl">🔥 Desafio Diário</button>
          <button className="bg-gray-600 px-6 py-2 rounded-xl">📘 Resolução de Questões (em breve)</button>
        </div>
      )}

      {tela === "cronograma" && (
        <div className="max-w-xl w-full space-y-4">
          {blocos.map((bloco, idx) => (
            <button
              key={idx}
              onClick={() => iniciarEstudo(bloco)}
              className={`w-full text-left p-3 rounded-xl bg-blue-600`}
            >
              <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
              <span className="italic">Tópicos: {bloco.topicos.join(", ")}</span>
            </button>
          ))}
        </div>
      )}

      {tela === "estudo" && blocoSelecionado && (
        <div className="text-center space-y-4">
          {!telaEscura && (
            <>
              <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
              <p className="text-lg">Tópicos: {blocoSelecionado.topicos.join(", ")}</p>
              <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
              <div className="w-full bg-white rounded overflow-hidden h-4">
                <div className="bg-blue-500 h-4" style={{ width: `${progresso}%` }}></div>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setPausado(!pausado)} className="bg-yellow-600 px-4 py-2 rounded-xl">
                  {pausado ? "▶️ Retomar" : "⏸ Pausar"}
                </button>
                <button onClick={() => { setTelaEscura(true); setMostrarConfirmar('reset'); setTimeout(() => setMostrarConfirmar('reset-buttons'), 3000); }} className="bg-purple-600 px-4 py-2 rounded-xl">🔁 Resetar</button>
                <button onClick={confirmarEncerramento} className="bg-green-600 px-4 py-2 rounded-xl">✅ Concluir</button>
                <button onClick={confirmarEncerramento} className="bg-red-600 px-4 py-2 rounded-xl">❌ Encerrar</button>
              </div>
            </>
          )}

          {telaEscura && (
            <div className="text-center mt-8">
              {mostrarConfirmar.startsWith('reset') && (<p className="text-2xl text-red-500 font-bold piscar">Deseja realmente resetar o tempo?</p>)}
              {mostrarConfirmar.startsWith('mostrar') && (<p className="text-2xl text-red-500 font-bold piscar">Você finalizou mesmo ou só está se enganando?</p>)}
              {mostrarConfirmar.endsWith('buttons') && (
                <div className="flex gap-4 justify-center mt-4">
                  {mostrarConfirmar === 'mostrar-buttons' && (
                    <>
                      <button onClick={() => setBlocoSelecionado(null)} className="bg-blue-600 px-4 py-2 rounded-xl">✔️ Confirmar</button>
                      <button onClick={() => { setTelaEscura(false); setMostrarConfirmar(false); }} className="bg-gray-600 px-4 py-2 rounded-xl">⏳ Continuar estudando</button>
                    </>
                  )}
                  {mostrarConfirmar === 'reset-buttons' && (
                    <>
                      <button onClick={() => { setTempoRestante(blocoSelecionado.tempo * 60); setTelaEscura(false); setMostrarConfirmar(false); }} className="bg-blue-600 px-4 py-2 rounded-xl">✔️ Confirmar Reset</button>
                      <button onClick={() => { setTelaEscura(false); setMostrarConfirmar(false); }} className="bg-gray-600 px-4 py-2 rounded-xl">❌ Cancelar</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
