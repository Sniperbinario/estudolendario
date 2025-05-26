import React, { useState, useEffect, useRef } from "react";

const DATA_PROVA = new Date("2025-07-27T00:00:00");
const TEMPO_MINIMO = 20;

const materias = [
  { nome: "Língua Portuguesa", peso: 3, cor: "bg-red-600", topicos: ["Interpretação", "Ortografia", "Morfossintaxe"] },
  { nome: "Direito Administrativo", peso: 3, cor: "bg-blue-600", topicos: ["Atos administrativos", "Licitações"] },
  { nome: "Direito Constitucional", peso: 3, cor: "bg-green-600", topicos: ["Direitos Fundamentais", "Organização do Estado"] },
  { nome: "Informática", peso: 2, cor: "bg-yellow-600", topicos: ["Segurança da Informação", "Pacote Office"] },
  { nome: "Raciocínio Lógico", peso: 2, cor: "bg-purple-600", topicos: ["Proposições", "Diagramas"] },
];

export default function App() {
  const [materiaAtual, setMateriaAtual] = useState(null);
  const [topicoAtual, setTopicoAtual] = useState("");
  const [tempoRestante, setTempoRestante] = useState(0);
  const [emEstudo, setEmEstudo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [modoFoco, setModoFoco] = useState(false);
  const [contador, setContador] = useState(0);
  const [xp, setXp] = useState(0);
  const [medalhas, setMedalhas] = useState([]);
  const [mostrarRecompensa, setMostrarRecompensa] = useState(false);
  const [sugestaoAtual, setSugestaoAtual] = useState("");
  const [ultimoIntervalo, setUltimoIntervalo] = useState(-1);

  const sugestoes = [
    "Mantenha o foco!",
    "Evite distrações!",
    "Respire fundo e continue!",
    "Você está indo bem!",
    "Vamos com tudo!",
  ];

  const iniciarEstudo = (materia) => {
    setMateriaAtual(materia);
    const topico = materia.topicos[Math.floor(Math.random() * materia.topicos.length)];
    setTopicoAtual(topico);
    setTempoRestante(materia.peso * TEMPO_MINIMO);
    setEmEstudo(true);
    setPausado(false);
    setModoFoco(true);
    setContador(0);
  };

  const pausarEstudo = () => setPausado(true);
  const retomarEstudo = () => setPausado(false);
  const encerrarEstudo = () => {
    setMateriaAtual(null);
    setTopicoAtual("");
    setTempoRestante(0);
    setEmEstudo(false);
    setPausado(false);
    setModoFoco(false);
    setMostrarRecompensa(false);
  };

  useEffect(() => {
    let timer;
    if (emEstudo && !pausado && tempoRestante > 0) {
      timer = setInterval(() => setTempoRestante(t => t - 1), 1000);
    }

    setTimeout(() => {
      setXp(prev => prev + 10);
      setMedalhas(prev => [...prev, "🏅 Foco Inicial"]);
      setMostrarRecompensa(true);
    }, 1000);

    return () => clearInterval(timer);
  }, [modoFoco, contador]);

  useEffect(() => {
    if (modoFoco && contador > 0) {
      const intervaloAtual = Math.floor(contador / 30);
      if (intervaloAtual !== ultimoIntervalo) {
        const novaSugestao = sugestoes[Math.floor(Math.random() * sugestoes.length)];
        setSugestaoAtual(novaSugestao);
        setUltimoIntervalo(intervaloAtual);
      }
    }
  }, [contador]);

  useEffect(() => {
    if (emEstudo && !pausado) {
      const cron = setInterval(() => {
        setContador(c => c + 1);
      }, 1000);
      return () => clearInterval(cron);
    }
  }, [emEstudo, pausado]);

  const tempoFormatado = () => {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {!emEstudo && (
        <div className="grid gap-4">
          {materias.map((m, i) => (
            <button
              key={i}
              className={`p-4 rounded-xl shadow-md text-lg font-bold ${m.cor}`}
              onClick={() => iniciarEstudo(m)}
            >
              Estudar {m.nome}
            </button>
          ))}
        </div>
      )}

      {emEstudo && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">{materiaAtual.nome} - {topicoAtual}</h2>
          <p className="text-3xl font-mono">{tempoFormatado()}</p>

          {mostrarRecompensa && (
            <div className="text-green-400 text-xl animate-pulse">
              🎉 Recompensa: +10 XP e medalha conquistada!
            </div>
          )}

          {sugestaoAtual && (
            <p className="text-yellow-400 italic">💡 {sugestaoAtual}</p>
          )}

          <div className="flex gap-4 justify-center">
            {!pausado ? (
              <button onClick={pausarEstudo} className="bg-yellow-600 px-4 py-2 rounded-xl">
                Pausar
              </button>
            ) : (
              <button onClick={retomarEstudo} className="bg-green-600 px-4 py-2 rounded-xl">
                Retomar
              </button>
            )}
            <button onClick={encerrarEstudo} className="bg-red-600 px-4 py-2 rounded-xl">
              Encerrar
            </button>
          </div>

          <div className="mt-6 text-sm">
            <p>⏱️ Tempo focado: {contador}s</p>
            <p>⭐ XP: {xp}</p>
            <p>🏅 Medalhas: {medalhas.join(" ") || "Nenhuma ainda"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
