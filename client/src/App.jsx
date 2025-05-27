// MetaConcurseiro App - Versão com todas as telas restauradas e cronograma funcional
import React, { useState, useEffect } from "react";
import { materiasPorBloco } from "./Data/editalPF";

export default function App() {
  const [tela, setTela] = useState("inicio");
  const [motivacao, setMotivacao] = useState("");
  const [tempoEstudo, setTempoEstudo] = useState("");
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
      intervalo = setInterval(() => setTempoRestante(t => t - 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante, pausado]);

  const gerarCronograma = () => {
    const totalMin = Math.round(parseFloat(tempoEstudo.replace(",", ".")) * 60);
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
        const tempoMateria = restante >= 30 ? 20 : 15;
        const topicos = [...materias[i].topicos];
        const topicosEscolhidos = topicos.sort(() => 0.5 - Math.random()).slice(0, tempoMateria >= 60 ? 3 : 1);
        blocosGerados.push({ nome: materias[i].nome, topico: topicosEscolhidos.join(", "), tempo: tempoMateria, cor: bloco });
        tempoDistribuidoBloco += tempoMateria;
      }
      tempoDistribuido += tempoDistribuidoBloco;
    });
    const sobra = totalMin - tempoDistribuido;
    if (sobra > 0 && blocosGerados.length > 0) blocosGerados[0].tempo += sobra;
    setBlocos(blocosGerados);
    setTela("modulos");
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(false);
    setMostrarConfirmar(false);
    setTela("cronometro");
  };

  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const progresso = blocoSelecionado ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col items-center justify-center">
      {tela === "inicio" && (
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">MetaConcurseiro App</h1>
          <button onClick={() => setTela("motivacao")} className="bg-blue-600 px-6 py-3 rounded-xl">Começar</button>
        </div>
      )}

      {tela === "motivacao" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl">Você está motivado hoje?</h2>
          <input type="text" value={motivacao} onChange={e => setMotivacao(e.target.value)} className="text-black px-4 py-2 rounded" />
          <button onClick={() => setTela("tempo")} className="bg-green-600 px-4 py-2 rounded-xl">Continuar</button>
        </div>
      )}

      {tela === "tempo" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl">Quanto tempo você vai estudar hoje?</h2>
          <input type="text" placeholder="Horas (ex: 1.5)" value={tempoEstudo} onChange={e => setTempoEstudo(e.target.value)} className="text-black px-4 py-2 rounded" />
          <button onClick={gerarCronograma} className="bg-blue-600 px-4 py-2 rounded-xl">Gerar Cronograma</button>
        </div>
      )}

      {tela === "modulos" && (
        <div className="text-center space-y-6">
          <h2 className="text-xl font-bold">Escolha um módulo para hoje:</h2>
          <button onClick={() => setTela("desafio")} className="bg-yellow-600 px-4 py-2 rounded-xl">🔥 Desafio Diário</button>
          <button className="bg-gray-600 px-4 py-2 rounded-xl">📘 Resolução de Questões (em breve)</button>
          <button onClick={() => setTela("tempo")} className="text-sm underline text-gray-300">Voltar</button>
        </div>
      )}

      {tela === "desafio" && (
        <div className="text-center space-y-6">
          <h2 className="text-xl font-bold">Blocos para estudar:</h2>
          {blocos.map((bloco, idx) => (
            <button key={idx} onClick={() => iniciarEstudo(bloco)} className="bg-blue-600 hover:bg-blue-700 text-left w-full px-4 py-3 rounded-xl">
              <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
              <span className="italic text-sm">Tópicos: {bloco.topico}</span>
            </button>
          ))}
          <button onClick={() => setTela("modulos")} className="text-sm underline text-gray-300">Voltar</button>
        </div>
      )}

      {tela === "cronometro" && blocoSelecionado && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
          <p className="italic">Tópicos: {blocoSelecionado.topico}</p>
          <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
          <div className="w-full bg-white rounded overflow-hidden h-4">
            <div className="bg-green-500 h-4" style={{ width: `${progresso}%` }}></div>
          </div>
          <div className="flex gap-4 justify-center mt-4">
            <button onClick={() => setPausado(!pausado)} className="bg-yellow-600 px-4 py-2 rounded-xl">{pausado ? "▶️ Retomar" : "⏸ Pausar"}</button>
            <button onClick={() => setTela("modulos")} className="bg-gray-600 px-4 py-2 rounded-xl">🔙 Voltar</button>
            <button onClick={() => setTela("modulos")} className="bg-green-600 px-4 py-2 rounded-xl">✅ Concluir</button>
          </div>
        </div>
      )}
    </div>
  );
}
