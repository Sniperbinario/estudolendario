// App.jsx completo com todas as telas restauradas e cronograma funcional com botões (corrigido)
import React, { useState, useEffect } from "react";

const DATA_PROVA = new Date("2025-07-27T00:00:00");
const TEMPO_MINIMO = 20;

const concursosInfo = {
  "Polícia Federal": {
    salario: "R$ 12.522,50",
    jornada: "40h semanais",
    estabilidade: "Sim",
    dataProva: "28/07/2025"
  },
  INSS: {
    salario: "R$ 5.905,79",
    jornada: "40h semanais",
    estabilidade: "Sim",
    dataProva: "12/08/2025"
  }
};

const materias = [
  { nome: "Língua Portuguesa", peso: 3, cor: "bg-red-600", topicos: ["Interpretação", "Ortografia", "Morfossintaxe"] },
  { nome: "Direito Administrativo", peso: 3, cor: "bg-blue-600", topicos: ["Atos administrativos", "Licitações"] },
  { nome: "Direito Constitucional", peso: 3, cor: "bg-green-600", topicos: ["Direitos Fundamentais"] },
  { nome: "Informática", peso: 2, cor: "bg-yellow-600", topicos: ["Segurança da Informação"] },
  { nome: "Raciocínio Lógico", peso: 2, cor: "bg-purple-600", topicos: ["Proposições"] },
];

export default function App() {
  const [fase, setFase] = useState("login");
  const [nome, setNome] = useState("");
  const [concurso, setConcurso] = useState("");
  const [respostaMotivada, setRespostaMotivada] = useState(null);
  const [respostasMotivacionais, setRespostasMotivacionais] = useState(["", "", "", "", ""]);
  const [horasPorDia, setHorasPorDia] = useState(2);
  const [cronograma, setCronograma] = useState([]);
  const [blocoAtivo, setBlocoAtivo] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [emEstudo, setEmEstudo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [overlay, setOverlay] = useState({ ativo: false, mensagem: "", acao: null, podeFechar: false });

  const handleMotivacionalChange = (index, value) => {
    const novas = [...respostasMotivacionais];
    novas[index] = value;
    setRespostasMotivacionais(novas);
  };

  const gerarCronograma = () => {
    const totalMinutos = horasPorDia * 60;
    const pesoTotal = materias.reduce((s, m) => s + m.peso, 0);
    const plano = [];
    materias.forEach((m) => {
      const blocos = Math.floor((m.peso / pesoTotal) * totalMinutos / TEMPO_MINIMO);
      for (let i = 0; i < blocos; i++) {
        const topico = m.topicos[Math.floor(Math.random() * m.topicos.length)];
        plano.push({ materia: m.nome, topico, tempo: TEMPO_MINIMO, cor: m.cor });
      }
    });
    setCronograma(plano);
  };

  const iniciarBloco = (bloco) => {
    setBlocoAtivo(bloco);
    setTempoRestante(bloco.tempo * 60);
    setEmEstudo(true);
    setPausado(false);
  };

  useEffect(() => {
    let timer;
    if (emEstudo && !pausado && tempoRestante > 0) {
      timer = setInterval(() => setTempoRestante(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emEstudo, pausado, tempoRestante]);

  const formatar = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const acaoFinal = (tipo) => {
    let mensagem = "";
    if (tempoRestante > 10) {
      mensagem = tipo === "concluir" ? "Já acabou mesmo ou só tá fingindo?" : "Desistir agora... ou respirar e voltar depois?";
    } else {
      mensagem = tipo === "concluir" ? "Parabéns, mais um passo dado!" : "Bloco encerrado.";
    }
    setOverlay({ ativo: true, mensagem, acao: tipo, podeFechar: false });
    setTimeout(() => setOverlay(o => ({ ...o, podeFechar: true })), 2500);
  };

  const confirmarFinal = () => {
    setOverlay({ ativo: false, mensagem: "", acao: null, podeFechar: false });
    setBlocoAtivo(null);
    setTempoRestante(0);
    setEmEstudo(false);
  };

  if (overlay.ativo) {
    return <div className="fixed inset-0 bg-black text-white flex items-center justify-center flex-col z-50">
      <p className="text-xl mb-4 animate-pulse">{overlay.mensagem}</p>
      {overlay.podeFechar && <button onClick={confirmarFinal} className="bg-white text-black px-4 py-2 rounded">Confirmar</button>}
    </div>;
  }

  if (fase === "login") {
    return <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-4">MetaConcurseiro</h1>
      <input type="text" placeholder="Seu nome" className="p-2 text-black rounded mb-4" value={nome} onChange={(e) => setNome(e.target.value)} />
      <button className="bg-blue-600 px-4 py-2 rounded" onClick={() => setFase("boasvindas")}>Entrar</button>
    </div>;
  }

  if (fase === "boasvindas") {
    return <div className="min-h-screen bg-gray-900 text-white text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao MetaConcurseiro</h1>
      <p className="mb-6">Aqui você vai acabar com a procrastinação e estudar com inteligência e constância!</p>
      <button onClick={() => setFase("escolherConcurso")} className="bg-green-600 px-6 py-2 rounded">Começar</button>
    </div>;
  }

  if (fase === "escolherConcurso") {
    return <div className="min-h-screen bg-gray-900 text-white text-center p-6">
      <h2 className="text-2xl font-bold mb-4">Qual concurso você quer passar?</h2>
      <select value={concurso} onChange={(e) => setConcurso(e.target.value)} className="text-black p-2 rounded">
        <option value="">Selecione</option>
        {Object.keys(concursosInfo).map((c, i) => <option key={i}>{c}</option>)}
      </select>
      <button disabled={!concurso} className="block mt-4 bg-blue-600 px-4 py-2 rounded mx-auto" onClick={() => setFase("vantagens")}>Confirmar</button>
    </div>;
  }

  if (fase === "vantagens") {
    const info = concursosInfo[concurso];
    return <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Por que vale a pena?</h2>
      <div className="space-y-2 text-lg text-center">
        <p>💰 Salário: {info.salario}</p>
        <p>📅 Prova: {info.dataProva}</p>
        <p>⏱️ Jornada: {info.jornada}</p>
        <p>🛡️ Estabilidade: {info.estabilidade}</p>
      </div>
      <button className="mt-6 bg-green-600 px-6 py-2 rounded block mx-auto" onClick={() => setFase("motivacao")}>Seguir</button>
    </div>;
  }

  if (fase === "motivacao") {
    if (respostaMotivada === null) {
      return <div className="min-h-screen bg-gray-900 text-white text-center p-6">
        <h2 className="text-2xl mb-6">Você está motivado para estudar hoje?</h2>
        <button onClick={() => setRespostaMotivada(true)} className="bg-green-600 px-6 py-2 rounded mr-4">Sim</button>
        <button onClick={() => setRespostaMotivada(false)} className="bg-red-600 px-6 py-2 rounded">Não</button>
      </div>;
    }
    if (respostaMotivada === true) return setTimeout(() => setFase("acoes"), 500), <div className="text-white text-center mt-20">🚀 Vamos com tudo!</div>;

    const perguntas = [
      "Por que você quer passar nesse concurso?",
      "O que te fez começar?",
      "Como será sua vida após a aprovação?",
      "O que você já superou até aqui?",
      "Quem você inspira ou quer orgulhar?"
    ];
    return <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-xl font-bold mb-4">Responda para se reconectar com sua meta:</h2>
      {perguntas.map((p, i) => (
        <div key={i} className="mb-4">
          <label className="block mb-1">{p}</label>
          <input className="w-full p-2 rounded text-black" value={respostasMotivacionais[i]} onChange={(e) => handleMotivacionalChange(i, e.target.value)} />
        </div>
      ))}
      <button className="bg-blue-600 px-4 py-2 rounded mt-4" onClick={() => setFase("acoes")}>Seguir</button>
    </div>;
  }

  if (fase === "acoes") {
    return <div className="min-h-screen bg-gray-900 text-white text-center p-6">
      <h1 className="text-2xl mb-6">Escolha sua próxima ação, {nome || "Concurseiro"}</h1>
      <div className="space-y-4">
        <button className="bg-purple-600 p-4 w-full rounded">🏆 Desafio do Dia (em breve)</button>
        <button className="bg-yellow-600 p-4 w-full rounded opacity-50 cursor-not-allowed">📝 Resolver Questões (em breve)</button>
        <button className="bg-green-600 p-4 w-full rounded" onClick={() => setFase("cronograma")}>📅 Montar Cronograma</button>
      </div>
    </div>;
  }

  if (fase === "cronograma") {
    if (emEstudo && blocoAtivo) {
      const porcentagem = blocoAtivo ? 100 - Math.floor((tempoRestante / (blocoAtivo.tempo * 60)) * 100) : 0;
      return (
        <div className="min-h-screen bg-gray-900 text-white p-6 text-center">
          <h2 className="text-2xl mb-4">Estudando: {blocoAtivo.materia}</h2>
          <p className="mb-2">Tópico: {blocoAtivo.topico}</p>
          <div className="w-full max-w-xl mx-auto h-4 bg-gray-700 rounded mb-4">
            <div className={`${blocoAtivo.cor} h-full`} style={{ width: `${porcentagem}%` }}></div>
          </div>
          <p className="text-4xl font-mono mb-4">{formatar(tempoRestante)}</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => setPausado(!pausado)} className="bg-yellow-500 px-4 py-2 rounded">{pausado ? "Retomar" : "Pausar"}</button>
            <button onClick={() => acaoFinal("concluir")} className="bg-green-600 px-4 py-2 rounded">Concluir</button>
            <button onClick={() => acaoFinal("encerrar")} className="bg-red-600 px-4 py-2 rounded">Encerrar</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">📅 Cronograma do Dia</h2>
          <label className="block mb-2 text-center">Quantas horas você vai estudar hoje?</label>
          <input type="number" value={horasPorDia} onChange={(e) => setHorasPorDia(Number(e.target.value))} className="p-2 rounded w-full text-black mb-4" />
          <button className="bg-blue-600 px-4 py-2 rounded w-full" onClick={gerarCronograma}>Gerar Cronograma</button>

          <div className="mt-6 space-y-4">
            {cronograma.map((bloco, i) => (
              <div key={i} className={`p-4 rounded ${bloco.cor}`}>
                <p className="text-lg font-bold">📘 {bloco.materia} - {bloco.tempo} min</p>
                <p className="text-sm">Tópico: {bloco.topico}</p>
                <button onClick={() => iniciarBloco(bloco)} className="mt-2 bg-black px-4 py-2 rounded">Iniciar bloco</button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  return null;
}
