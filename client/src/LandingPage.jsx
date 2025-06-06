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
          {/* FAQ - Perguntas Frequentes */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-8">Dúvidas Frequentes</h2>
        <div className="flex flex-col gap-6">
          {/* 1 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">1. Como funciona o teste grátis?</h3>
            <p className="text-gray-200">Você pode testar a plataforma por 3 dias com acesso total. Após esse tempo ou após alguns minutos, será solicitado o cadastro de um cartão para continuar.</p>
          </div>
          {/* 2 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">2. O que está incluso no plano?</h3>
            <p className="text-gray-200">Todos os planos incluem cronograma automático, questões reais, desempenho por matéria, revisão de erros, simulados e suporte dedicado.</p>
          </div>
          {/* 3 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">3. Posso cancelar quando quiser?</h3>
            <p className="text-gray-200">Sim! Cancelamento simples, direto no painel do usuário, sem taxa ou enrolação.</p>
          </div>
          {/* 4 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">4. Posso estudar para qualquer concurso?</h3>
            <p className="text-gray-200">Sim! A plataforma é flexível e cobre os principais editais do Brasil. Se faltar algum, é só pedir pelo suporte.</p>
          </div>
          {/* 5 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">5. Os simulados e questões são oficiais?</h3>
            <p className="text-gray-200">As questões são baseadas em provas reais de bancas como CESPE, FGV e FCC. Eventuais ajustes podem ocorrer na base de dados.</p>
          </div>
          {/* 6 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">6. Como é feito o acompanhamento do desempenho?</h3>
            <p className="text-gray-200">O sistema registra suas respostas e mostra os erros, acertos e pontos de melhoria em cada matéria.</p>
          </div>
          {/* 7 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">7. É seguro colocar meus dados e cartão na plataforma?</h3>
            <p className="text-gray-200">Sim! Utilizamos o Mercado Pago como gateway de pagamento, com criptografia total dos dados.</p>
          </div>
          {/* 8 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">8. Tenho suporte se tiver dúvidas ou problemas?</h3>
            <p className="text-gray-200">Sim! Suporte ágil via WhatsApp e direto pelo painel do site. Assinantes têm prioridade.</p>
          </div>
          {/* 9 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">9. Não sou bom de tecnologia. Vou conseguir usar?</h3>
            <p className="text-gray-200">Com certeza! A plataforma é simples, intuitiva e pensada até para quem está começando agora no mundo digital.</p>
          </div>
          {/* 10 */}
          <div className="bg-gray-900/90 p-6 rounded-2xl shadow flex flex-col gap-2">
            <h3 className="text-lg font-bold text-indigo-300">10. Tem desconto pra plano anual ou para grupos?</h3>
            <p className="text-gray-200">Sim! O plano anual tem desconto embutido. Para grupos de estudo ou empresas, fale com o suporte para condições especiais.</p>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">Depoimentos de quem já usou</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { nome: "João Pedro", texto: "Com o MetaConcurseiro consegui manter o foco e evoluir. Recomendo demais!", fonte: "Aprovado na PF" },
            { nome: "Ana Souza", texto: "A plataforma é prática, organizada e realmente faz diferença pra quem quer passar!", fonte: "Concurseira" },
            { nome: "Kamila Bernardes", texto: "Nunca pensei que organizaria meus estudos tão bem. É incrível!", fonte: "Aprovada no Ministério da Saúde" },
            { nome: "Fernando Oliveira", texto: "O sistema de desempenho me deixou muito mais seguro!", fonte: "Concursado" },
            { nome: "Priscila Lima", texto: "Já testei outras plataformas, mas só aqui realmente avancei!", fonte: "Estudante" },
            { nome: "Carlos Henrique", texto: "Com os desafios diários, não largo mais. MetaConcurseiro é top!", fonte: "Aprovado" }
          ].map((dep, i) => (
            <div key={i} className="bg-gray-800/90 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center gap-3">
              <span className="text-2xl">⭐️⭐️⭐️⭐️⭐️</span>
              <p className="text-center text-gray-200">“{dep.texto}”</p>
              <span className="text-sm text-indigo-400 font-bold">{dep.nome}, {dep.fonte}</span>
            </div>
          ))}
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
