import React, { useState, useEffect } from "react";

const concursos = {
  "Polícia Federal": {
    salario: "R$ 12.522,50",
    jornada: "40h semanais",
    estabilidade: "Sim"
  },
  INSS: {
    salario: "R$ 5.905,79",
    jornada: "40h semanais",
    estabilidade: "Sim"
  },
  PMDF: {
    salario: "R$ 6.000,00",
    jornada: "40h semanais",
    estabilidade: "Sim"
  }
};

const materiasPorBloco = {
  Bloco1: [
    { nome: "Língua Portuguesa", topicos: ["Interpretação de texto", "Ortografia", "Gramática"] },
    { nome: "Língua Inglesa", topicos: ["Reading comprehension", "Vocabulary", "Grammar"] },
    { nome: "Raciocínio Lógico", topicos: ["Proposições", "Lógica de Argumentação"] },
    { nome: "Direito Administrativo", topicos: ["Atos administrativos", "Poderes administrativos"] },
    { nome: "Direito Constitucional", topicos: ["Direitos Fundamentais", "Organização do Estado"] }
  ],
  Bloco2: [
    { nome: "Direito Penal", topicos: ["Crimes contra a pessoa", "Teoria do crime"] },
    { nome: "Processo Penal", topicos: ["Inquérito policial", "Ação penal"] },
    { nome: "Legislação Especial", topicos: ["Lei de Drogas", "Estatuto do Desarmamento"] },
    { nome: "Direitos Humanos", topicos: ["Declaração Universal", "Tratados internacionais"] }
  ],
  Bloco3: [
    { nome: "Informática", topicos: ["Segurança da Informação", "Pacote Office"] },
    { nome: "Contabilidade", topicos: ["Contas contábeis", "Balanço patrimonial"] },
    { nome: "Administração", topicos: ["Teorias administrativas", "Gestão de pessoas"] },
    { nome: "Estatística", topicos: ["Média e mediana", "Probabilidade"] }
  ]
};

const pesos = {
  Bloco1: 0.5,
  Bloco2: 0.3,
  Bloco3: 0.2
};

export default function App() {
  const [tela, setTela] = useState("cronograma");
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);
  const [contador, setContador] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [blocoSelecionado, setBlocoSelecionado] = useState(null);

  useEffect(() => {
    let intervalo;
    if (tempoRestante > 0) {
      intervalo = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
        setContador((c) => c + 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempoRestante]);

  const gerarCronograma = () => {
    const totalMin = Math.max(tempoEstudo * 60, 30);
    const blocosGerados = [];

    Object.entries(pesos).forEach(([bloco, peso]) => {
      const tempoBloco = Math.floor(totalMin * peso);
      const materias = materiasPorBloco[bloco];
      const tempoPorMateria = Math.floor(tempoBloco / materias.length);
      materias.forEach(m => {
        if (tempoPorMateria >= 10) {
          const topico = m.topicos[Math.floor(Math.random() * m.topicos.length)];
          blocosGerados.push({ nome: m.nome, topico, tempo: tempoPorMateria, cor: bloco });
        }
      });
    });

    setBlocos(blocosGerados);
  };

  const tempoFormatado = () => {
    const min = Math.floor(tempoRestante / 60);
    const seg = tempoRestante % 60;
    return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  };

  const iniciarEstudo = (bloco) => {
    setBlocoSelecionado(bloco);
    setTempoRestante(bloco.tempo * 60);
    setContador(0);
  };

  const finalizarEstudo = () => {
    setMostrarConfirmar(true);
    setTimeout(() => setMostrarConfirmar("mostrar"), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      {tela === "cronograma" && (
        <div className="max-w-xl w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">Quanto tempo você vai estudar hoje?</h2>
          <input
            type="number"
            placeholder="Informe o tempo em horas (ex: 1.5)"
            className="w-full px-4 py-2 rounded text-black"
            onChange={(e) => setTempoEstudo(Number(e.target.value))}
          />
          <button
            onClick={gerarCronograma}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl"
          >
            Gerar Cronograma
          </button>

          {blocos.length > 0 && !blocoSelecionado && (
            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-semibold">Seu cronograma de hoje:</h3>
              {blocos.map((bloco, idx) => (
                <button
                  key={idx}
                  onClick={() => iniciarEstudo(bloco)}
                  className={`p-3 w-full text-left rounded-xl ${
                    bloco.cor === "Bloco1" ? "bg-red-600" : bloco.cor === "Bloco2" ? "bg-yellow-600" : "bg-green-600"
                  }`}
                >
                  <strong>{bloco.nome}</strong> — clique para estudar tópico: <em>{bloco.topico}</em>
                </button>
              ))}
            </div>
          )}

          {blocoSelecionado && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">{blocoSelecionado.nome}</h2>
              <p className="text-lg">Tópico: {blocoSelecionado.topico}</p>
              <p className="text-3xl font-mono">⏱ {tempoFormatado()}</p>
              <div className="flex gap-4 justify-center">
                <button className="bg-yellow-600 px-4 py-2 rounded-xl">⏸ Pausar</button>
                <button onClick={finalizarEstudo} className="bg-green-600 px-4 py-2 rounded-xl">✅ Concluir</button>
                <button onClick={finalizarEstudo} className="bg-red-600 px-4 py-2 rounded-xl">❌ Encerrar</button>
              </div>
              {mostrarConfirmar === "mostrar" && (
                <div className="mt-4 space-y-2">
                  <p className="text-red-400">Tem certeza que finalizou ou você está só se enganando?</p>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setBlocoSelecionado(null)} className="bg-blue-600 px-4 py-2 rounded-xl">✔️ Confirmar</button>
                    <button onClick={() => setMostrarConfirmar(false)} className="bg-gray-600 px-4 py-2 rounded-xl">⏳ Continuar estudando</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
