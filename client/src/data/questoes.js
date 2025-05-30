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
    banca: "FGV",
    orgao: "PM-SP",
    ano: 2025
  },
  {
    id: 11,
    enunciado: "Sobre a organização do Estado brasileiro, é correto afirmar que:",
    alternativas: [
      "O Distrito Federal pode ser dividido em Municípios.",
      "Os Territórios Federais possuem autonomia política equivalente à dos Estados.",
      "Os Estados podem incorporar-se entre si, independentemente de consulta popular.",
      "Os Municípios possuem autonomia política, administrativa e financeira.",
      "A criação de novos Estados independe de aprovação do Congresso Nacional."
    ],
    correta: 3,
    banca: "CESPE",
    orgao: "ICMBio",
    ano: 2025
  },
  {
    id: 12,
    enunciado: "Em relação aos direitos sociais previstos na Constituição Federal, assinale a alternativa correta.",
    alternativas: [
      "O direito à saúde é garantido apenas aos trabalhadores formais.",
      "A educação é direito de todos e dever do Estado e da família.",
      "A previdência social é destinada exclusivamente aos servidores públicos.",
      "O direito ao trabalho é assegurado apenas aos brasileiros natos.",
      "A assistência social é prestada apenas mediante contribuição."
    ],
    correta: 1,
    banca: "FGV",
    orgao: "SEFAZ-PR",
    ano: 2025
  },
  {
    id: 13,
    enunciado: "No que tange ao Poder Judiciário, é correto afirmar que:",
    alternativas: [
      "O Supremo Tribunal Federal é composto por 15 ministros.",
      "O Conselho Nacional de Justiça é órgão do Poder Executivo.",
      "Os juízes gozam de vitaliciedade após 2 anos de exercício.",
      "O Superior Tribunal de Justiça é responsável pela guarda da Constituição.",
      "Os tribunais regionais federais são órgãos do Poder Legislativo."
    ],
    correta: 2,
    banca: "CESPE",
    orgao: "IBAMA",
    ano: 2025
  },
  {
    id: 14,
    enunciado: "Acerca dos princípios da administração pública, é correto afirmar que:",
    alternativas: [
      "O princípio da legalidade permite que o administrador público aja conforme sua vontade.",
      "O princípio da impessoalidade impede a responsabilização do servidor público.",
      "O princípio da moralidade exige conduta ética dos agentes públicos.",
      "O princípio da publicidade permite a manutenção de atos administrativos secretos.",
      "O princípio da eficiência é incompatível com a meritocracia no serviço público."
    ],
    correta: 2,
    banca: "FGV",
    orgao: "PM-SP",
    ano: 2025
  },
  {
    id: 15,
    enunciado: "Sobre o processo administrativo disciplinar, assinale a alternativa correta.",
    alternativas: [
      "A penalidade de demissão pode ser aplicada sem a instauração de processo administrativo.",
      "O servidor público não tem direito à ampla defesa no processo disciplinar.",
      "O processo administrativo disciplinar deve observar o contraditório e a ampla defesa.",
      "A suspensão preventiva do servidor é vedada durante o processo disciplinar.",
      "O processo administrativo disciplinar não admite recurso."
    ],
    correta: 
::contentReference[oaicite:1]{index=1}
 
