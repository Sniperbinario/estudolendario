const LETTERS = ["A", "B", "C", "D", "E"];

const SOURCE = {
  banca: "FGV",
  orgao: "Corpo de Bombeiros Militar do Estado do Rio de Janeiro - CBMERJ",
  cargo: "Cadete BM - 1º ano do Curso de Formação de Oficiais",
  ano: 2024,
  prova: "CBMERJ 2024 — Cadete BM — Tipo 1",
  fonte: "Caderno oficial e gabarito definitivo do CBMERJ 2024",
};

// Amostra importada do lote_2c4bc17d3375e6b9. A origem real da questão é
// preservada; o edital da Receita apenas a disponibiliza como treino compatível.
const importedPortugueseQuestions = [
  {
    id: "q_c8f53b8f4e76a2ea94987ab56bba6bb3",
    numeroOriginal: 1,
    assunto: "Interpretação e sentido",
    enunciado: `Um dicionário de citações traz o seguinte pensamento:
A vida é como uma escada rolante: você pode se mover para frente ou para trás, mas não pode permanecer parado.
A mensagem mais importante desse pensamento é:`,
    alternativas: {
      A: "os seres humanos devem ajudar-se uns aos outros.",
      B: "não devemos aposentar-nos cedo demais.",
      C: "mais importante que pensar é fazer.",
      D: "ninguém deve aderir ao comodismo.",
      E: "fazer exercícios é vital para a saúde de cada um.",
    },
    alternativaCorreta: "D",
  },
  {
    id: "q_9f6c4f12bd27c8721594e1f7c5397bb5",
    numeroOriginal: 2,
    assunto: "Interpretação e sentido",
    enunciado: `Um escritor disse o seguinte:
Três coisas são importantes na vida humana: a primeira é ser uma boa pessoa. A segunda é ser uma boa pessoa. E a terceira é ser uma boa pessoa.
Com essa frase o escritor`,
    alternativas: {
      A: "brinca com o leitor, repetindo as mesmas palavras.",
      B: "repete palavras com sentidos diferentes.",
      C: "destaca a única coisa de fato importante.",
      D: "formula uma frase sem sentido.",
      E: "mostra três fatores em ordem de importância.",
    },
    alternativaCorreta: "C",
  },
  {
    id: "q_d90a51d2c3e527cbf5c0e62a6e349fa4",
    numeroOriginal: 3,
    assunto: "Pronomes",
    enunciado: "As frases listadas a seguir mostram um pronome sublinhado que se refere a um termo anterior. Assinale a frase em que esse termo anterior está corretamente identificado.",
    alternativas: {
      A: "Acreditai que nenhum mundo, que nada nem ninguém vale mais que uma vida ou a alegria de tê-la. / alegria.",
      B: "Quando você tem um elefante preso pelo pé e ele estiver tentando fugir, o melhor é deixá-lo ir. / pé.",
      C: "Se você tiver a sorte de encontrar um meio de vida de que goste, precisará ter coragem para vivê-la. / coragem.",
      D: "Todo homem pensa que Deus está do seu lado. Os ricos e os poderosos sabem que ele está. / Deus.",
      E: "Riqueza e saber são rosa e cravo que juntos não saberiam florescer. / rosa e cravo.",
    },
    alternativaCorreta: "E",
  },
  {
    id: "q_d0985e829b9f4b753a696e651178dc37",
    numeroOriginal: 4,
    assunto: "Ortografia e emprego de palavras",
    enunciado: "Assinale a frase em que houve troca indevida entre “porque” e “por que”.",
    alternativas: {
      A: "Quem tem porque viver é capaz de suportar qualquer coisa.",
      B: "Não deves julgar os outros pela aparência porque não é justo.",
      C: "Por que, quem é calvo por natureza não recupera nunca o cabelo?",
      D: "Desejava saber por que não chove nos desertos.",
      E: "O porquê de a Lua não ter água é um mistério.",
    },
    alternativaCorreta: "A",
  },
  {
    id: "q_111531ad768bf16def017455dc5e248c",
    numeroOriginal: 5,
    assunto: "Ortografia e emprego de palavras",
    enunciado: "Assinale a frase em que houve troca indevida entre “mas” e “mais”.",
    alternativas: {
      A: "A vida não é motivo de riso, mas já imaginou ter de viver sem rir?",
      B: "Não há mulher por mais feia que seja, que não tenha um traço de beleza.",
      C: "O jumento é um animal de patas compridas mais ideias curtas.",
      D: "Não são as mais belas que inspiram as maiores paixões.",
      E: "Digam o que quiserem, mas a pobreza é muito mais divertida.",
    },
    alternativaCorreta: "C",
  },
  {
    id: "q_d332fd202da420f34a6fc784d104a39e",
    numeroOriginal: 6,
    assunto: "Semântica e construção de sentido",
    enunciado: "Assinale a frase que não mostra uma oposição em sua estrutura.",
    alternativas: {
      A: "Levar uma vida fácil é tarefa bem difícil.",
      B: "O segredo de uma vida rica é ter mais princípios que fins.",
      C: "A vida está nas pequenas coisas como nas grandes.",
      D: "As mulheres são capazes de tudo e os homens, do resto.",
      E: "Um bom começo pode levar a um mau final.",
    },
    alternativaCorreta: "D",
  },
  {
    id: "q_5abd378bee70b882301f72440c62f684",
    numeroOriginal: 8,
    assunto: "Interpretação e sentido",
    enunciado: "Assinale a frase em que a troca de posição de termos trouxe modificação de sentido.",
    alternativas: {
      A: "Quem olha para adiante não olha para trás / Quem olha para trás não olha para adiante.",
      B: "O saber se adquire com a capacidade, não com a idade / O saber se adquire com a idade, não com a capacidade.",
      C: "Os homens confiam menos nos seus ouvidos do que nos seus olhos / Os homens confiam mais nos seus olhos do que nos seus ouvidos.",
      D: "A maior arte da vida é saber a hora certa de dizer as coisas / Saber a hora certa de dizer as coisas é a maior arte da vida.",
      E: "Saber é ver em nós mesmos / Ver em nós mesmos é saber.",
    },
    alternativaCorreta: "B",
  },
  {
    id: "q_79f208aed47671f61396305049b3da55",
    numeroOriginal: 9,
    assunto: "Semântica: sentido dos vocábulos",
    enunciado: "As frases listadas a seguir mostram vocábulos idênticos repetidos. Assinale a frase em que esses vocábulos mostram significados diferentes.",
    alternativas: {
      A: "No encontro entre um sábio e um idiota, o sábio tira mais proveito.",
      B: "Saber que não se sabe constitui talvez o mais difícil e delicado saber.",
      C: "Um falso problema é sempre melhor do que problema nenhum.",
      D: "Os homens confiam menos nos seus ouvidos no que confiam nos seus olhos.",
      E: "Olho por olho, dente por dente.",
    },
    alternativaCorreta: "B",
  },
  {
    id: "q_211b527b9a2a588d845cd5bfee767be4",
    numeroOriginal: 11,
    assunto: "Regência e colocação pronominal",
    enunciado: "Assinale a frase em que houve troca indevida entre “o” e “lhe”.",
    alternativas: {
      A: "Devemos ser pontes para cobrirmos os abismos e nunca para aprofundá-los.",
      B: "Se quiser conhecer verdadeiramente um homem, dê-lhe autoridade.",
      C: "Um bobo sempre acha um mais bobo para admirar-lhe.",
      D: "A minha disposição é muita, mas a minha vontade de obedecer-lhe é pouca.",
      E: "Não há prazer em estar em um lugar e não o visitar.",
    },
    alternativaCorreta: "C",
  },
  {
    id: "q_6bfe96a653c90c93ffa3f0fe4820e42a",
    numeroOriginal: 12,
    assunto: "Regência e valor semântico das preposições",
    enunciado: "Assinale a frase em que a preposição A, sozinha ou combinada, tem seu valor semântico corretamente indicado.",
    alternativas: {
      A: "Às nove horas ele tomou banho sem pressa. / lugar.",
      B: "Saiu às compras com toda a família. / finalidade.",
      C: "Capitu, aos quatorze anos já tinha atrevimento. / modo.",
      D: "Foi ao circo junto com a família do noivo. / tempo.",
      E: "Estava à porta de casa quando foi atingida. / direção.",
    },
    alternativaCorreta: "B",
  },
  {
    id: "q_7f0dbd68ac9699b5d512762bec66dec1",
    numeroOriginal: 13,
    assunto: "Morfologia e formação de palavras",
    enunciado: "Muitas palavras portuguesas mostram o prefixo A- sem qualquer valor semântico, sendo equivalentes ao mesmo vocábulo sem esse prefixo. Assinale a palavra abaixo que exemplifica esse A protético.",
    alternativas: {
      A: "Alargar.",
      B: "Assaltar.",
      C: "Atacar.",
      D: "Apanhar.",
      E: "Avoar.",
    },
    alternativaCorreta: "E",
  },
  {
    id: "q_ca315b013e49f874cae622beda4e9f78",
    numeroOriginal: 14,
    assunto: "Morfologia: grau do adjetivo",
    enunciado: "Assinale a frase que mostra um adjetivo em grau superlativo.",
    alternativas: {
      A: "O homem prudente previne-se para o futuro como se já estivesse presente.",
      B: "Há pessoas tão chatas que nos fazem perder um dia em cinco minutos.",
      C: "Quem mais tempo sabe aproveitar mais certo está de ganhar.",
      D: "Quando a história se encarrega de fazer teatro, o faz maravilhosamente.",
      E: "Profetizar o futuro não é difícil, mas é perigoso.",
    },
    alternativaCorreta: "B",
  },
  {
    id: "q_745bbb2d041d42a9838468c7f0e880f4",
    numeroOriginal: 15,
    assunto: "Morfologia: adjetivos",
    enunciado: "Os adjetivos podem representar estados, qualidades, características e relações; assinale a frase abaixo que mostra um tipo de adjetivo diferente dos demais.",
    alternativas: {
      A: "Meu pai, apesar da idade, não mostra cabelos brancos.",
      B: "Filhos teimosos são filhos mal-educados.",
      C: "As rosas vermelhas são as mais bonitas.",
      D: "A seda é o tecido mais macio que há.",
      E: "Toalhas manchadas são fruto de descuido.",
    },
    alternativaCorreta: "B",
  },
  {
    id: "q_15f5a6560a23617d004ffb06b2e364a0",
    numeroOriginal: 16,
    assunto: "Crase",
    enunciado: "Assinale a frase que mostra o acento grave indicativo da crase em um contexto em que seu uso é optativo.",
    alternativas: {
      A: "Se encontrares o criminoso, leva-o à delegacia.",
      B: "Todos os caminhos do trabalho levam à riqueza.",
      C: "Nem sempre prestamos atenção à nossa família.",
      D: "Dê boas-vindas à felicidade.",
      E: "Tudo o que vem da terra volta à terra.",
    },
    alternativaCorreta: "C",
  },
];

const linguaPortuguesa = importedPortugueseQuestions.map((question) => ({
  id: question.id,
  tipo: "multipla_escolha",
  enunciado: question.enunciado,
  alternativas: LETTERS.map((letter) => question.alternativas[letter]),
  correta: LETTERS.indexOf(question.alternativaCorreta),
  materia: "Língua Portuguesa",
  assunto: question.assunto,
  numeroOriginal: question.numeroOriginal,
  ...SOURCE,
}));

export default {
  "Língua Portuguesa": linguaPortuguesa,
};
