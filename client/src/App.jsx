// MetaConcurseiro App - Organizado com sequência de telas
import React, { useState, useEffect } from "react";
import { materiasPorBloco } from "./data/editalPF";

export default function App() {
  const [tela, setTela] = useState("login");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [motivacao, setMotivacao] = useState("");
  const [perguntasMotivacionais, setPerguntasMotivacionais] = useState([]);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [telaEscura, setTelaEscura] = useState(false);

  const pesos = { Bloco1: 0.5, Bloco2: 0.3, Bloco3: 0.2 };

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado) {
      intervalo = setInterval(() => {
        setTempoRestante((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante, pausado]);

  const avancarTela = () => {
    const ordem = ["login", "boasvindas", "concurso", "motivacao", "modulo", "cronograma"];
    const atual = ordem.indexOf(tela);
    setTela(ordem[atual + 1]);
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
        const tempoMateria = restante >= 60 ? 30 : restante >= 45 ? 20 : 15;
        const topicos = [...materias[i].topicos];
        const selecionados = [];
        while (selecionados.length < (tempoMateria >= 60 ? 3 : tempoMateria >= 45 ? 2 : 1)) {
          const escolhido = topicos.splice(Math.floor(Math.random() * topicos.length), 1)[0];
          if (escolhido) selecionados.push(escolhido);
        }
        blocosGerados.push({
          nome: materias[i].nome,
          topicos: selecionados,
          tempo: tempoMateria,
          cor: bloco
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
    setTela("estudo");
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

  const progresso = blocoSelecionado
    ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100
    : 0;

  return (
    <div className={`min-h-screen ${telaEscura ? "bg-black" : "bg-gray-900"} text-white p-6 flex flex-col items-center justify-center`}>
      {tela === "login" && (
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold">Bem-vindo ao MetaConcurseiro</h1>
          <input placeholder="Seu nome" className="text-black px-4 py-2 rounded" onChange={(e) => setNomeUsuario(e.target.value)} />
          <button onClick={avancarTela} className="bg-blue-600 px-6 py-2 rounded">Entrar</button>
        </div>
      )}

      {tela === "boasvindas" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl">Olá, {nomeUsuario}!</h2>
          <p>Você está prestes a montar seu dia ideal de estudos e vencer a procrastinação.</p>
          <button onClick={avancarTela} className="bg-green-600 px-6 py-2 rounded">Vamos lá!</button>
        </div>
      )}

      {tela === "concurso" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl">Escolha seu concurso:</h2>
          <button onClick={avancarTela} className="bg-yellow-600 px-6 py-2 rounded">Polícia Federal 2025</button>
        </div>
      )}

      {tela === "motivacao" && (
        <div className="text-center space-y-4">
          <h2 className="text-xl">Você está motivado para estudar hoje?</h2>
          <div className="flex justify-center gap-4">
            <button onClick={() => setTela("modulo")} className="bg-green-600 px-4 py-2 rounded">Sim</button>
            <button onClick={() => setPerguntasMotivacionais(["Por que você começou a estudar?", "O que você quer conquistar?", "Quem te inspira?", "O que está te atrapalhando hoje?", "Qual é o próximo passo?"])} className="bg-red-600 px-4 py-2 rounded">Não</button>
          </div>
          {perguntasMotivacionais.length > 0 && (
            <div className="space-y-2 text-left mt-4">
              {perguntasMotivacionais.map((p, idx) => (
                <div key={idx}><strong>{p}</strong><br /><textarea className="text-black w-full rounded" rows={2}></textarea></div>
              ))}
              <button onClick={() => setTela("modulo")} className="bg-blue-600 mt-4 px-6 py-2 rounded">Pronto</button>
            </div>
          )}
        </div>
      )}

      {tela === "modulo" && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Escolha um módulo para hoje:</h2>
          <button onClick={() => setTela("cronograma")} className="bg-amber-500 px-6 py-2 rounded">🔥 Desafio Diário</button>
          <button disabled className="bg-gray-500 px-6 py-2 rounded">📘 Resolução de Questões (em breve)</button>
        </div>
      )}

      {tela === "cronograma" && !blocoSelecionado && (
        <div className="max-w-xl w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">Quanto tempo você vai estudar hoje?</h2>
          <input
            type="text"
            placeholder="Informe o tempo em horas (ex: 1.5)"
            className="w-full px-4 py-2 rounded text-black"
            onChange={(e) => {
              const valor = parseFloat(e.target.value.replace(",", "."));
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
                <button
                  key={idx}
                  onClick={() => iniciarEstudo(bloco)}
                  className="w-full text-left p-3 rounded-xl bg-blue-600"
                >
                  <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
                  <span className="italic">Tópicos: {bloco.topicos.join(", ")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {blocoSelecionado && (
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
                <button onClick={() => { setTelaEscura(true); setMostrarConfirmar('mostrar'); setTimeout(() => setMostrarConfirmar('mostrar-buttons'), 3000); }} className="bg-green-600 px-4 py-2 rounded-xl">✅ Concluir</button>
                <button onClick={() => { setTelaEscura(true); setMostrarConfirmar('mostrar'); setTimeout(() => setMostrarConfirmar('mostrar-buttons'), 3000); }} className="bg-red-600 px-4 py-2 rounded-xl">❌ Encerrar</button>
              </div>
            </>
          )}

          {telaEscura && (
            <div className="text-center mt-8">
              {mostrarConfirmar.startsWith('reset') && (<p className="text-2xl text-red-500 font-bold">Deseja realmente resetar o tempo?</p>)}
              {mostrarConfirmar.startsWith('mostrar') && (<p className="text-2xl text-red-500 font-bold">Você finalizou mesmo ou só está se enganando?</p>)}
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
