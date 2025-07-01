import React, { useState } from "react";

const faqData = [
  {
    pergunta: "Como funciona o teste grátis?",
    resposta:
      "Você pode testar a plataforma por 3 dias, com acesso total a todas as funcionalidades. Após esse período ou após explorar por alguns minutos, será solicitado o cadastro de um cartão para continuar aproveitando todos os recursos.",
  },
  {
    pergunta: "O que está incluso no plano?",
    resposta:
      "Todos os planos incluem acesso completo ao cronograma inteligente, banco de questões, acompanhamento do seu desempenho por matéria, revisão inteligente de erros, simulados e suporte personalizado.",
  },
  {
    pergunta: "Posso cancelar quando quiser?",
    resposta:
      "Sim! O cancelamento é simples, feito direto pelo site, sem burocracia ou taxas escondidas.",
  },
  {
    pergunta: "Posso estudar para qualquer concurso?",
    resposta:
      "Sim! Você pode criar seu cronograma para os principais concursos do Brasil. Temos editais prontos e a equipe está sempre de olho para incluir novos concursos. Se faltar algum, é só pedir pelo suporte.",
  },
  {
    pergunta: "Os simulados e questões são oficiais?",
    resposta:
      "Utilizamos questões reais retiradas de provas anteriores das principais bancas do Brasil (CESPE, FGV, FCC, VUNESP, etc.), organizadas por matéria e edital. Apesar de todo cuidado, podem ocorrer variações e eventuais ajustes na base de dados.",
  },
  {
    pergunta: "Como é feito o acompanhamento do desempenho?",
    resposta:
      "O sistema registra automaticamente seus acertos e erros por matéria, mostrando sua evolução de forma prática e simples. Você acompanha seu progresso e identifica os pontos que precisam de mais atenção.",
  },
  {
    pergunta: "É seguro colocar meus dados e cartão na plataforma?",
    resposta:
      "Sim! Utilizamos o Mercado Pago, um dos maiores gateways de pagamento do Brasil, para garantir a segurança das suas informações. Todos os dados são criptografados e protegidos.",
  },
  {
    pergunta: "Tenho suporte se tiver dúvidas ou problemas?",
    resposta:
      "Tem sim! Nosso time responde rápido pelo próprio site ou WhatsApp, com prioridade para assinantes.",
  },
  {
    pergunta: "Não sou “bom de tecnologia”, vou conseguir usar?",
    resposta:
      "Pode ficar tranquilo! O EstudoLendario foi feito pra ser simples, intuitivo e fácil de usar, mesmo para quem nunca estudou online. Qualquer dúvida, é só chamar o suporte.",
  },
  {
    pergunta: "Tem desconto pra plano anual ou para grupos?",
    resposta:
      "Sim! O plano anual tem desconto especial e, se você for de grupo de estudos ou empresa, pode falar com a gente pra negociar condições diferenciadas.",
  },
];

function AccordionFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="max-w-4xl mx-auto px-4 py-14 mt-12 bg-gray-900/80 rounded-3xl shadow-2xl mb-12"
    >
      <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-8">
        FAQ (EstudoLendario 2025)
      </h2>
      <div className="flex flex-col gap-4">
        {faqData.map((item, idx) => (
          <div
            key={idx}
            className="border-b border-indigo-700 last:border-none"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full flex justify-between items-center py-4 px-2 text-left focus:outline-none"
              aria-expanded={openIndex === idx}
            >
              <span className="text-lg text-white font-semibold">
                {item.pergunta}
              </span>
              <span
                className={`ml-4 transition-transform duration-300 ${
                  openIndex === idx ? "rotate-180 text-indigo-400" : "text-indigo-300"
                }`}
              >
                ▼
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === idx
                  ? "max-h-40 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-gray-200 py-2 px-2">{item.resposta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { auth } from "./firebase";

export default function LandingPage({ onComecar }) {

  
  async function pagarPlano(tipo) {
    const user = auth.currentUser;
    console.log("👉 Usuário atual:", user);

    if (!user) {
      alert("Você precisa estar logado para assinar.");
      return;
    }

    try {
      const res = await fetch("https://sniperbet4.onrender.com/criar-assinatura-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, tipo })
      });

      const data = await res.json();
      console.log("✅ Resposta do servidor:", data);

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("❌ Não foi possível gerar o link de pagamento.");
      }
    } catch (error) {
      console.error("❌ Erro no pagamento:", error);
      alert("Erro ao iniciar o pagamento.");
    }
  }

