// editalINSS.js – Estrutura de matérias e tópicos por bloco para o concurso do INSS

export const materiasPorBloco = {
  Bloco1: [
    {
      nome: "Língua Portuguesa",
      topicos: [
        "Interpretação de texto",
        "Ortografia oficial",
        "Acentuação gráfica",
        "Pontuação",
        "Emprego das classes de palavras",
        "Concordância verbal e nominal",
        "Regência verbal e nominal",
        "Crase",
        "Colocação pronominal",
        "Redação oficial"
      ]
    },
    {
      nome: "Ética no Serviço Público",
      topicos: [
        "Código de Ética Profissional do Servidor Público",
        "Deveres funcionais",
        "Comportamento profissional",
        "Ética e cidadania",
        "Responsabilidade social"
      ]
    }
  ],
  Bloco2: [
    {
      nome: "Raciocínio Lógico",
      topicos: [
        "Estrutura lógica de relações",
        "Negação de proposições",
        "Conectivos lógicos",
        "Equivalências",
        "Diagramas lógicos",
        "Problemas matemáticos",
        "Sequências",
        "Probabilidade básica"
      ]
    },
    {
      nome: "Noções de Informática",
      topicos: [
        "Conceitos básicos de computação",
        "Sistemas operacionais (Windows, Linux)",
        "Pacote Office (Word, Excel, PowerPoint)",
        "Segurança da informação",
        "Navegação e busca na internet",
        "Correio eletrônico",
        "Armazenamento em nuvem"
      ]
    }
  ],
  Bloco3: [
    {
      nome: "Conhecimentos Específicos",
      topicos: [
        "Regime Geral de Previdência Social",
        "Benefícios previdenciários",
        "Segurados e dependentes",
        "Custeio da previdência",
        "Legislação previdenciária",
        "Organização da Seguridade Social",
        "INSS e suas competências"
      ]
    }
  ]
};

export const pesos = {
  Bloco1: 0.4,
  Bloco2: 0.3,
  Bloco3: 0.3
};