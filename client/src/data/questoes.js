// src/data/questoes.js

export const questoesPorMateria = {
  "Língua Portuguesa": [
    {
      tipo: "multipla", // ou "certoErrado"
      enunciado: "Qual das opções está correta quanto à ortografia?",
      opcoes: {
        A: "Excessão",
        B: "Execessão",
        C: "Exceção",
        D: "Excessão",
      },
      correta: "C",
      explicacao: "A forma correta é 'Exceção', com 'x' e 'ç'."
    },
    {
      tipo: "certoErrado",
      enunciado: "A palavra 'traz' está corretamente grafada como forma do verbo 'trazer' no presente.",
      correta: "Certo",
      explicacao: "Correto! 'Traz' é a forma correta da 3ª pessoa do singular do presente do indicativo de 'trazer'."
    }
  ],
  "Direito Administrativo": [
    {
      tipo: "multipla",
      enunciado: "Qual é um dos princípios do Direito Administrativo?",
      opcoes: {
        A: "Segurança",
        B: "Moralidade",
        C: "Velocidade",
        D: "Lucro",
      },
      correta: "B",
      explicacao: "Moralidade é um dos princípios expressos no art. 37 da Constituição Federal."
    },
    {
      tipo: "certoErrado",
      enunciado: "O princípio da publicidade exige que os atos administrativos sejam, em regra, públicos.",
      correta: "Certo",
      explicacao: "Correto! A publicidade é regra para os atos administrativos, com exceções previstas em lei."
    }
  ]
};
