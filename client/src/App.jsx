import React, { useState } from "react";

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
  Bloco1: ["Língua Portuguesa", "Língua Inglesa", "Raciocínio Lógico", "Direito Administrativo", "Direito Constitucional"],
  Bloco2: ["Direito Penal", "Processo Penal", "Legislação Especial", "Direitos Humanos"],
  Bloco3: ["Informática", "Contabilidade", "Administração", "Estatística"]
};

const pesos = {
  Bloco1: 0.5,
  Bloco2: 0.3,
  Bloco3: 0.2
};

export default function App() {
  const [tela, setTela] = useState("login");
  const [concursoSelecionado, setConcursoSelecionado] = useState(null);
  const [respostasMotivacionais, setRespostasMotivacionais] = useState(["", "", "", "", ""]);
  const [tempoEstudo, setTempoEstudo] = useState(0);
  const [blocos, setBlocos] = useState([]);

  const perguntas = [
    "Por que você quer passar neste concurso?",
    "Como sua vida vai melhorar depois de ser aprovado?",
    "Quem te inspira a continuar estudando?",
    "O que você ganha se continuar firme hoje?",
    "O que você perde se desistir agora?"
  ];

  const gerarCronograma = () => {
    const totalMin = tempoEstudo * 60;
    const blocosGerados = [];

    Object.entries(pesos).forEach(([bloco, peso]) => {
      const tempoBloco = Math.floor(totalMin * peso);
      const materias = materiasPorBloco[bloco];
      const tempoPorMateria = Math.floor(tempoBloco / materias.length);
      materias.forEach(materia => {
        if (tempoPorMateria >= 15) {
          blocosGerados.push({ nome: materia, tempo: tempoPorMateria, cor: bloco });
        }
      });
    });

    setBlocos(blocosGerados);
  };

  const handleMotivacao = (resposta) => {
    if (resposta === "sim") {
      setTela("painel");
    } else {
      setTela("motivacional");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      {tela === "login" && (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">MetaConcurseiro</h1>
          <p className="text-gray-300">Clique abaixo para iniciar sua jornada</p>
          <button onClick={() => setTela("boasVindas")} className="bg-green-600 px-6 py-2 rounded-xl hover:bg-green-700">
            Entrar
          </button>
        </div>
      )}

      {tela === "boasVindas" && (
        <div className="text-center space-y-4 max-w-xl">
          <h1 className="text-3xl font-bold">Bem-vindo ao MetaConcurseiro</h1>
          <p className="text-gray-300">Este é um site antiprocrastinação feito para você manter o foco nos estudos, treinar com constância e alcançar sua aprovação no concurso dos seus sonhos.</p>
          <button onClick={() => setTela("escolherConcurso")} className="bg-blue-600 px-6 py-2 rounded-xl hover:bg-blue-700">
            Continuar
          </button>
        </div>
      )}

      {tela === "escolherConcurso" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold mb-4">Escolha seu concurso</h2>
          {Object.keys(concursos).map((nome) => (
            <button
              key={nome}
              onClick={() => {
                setConcursoSelecionado(nome);
                setTela("remuneracao");
              }}
              className="block bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-xl w-64 mx-auto mb-2"
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {tela === "remuneracao" && concursoSelecionado && (
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">{concursoSelecionado}</h2>
          <p>💰 Salário: {concursos[concursoSelecionado].salario}</p>
          <p>⏱ Jornada: {concursos[concursoSelecionado].jornada}</p>
          <p>🛡 Estabilidade: {concursos[concursoSelecionado].estabilidade}</p>
          <button onClick={() => setTela("motivacao")} className="bg-purple-600 px-6 py-2 rounded-xl hover:bg-purple-700">
            Continuar
          </button>
        </div>
      )}

      {tela === "motivacao" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Você está motivado para estudar hoje?</h2>
          <div className="flex gap-4 justify-center">
            <button onClick={() => handleMotivacao("sim")} className="bg-green-600 px-4 py-2 rounded-xl">Sim</button>
            <button onClick={() => handleMotivacao("nao")} className="bg-red-600 px-4 py-2 rounded-xl">Não</button>
          </div>
        </div>
      )}

      {tela === "motivacional" && (
        <div className="space-y-4 max-w-xl">
          <h2 className="text-xl font-bold text-center">Vamos resgatar sua motivação!</h2>
          {perguntas.map((pergunta, idx) => (
            <div key={idx}>
              <p className="text-sm mb-1">{pergunta}</p>
              <input
                type="text"
                className="w-full px-4 py-2 rounded text-black"
                value={respostasMotivacionais[idx]}
                onChange={(e) => {
                  const novas = [...respostasMotivacionais];
                  novas[idx] = e.target.value;
                  setRespostasMotivacionais(novas);
                }}
              />
            </div>
          ))}
          <button onClick={() => setTela("painel")} className="bg-blue-600 px-6 py-2 rounded-xl hover:bg-blue-700">
            Continuar para o painel
          </button>
        </div>
      )}

      {tela === "painel" && (
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">Escolha uma opção</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-xl shadow">
              📚 Desafio Diário
            </button>
            <button className="bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow cursor-not-allowed" disabled>
              🧠 Resolução de Questões (em breve)
            </button>
            <button
              onClick={() => setTela("cronograma")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow"
            >
              📅 Montar Cronograma
            </button>
          </div>
        </div>
      )}

      {tela === "cronograma" && (
        <div className="max-w-xl w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">Quanto tempo você vai estudar hoje?</h2>
          <input
            type="number"
            placeholder="Informe o tempo em horas (ex: 2)"
            className="w-full px-4 py-2 rounded text-black"
            onChange={(e) => setTempoEstudo(Number(e.target.value))}
          />
          <button
            onClick={gerarCronograma}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl"
          >
            Gerar Cronograma
          </button>

          {blocos.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-semibold">Seu cronograma de hoje:</h3>
              {blocos.map((bloco, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-white ${
                    bloco.cor === "Bloco1" ? "bg-red-600" : bloco.cor === "Bloco2" ? "bg-yellow-600" : "bg-green-600"
                  }`}
                >
                  {bloco.nome} — {bloco.tempo} min
                </div>
              ))}
            </div>
          )}

          {blocos.length === 0 && tempoEstudo > 0 && (
            <p className="text-red-400 text-center mt-4">Tempo muito curto para gerar um cronograma decente. Aumente as horas.</p>
          )}
        </div>
      )}
    </div>
  );
}
