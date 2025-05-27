// MetaConcurseiro App Premium - Todas as telas conectadas
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
        const tempoMateria = restante >= 60 ? 30 : restante >= 30 ? 20 : 15;
        const qtdTopicos = tempoMateria >= 60 ? 3 : tempoMateria >= 30 ? 2 : 1;
        const topicosAleatorios = materias[i].topicos.sort(() => 0.5 - Math.random()).slice(0, qtdTopicos);

        blocosGerados.push({ nome: materias[i].nome, topicos: topicosAleatorios, tempo: tempoMateria });
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
  };

  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const progresso = blocoSelecionado ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
      <style>{`
        .piscar { animation: piscar 1s infinite; }
        @keyframes piscar { 0% {opacity: 1;} 50% {opacity: 0;} 100% {opacity: 1;} }
      `}</style>

      {tela === "login" && (
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold">Bem-vindo ao MetaConcurseiro</h1>
          <button onClick={() => setTela("boasVindas")} className="bg-blue-600 px-6 py-2 rounded">Entrar</button>
        </div>
      )}

      {tela === "boasVindas" && (
        <div className="space-y-6 text-center">
          <h1 className="text-2xl">O sistema antiprocrastinação de elite dos concurseiros</h1>
          <button onClick={() => setTela("escolherConcurso")} className="bg-blue-600 px-6 py-2 rounded">Avançar</button>
        </div>
      )}

      {tela === "escolherConcurso" && (
        <div className="space-y-6 text-center">
          <h2 className="text-xl">Escolha seu concurso:</h2>
          <button onClick={() => setTela("remuneracao")} className="bg-green-600 px-6 py-2 rounded">Polícia Federal</button>
        </div>
      )}

      {tela === "remuneracao" && (
        <div className="space-y-4 text-center">
          <p>Salário: R$ 12.522,50</p>
          <p>Estabilidade, benefícios e respeito.</p>
          <button onClick={() => setTela("motivacao")} className="bg-green-600 px-6 py-2 rounded">Quero Estudar</button>
        </div>
      )}

      {tela === "motivacao" && (
        <div className="space-y-6 text-center">
          <h2>Você está motivado para estudar hoje?</h2>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setTela("modulos")} className="bg-blue-600 px-4 py-2 rounded">Sim!</button>
            <button onClick={() => setTela("modulos")} className="bg-gray-600 px-4 py-2 rounded">Não muito...</button>
          </div>
        </div>
      )}

      {tela === "modulos" && (
        <div className="space-y-6 text-center">
          <h2 className="text-xl font-semibold">Escolha um módulo para hoje:</h2>
          <div className="flex flex-col gap-4">
            <button onClick={() => setTela("desafio")} className="bg-amber-600 px-4 py-2 rounded">🔥 Desafio Diário</button>
            <button onClick={() => setTela("questoes")} className="bg-gray-600 px-4 py-2 rounded">📘 Resolução de Questões (em breve)</button>
            <button onClick={() => setTela("cronograma")} className="bg-blue-600 px-4 py-2 rounded">🗓️ Montar Cronograma</button>
          </div>
        </div>
      )}

      {tela === "desafio" && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">Desafio Diário</h2>
          <p>10 questões para testar seus conhecimentos!</p>
          <p className="italic">(Em construção)</p>
          <button onClick={() => setTela("modulos")} className="mt-4 bg-gray-700 px-4 py-2 rounded">🔙 Voltar</button>
        </div>
      )}

      {tela === "questoes" && (
        <div className="text-center">
          <h2 className="text-xl">Resolução de Questões</h2>
          <p>(Em breve com centenas de questões por matéria)</p>
          <button onClick={() => setTela("modulos")} className="mt-4 bg-gray-700 px-4 py-2 rounded">🔙 Voltar</button>
        </div>
      )}

      {tela === "cronograma" && (
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

          {blocos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Seu cronograma de hoje:</h3>
              {blocos.map((bloco, idx) => (
                <div key={idx} className="w-full text-left p-3 rounded-xl bg-blue-600">
                  <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
                  <span className="italic">Tópicos: {bloco.topicos.join(", ")}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setTela("modulos")} className="mt-6 bg-gray-700 px-4 py-2 rounded w-full">🔙 Voltar</button>
        </div>
      )}
    </div>
  );
}
