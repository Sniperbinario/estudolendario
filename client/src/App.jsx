// MetaConcurseiro App - Módulos separados em telas com botão de voltar
import React, { useState, useEffect } from "react";
import { materiasPorBloco } from "./data/editalPF";

export default function App() {
  const [tela, setTela] = useState("login");
  const [respostasMotivacionais, setRespostasMotivacionais] = useState([]);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [telaEscura, setTelaEscura] = useState(false);
  const [telaAnterior, setTelaAnterior] = useState(null);

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

  const trocarTela = (novaTela) => {
    setTelaAnterior(tela);
    setTela(novaTela);
  };

  const voltar = () => {
    if (telaAnterior) {
      setTela(telaAnterior);
    }
  };

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
        const tempoMateria = restante >= 60 ? 60 : restante >= 30 ? 30 : 15;
        const qtdTopicos = tempoMateria >= 60 ? 3 : tempoMateria >= 30 ? 2 : 1;
        const topicosSelecionados = materias[i].topicos.sort(() => 0.5 - Math.random()).slice(0, qtdTopicos);
        blocosGerados.push({ nome: materias[i].nome, topicos: topicosSelecionados, tempo: tempoMateria, cor: bloco });
        tempoDistribuidoBloco += tempoMateria;
      }
      tempoDistribuido += tempoDistribuidoBloco;
    });

    const sobra = totalMin - tempoDistribuido;
    if (sobra > 0 && blocosGerados.length > 0) {
      blocosGerados[0].tempo += sobra;
    }
    setBlocos(blocosGerados);
    trocarTela("modulos");
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(false);
    setMostrarConfirmar(false);
    trocarTela("estudo");
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

      {tela === "modulos" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Escolha um módulo:</h2>
          <button className="bg-yellow-600 px-6 py-2 rounded-xl" onClick={() => trocarTela("desafio")}>🔥 Desafio Diário</button>
          <button className="bg-blue-600 px-6 py-2 rounded-xl" onClick={() => trocarTela("questoes")}>📘 Resolução de Questões</button>
          <button className="bg-green-600 px-6 py-2 rounded-xl" onClick={() => trocarTela("cronograma")}>📅 Ver Cronograma</button>
        </div>
      )}

      {tela === "desafio" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Desafio Diário</h2>
          <p>Em breve perguntas interativas...</p>
          <button className="bg-gray-600 px-4 py-2 rounded-xl" onClick={voltar}>🔙 Voltar</button>
        </div>
      )}

      {tela === "questoes" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Resolução de Questões</h2>
          <p>Funcionalidade em desenvolvimento.</p>
          <button className="bg-gray-600 px-4 py-2 rounded-xl" onClick={voltar}>🔙 Voltar</button>
        </div>
      )}

      {tela === "cronograma" && (
        <div className="text-center space-y-4 w-full max-w-lg">
          <h2 className="text-2xl font-bold">Seu cronograma de hoje:</h2>
          {blocos.map((bloco, idx) => (
            <button
              key={idx}
              onClick={() => iniciarEstudo(bloco)}
              className="w-full text-left p-3 rounded-xl bg-blue-600"
            >
              <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
              <span className="italic">Tópicos: {bloco.topicos.join(", ")}</span>
            </button>
          ))}
          <button className="bg-gray-600 px-4 py-2 rounded-xl mt-4" onClick={voltar}>🔙 Voltar</button>
        </div>
      )}

      {/* demais telas continuam como estavam... */}
    </div>
  );
}
