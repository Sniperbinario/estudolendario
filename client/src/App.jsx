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

export default function App() {
  const [tela, setTela] = useState("login");
  const [concursoSelecionado, setConcursoSelecionado] = useState(null);
  const [respostasMotivacionais, setRespostasMotivacionais] = useState(["", "", "", "", ""]);
  const [motivacao, setMotivacao] = useState(null);

  const handleMotivacao = (resposta) => {
    if (resposta === "sim") {
      setTela("painel");
    } else {
      setTela("motivacional");
    }
  };

  const perguntas = [
    "Por que você quer passar neste concurso?",
    "Como sua vida vai melhorar depois de ser aprovado?",
    "Quem te inspira a continuar estudando?",
    "O que você ganha se continuar firme hoje?",
    "O que você perde se desistir agora?"
  ];

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
          <div className="space-y-4">
            <button className="bg-yellow-600 px-6 py-2 rounded-xl">📚 Desafio Diário</button>
            <button className="bg-gray-500 px-6 py-2 rounded-xl cursor-not-allowed" disabled>🧠 Resolução de Questões (em breve)</button>
            <button className="bg-green-600 px-6 py-2 rounded-xl">📅 Montar Cronograma</button>
          </div>
        </div>
      )}
    </div>
  );
}
