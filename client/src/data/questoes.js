const questoes = [
  {
    id: 1,
    enunciado: "Em relação à administração pública, assinale a alternativa correta.",
    alternativas: [
      "A administração direta é composta por autarquias e fundações públicas.",
      "A administração indireta é composta por ministérios e secretarias.",
      "A administração direta é composta pelos entes federativos: União, Estados, Distrito Federal e Municípios.",
      "A administração indireta não possui personalidade jurídica própria.",
      "A administração direta é composta por empresas públicas e sociedades de economia mista."
    ],
    correta: 2,
    explicacao: "A administração direta é composta pelos entes políticos: União, Estados, Distrito Federal e Municípios. Já a administração indireta compreende entidades com personalidade jurídica própria.",
    banca: "CESPE",
    orgao: "IBAMA",
    ano: 2025
  },
  {
    id: 2,
    enunciado: "No que tange aos princípios constitucionais da administração pública, é correto afirmar que:",
    alternativas: [
      "O princípio da legalidade permite que o administrador público atue conforme sua conveniência.",
      "O princípio da impessoalidade impede que o servidor público seja responsabilizado por seus atos.",
      "O princípio da moralidade exige que o administrador público atue conforme padrões éticos aceitos pela sociedade.",
      "O princípio da publicidade permite que atos administrativos secretos sejam mantidos indefinidamente.",
      "O princípio da eficiência é incompatível com a meritocracia no serviço público."
    ],
    correta: 2,
    explicacao: "O princípio da moralidade exige que a atuação do agente público esteja em consonância com padrões éticos e de boa-fé, não bastando a legalidade.",
    banca: "FGV",
    orgao: "PM-SP",
    ano: 2025
  },
  {
    id: 3,
    enunciado: "Sobre o processo legislativo brasileiro, assinale a alternativa correta.",
    alternativas: [
      "A iniciativa popular de lei é admitida apenas no âmbito federal.",
      "Medidas provisórias podem ser reeditadas indefinidamente.",
      "O veto presidencial pode ser derrubado por maioria simples do Congresso Nacional.",
      "As leis complementares exigem maioria absoluta para sua aprovação.",
      "As leis ordinárias têm hierarquia superior às leis complementares."
    ],
    correta: 3,
    explicacao: "As leis complementares exigem maioria absoluta (metade mais um dos membros da casa) para aprovação, ao contrário das ordinárias.",
    banca: "CESPE",
    orgao: "ICMBio",
    ano: 2025
  },
  {
    id: 4,
    enunciado: "Em relação aos direitos e garantias fundamentais previstos na Constituição Federal de 1988, é correto afirmar que:",
    alternativas: [
      "A liberdade de expressão é absoluta, não admitindo restrições.",
      "O direito de reunião pode ser exercido independentemente de aviso prévio à autoridade competente.",
      "A casa é asilo inviolável do indivíduo, não podendo ser penetrada sem consentimento do morador, salvo em caso de flagrante delito ou desastre.",
      "É permitida a tortura em casos excepcionais de segurança nacional.",
      "O sigilo das comunicações telefônicas pode ser quebrado por decisão administrativa."
    ],
    correta: 2,
    explicacao: "A Constituição protege a inviolabilidade do domicílio, admitindo exceções apenas em situações muito específicas previstas em lei.",
    banca: "FGV",
    orgao: "SEFAZ-PR",
    ano: 2025
  },
  {
    id: 5,
    enunciado: "No que se refere ao controle da administração pública, assinale a alternativa correta.",
    alternativas: [
      "O controle interno é exercido exclusivamente pelo Poder Legislativo.",
      "O controle externo é realizado apenas pelo Poder Executivo.",
      "O Tribunal de Contas da União é um órgão do Poder Judiciário.",
      "O controle interno visa à legalidade, legitimidade e economicidade dos atos administrativos.",
      "O controle externo não pode ser exercido sobre as empresas públicas."
    ],
    correta: 3,
    explicacao: "O controle interno é exercido pela própria Administração e busca garantir a legalidade, legitimidade e economicidade dos atos praticados.",
    banca: "CESPE",
    orgao: "IBAMA",
    ano: 2025
  },
  {
    id: 6,
    enunciado: "Acerca dos contratos administrativos, é correto afirmar que:",
    alternativas: [
      "Os contratos administrativos não admitem cláusulas exorbitantes.",
      "A alteração unilateral do contrato pela administração é vedada.",
      "A rescisão do contrato administrativo pode ocorrer por interesse público.",
      "Os contratos administrativos não se submetem ao princípio da legalidade.",
      "A duração dos contratos administrativos é ilimitada."
    ],
    correta: 2,
    explicacao: "A Administração pode rescindir unilateralmente um contrato por motivo de interesse público, conforme previsto na Lei de Licitações.",
    banca: "FGV",
    orgao: "PM-SP",
    ano: 2025
  },
  {
    id: 7,
    enunciado: "Sobre o regime jurídico dos servidores públicos civis da União, é correto afirmar que:",
    alternativas: [
      "A estabilidade é adquirida após 2 anos de efetivo exercício.",
      "O servidor estável pode ser exonerado por insuficiência de desempenho, mediante processo administrativo.",
      "A aposentadoria compulsória ocorre aos 75 anos de idade, com proventos proporcionais ao tempo de contribuição.",
      "O servidor público não pode acumular cargos públicos em nenhuma hipótese.",
      "A remuneração dos servidores públicos pode exceder o teto constitucional."
    ],
    correta: 1,
    explicacao: "O servidor estável pode perder o cargo por insuficiência de desempenho, desde que garantidos o contraditório e a ampla defesa.",
    banca: "CESPE",
    orgao: "ICMBio",
    ano: 2025
  },
  {
    id: 8,
    enunciado: "Em relação à responsabilidade civil do Estado, é correto afirmar que:",
    alternativas: [
      "O Estado responde subjetivamente pelos danos causados por seus agentes.",
      "A responsabilidade do Estado é objetiva, independentemente de dolo ou culpa.",
      "O Estado não responde por atos omissivos de seus agentes.",
      "A responsabilidade do Estado é sempre subsidiária em relação ao agente público.",
      "O Estado responde apenas por atos lícitos de seus agentes."
    ],
    correta: 1,
    explicacao: "A responsabilidade do Estado por atos de seus agentes é objetiva, nos termos do art. 37, §6º da Constituição.",
    banca: "FGV",
    orgao: "SEFAZ-PR",
    ano: 2025
  },
  {
    id: 9,
    enunciado: "No que se refere aos princípios orçamentários, assinale a alternativa correta.",
    alternativas: [
      "O princípio da anualidade estabelece que o orçamento deve ser elaborado para um período de dois anos.",
      "O princípio da universalidade determina que todas as receitas e despesas devem constar na lei orçamentária.",
      "O princípio da exclusividade permite que a lei orçamentária trate de matéria estranha à previsão de receitas e à fixação de despesas.",
      "O princípio do equilíbrio orçamentário obriga que as despesas sejam sempre superiores às receitas.",
      "O princípio da legalidade orçamentária permite a execução de despesas sem prévia autorização legislativa."
    ],
    correta: 1,
    explicacao: "A universalidade orçamentária prevê que todas as receitas e despesas públicas devem constar na lei orçamentária.",
    banca: "CESPE",
    orgao: "IBAMA",
    ano: 2025
  },
  {
    id: 10,
    enunciado: "Acerca da Lei de Responsabilidade Fiscal (LRF), é correto afirmar que:",
    alternativas: [
      "A LRF não se aplica aos Estados e Municípios.",
      "A LRF estabelece limites para as despesas com pessoal.",
      "A LRF permite a realização de operações de crédito por antecipação de receita orçamentária sem restrições.",
      "A LRF dispensa a transparência na gestão fiscal.",
      "A LRF não prevê sanções para o descumprimento de seus dispositivos."
    ],
    correta: 1,
    explicacao: "A LRF impõe limites de gastos com pessoal, dívida pública, entre outros, visando o equilíbrio fiscal.",
    banca: "FGV",
    orgao: "PM-SP",
    ano: 2025
  }
];

export default questoes;
