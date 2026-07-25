import type {
  ConteudoGerado,
  PostGerado,
} from './supabaseClient';

export const mockConteudoGerado: ConteudoGerado = {
  id: 1,
  relatorio_tendencias:
    'O mercado imobiliário e logístico brasileiro atravessa um momento de inflexão. A combinação entre a estabilização da Selic no patamar de dois dígitos, o avanço de fundos imobiliários focados em galpões logísticos e a expansão do e-commerce sustenta uma demanda seletiva por ativos com fluxo de renda previsível. Observamos uma rotação de capital de empreendimentos residenciais de alto padrão para imóveis comerciais e logísticos com lastro em receitas de longo prazo. A escassez de terrenos bem localizados nas regiões metropolitanas de São Paulo e Rio de Janeiro mantém os preços de aquisição elevados, enquanto a velocidade de absorção de galpões Classe A acelera. Para a equipe de design, o tom deve transmitir solidez institucional e visão analítica, evitando apelos emocionais excessivos e priorizando clareza de dados e hierarquia visual robusta.',
  topicos_estrategicos: [
    {
      tema_macro: 'Galpões logísticos Classe A lideram absorção no trimestre',
      pontuacao_relevancia: 9,
      justificativa_pontuacao:
        'Velocidade de absorção 23% acima da média histórica e escassez de oferta em SP e RJ.',
      sintese:
        'A demanda por galpões Classe A cresceu de forma consistente, puxada pelo e-commerce e por fundos imobiliários que buscam lastro em receitas contratuais de longo prazo. A escassez de terrenos bem localizados eleva o spread de aquisição e favorece desenvolvedores com landbank estratégico. Recomenda-se reforçar nas comunicações o argumento de previsibilidade de fluxo de caixa e a localização como diferencial competitivo.',
    },
    {
      tema_macro: 'Estabilização da Selic reativa interesse por lançamentos residenciais',
      pontuacao_relevancia: 7,
      justificativa_pontuacao:
        'Sinalização do Copom de ciclo de cortes melhora expectativa de crédito habitacional.',
      sintese:
        'A pausa no ciclo de alta da Selic e a expectativa de cortes graduais reanimam o crédito imobiliário, especialmente para a classe média. Lançamentos com preço de venda controlado e prazos curtos de entrega tendem a captar demanda represada. O conteúdo deve destacar o timing de entrada e o custo de oportunidade do financiamento.',
    },
    {
      tema_macro: 'Fundos imobiliários aceleram captação para ativos logísticos',
      pontuacao_relevancia: 8,
      justificativa_pontuacao:
        'Captação líquida positiva em FIIs logísticos pelo quarto mês consecutivo.',
      sintese:
        'FIIs do segmento logístico registram captação líquida positiva e ampliam a busca por ativos com contratos de longo prazo e indexação ao IGP-M. Esse movimento reforça a liquidez do secundário e amplia o interesse do investidor pessoa física. A comunicação pode explorar o tema como ponte entre o investidor e o ativo real.',
    },
    {
      tema_macro: 'E-commerce mantém expansão de dois dígitos e pressiona última milha',
      pontuacao_relevancia: 6,
      justificativa_pontuacao:
        'Crescimento de 11% no volume de pedidos impacta demanda por mini-logística urbana.',
      sintese:
        'A expansão do e-commerce sustenta a demanda por mini-logística urbana e por galpões de menor porte próximos aos centros de consumo. O tema é relevante para investidores em FIIs e para desenvolvedores com expertise em conversão de imóveis obsoletos. Recomenda-se abordar o ganho de eficiência logística como argumento de venda.',
    },
    {
      tema_macro: 'Residencial alto padrão perdem tração em favor de renda recorrente',
      pontuacao_relevancia: 4,
      justificativa_pontuacao:
        'Velocidade de vendas em lançamentos de alto padrão caiu 12% no trimestre.',
      sintese:
        'O segmento residencial de alto padrão enfrenta deságio e alongamento de prazo de vendas, enquanto investidores migram para ativos com renda recorrente. O tema é secundário para a estratégia de comunicação, mas útil como contraponto em análises comparativas de alocação.',
    },
    {
      tema_macro: 'ESG vira critério de elegibilidade em fundos corporativos',
      pontuacao_relevancia: 3,
      justificativa_pontuacao:
        'Crescente exigência de certificações ambientais em edifícios corporativos Classe AA.',
      sintese:
        'Certificações ambientais (LEED, AQUA) tornam-se critério de elegibilidade para investidores institucionais em edifícios corporativos. O tema ainda é incipiente no segmento logístico, mas tende a ganhar relevância. Pode ser abordado como diferencial reputacional em comunicações institucionais.',
    },
  ],
  sugestoes_pautas: [
    {
      titulo: 'Por que galpões Classe A viraram o ativo mais disputado de 2026',
      contexto:
        'Explicar o movimento de fundos imobiliários e a escassez de oferta em SP/RJ, com dados de absorção.',
    },
    {
      titulo: 'Selic estável: o que muda para o crédito imobiliário agora',
      contexto:
        'Análise do impacto da estabilização da taxa básica sobre lançamentos e financiamento.',
    },
    {
      titulo: 'FIIs logísticos: como o investidor pessoa física acessa o ativo real',
      contexto:
        'Conectar o investidor ao ativo físico, explicando lastro, contratos e liquidez.',
    },
    {
      titulo: 'Mini-logística urbana: a próxima fronteira do e-commerce',
      contexto:
        'Abordar conversão de imóveis obsoletos e ganho de eficiência na última milha.',
    },
  ],
  created_at: '2026-07-25T09:30:00.000Z',
};

export const mockPostsGerados: PostGerado[] = [
  {
    id: 101,
    conteudo_gerado_id: 1,
    plataforma: 'Instagram',
    formato: 'Carrossel',
    headline: 'Galpões Classe A: o ativo mais disputado do mercado',
    subtitulo:
      'Absorção 23% acima da média histórica e escassez de terrenos redefinem o jogo logístico',
    texto_apoio:
      'Fundos imobiliários buscam lastro em receitas de longo prazo. Em SP e RJ, a oferta de galpões Classe A não acompanha a demanda — e quem tem landbank estratégico sai na frente.',
    cta: 'Leia a análise completa no link da bio',
    legenda:
      'O mercado imobiliário está em rotação. Enquanto lançamentos residenciais desaceleram, galpões logísticos Classe A lideram a absorção no trimestre. É a combinação de e-commerce em alta, fundos buscando renda recorrente e escassez de terrenos bem localizados. Para investidores e desenvolvedores, a pergunta certa não é se, mas onde posicionar o capital. Salve este post e compartilhe com quem precisa entender o setor.',
    hashtags: '#Imobiliário #Logística #FundosImobiliários #MercadoImobiliário #AurumDI',
  },
  {
    id: 102,
    conteudo_gerado_id: 1,
    plataforma: 'Instagram',
    formato: 'Estático',
    headline: 'Selic estável: o crédito imobiliário volta a respirar',
    subtitulo: 'Sinalização do Copom reativa interesse por lançamentos residenciais',
    texto_apoio:
      'A pausa no ciclo de alta e a expectativa de cortes graduais reanimam o crédito habitacional, especialmente para a classe média.',
    cta: 'Comente: você sente essa mudança no seu mercado?',
    legenda:
      'A estabilização da Selic muda o humor do mercado. Lançamentos com preço controlado e prazos curtos tendem a captar demanda represada. O timing de entrada e o custo de oportunidade do financiamento viram argumentos centrais. Se você atua no setor, vale revisar o pipeline de lançamentos para os próximos trimestres.',
    hashtags: '#Selic #CréditoImobiliário #MercadoImobiliário #AurumDI',
  },
  {
    id: 103,
    conteudo_gerado_id: 1,
    plataforma: 'Instagram',
    formato: 'Reels',
    headline: 'Como o investidor pessoa física acessa o ativo logístico',
    subtitulo: 'FIIs logísticos conectam o capital individual ao imóvel real',
    texto_apoio:
      'Captação líquida positiva pelo quarto mês seguido. Lastro, contratos de longo prazo e indexação ao IGP-M explicam o apetite.',
    cta: 'Siga para mais análises de mercado imobiliário',
    legenda:
      'FIIs do segmento logístico registram captação líquida positiva e ampliam a busca por ativos com contratos de longo prazo. O investidor pessoa física ganha acesso ao ativo real sem precisar comprar o galpão. A comunicação deve explorar essa ponte entre o capital e o imóvel — e por que ela tende a continuar.',
    hashtags: '#FIIs #FundosImobiliários #Investimentos #Logística #AurumDI',
  },
  {
    id: 104,
    conteudo_gerado_id: 1,
    plataforma: 'LinkedIn',
    formato: 'Estático',
    headline: 'Rotação de capital: do residencial de alto padrão para a renda recorrente',
    subtitulo:
      'Investidores migram para ativos com fluxo de caixa previsível em ciclo de juros altos',
    texto_apoio:
      'Velocidade de vendas em lançamentos de alto padrão caiu 12% no trimestre, enquanto FIIs logísticos ampliam captação. A mensagem do mercado é clara: previsibilidade vence aposta em valorização.',
    cta: 'Compartilhe com sua rede se faz sentido para o seu setor',
    legenda:
      'O movimento é estrutural, não conjuntural. Investidores institucionais e pessoas físicas estão reponderando portfólios em favor de ativos com renda recorrente e contratos indexados. Para desenvolvedores, isso significa repensar o produto: menos aposta em ganho de capital, mais lastro em fluxo de caixa. O conteúdo que produzirmos precisa refletir essa mudança de narrativa — de "valorização" para "previsibilidade".',
    hashtags: '#MercadoImobiliário #Investimentos #FIIs #Logística #RealEstate',
  },
  {
    id: 105,
    conteudo_gerado_id: 1,
    plataforma: 'LinkedIn',
    formato: 'Carrossel',
    headline: 'Mini-logística urbana: a próxima fronteira do e-commerce',
    subtitulo: 'Conversão de imóveis obsoletos vira oportunidade de renda em centros densos',
    texto_apoio:
      'E-commerce cresce dois dígitos e pressiona a última milha. Galpões de menor porte próximos aos centros de consumo ganham valor.',
    cta: 'Salve este post e leve para a próxima reunião de estratégia',
    legenda:
      'A expansão do e-commerce sustenta a demanda por mini-logística urbana e por galpões de menor porte próximos aos centros de consumo. Para desenvolvedores com expertise em conversão de imóveis obsoletos, abre-se uma janela real de oportunidade. O argumento de venda deixa de ser apenas "localização" e passa a ser "eficiência logística". É um recorte que merece espaço na nossa pauta institucional.',
    hashtags: '#Logística #ECommerce #MiniLogística #RealEstate #AurumDI',
  },
  {
    id: 106,
    conteudo_gerado_id: 1,
    plataforma: 'LinkedIn',
    formato: 'Estático',
    headline: 'ESG vira critério de elegibilidade em edifícios corporativos',
    subtitulo: 'Certificações ambientais deixam de ser diferencial e viram requisito',
    texto_apoio:
      'Investidores institucionais passam a exigir LEED ou AQUA em ativos corporativos Classe AA. O movimento tende a alcançar o segmento logístico.',
    cta: 'Como sua empresa está se preparando para essa exigência?',
    legenda:
      'Certificações ambientais (LEED, AQUA) tornam-se critério de elegibilidade para investidores institucionais em edifícios corporativos. O tema ainda é incipiente no segmento logístico, mas tende a ganhar relevância nos próximos ciclos de captação. Para a comunicação institucional, vale posicionar a sustentabilidade como diferencial reputacional — não como acessório.',
    hashtags: '#ESG #Sustentabilidade #RealEstate #Corporativo #AurumDI',
  },
];
