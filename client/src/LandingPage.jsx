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
            Cronograma inteligente, banco de questões oficial, desempenho automático por matéria e motivação diária.
            Tudo para quem quer passar de verdade!
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
      <section
        id="features"
        className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8"
      >
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-white text-center">
          <span className="text-4xl mb-2">🧠</span>
          <h2 className="font-bold text-xl mb-2">Cronograma Inteligente</h2>
          <p className="text-sm text-gray-300">
            Planeje seus estudos com inteligência e flexibilidade. O sistema adapta tudo pra você!
          </p>
        </div>
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-white text-center">
          <span className="text-4xl mb-2">📚</span>
          <h2 className="font-bold text-xl mb-2">Banco de Questões Oficial</h2>
          <p className="text-sm text-gray-300">
            Questões reais de bancas como CESPE, FGV, FCC e mais. Tudo organizado por matéria e edital!
          </p>
        </div>
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-white text-center">
          <span className="text-4xl mb-2">📈</span>
          <h2 className="font-bold text-xl mb-2">Desempenho Automático</h2>
          <p className="text-sm text-gray-300">
            Acompanhe seus acertos, erros e evolução em tempo real. Foco total nos pontos fracos!
          </p>
        </div>
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-white text-center">
          <span className="text-4xl mb-2">🔥</span>
          <h2 className="font-bold text-xl mb-2">Motivação Diária</h2>
          <p className="text-sm text-gray-300">
            Frases motivacionais e desafios diários para manter o ritmo e não desanimar nunca!
          </p>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como" className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 items-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Como funciona?</h2>
        <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
          <div className="bg-indigo-900/80 rounded-xl px-6 py-6 flex-1 flex flex-col items-center shadow">
            <span className="text-3xl mb-2">1️⃣</span>
            <h3 className="font-bold text-lg text-white mb-2">Cadastre-se Grátis</h3>
            <p className="text-gray-200 text-center">Crie sua conta e tenha acesso ao melhor método de estudos do Brasil.</p>
          </div>
          <div className="bg-indigo-900/80 rounded-xl px-6 py-6 flex-1 flex flex-col items-center shadow">
            <span className="text-3xl mb-2">2️⃣</span>
            <h3 className="font-bold text-lg text-white mb-2">Monte seu Cronograma</h3>
            <p className="text-gray-200 text-center">Escolha seu edital, matérias e tempo disponível. O sistema monta tudo pra você!</p>
          </div>
          <div className="bg-indigo-900/80 rounded-xl px-6 py-6 flex-1 flex flex-col items-center shadow">
            <span className="text-3xl mb-2">3️⃣</span>
            <h3 className="font-bold text-lg text-white mb-2">Detone nos Estudos</h3>
            <p className="text-gray-200 text-center">Resolva questões, revise erros e acompanhe sua evolução até a aprovação!</p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-10">
          Planos para turbinar seus estudos
        </h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {/* TESTE GRÁTIS */}
          <div className="flex-1 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg p-8 flex flex-col items-center border-4 border-green-200">
            <h3 className="text-2xl font-bold text-white mb-2">Teste Grátis</h3>
            <div className="text-4xl font-extrabold text-white mb-1">R$0</div>
            <p className="text-gray-100 mb-6 text-center">
              3 dias para testar tudo sem compromisso.<br />Sem cartão no início!
            </p>
            <ul className="mb-8 text-white flex flex-col gap-2 w-full">
              <li>✔️ Acesso total à plataforma</li>
              <li>✔️ Cronograma inteligente</li>
              <li>✔️ Questões ilimitadas</li>
              <li>✔️ Desempenho por matéria</li>
            </ul>
            <button onClick={onComecar} className="w-full bg-white text-green-700 font-bold py-3 rounded-xl shadow-lg hover:bg-green-50 transition">
              Começar grátis
            </button>
          </div>
          {/* MENSAL */}
          <div className="flex-1 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl shadow-lg p-8 flex flex-col items-center border-2 border-indigo-300">
            <h3 className="text-2xl font-bold text-white mb-2">Mensal</h3>
            <div className="text-4xl font-extrabold text-white mb-1">R$29,90<span className="text-lg font-normal">/mês</span></div>
            <p className="text-gray-100 mb-6 text-center">
              Para quem quer focar de verdade até a aprovação.
            </p>
            <ul className="mb-8 text-white flex flex-col gap-2 w-full">
              <li>✔️ Acesso ilimitado</li>
              <li>✔️ Todos os simulados</li>
              <li>✔️ Revisão de erros inteligente</li>
              <li>✔️ Suporte prioritário</li>
            </ul>
            <button onClick={onComecar} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition">
              Assinar Mensal
            </button>
          </div>
          {/* ANUAL */}
          <div className="flex-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg p-8 flex flex-col items-center border-2 border-yellow-200">
            <h3 className="text-2xl font-bold text-white mb-2">Anual</h3>
            <div className="text-4xl font-extrabold text-white mb-1">R$239,90<span className="text-lg font-normal">/ano</span></div>
            <p className="text-gray-100 mb-6 text-center">
              Economia de 33% e benefícios exclusivos.
            </p>
            <ul className="mb-8 text-white flex flex-col gap-2 w-full">
              <li>✔️ Tudo do plano Mensal</li>
              <li>✔️ 2 meses grátis</li>
              <li>✔️ E-book bônus exclusivo</li>
              <li>✔️ Sorteios mensais</li>
            </ul>
            <button onClick={onComecar} className="w-full bg-yellow-200 text-yellow-800 font-bold py-3 rounded-xl shadow-lg hover:bg-yellow-300 transition">
              Assinar Anual
            </button>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">Depoimentos de quem já usou</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/90 rounded-2xl shadow-lg flex-1 p-6 flex flex-col gap-3 items-center text-white">
            <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-gray-200 text-center">
              “Com o MetaConcurseiro finalmente consegui manter o foco e evoluir de verdade nos estudos. Recomendo pra todo mundo!”
            </p>
            <span className="text-sm text-indigo-400 font-bold">João Pedro, aprovado na PF</span>
          </div>
          <div className="bg-gray-800/90 rounded-2xl shadow-lg flex-1 p-6 flex flex-col gap-3 items-center text-white">
            <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-gray-200 text-center">
              “A plataforma é prática, organizada e realmente faz diferença pra quem quer passar!”
            </p>
            <span className="text-sm text-indigo-400 font-bold">Ana Souza, concurseira</span>
          </div>
          <div className="bg-gray-800/90 rounded-2xl shadow-lg flex-1 p-6 flex flex-col gap-3 items-center text-white">
            <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-gray-200 text-center">
              “Nunca pensei que conseguiria organizar meus estudos de um jeito tão eficiente. A plataforma é incrível!”
            </p>
            <span className="text-sm text-indigo-400 font-bold">Kamila Bernardes, aprovada no Ministério da Saúde</span>
          </div>
          <div className="bg-gray-800/90 rounded-2xl shadow-lg flex-1 p-6 flex flex-col gap-3 items-center text-white">
            <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-gray-200 text-center">
              “O sistema de desempenho e revisão de erros mudou minha preparação, me sinto muito mais seguro!”
            </p>
            <span className="text-sm text-indigo-400 font-bold">Fernando Oliveira, concursado</span>
          </div>
          <div className="bg-gray-800/90 rounded-2xl shadow-lg flex-1 p-6 flex flex-col gap-3 items-center text-white">
            <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-gray-200 text-center">
              “Eu já tinha tentado várias plataformas, mas só aqui consegui realmente avançar. Recomendo demais!”
            </p>
            <span className="text-sm text-indigo-400 font-bold">Priscila Lima, estudante</span>
          </div>
          <div className="bg-gray-800/90 rounded-2xl shadow-lg flex-1 p-6 flex flex-col gap-3 items-center text-white">
            <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-gray-200 text-center">
              “Muito mais motivação com os desafios diários, não largo mais. MetaConcurseiro é top!”
            </p>
            <span className="text-sm text-indigo-400 font-bold">Carlos Henrique, aprovado</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 flex flex-col md:flex-row items-center justify-between bg-gray-900 border-t border-indigo-900">
        <span className="text-gray-400 text-sm">&copy; 2025 MetaConcurseiro • Todos os direitos reservados</span>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Instagram
          </a>
          <a href="mailto:contato@metaconcurseiro.com" className="text-indigo-400 hover:underline">
            Contato
          </a>
          <a href="#" className="text-indigo-400 hover:underline">
            Suporte
          </a>
        </div>
      </footer>
    </div>
  );
}
