// MetaConcurseiro App Premium - Todas as telas renderizadas e cronograma integrado
import React, { useState, useEffect } from "react";

export default function App() {
  const [tela, setTela] = useState("login");
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [telaEscura, setTelaEscura] = useState(false);
  const [respostasMotivacionais, setRespostasMotivacionais] = useState(["", "", "", "", ""]);

  const pesos = {
    Bloco1: 0.5,
    Bloco2: 0.3,
    Bloco3: 0.2
  };

  const materiasPorBloco = {
    Bloco1: [
      { nome: "Língua Portuguesa", topicos: ["Gramática", "Ortografia"] },
      { nome: "Raciocínio Lógico", topicos: ["Proposições", "Diagramas"] },
    ],
    Bloco2: [
      { nome: "Direito Penal", topicos: ["Crimes", "Sanções"] },
    ],
    Bloco3: [
      { nome: "Informática", topicos: ["Segurança", "Atalhos"] },
    ]
  };

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado) {
      intervalo = setInterval(() => setTempoRestante(t => t - 1), 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante, pausado]);

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
    setTelaEscura(false);
    setMostrarConfirmar(false);
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

  const renderTelas = {
    login: (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-6">MetaConcurseiro App</h1>
        <button onClick={() => setTela("boas-vindas")} className="bg-blue-600 px-6 py-3 rounded-xl text-white">Entrar</button>
      </div>
    ),
    "boas-vindas": (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Bem-vindo ao MetaConcurseiro!</h2>
        <p className="mb-6 max-w-lg text-center">Nosso objetivo é ajudar você a vencer a procrastinação e alcançar sua aprovação. Bora começar?</p>
        <button onClick={() => setTela("concurso")} className="bg-green-600 px-6 py-3 rounded-xl">Começar</button>
      </div>
    ),
    concurso: (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Escolha o concurso</h2>
        <button onClick={() => setTela("beneficios")} className="bg-blue-600 px-6 py-3 rounded-xl">Polícia Federal</button>
      </div>
    ),
    beneficios: (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold mb-4">Benefícios da PF</h2>
        <ul className="mb-6 text-left">
          <li>💰 Salário: R$ 12.522,50</li>
          <li>🕒 Jornada: 40h semanais</li>
          <li>🔒 Estabilidade: Sim</li>
        </ul>
        <button onClick={() => setTela("motivacao")} className="bg-green-600 px-6 py-3 rounded-xl">Próximo</button>
      </div>
    ),
    motivacao: (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold mb-4">Você está motivado para estudar hoje?</h2>
        <div className="flex gap-4">
          <button onClick={() => setTela("modulos")} className="bg-green-600 px-6 py-3 rounded-xl">Sim</button>
          <button onClick={() => setTela("reflexao")} className="bg-red-600 px-6 py-3 rounded-xl">Não</button>
        </div>
      </div>
    ),
    reflexao: (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
        <h2 className="text-xl font-bold mb-4">Reflexão</h2>
        <p className="mb-4">Responda essas perguntas para recuperar sua motivação:</p>
        {respostasMotivacionais.map((r, i) => (
          <input
            key={i}
            value={r}
            onChange={e => {
              const novas = [...respostasMotivacionais];
              novas[i] = e.target.value;
              setRespostasMotivacionais(novas);
            }}
            placeholder={`Pergunta ${i + 1}`}
            className="w-full text-black p-2 rounded mb-2"
          />
        ))}
        <button onClick={() => setTela("modulos")} className="bg-blue-600 px-6 py-3 rounded-xl">Continuar motivado!</button>
      </div>
    ),
    modulos: (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
        <h2 className="text-xl font-bold mb-4">Escolha um módulo para hoje:</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={() => setTela("desafio")} className="bg-yellow-600 px-6 py-3 rounded-xl">🔥 Desafio Diário</button>
          <button disabled className="bg-gray-600 px-6 py-3 rounded-xl">📘 Resolução de Questões (em breve)</button>
          <button onClick={() => setTela("cronograma")} className="bg-blue-600 px-6 py-3 rounded-xl">📅 Montar Cronograma</button>
        </div>
      </div>
    ),
    cronograma: (
      <div className={`min-h-screen ${telaEscura ? 'bg-black' : 'bg-gray-900'} text-white p-6 flex flex-col items-center justify-center`}>
        <style>{`.piscar { animation: piscar 1s infinite; } @keyframes piscar { 0% {opacity: 1;} 50% {opacity: 0;} 100% {opacity: 1;} }`}</style>
        {!blocoSelecionado ? (
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
            <button onClick={gerarCronograma} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl">Gerar Cronograma</button>
            {blocos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Seu cronograma de hoje:</h3>
                {blocos.map((bloco, idx) => (
                  <button key={idx} onClick={() => iniciarEstudo(bloco)} className={`w-full text-left p-3 rounded-xl ${bloco.cor === "Bloco1" ? "bg-red-600" : bloco.cor === "Bloco2" ? "bg-yellow-600" : "bg-green-600"}`}>
                    <strong>{bloco.nome}</strong> — {bloco.tempo} min<br />
                    <span className="italic">Tópico: {bloco.topico}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            {!telaEscura && (
              <>
                <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
                <p className="text-lg">Tópico: {blocoSelecionado.topico}</p>
                <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
                <div className="w-full bg-white rounded overflow-hidden h-4">
                  <div className="bg-blue-500 h-4" style={{ width: `${progresso}%` }}></div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setPausado(!pausado)} className="bg-yellow-600 px-4 py-2 rounded-xl">{pausado ? "▶️ Retomar" : "⏸ Pausar"}</button>
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
    )
  };

  return renderTelas[tela] || <div className="text-white p-8">Tela não encontrada.</div>;
}
