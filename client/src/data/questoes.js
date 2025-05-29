// src/data/questoes.js

const questoesPorMateria = {
  "Língua Portuguesa": [
    {
      tipo: "multipla_escolha",
      enunciado: "Qual alternativa apresenta apenas palavras proparoxítonas?",
      alternativas: ["Ânimo, árvore, lâmpada", "Caráter, júri, açúcar", "Sofá, café, você"],
      correta: 0,
      explicacao: "Proparoxítonas são palavras cuja sílaba tônica é a antepenúltima. Ex: â-ni-mo, ár-vo-re, lâm-pa-da."
    },
    {
      tipo: "certo_errado",
      enunciado: "A vírgula pode ser usada para separar o sujeito do predicado, quando o sujeito for muito longo.",
      correta: false,
      explicacao: "Mesmo que o sujeito seja longo, não se deve separar o sujeito do predicado com vírgula. Essa é uma falha gramatical comum."
    }
  ],
  "Direito Administrativo": [
    {
      tipo: "multipla_escolha",
      enunciado: "Qual é o princípio que impede que a Administração Pública atue contra seus próprios atos válidos?",
      alternativas: ["Legalidade", "Autotutela", "Segurança Jurídica", "Moralidade"],
      correta: 2,
      explicacao: "O princípio da segurança jurídica visa garantir estabilidade às relações, evitando mudanças repentinas nos atos da administração."
    },
    {
      tipo: "certo_errado",
      enunciado: "A Administração Pública pode anular seus próprios atos quando eivados de ilegalidade, mesmo sem decisão judicial.",
      correta: true,
      explicacao: "Segundo o princípio da autotutela, a Administração pode anular seus próprios atos ilegais sem necessidade de recorrer ao Judiciário."
    }
  ]
};

export default questoesPorMateria;
