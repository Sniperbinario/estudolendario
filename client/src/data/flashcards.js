const flashcards = {
  sedes_tdas_tecadm: {
    "Língua Portuguesa": [
      { id: "sedes-fc-001", assunto: "Compreensão e interpretação de textos de gêneros variados", tipo: "conceito", frente: "O que é inferência em interpretação de texto?", verso: "É concluir uma informação implícita com base em pistas do texto. Não é opinião pessoal." },
      { id: "sedes-fc-002", assunto: "Mecanismos de coesão textual: referenciação, substituição, repetição, conectores e sequenciação textual", tipo: "conceito", frente: "Para que servem os conectores na coesão?", verso: "Ligam ideias e indicam relações como causa, oposição, conclusão, condição e adição." },
      { id: "sedes-fc-003", assunto: "Emprego do sinal indicativo de crase", tipo: "pegadinha", frente: "Existe crase antes de verbo?", verso: "Não. Crase exige preposição 'a' + artigo feminino 'a'. Verbo não aceita artigo." },
    ],
    "Conhecimentos do Distrito Federal, Política para Mulheres, Legislação e Primeiros Socorros": [
      { id: "sedes-fc-004", assunto: "RIDE: Lei Complementar Federal nº 94/1998 e Decreto Federal nº 7.469/2011", tipo: "decoreba", frente: "O que significa RIDE?", verso: "Região Integrada de Desenvolvimento do Distrito Federal e Entorno." },
      { id: "sedes-fc-005", assunto: "Lei Federal nº 11.340/2006: Lei Maria da Penha", tipo: "conceito", frente: "Qual é o foco central da Lei Maria da Penha?", verso: "Criar mecanismos para coibir e prevenir a violência doméstica e familiar contra a mulher." },
      { id: "sedes-fc-006", assunto: "Primeiros socorros: reconhecimento de urgência e emergência e acionamento do socorro especializado", tipo: "pegadinha", frente: "Em primeiros socorros, qual a primeira conduta geral?", verso: "Avaliar a segurança da cena, proteger a vítima e acionar socorro especializado quando necessário." },
    ],
    "Fundamentos, Organização, Gestão e Marcos Operacionais do SUAS": [
      { id: "sedes-fc-007", assunto: "PNAS/2004 e organização da assistência social: princípios, diretrizes e objetivos", tipo: "decoreba", frente: "A PNAS é de qual ano?", verso: "2004. Ela organiza a política pública de assistência social e orienta o SUAS." },
      { id: "sedes-fc-008", assunto: "Proteções afiançadas: Proteção Social Básica e Proteção Social Especial", tipo: "conceito", frente: "Qual a diferença entre Proteção Social Básica e Especial?", verso: "Básica previne riscos; Especial atende situações de violação de direitos ou vínculos rompidos/fragilizados." },
      { id: "sedes-fc-009", assunto: "SUAS: princípios, diretrizes, organização e seguranças socioassistenciais", tipo: "pegadinha", frente: "A assistência social depende de contribuição prévia?", verso: "Não. É política pública não contributiva, direito do cidadão e dever do Estado." },
    ],
    "Programas, Benefícios e Instrumentos Socioassistenciais do Distrito Federal": [
      { id: "sedes-fc-010", assunto: "Programa de Provimento Alimentar Direto em Caráter Emergencial – Cartão Prato Cheio: Lei Distrital nº 7.009/2021 e Decreto nº 42.873/2021", tipo: "conceito", frente: "Qual a finalidade do Cartão Prato Cheio?", verso: "Garantir provimento alimentar direto, em caráter emergencial, a famílias em insegurança alimentar." },
      { id: "sedes-fc-011", assunto: "Programa Cartão Gás: Lei Distrital nº 6.938/2021 e Decreto nº 42.376/2021", tipo: "decoreba", frente: "O Cartão Gás está ligado a qual necessidade básica?", verso: "Auxílio para aquisição de gás de cozinha, ligado à segurança alimentar e proteção social." },
      { id: "sedes-fc-012", assunto: "Benefícios Eventuais da Política de Assistência Social do Distrito Federal: Lei Distrital nº 5.165/2013 e Decreto nº 35.191/2014", tipo: "conceito", frente: "O que são benefícios eventuais?", verso: "Provisões suplementares e provisórias prestadas em situações de vulnerabilidade temporária, calamidade ou necessidade específica." },
    ],
    "Noções de Direito Constitucional": [
      { id: "sedes-fc-013", assunto: "Constituição Federal de 1988: princípios fundamentais", tipo: "decoreba", frente: "Quais são fundamentos da República no art. 1º da CF?", verso: "Soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa, pluralismo político." },
      { id: "sedes-fc-014", assunto: "Direitos e garantias fundamentais: direitos e deveres individuais e coletivos", tipo: "pegadinha", frente: "Direitos fundamentais são absolutos?", verso: "Não. Podem sofrer limitações constitucionais e ponderação em conflito com outros direitos." },
      { id: "sedes-fc-015", assunto: "Direitos sociais", tipo: "conceito", frente: "Cite exemplos de direitos sociais do art. 6º.", verso: "Educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência, proteção à maternidade/infância e assistência aos desamparados." },
    ],
    "Noções de Direito Administrativo e Legislação": [
      { id: "sedes-fc-016", assunto: "Ato administrativo: conceito, requisitos, atributos e classificação", tipo: "decoreba", frente: "Quais são os requisitos clássicos do ato administrativo?", verso: "Competência, finalidade, forma, motivo e objeto." },
      { id: "sedes-fc-017", assunto: "Poderes da Administração Pública: hierárquico, disciplinar, regulamentar e de polícia", tipo: "conceito", frente: "O que é poder de polícia?", verso: "É a atividade estatal que limita ou condiciona direitos individuais em favor do interesse público." },
      { id: "sedes-fc-018", assunto: "LC nº 840/2011: direitos, deveres e responsabilidade", tipo: "pegadinha", frente: "Servidor pode alegar desconhecimento da lei para descumprir dever funcional?", verso: "Não. O dever funcional decorre da lei e do regime jurídico aplicável ao cargo." },
    ],
    "Atendimento, Rotinas Administrativas e Arquivologia": [
      { id: "sedes-fc-019", assunto: "Qualidade no atendimento ao público", tipo: "conceito", frente: "O que caracteriza atendimento público de qualidade?", verso: "Urbanidade, clareza, eficiência, respeito, escuta ativa e orientação adequada ao cidadão." },
      { id: "sedes-fc-020", assunto: "Noções de redação oficial", tipo: "pegadinha", frente: "Redação oficial deve usar linguagem rebuscada?", verso: "Não. Deve ser clara, objetiva, impessoal, formal e padronizada." },
      { id: "sedes-fc-021", assunto: "Protocolo: recebimento, registro, distribuição e tramitação", tipo: "conceito", frente: "Qual a função do protocolo?", verso: "Controlar recebimento, registro, distribuição, tramitação e rastreabilidade de documentos/processos." },
    ],
    "Noções de Recursos Materiais, Patrimônio e Compras": [
      { id: "sedes-fc-022", assunto: "Administração de materiais: gestão de estoques e armazenagem", tipo: "conceito", frente: "Qual o objetivo da gestão de estoques?", verso: "Garantir materiais disponíveis na quantidade certa, evitando falta, excesso e desperdício." },
      { id: "sedes-fc-023", assunto: "Gestão patrimonial: tombamento, controle, inventário e baixa de bens", tipo: "decoreba", frente: "O que é tombamento patrimonial?", verso: "Registro formal do bem permanente para identificação, controle e responsabilização." },
      { id: "sedes-fc-024", assunto: "Noções de compras no setor público: Lei Federal nº 14.133/2021 e alterações", tipo: "pegadinha", frente: "Compra pública pode ser feita sem planejamento?", verso: "Não. A fase preparatória e o planejamento são essenciais na Lei 14.133/2021." },
    ],
  },
  pf: {},
  alego: {},
  inss: {},
};

export default flashcards;
