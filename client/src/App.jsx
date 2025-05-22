import React, { useState, useEffect } from "react";

export default function App() {
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

  const [sugestaoAtual, setSugestaoAtual] = useState("");
  const [ultimoIntervalo, setUltimoIntervalo] = useState(null);

  useEffect(() => {
    let timer;
    if (modoFoco && contador > 0) {
      timer = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
    }
    if (contador === 0 && modoFoco) {
      setTimeout(() => {
        setXp((prev) => prev + 10);
        setMedalhas((prev) => [...prev, "🏅 Foco Inicial"]);
        setMostrarRecompensa(true);
      }, 1000);
    }
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
    if (modoFoco) {
      const primeira = sugestoes[Math.floor(Math.random() * sugestoes.length)];
      setSugestaoAtual(primeira);
      setUltimoIntervalo(Math.floor(contador / 30));
    }
  }, [modoFoco]);

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60).toString().padStart(2, "0");
    const sec = (segundos % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const iniciarQuestao = () => {
    const sorteada = questoes[Math.floor(Math.random() * questoes.length)];
    setQuestaoAtual(sorteada);
    setMostrarQuestao(true);
    setRespostaSelecionada("");
    setRespondeu(false);
  };

  const responder = () => {
    if (!respondeu && respostaSelecionada) {
      setRespondeu(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-black">
      {!concursoConfirmado && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow text-center">
          <h1 className="text-xl font-bold mb-4">Escolha o concurso que você vai estudar:</h1>
          <select
            className="w-full p-2 border rounded mb-4"
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
            onClick={() => setConcursoConfirmado(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            disabled={!concursoSelecionado}
          >
            Confirmar concurso
          </button>
        </div>
      )}

      {concursoConfirmado && !modoFoco && !mostrarQuestao && (
        <>
          <header className="bg-white shadow-md p-4 rounded-xl mb-6">
            <h1 className="text-2xl font-bold text-center">MetaConcurseiro 📚</h1>
            <p className="text-center text-sm text-gray-500">Concurso: {concursoSelecionado}</p>
          </header>

          <section className="bg-white p-6 rounded-xl shadow text-center mb-4">
            <h2 className="text-xl font-semibold mb-4">⏱️ Desafio de 2 minutos</h2>
            <p className="text-sm text-gray-600 mb-4">Estude por apenas 2 minutos e ganhe XP + medalhas.</p>
            <button onClick={() => { setModoFoco(true); setContador(120); setMostrarRecompensa(false); }} className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700">
              Começar agora
            </button>
          </section>

          <section className="bg-white p-6 rounded-xl shadow text-center">
            <h2 className="text-xl font-semibold mb-4">Responder uma questão agora</h2>
            <p className="text-sm text-gray-600 mb-4">Sem enrolação. Responda uma questão e sinta o progresso real.</p>
            <button onClick={iniciarQuestao} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">
              Bora responder!
            </button>
          </section>

          <section className="mt-6 text-center">
            <p className="text-sm">🎯 XP Atual: <strong>{xp}</strong></p>
            <p className="text-sm">🏅 Medalhas: {medalhas.join(", ")}</p>
          </section>
        </>
      )}

      {modoFoco && (
        <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-900 text-white p-4">
          <h2 className="text-3xl font-bold mb-6">🎯 Você deu o primeiro passo!</h2>
          <p className="text-lg italic mb-4 max-w-xl">
            “Não espere pela motivação. Comece. O movimento cria o impulso.”
          </p>
          <p className="text-base mb-6 font-medium">{sugestaoAtual}</p>
          <p className="text-4xl font-mono mb-4">{formatarTempo(contador)}</p>

          {contador === 0 && mostrarRecompensa && (
            <div className="bg-white text-black p-4 rounded-xl shadow text-center">
              <p className="text-lg font-bold mb-2">🏅 Medalha desbloqueada: Foco Inicial!</p>
              <p className="text-sm text-gray-600">XP ganho: +10</p>
              <p className="text-sm">Nível atual: {Math.floor(xp / 50)}</p>
              <button
                onClick={() => { setModoFoco(false); }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Voltar para início
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarQuestao && questaoAtual && (
        <div className="bg-white p-6 rounded-xl shadow max-w-2xl mx-auto text-black">
          <h2 className="text-xl font-bold mb-4">{questaoAtual.enunciado}</h2>
          <div className="space-y-3">
            {questaoAtual.alternativas.map((alt, idx) => (
              <label key={idx} className={`block p-2 border rounded cursor-pointer ${respondeu && alt === questaoAtual.correta ? 'bg-green-100 border-green-500' : ''} ${respondeu && alt === respostaSelecionada && alt !== questaoAtual.correta ? 'bg-red-100 border-red-500' : ''}`}>
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

          {!respondeu && (
            <button
              onClick={responder}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={!respostaSelecionada}
            >
              Responder
            </button>
          )}

          {respondeu && (
            <div className="mt-4 text-center">
              {respostaSelecionada === questaoAtual.correta ? (
                <p className="text-green-700 font-semibold">Acertou! Boa!</p>
              ) : (
                <p className="text-red-700 font-semibold">Errou, mas tá no jogo!</p>
              )}
              <p className="text-sm text-gray-600 mt-2">{questaoAtual.explicacao}</p>
              <button
                onClick={iniciarQuestao}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Próxima questão
              </button>
              <button
                onClick={() => setMostrarQuestao(false)}
                className="mt-2 text-sm text-gray-500 underline"
              >
                Voltar para início
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
