// App.jsx reorganizado: começa pela escolha do edital e só mostra o conteúdo depois
import React, { useState, useEffect } from 'react';

const DATA_PROVA = new Date('2025-07-27T00:00:00');
const TEMPO_MINIMO = 20;

const cargos = {
  agente: {
    nome: 'Agente de Polícia Federal',
    materias: [
      { nome: 'Língua Portuguesa', peso: 3, topicos: ['Interpretação', 'Ortografia', 'Morfossintaxe'] },
      { nome: 'Direito Administrativo', peso: 3, topicos: ['Atos administrativos', 'Licitações'] },
      { nome: 'Direito Constitucional', peso: 3, topicos: ['Direitos Fundamentais'] },
      { nome: 'Informática', peso: 2, topicos: ['Segurança da Informação'] },
      { nome: 'Raciocínio Lógico', peso: 2, topicos: ['Proposições'] },
      { nome: 'Estatística', peso: 2, topicos: ['Tendência central'] },
      { nome: 'Contabilidade', peso: 2, topicos: ['Balanço'] },
      { nome: 'Legislação Penal', peso: 1, topicos: ['Lei de Drogas'] },
      { nome: 'Direitos Humanos', peso: 1, topicos: ['Declaração Universal'] }
    ]
  }
};
// Novo App.jsx com layout profissional usando TailwindCSS
import React, { useState, useEffect } from "react";

export default function App() {
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [xp, setXp] = useState(() => Number(localStorage.getItem("xp")) || 0);
  const [medalhas, setMedalhas] = useState(() => JSON.parse(localStorage.getItem("medalhas")) || []);
  const [concluidos, setConcluidos] = useState(() => JSON.parse(localStorage.getItem("progresso")) || {});
  const [cargoSelecionado, setCargoSelecionado] = useState('');
  const [horasPorDia, setHorasPorDia] = useState(2);
  const [cronograma, setCronograma] = useState([]);
  const [modoFoco, setModoFoco] = useState(false);
  const [contador, setContador] = useState(120);
  const [mostrarQuestao, setMostrarQuestao] = useState(false);
  const [questaoAtual, setQuestaoAtual] = useState(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState("");
  const [respondeu, setRespondeu] = useState(false);
  const [xp, setXp] = useState(0);
  const [medalhas, setMedalhas] = useState([]);
  const [mostrarRecompensa, setMostrarRecompensa] = useState(false);
  const [concursoSelecionado, setConcursoSelecionado] = useState("");
  const [concursoConfirmado, setConcursoConfirmado] = useState(false);

  const sugestoes = [
    "Anote 3 tópicos que você lembra de Direito Constitucional.",
    "Se você tivesse prova em 7 dias, o que estudaria HOJE?",
    "Liste 2 artigos da Constituição que você já estudou.",
    "Pegue uma caneta e escreva: ‘Hoje eu comecei’.",
    "Qual tema você mais evita estudar? Por quê?"
  ];

  const questoes = [
    {
      id: 1,
      enunciado: "Qual artigo trata da educação na Constituição?",
      alternativas: ["Art. 5º", "Art. 205", "Art. 6º", "Art. 7º"],
      correta: "Art. 205",
      explicacao: "O artigo 205 estabelece a educação como direito de todos."
    },
    {
      id: 2,
      enunciado: "Qual o princípio fundamental da Constituição?",
      alternativas: ["Cidadania", "Educação", "Moradia", "Trabalho"],
      correta: "Cidadania",
      explicacao: "A cidadania é um dos fundamentos da República no Art. 1º."
    }
  ];

  useEffect(() => {
    const hoje = new Date();
    const diff = Math.floor((DATA_PROVA - hoje) / (1000 * 60 * 60 * 24));
    setDiasRestantes(diff);
  }, []);
  const [sugestaoAtual, setSugestaoAtual] = useState("");
  const [ultimoIntervalo, setUltimoIntervalo] = useState(null);

  useEffect(() => {
    localStorage.setItem("xp", xp);
    localStorage.setItem("medalhas", JSON.stringify(medalhas));
    localStorage.setItem("progresso", JSON.stringify(concluidos));
  }, [xp, medalhas, concluidos]);

  const handleDesafio2Min = () => {
    setXp((xp) => xp + 10);
    if (!medalhas.includes("Foco Inicial")) {
      setMedalhas((m) => [...m, "Foco Inicial"]);
    let timer;
    if (modoFoco && contador > 0) {
      timer = setInterval(() => setContador(prev => prev - 1), 1000);
    }
  };

  const responderQuestao = () => {
    setXp((xp) => xp + 15);
  };

  const gerarCronograma = () => {
    if (!cargoSelecionado) {
      alert("Selecione um cargo antes de gerar o cronograma!");
      return;
    if (contador === 0 && modoFoco) {
      setTimeout(() => {
        setXp(prev => prev + 10);
        setMedalhas(prev => [...prev, "🏅 Foco Inicial"]);
        setMostrarRecompensa(true);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [modoFoco, contador]);

    const materias = cargos[cargoSelecionado].materias;
    const totalMinutos = horasPorDia * 60;
    const materiasFiltradas = materias.map((mat) => {
      const feitos = concluidos[mat.nome] || [];
      const restantes = mat.topicos.filter((t) => !feitos.includes(t));
      return restantes.length > 0 ? { ...mat, topicos: restantes } : null;
    }).filter(Boolean);

    const materiasOrdenadas = [...materiasFiltradas].sort((a, b) => b.peso - a.peso);
    const selecionadas = [];
    let minutosDistribuidos = 0;
    let i = 0;

    while (minutosDistribuidos + TEMPO_MINIMO <= totalMinutos && i < materiasOrdenadas.length) {
      const mat = materiasOrdenadas[i];
      selecionadas.push(mat);
      minutosDistribuidos += TEMPO_MINIMO;
      i++;
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

    const pesoTotal = selecionadas.reduce((acc, m) => acc + m.peso, 0);
    const plano = selecionadas.map((mat) => {
      const tempoMat = Math.round((mat.peso / pesoTotal) * totalMinutos);
      const tempo = tempoMat < TEMPO_MINIMO ? TEMPO_MINIMO : tempoMat;
      const topico = mat.topicos[Math.floor(Math.random() * mat.topicos.length)];
      return { materia: mat.nome, topico, tempo, peso: mat.peso };
    });
  const formatarTempo = (segundos) => {
    const min = String(Math.floor(segundos / 60)).padStart(2, "0");
    const sec = String(segundos % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

    setCronograma(plano);
  const iniciarQuestao = () => {
    const sorteada = questoes[Math.floor(Math.random() * questoes.length)];
    setQuestaoAtual(sorteada);
    setMostrarQuestao(true);
    setRespostaSelecionada("");
    setRespondeu(false);
  };

  if (!cargoSelecionado) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Escolha seu cargo</h1>
        <select
          value={cargoSelecionado}
          onChange={(e) => setCargoSelecionado(e.target.value)}
          className="p-2 rounded text-black"
        >
          <option value="">-- Escolha o cargo --</option>
          <option value="agente">Agente de Polícia Federal</option>
        </select>
      </div>
    );
  }
  const responder = () => {
    if (!respondeu && respostaSelecionada) setRespondeu(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-2">MetaConcurseiro 🚨</h1>
      <p className="text-center text-yellow-300 mb-6 animate-pulse">⏳ Faltam {diasRestantes} dias até a prova!</p>

      <div className="max-w-xl mx-auto">
        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <h2 className="text-xl font-bold mb-2">⏱️ Desafio de 2 minutos</h2>
          <p className="text-sm mb-2">Ganhe XP + medalhas só por começar.</p>
          <button onClick={handleDesafio2Min} className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
            Começar agora
      {!concursoConfirmado && (
        <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow text-center">
          <h1 className="text-2xl font-bold mb-4">🎯 Qual concurso você vai vencer?</h1>
          <select
            className="w-full p-2 rounded text-black mb-4"
            value={concursoSelecionado}
            onChange={(e) => setConcursoSelecionado(e.target.value)}
          >
            <option value="">Selecione um concurso</option>
            <option>Polícia Federal</option>
            <option>INSS</option>
            <option>PRF</option>
            <option>Outro...</option>
          </select>
          <button
            className="bg-blue-600 px-6 py-2 rounded-xl hover:bg-blue-700 transition"
            onClick={() => setConcursoConfirmado(true)}
            disabled={!concursoSelecionado}
          >
            Confirmar
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <h2 className="text-xl font-bold mb-2">🧠 Questão Rápida</h2>
          <p className="text-sm mb-2">Responda e sinta o progresso real.</p>
          <button onClick={responderQuestao} className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700">
            Bora responder!
          </button>
      )}

      {concursoConfirmado && !modoFoco && !mostrarQuestao && (
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">MetaConcurseiro 📚</h1>
            <p className="text-sm text-gray-400">Concurso: {concursoSelecionado}</p>
          </header>

          <section className="bg-gray-800 p-6 rounded-xl shadow text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">⏱️ Desafio de 2 minutos</h2>
            <p className="text-sm text-gray-400 mb-4">Ganhe XP + medalhas só por começar.</p>
            <button onClick={() => { setModoFoco(true); setContador(120); setMostrarRecompensa(false); }} className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition">
              Começar agora
            </button>
          </section>

          <section className="bg-gray-800 p-6 rounded-xl shadow text-center">
            <h2 className="text-2xl font-semibold mb-2">🧠 Questão Rápida</h2>
            <p className="text-sm text-gray-400 mb-4">Responda e sinta o progresso real.</p>
            <button onClick={iniciarQuestao} className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition">
              Bora responder!
            </button>
          </section>

          <div className="text-center mt-6 text-sm">
            <p>🎯 XP Atual: <strong>{xp}</strong></p>
            <p>🏅 Medalhas: {medalhas.join(", ")}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <h2 className="text-lg font-bold">🏅 XP Atual: <span className="text-green-400">{xp}</span></h2>
          <p className="text-sm">🎖️ Medalhas: {medalhas.length > 0 ? medalhas.join(', ') : 'Nenhuma'}</p>
      )}

      {modoFoco && (
        <div className="flex flex-col items-center justify-center h-screen text-center">
          <h2 className="text-3xl font-bold mb-6">🚀 Você está focado!</h2>
          <p className="text-lg italic mb-4 max-w-xl text-gray-300">{sugestaoAtual}</p>
          <p className="text-5xl font-mono mb-6">{formatarTempo(contador)}</p>

          {contador === 0 && mostrarRecompensa && (
            <div className="bg-white text-black p-4 rounded-xl shadow text-center">
              <p className="text-lg font-bold mb-2">🏅 Medalha desbloqueada: Foco Inicial!</p>
              <p className="text-sm text-gray-600">XP ganho: +10</p>
              <p className="text-sm">Nível atual: {Math.floor(xp / 50)}</p>
              <button onClick={() => { setModoFoco(false); }} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Voltar para início
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <label className="block mb-2 font-semibold">Quantas horas você vai estudar hoje para mudar de vida?</label>
          <input
            type="number"
            className="w-full p-2 text-black rounded mb-4"
            value={horasPorDia}
            onChange={(e) => setHorasPorDia(Number(e.target.value))}
          />
          <button onClick={gerarCronograma} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 w-full">
            Gerar cronograma de hoje 📅
          </button>
        </div>

        {cronograma.length > 0 && (
          <div className="space-y-4">
            {cronograma.map((item, idx) => (
              <div key={idx} className="bg-gray-800 p-4 rounded-xl">
                <p className="text-lg font-bold">📘 {item.materia} - {item.tempo} min</p>
                <p className="text-sm text-gray-300">Tópico: {item.topico}</p>
              </div>
      )}

      {mostrarQuestao && questaoAtual && (
        <div className="bg-gray-800 p-6 rounded-xl shadow max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">{questaoAtual.enunciado}</h2>
          <div className="space-y-3">
            {questaoAtual.alternativas.map((alt, idx) => (
              <label key={idx} className={`block p-3 border rounded cursor-pointer ${respondeu && alt === questaoAtual.correta ? 'bg-green-200 text-black border-green-500' : ''} ${respondeu && alt === respostaSelecionada && alt !== questaoAtual.correta ? 'bg-red-200 text-black border-red-500' : ''}`}>
                <input
                  type="radio"
                  name="resposta"
                  className="mr-2"
                  value={alt}
                  disabled={respondeu}
                  checked={respostaSelecionada === alt}
                  onChange={() => setRespostaSelecionada(alt)}
                />
                {alt}
              </label>
            ))}
          </div>
        )}
      </div>

          {!respondeu && (
            <button onClick={responder} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={!respostaSelecionada}>
              Responder
            </button>
          )}

          {respondeu && (
            <div className="mt-4 text-center">
              <p className={`font-semibold ${respostaSelecionada === questaoAtual.correta ? 'text-green-400' : 'text-red-400'}`}>
                {respostaSelecionada === questaoAtual.correta ? "Acertou!" : "Errou, mas tá no jogo!"}
              </p>
              <p className="text-sm text-gray-300 mt-2">{questaoAtual.explicacao}</p>
              <button onClick={iniciarQuestao} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Próxima questão
              </button>
              <button onClick={() => setMostrarQuestao(false)} className="mt-2 text-sm text-blue-400 underline block">
                Voltar para início
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
