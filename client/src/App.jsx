// MetaConcurseiro App - Versão Final com Cronograma Funcional e Todas as Telas
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
  const [pesos] = useState({ Bloco1: 0.5, Bloco2: 0.3, Bloco3: 0.2 });

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado) {
      intervalo = setInterval(() => {
        setTempoRestante((t) => t - 1);
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

        const tempoMateria = restante >= 60 ? 60 : restante >= 30 ? 30 : 15;
        const topicosAleatorios = [...materias[i].topicos].sort(() => 0.5 - Math.random());
        const topicosSelecionados = topicosAleatorios.slice(0, tempoMateria >= 60 ? 3 : tempoMateria >= 30 ? 2 : 1);

        blocosGerados.push({
          nome: materias[i].nome,
          topicos: topicosSelecionados,
          tempo: tempoMateria,
          cor: bloco,
        });
        tempoDistribuidoBloco += tempoMateria;
      }
      tempoDistribuido += tempoDistribuidoBloco;
    });

    const sobra = totalMin - tempoDistribuido;
    if (sobra > 0 && blocosGerados.length > 0) {
      blocosGerados[0].tempo += sobra;
    }
    setBlocos(blocosGerados);
    setTela("cronograma-gerado");
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setPausado(false);
    setTelaEscura(false);
    setMostrarConfirmar(false);
    setTela("cronograma-estudo");
  };

  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const confirmarEncerramento = () => {
    setTelaEscura(true);
    setMostrarConfirmar(false);
    setMostrarConfirmar("mostrar");
    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 3000);
  };

  const progresso = blocoSelecionado ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100 : 0;

  return (
    <div className={`min-h-screen ${telaEscura ? "bg-black" : "bg-gray-900"} text-white p-6 flex flex-col items-center justify-center`}>
      <style>{`
        .piscar { animation: piscar 1s infinite; }
        @keyframes piscar { 0% {opacity: 1;} 50% {opacity: 0;} 100% {opacity: 1;} }
      `}</style>

      {tela === "cronograma" && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">Quanto tempo você vai estudar hoje?</h2>
          <input
            type="text"
            placeholder="Informe o tempo em horas (ex: 1.5)"
            className="w-full px-4 py-2 rounded text-black"
            onChange={(e) => {
              const valor = parseFloat(e.target.value.replace(",", "."));
              setTempoEstudo(isNaN(valor) ? 0 : valor);
            }}
          />
          <button onClick={gerarCronograma} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl">
            Gerar Cronograma
          </button>
        </div>
      )}

      {tela === "cronograma-gerado" && (
        <div className="space-y-4 text-center w-full max-w-lg">
          <h3 className="text-xl font-semibold">Seu cronograma de hoje:</h3>
          {blocos.map((bloco, idx) => (
            <button
              key={idx}
              onClick={() => iniciarEstudo(bloco)}
              className={`w-full text-left p-3 rounded-xl bg-blue-700`}
            >
              <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
              <span className="italic">Tópicos: {bloco.topicos.join(", ")}</span>
            </button>
          ))}
          <button onClick={() => setTela("modulos")}>🔙 Voltar</button>
        </div>
      )}

      {tela === "cronograma-estudo" && blocoSelecionado && (
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
                <button onClick={() => setTela("cronograma-gerado")}>🔙 Voltar</button>
                <button onClick={confirmarEncerramento} className="bg-green-600 px-4 py-2 rounded-xl">✅ Concluir</button>
                <button onClick={confirmarEncerramento} className="bg-red-600 px-4 py-2 rounded-xl">❌ Encerrar</button>
              </div>
            </>
          )}

          {telaEscura && (
            <div className="text-center mt-8">
              <p className="text-2xl text-red-500 font-bold piscar">Você finalizou mesmo ou só está se enganando?</p>
              {mostrarConfirmar === "mostrar-buttons" && (
                <div className="flex gap-4 justify-center mt-4">
                  <button onClick={() => setTela("modulos")} className="bg-blue-600 px-4 py-2 rounded-xl">✔️ Confirmar</button>
                  <button onClick={() => { setTelaEscura(false); setMostrarConfirmar(false); }} className="bg-gray-600 px-4 py-2 rounded-xl">⏳ Continuar estudando</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
