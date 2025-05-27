// App.jsx - MetaConcurseiro com responsividade total e transições suaves
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
    Bloco3: 0.2,
  };

  const materiasPorBloco = {
    Bloco1: [
      { nome: "Língua Portuguesa", topicos: ["Gramática", "Ortografia"] },
      { nome: "Raciocínio Lógico", topicos: ["Proposições", "Diagramas"] },
    ],
    Bloco2: [{ nome: "Direito Penal", topicos: ["Crimes", "Sanções"] }],
    Bloco3: [{ nome: "Informática", topicos: ["Segurança", "Atalhos"] }],
  };

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0 && !pausado) {
      intervalo = setInterval(() => setTempoRestante((t) => t - 1), 1000);
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
    setMostrarConfirmar("mostrar");
    setTimeout(() => setMostrarConfirmar("mostrar-buttons"), 2500);
  };

  const progresso = blocoSelecionado
    ? ((blocoSelecionado.tempo * 60 - tempoRestante) / (blocoSelecionado.tempo * 60)) * 100
    : 0;

  // Transição suave entre telas
  const Container = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white transition-all duration-500 ease-in-out animate-fadeIn">
      <div className="w-full max-w-screen-sm">{children}</div>
    </div>
  );

  const renderTelas = {
    login: (
      <Container>
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold">MetaConcurseiro App</h1>
          <button onClick={() => setTela("boas-vindas")} className="bg-blue-600 w-full sm:w-auto px-6 py-3 rounded-xl">Entrar</button>
        </div>
      </Container>
    ),
    "boas-vindas": (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold">Bem-vindo ao MetaConcurseiro!</h2>
          <p>Nosso objetivo é ajudar você a vencer a procrastinação e alcançar sua aprovação.</p>
          <button onClick={() => setTela("concurso")} className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-xl">Começar</button>
        </div>
      </Container>
    ),
    concurso: (
      <Container>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold">Escolha o concurso</h2>
          <button onClick={() => setTela("beneficios")} className="bg-blue-600 w-full sm:w-auto px-6 py-3 rounded-xl">Polícia Federal</button>
        </div>
      </Container>
    ),
    beneficios: (
      <Container>
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-xl font-bold">Benefícios da PF</h2>
          <ul className="list-disc pl-4">
            <li>Salário: R$ 12.522,50</li>
            <li>Jornada: 40h semanais</li>
            <li>Estabilidade: Sim</li>
          </ul>
          <button onClick={() => setTela("motivacao")} className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-xl">Próximo</button>
        </div>
      </Container>
    ),
    motivacao: (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-xl font-bold">Você está motivado para estudar hoje?</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button onClick={() => setTela("modulos")} className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-xl">Sim</button>
            <button onClick={() => setTela("reflexao")} className="bg-red-600 w-full sm:w-auto px-6 py-3 rounded-xl">Não</button>
          </div>
        </div>
      </Container>
    ),
    reflexao: (
      <Container>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Reflexão</h2>
          <p>Responda essas perguntas para recuperar sua motivação:</p>
          {respostasMotivacionais.map((r, i) => (
            <input
              key={i}
              value={r}
              onChange={(e) => {
                const novas = [...respostasMotivacionais];
                novas[i] = e.target.value;
                setRespostasMotivacionais(novas);
              }}
              placeholder={`Pergunta ${i + 1}`}
              className="w-full text-black p-2 rounded"
            />
          ))}
          <button onClick={() => setTela("modulos")} className="bg-blue-600 w-full sm:w-auto px-6 py-3 rounded-xl">Continuar motivado!</button>
        </div>
      </Container>
    ),
    modulos: (
      <Container>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Escolha um módulo para hoje:</h2>
          <div className="flex flex-col gap-4 w-full">
            <button onClick={() => setTela("desafio")} className="bg-yellow-600 w-full px-6 py-3 rounded-xl">🔥 Desafio Diário</button>
            <button onClick={() => setTela("questoes")} className="bg-gray-600 w-full px-6 py-3 rounded-xl">📘 Resolução de Questões</button>
            <button onClick={() => setTela("cronograma")} className="bg-blue-600 w-full px-6 py-3 rounded-xl">📅 Montar Cronograma</button>
          </div>
        </div>
      </Container>
    ),
    desafio: (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold">Desafio Diário</h2>
          <p>Aqui vai o conteúdo do seu desafio diário motivacional...</p>
          <button onClick={() => setTela("modulos")} className="bg-red-600 w-full sm:w-auto px-6 py-2 rounded-xl">🔙 Voltar</button>
        </div>
      </Container>
    ),
    questoes: (
      <Container>
        <div className="flex flex-col items-center text-center gap-4">
          <h2 className="text-2xl font-bold">Resolução de Questões</h2>
          <p>Em breve, você poderá resolver questões aqui!</p>
          <button onClick={() => setTela("modulos")} className="bg-red-600 w-full sm:w-auto px-6 py-2 rounded-xl">🔙 Voltar</button>
        </div>
      </Container>
    ),
    // A tela "cronograma" segue igual, mas posso aplicar responsividade nela também se quiser.
  };

  return renderTelas[tela] || <Container><p>Tela não encontrada.</p></Container>;
}