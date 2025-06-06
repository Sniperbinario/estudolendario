import React from "react";

export default function LandingPage({ onComecar }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-indigo-900 flex flex-col">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-8 py-6 bg-transparent">
        <div className="flex items-center gap-3">
          <img
            src="/landpage.png"
            alt="Mascote Madonna"
            className="w-10 h-10"
          />
          <span className="text-2xl font-bold text-white tracking-wide">MetaConcurseiro</span>
        </div>
        <nav className="hidden md:flex gap-8 text-white text-base font-medium">
          <a href="#features" className="hover:text-indigo-400 transition">Funcionalidades</a>
          <a href="#como" className="hover:text-indigo-400 transition">Como Funciona</a>
          <a href="#planos" className="hover:text-indigo-400 transition">Planos</a>
          <a href="#depoimentos" className="hover:text-indigo-400 transition">Depoimentos</a>
        </nav>
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg hover:bg-indigo-700 font-semibold transition"
          onClick={onComecar}
        >
          Entrar
        </button>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 px-4 md:px-24 py-10">
        <div className="flex-1 flex flex-col gap-6 items-start">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Plataforma definitiva<br />para sua <span className="text-indigo-400">aprovação</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-xl">
            Cronograma inteligente, banco de questões real, desempenho por matéria e motivação diária.
          </p>
          <button
            className="bg-indigo-500 text-white px-8 py-4 rounded-2xl text-lg font-bold mt-2 shadow-xl hover:bg-indigo-600 transition"
            onClick={onComecar}
          >
            Começar Agora
          </button>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <img
            src="/landpage.png"
            alt="Mascote Madonna"
            className="w-80 h-80 drop-shadow-2xl"
          />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 text-white text-center">
          <span className="text-4xl mb-2">🧠</span>
          <h2 className="font-bold text-xl mb-2">Cronograma Inteligente</h2>
          <p className="text-sm text-gray-300">O sistema adapta seus estudos com base no tempo e edital escolhido.</p>
        </div>
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 text-white text-center">
          <span className="text-4xl mb-2">📚</span>
          <h2 className="font-bold text-xl mb-2">Banco de Questões</h2>
          <p className="text-sm text-gray-300">Questões reais por matéria e edital, no estilo da sua banca.</p>
        </div>
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 text-white text-center">
          <span className="text-4xl mb-2">📈</span>
          <h2 className="font-bold text-xl mb-2">Desempenho Automático</h2>
          <p className="text-sm text-gray-300">Acompanhe seus acertos, erros e o que precisa revisar.</p>
        </div>
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 text-white text-center">
          <span className="text-4xl mb-2">🔥</span>
          <h2 className="font-bold text-xl mb-2">Motivação Diária</h2>
          <p className="text-sm text-gray-300">Desafios, frases e alertas diários para manter o foco.</p>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como" className="max-w-4xl mx-auto px-4 py-12 text-white">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">Como funciona?</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-indigo-800/80 p-6 rounded-xl shadow text-center">
            <span className="text-3xl">1️⃣</span>
            <h3 className="font-bold text-lg mt-2">Crie sua conta</h3>
            <p>Cadastre-se e comece a explorar o sistema por 3 dias.</p>
          </div>
          <div className="flex-1 bg-indigo-800/80 p-6 rounded-xl shadow text-center">
            <span className="text-3xl">2️⃣</span>
            <h3 className="font-bold text-lg mt-2">Monte seu cronograma</h3>
            <p>Escolha edital, matérias e tempo disponível. O sistema monta tudo pra você.</p>
          </div>
          <div className="flex-1 bg-indigo-800/80 p-6 rounded-xl shadow text-center">
            <span className="text-3xl">3️⃣</span>
            <h3 className="font-bold text-lg mt-2">Estude com foco</h3>
            <p>Resolva questões, revise erros e siga o plano até a aprovação.</p>
          </div>
        </div>
      </section>

      {/* Gatilhos antes dos Planos */}
      <section className="max-w-4xl mx-auto px-4 pt-2 pb-10 text-white">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6">Por que estudar no MetaConcurseiro?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-indigo-800/80 p-6 rounded-2xl shadow">
            <span className="text-4xl mb-2 text-yellow-300">⚡</span>
            <h3 className="text-lg font-bold mb-2">Avance 3x mais rápido</h3>
            <p>Estude só o que realmente cai, com método comprovado por aprovados.</p>
          </div>
          <div className="bg-indigo-800/80 p-6 rounded-2xl shadow">
            <span className="text-4xl mb-2 text-green-300">🔒</span>
            <h3 className="text-lg font-bold mb-2">Rotina blindada</h3>
            <p>Alerta de foco e cronograma inteligente pra não perder tempo.</p>
          </div>
          <div className="bg-indigo-800/80 p-6 rounded-2xl shadow">
            <span className="text-4xl mb-2 text-pink-300">🚀</span>
            <h3 className="text-lg font-bold mb-2">Desempenho real</h3>
            <p>Revise o que errou, veja o que mais cai e acelere sua aprovação.</p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-10">Planos para turbinar seus estudos</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center text-white">
          {/* Teste Grátis */}
          <div className="flex-1 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg p-8 border-4 border-green-200 flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2">Teste Grátis</h3>
            <div className="text-4xl font-extrabold mb-1">R$0</div>
            <p className="text-center mb-6">3 dias de acesso total para explorar a plataforma.</p>
            <ul className="mb-8 flex flex-col gap-2 w-full">
              <li>✔️ Cronograma completo</li>
              <li>✔️ Questões por matéria</li>
              <li>✔️ Desempenho individual</li>
              <li>✔️ Revisão inteligente</li>
            </ul>
            <button onClick={onComecar} className="w-full bg-white text-green-700 font-bold py-3 rounded-xl shadow hover:bg-green-50">
              Começar Grátis
            </button>
          </div>
          {/* Mensal */}
          <div className="flex-1 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl shadow-lg p-8 border-2 border-indigo-300 flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2">Mensal</h3>
            <div className="text-4xl font-extrabold mb-1">R$29,90<span className="text-base font-normal">/mês</span></div>
            <p className="text-center mb-6">Acesso total renovado todo mês. Cancele quando quiser.</p>
            <ul className="mb-8 flex flex-col gap-2 w-full">
              <li>✔️ Tudo do plano grátis</li>
              <li>✔️ Simulados e metas</li>
              <li>✔️ Revisão de erros</li>
              <li>✔️ Suporte prioritário</li>
            </ul>
            <button onClick={onComecar} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow hover:bg-green-700">
              Assinar Mensal
            </button>
          </div>
          {/* Anual */}
          <div className="flex-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg p-8 border-2 border-yellow-200 flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2">Anual</h3>
            <div className="text-4xl font-extrabold mb-1">R$239,90<span className="text-base font-normal">/ano</span></div>
            <p className="text-center mb-6">Economize 33% com acesso durante o ano inteiro.</p>
            <ul className="mb-8 flex flex-col gap-2 w-full">
              <li>✔️ Tudo do mensal</li>
              <li>✔️ 2 meses grátis</li>
              <li>✔️ Grupo VIP no WhatsApp</li>
              <li>✔️ Sorteios e bônus</li>
            </ul>
            <button onClick={onComecar} className="w-full bg-yellow-200 text-yellow-800 font-bold py-3 rounded-xl shadow hover:bg-yellow-300">
              Assinar Anual
            </button>
          </div>
        </div>
      </section>
