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

export default function App() {
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [xp, setXp] = useState(() => Number(localStorage.getItem("xp")) || 0);
  const [medalhas, setMedalhas] = useState(() => JSON.parse(localStorage.getItem("medalhas")) || []);
  const [concluidos, setConcluidos] = useState(() => JSON.parse(localStorage.getItem("progresso")) || {});
  const [cargoSelecionado, setCargoSelecionado] = useState('');
  const [horasPorDia, setHorasPorDia] = useState(2);
  const [cronograma, setCronograma] = useState([]);

  useEffect(() => {
    const hoje = new Date();
    const diff = Math.floor((DATA_PROVA - hoje) / (1000 * 60 * 60 * 24));
    setDiasRestantes(diff);
  }, []);

  useEffect(() => {
    localStorage.setItem("xp", xp);
    localStorage.setItem("medalhas", JSON.stringify(medalhas));
    localStorage.setItem("progresso", JSON.stringify(concluidos));
  }, [xp, medalhas, concluidos]);

  const handleDesafio2Min = () => {
    setXp((xp) => xp + 10);
    if (!medalhas.includes("Foco Inicial")) {
      setMedalhas((m) => [...m, "Foco Inicial"]);
    }
  };

  const responderQuestao = () => {
    setXp((xp) => xp + 15);
  };

  const gerarCronograma = () => {
    if (!cargoSelecionado) {
      alert("Selecione um cargo antes de gerar o cronograma!");
      return;
    }

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
    }

    const pesoTotal = selecionadas.reduce((acc, m) => acc + m.peso, 0);
    const plano = selecionadas.map((mat) => {
      const tempoMat = Math.round((mat.peso / pesoTotal) * totalMinutos);
      const tempo = tempoMat < TEMPO_MINIMO ? TEMPO_MINIMO : tempoMat;
      const topico = mat.topicos[Math.floor(Math.random() * mat.topicos.length)];
      return { materia: mat.nome, topico, tempo, peso: mat.peso };
    });

    setCronograma(plano);
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
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <h2 className="text-xl font-bold mb-2">🧠 Questão Rápida</h2>
          <p className="text-sm mb-2">Responda e sinta o progresso real.</p>
          <button onClick={responderQuestao} className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700">
            Bora responder!
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-6">
          <h2 className="text-lg font-bold">🏅 XP Atual: <span className="text-green-400">{xp}</span></h2>
          <p className="text-sm">🎖️ Medalhas: {medalhas.length > 0 ? medalhas.join(', ') : 'Nenhuma'}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
