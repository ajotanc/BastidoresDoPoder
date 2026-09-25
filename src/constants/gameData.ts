import { ROLE_THEME_COLORS } from '@/constants/themeColors';
import type {
  RoleCard,
  MetaStat,
  NavigationItem,
  GeneralAction,
  TurnStep,
  GameExample,
  QuickReferenceRow,
  IconLegendItem,
  PlayerSetupCount,
  GameCoin
} from '@/types/game';

/**
 * Navegação rápida do manual
 */
export const NAVIGATION_SECTIONS: readonly NavigationItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'game', label: 'O jogo' },
  { id: 'cards', label: 'Cartas' },
  { id: 'setup', label: 'Preparação' },
  { id: 'actions', label: 'Ações' },
  { id: 'turn-order', label: 'Resolução' },
  { id: 'investigation', label: 'Investigação' },
  { id: 'examples', label: 'Exemplos' },
  { id: 'reference', label: 'Consulta' },
] as const;

/**
 * Definição completa dos 8 personagens e da carta de ajuda
 */
export const ROLE_CARDS: readonly RoleCard[] = [
  {
    id: 'card-colonel',
    slug: 'colonel',
    name: 'Coronel',
    category: 'Pressão',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.coronel,
    kind: 'Extorsão',
    summary: 'Ataque econômico com bloqueio próprio e defesa contra Investigador.',
    imageSrc: '/images/cards/colonel.png',
    previewSrc: '/images/previews/colonel.webp',
    imageAlt: 'Carta Coronel de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/colonel.webp',
    iconSrc: '/images/icons/colonel.webp',
    rules: [
      {
        title: 'Extorsão (ação)',
        description: 'Exija C$ 2 de um adversário vivo. Se ele tiver apenas C$ 1, entregará C$ 1; se tiver zero, a ação não transfere dinheiro.',
        type: 'action'
      },
      {
        title: 'Bloqueio de Extorsão (defesa)',
        description: 'Bloqueie a Extorsão quando você for o alvo.',
        type: 'defense'
      },
      {
        title: 'Bloqueio de Mandado (defesa)',
        description: 'Bloqueie o Mandado de Busca quando você for o alvo.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'O Coronel pode bloquear Extorsão e Mandado de Busca apenas quando for o alvo. Não protege outros jogadores.'
  },
  {
    id: 'card-executor',
    slug: 'executor',
    name: 'Executor',
    category: 'Eliminação',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.executor,
    kind: 'Eliminação',
    summary: 'Eliminação rápida com custo moderado, bloqueável por Advogada.',
    imageSrc: '/images/cards/executor.png',
    previewSrc: '/images/previews/executor.webp',
    imageAlt: 'Carta Executor de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/executor.webp',
    iconSrc: '/images/icons/executor.webp',
    rules: [
      {
        title: 'Execução (ação)',
        description: 'Pague C$ 3 ao cofre e escolha um adversário vivo. Se a ação não for cancelada por contestação ou bloqueio, ele perde um apoio à escolha dele.',
        type: 'action'
      }
    ],
    officialRuleNotice: 'O custo de C$ 3 é pago na declaração e nunca é devolvido, mesmo se a ação for bloqueada ou contestada.'
  },
  {
    id: 'card-untouchable',
    slug: 'untouchable',
    name: 'Intocável',
    category: 'Blindagem',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.intocavel,
    kind: 'Blindagem',
    summary: 'Defesa paga contra Impeachment comum. Não protege do definitivo.',
    imageSrc: '/images/cards/untouchable.png',
    previewSrc: '/images/previews/untouchable.webp',
    imageAlt: 'Carta Intocável de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/untouchable.webp',
    iconSrc: '/images/icons/untouchable.webp',
    rules: [
      {
        title: 'Bloqueio de Impeachment comum (defesa)',
        description: 'Quando você for o alvo de um Impeachment comum de C$ 7, alegue Intocável e pague C$ 3 ao cofre para declarar o bloqueio. O ataque é cancelado se o bloqueio não for desmascarado.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'Requer saldo prévio de C$ 3 para declarar a defesa. O valor vai para o cofre e nunca retorna.'
  },
  {
    id: 'card-lawyer',
    slug: 'lawyer',
    name: 'Advogada',
    category: 'Habeas Corpus',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.advogado,
    kind: 'Habeas Corpus',
    summary: 'Defesa contra eliminação e contra investigação.',
    imageSrc: '/images/cards/lawyer.png',
    previewSrc: '/images/previews/lawyer.webp',
    imageAlt: 'Carta Advogada de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/lawyer.webp',
    iconSrc: '/images/icons/lawyer.webp',
    rules: [
      {
        title: 'Bloqueio de Execução (defesa)',
        description: 'Bloqueie a Execução de C$ 3 quando você for o alvo.',
        type: 'defense'
      },
      {
        title: 'Bloqueio de Mandado (defesa)',
        description: 'Bloqueie o Mandado de Busca de C$ 5 quando você for o alvo.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'Não possui ação própria em seu turno; atua exclusivamente como defesa contra ataques direcionados.'
  },
  {
    id: 'card-baron',
    slug: 'baron',
    name: 'Barão',
    category: 'Finanças',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.barao,
    kind: 'Finanças',
    summary: 'Receita rápida e bloqueio de Vaquinha Virtual.',
    imageSrc: '/images/cards/baron.png',
    previewSrc: '/images/previews/baron.webp',
    imageAlt: 'Carta Barão de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/baron.webp',
    iconSrc: '/images/icons/baron.webp',
    rules: [
      {
        title: 'Caixa 2 (ação)',
        description: 'Receba C$ 3 do cofre central.',
        type: 'action'
      },
      {
        title: 'Bloqueio de Vaquinha Virtual (defesa)',
        description: 'Bloqueie a Vaquinha Virtual de qualquer adversário, impedindo que ele receba C$ 2.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'O bloqueio da Vaquinha pode ser declarado por qualquer adversário, não apenas pelo jogador seguinte.'
  },
  {
    id: 'card-marketer',
    slug: 'marketer',
    name: 'Marqueteira',
    category: 'Manipulação',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.marqueteiro,
    kind: 'Manipulação',
    summary: 'Troca de cartas no baralho e bloqueio de Extorsão.',
    imageSrc: '/images/cards/marketer.png',
    previewSrc: '/images/previews/marketer.webp',
    imageAlt: 'Carta Marqueteira de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/marketer.webp',
    iconSrc: '/images/icons/marketer.webp',
    rules: [
      {
        title: 'Troca de Cartas (ação)',
        description: 'Compre 2 cartas do baralho central. Junte-as aos seus apoios ativos, escolha duas para devolver ao baralho e reembaralhe-o.',
        type: 'action'
      },
      {
        title: 'Bloqueio de Extorsão (defesa)',
        description: 'Bloqueie a Extorsão do Coronel quando você for o alvo.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'Se possuir apenas um apoio ativo, compra 2 cartas, fica com 3 temporariamente e devolve 2, mantendo um apoio ativo.'
  },
  {
    id: 'card-investigator',
    slug: 'investigator',
    name: 'Investigador',
    category: 'Investigação',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.investigador,
    kind: 'Mandado de Busca',
    summary: 'Ataque focado por nome de personagem contra um rival.',
    imageSrc: '/images/cards/investigator.png',
    previewSrc: '/images/previews/investigator.webp',
    imageAlt: 'Carta Investigador de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/investigator.webp',
    iconSrc: '/images/icons/investigator.webp',
    rules: [
      {
        title: 'Mandado de Busca (ação)',
        description: 'Pague C$ 5 ao cofre, aponte um adversário vivo e nomeie um personagem. Após resolver a contestação e se não houver bloqueio válido, o alvo perde um apoio desse personagem, caso o possua em segredo. Se tiver duas cópias, perde apenas uma; se não tiver nenhuma, não perde apoio pelo Mandado.',
        type: 'action'
      }
    ],
    officialRuleNotice: 'Pode ser bloqueado pelo alvo se alegar Advogada ou Coronel. O custo de C$ 5 nunca é devolvido. Verifique os apoios que o alvo possui no momento do efeito, após eventuais reposições de cartas em desafios. O alvo não pode mentir sobre possuir o personagem procurado.'
  },
  {
    id: 'card-coordinator',
    slug: 'coordinator',
    name: 'Articuladora',
    category: 'Negociação',
    copies: '3 cópias',
    roleColor: ROLE_THEME_COLORS.articuladora,
    kind: 'Acordo de Bastidor',
    summary: 'Receba C$ 2 e favoreça outro jogador com C$ 1, ambos do cofre.',
    imageSrc: '/images/cards/coordinator.png',
    previewSrc: '/images/previews/coordinator.webp',
    imageAlt: 'Carta Articuladora de Bastidores do Poder: personagem oferecendo a mão para um acordo e resumo das habilidades',
    characterSrc: '/images/characters/coordinator.webp',
    iconSrc: '/images/icons/coordinator.webp',
    rules: [
      {
        title: 'Acordo de Bastidor (ação gratuita)',
        description: 'Escolha outro jogador vivo ao declarar a ação. Após resolver a contestação, receba C$ 2 do cofre; o escolhido recebe C$ 1 do cofre. Ele não precisa aceitar e também pode contestar.',
        type: 'action'
      },
      {
        title: 'Sem bloqueio',
        description: 'A Articuladora não bloqueia ações. O Acordo de Bastidor não pode ser bloqueado, mas pode ser contestado por qualquer adversário vivo.',
        type: 'passive'
      }
    ],
    officialRuleNotice: 'Distribua os Contos somente após resolver a contestação. Se a alegação não for comprovada, aplique a perda habitual de apoio e ninguém recebe moedas. Se o beneficiário for eliminado no desafio, cancele o acordo para ambos, sem escolher outro. Promessas não são obrigatórias. A ação não permite doações, empréstimos ou trocas de cartas entre jogadores; os dois pagamentos vêm do cofre. Com C$ 10 ou mais no início do turno, o Impeachment definitivo continua obrigatório.'
  },
  {
    id: 'card-guide',
    slug: 'guide',
    name: 'Guia de Mesa',
    category: 'Guia de mesa',
    copies: 'Fora do baralho',
    roleColor: ROLE_THEME_COLORS.ajuda,
    kind: 'Referência',
    summary: 'Carta de consulta rápida com resumo de todos os poderes e ações.',
    imageSrc: '/images/cards/guide.png',
    previewSrc: '/images/previews/guide.webp',
    imageAlt: 'Carta de ajuda com ícones, ações, bloqueios dos oito personagens e ações gerais',
    iconSrc: '/images/icons/guide.webp',
    rules: [
      {
        title: 'Distribuição',
        description: 'Cada jogador recebe 1 cópia da carta de ajuda no início da partida para manter à sua frente durante todo o jogo.',
        type: 'passive'
      }
    ],
    officialRuleNotice: 'Não entra no baralho de personagens nem pode ser perdida em desafios ou ataques.'
  }
] as const;

/**
 * Número de personagens no jogo.
 */
export const CARDS_LENGTH = ROLE_CARDS.filter((card) => card.slug !== 'guide').length;

/**
 * Número de cópias de cada personagem no baralho.
 */
export const SUPPORT_CARDS_PER_ROLE = 3;

/**
 * Número total de cartas no baralho de personagens.
 */
export const SUPPORT_CARDS_LENGTH = (CARDS_LENGTH * SUPPORT_CARDS_PER_ROLE);

/**
 * Estatísticas rápidas exibidas no banner principal (Masthead)
 */
export const GAME_META_STATS: readonly MetaStat[] = [
  { value: '3–8', label: 'jogadores' },
  { value: String(CARDS_LENGTH), label: 'personagens' },
  { value: String(SUPPORT_CARDS_LENGTH), label: 'cartas de apoio' },
  { value: 'C$', label: 'Conto · moeda do jogo' },
] as const;


/**
 * Ações gerais que qualquer jogador vivo pode realizar sem alegar personagem
 */
export const GENERAL_ACTIONS: readonly GeneralAction[] = [
  {
    name: 'Salário Oficial',
    cost: 'Grátis',
    effect: 'Receba C$ 1 do cofre central.',
    defense: 'Ninguém pode bloquear ou contestar.'
  },
  {
    name: 'Vaquinha Virtual',
    cost: 'Grátis',
    effect: 'Receba C$ 2 do cofre central.',
    defense: 'Qualquer adversário pode alegar Barão para bloquear gratuitamente.'
  },
  {
    name: 'Impeachment comum',
    cost: 'C$ 7',
    effect: 'Escolha um adversário vivo; ele perde um apoio à escolha dele.',
    defense: 'Somente o alvo pode alegar Intocável e pagar C$ 3 ao cofre para bloquear.',
    isAggressive: true
  },
  {
    name: 'Impeachment definitivo',
    cost: 'C$ 10',
    effect: 'Escolha um adversário vivo; ele perde um apoio à escolha dele.',
    defense: 'Ninguém. Não pode ser bloqueado nem contestado.',
    isAggressive: true
  }
] as const;

/**
 * Etapas da jogada (ordem do turno)
 */
export const TURN_STEPS: readonly TurnStep[] = [
  {
    stepNumber: 1,
    title: 'Declare a ação',
    description: 'Com C$ 10 ou mais no início do turno, declare obrigatoriamente Impeachment definitivo. Caso contrário, escolha uma ação. Informe o alvo quando houver, o beneficiário do Acordo de Bastidor e o personagem procurado no Mandado. Pague o custo. Alvos de ataque e roubo devem ser adversários vivos. Não é permitido mudar de alvo, beneficiário, ação ou palpite após a declaração.'
  },
  {
    stepNumber: 2,
    title: 'Resolva o desafio à ação',
    description: 'Se a ação exige personagem, qualquer adversário vivo pode contestar antes de qualquer efeito. Ações gerais não podem ser contestadas; as alegações usadas para bloqueá-las podem.',
    details: [
      'Alegação comprovada: o declarante mostra um apoio ativo do personagem; o contestador perde um apoio. Se a partida continuar, a carta comprovada volta ao baralho, é embaralhada e substituída por uma carta secreta. A ação segue para a etapa de bloqueio.',
      'Alegação não comprovada: o declarante perde um apoio à escolha dele; a ação é cancelada e o turno termina. Ele também pode optar por não comprovar, aceitando a penalidade.',
      'Sem contestação: avance normalmente. A carta permanece secreta.'
    ]
  },
  {
    stepNumber: 3,
    title: 'Declare um bloqueio permitido',
    description: 'Se existir defesa para a ação, o jogador autorizado pode alegá-la. O Intocável paga C$ 3 neste momento. As demais defesas são gratuitas. Se ninguém bloquear, avance ao efeito. Comprovar Executor, Coronel ou Investigador na etapa anterior não impede que a ação seja bloqueada agora.'
  },
  {
    stepNumber: 4,
    title: 'Resolva o desafio ao bloqueio',
    description: 'Qualquer outro jogador vivo, inclusive o autor da ação, pode contestar o bloqueio declarado.',
    details: [
      'Bloqueio comprovado: o contestador perde um apoio. Se a partida continuar, o defensor devolve a carta comprovada, embaralha e compra uma substituta. O bloqueio vale e a ação é cancelada.',
      'Bloqueio não comprovado: o defensor perde um apoio, o bloqueio é cancelado e a ação original continua se o alvo ainda estiver vivo e a partida não tiver terminado.',
      'Sem contestação: o bloqueio vale e a ação é cancelada, mesmo que tenha sido um blefe.'
    ]
  },
  {
    stepNumber: 5,
    title: 'Aplique o efeito e encerre o turno',
    description: 'Se a ação ainda estiver válida, receba ou transfira dinheiro, faça a troca ou aplique a perda de apoio. O próximo jogador vivo inicia o turno.'
  }
] as const;

/**
 * Regras estritas de desempate e disputa de ordem
 */
export const RESOLUTION_RULES: readonly string[] = [
  'Cada carta secreta de um jogador representa um apoio ativo. Ao perder um apoio, revele a carta escolhida e mantenha-a aberta e fora de jogo. Apoios perdidos não são usados para comprovar alegações nem voltam ao baralho. Quem perde todos os apoios é eliminado.',
  'Preparação padrão: use três cópias de cada um dos oito personagens, totalizando 24 cartas. Cada jogador recebe dois apoios secretos, C$ 2 e uma ajuda separada do baralho. Cartas repetidas na mão são permitidas.',
  'Blefe: é permitido alegar um personagem sem possuí-lo. Uma defesa exige declaração; possuir a carta não gera proteção automática. A alegação pode ser contestada conforme a ordem de resolução.',
  'Custos: é preciso ter saldo para declarar a ação ou a defesa. Pague ao cofre no momento da declaração; custos nunca são devolvidos.',
  'Beneficiário eliminado em desafio: o Acordo de Bastidor é cancelado para ambos, sem novo beneficiário e sem distribuição de Contos.',
  'Uma contestação por alegação: a ação pode ter um desafio e o bloqueio pode ter outro. Uma alegação já resolvida não é contestada novamente.',
  'Uma tentativa de bloqueio por ação: se for desmascarada, ninguém apresenta uma segunda defesa, nem mesmo usando outro personagem.',
  'Prioridade em sentido horário: comece pelo próximo jogador após quem declarou. O primeiro que aceitar usa a oportunidade. Depois que todos passam, a janela fecha.',
  'Sem voltar no tempo: não se contesta depois de resolvido o efeito; o Marqueteira só olha as novas cartas quando sua ação já foi validada.',
  'Alvo eliminado em desafio: o ataque ou roubo termina sem novo alvo e sem devolução de custo.',
  'Vitória imediata: ao restar apenas um jogador vivo, encerra-se a partida imediatamente sem resolver efeitos pendentes.'
] as const;

/**
 * Exemplos práticos de situações de mesa
 */
export const GAME_EXAMPLES: readonly GameExample[] = [
  {
    id: 'ex-1',
    title: 'Intocável + Advogada',
    description: 'Bruno tem essa dupla. Pode bloquear Executor gratuitamente com Advogada. Se Ana pagar C$ 7 pelo Impeachment comum, Bruno pode pagar C$ 3 com Intocável para bloquear. Mas se Ana pagar C$ 10 pelo Impeachment definitivo, Bruno é obrigado a perder um de seus apoios. A dupla é forte, mas não é imune.',
    highlight: 'A dupla é forte, mas não é imune.'
  },
  {
    id: 'ex-2',
    title: 'Intocável sem saldo',
    description: 'Bruno tem Intocável e apenas C$ 2. Ana paga C$ 7 pelo Impeachment comum. Bruno não pode declarar a defesa porque precisa de C$ 3 no momento do bloqueio. Ele escolhe um apoio e o perde.',
    highlight: 'Saldo insuficiente impede a declaração de bloqueio do Intocável.'
  },
  {
    id: 'ex-3',
    title: 'O Advogada era um blefe',
    description: 'Ana usa Execução contra Bruno, que tem dois apoios. Ele alega Advogada sem comprovar quando Ana contesta. Bruno perde um apoio no desafio; como continua vivo, a Execução prossegue e ele perde o segundo. Se tivesse apenas um apoio, seria eliminado no desafio e o ataque terminaria sem outra perda.',
    highlight: 'Uma defesa desmascarada não cancela o ataque original.'
  },
  {
    id: 'ex-4',
    title: 'Provar Executor não vence Advogada',
    description: 'Ana declara Executor. Um terceiro contesta. Ana prova a carta; o contestador perde um apoio. Como a partida continua, Ana repõe a carta comprovada. Em seguida, Bruno alega Advogada. A ação é bloqueada se ninguém contestar Bruno. Ana não recebe os C$ 3 de volta.',
    highlight: 'Provar o ataque na etapa 2 não anula o direito de bloqueio na etapa 3.'
  },
  {
    id: 'ex-5',
    title: 'Bloqueio falso do Intocável',
    description: 'Ana paga C$ 7 pelo Impeachment comum contra Bruno, que tem dois apoios. Bruno paga C$ 3 e blefa Intocável. Ana contesta e Bruno não comprova: perde um apoio pelo desafio e, como ainda está vivo, outro pelo ataque. Os dois pagamentos permanecem no cofre.',
    highlight: 'Com dois apoios, falhar nesse blefe pode causar a eliminação na mesma jogada.'
  },
  {
    id: 'ex-6',
    title: 'Caixa 2 contestado',
    description: 'Ana alega Barão para receber C$ 3. Bruno contesta. Se Ana comprovar, Bruno perde um apoio e, se a partida continuar, Ana repõe a carta comprovada e recebe C$ 3. Se Ana não comprovar, perde um apoio e não recebe Contos.',
    highlight: 'Caixa 2 não pode ser bloqueado; a alegação de Barão pode ser contestada.'
  },
  {
    id: 'ex-7',
    title: 'Mandado certo e Mandado errado',
    description: 'Ana paga C$ 5 e procura Advogada em Bruno. Após resolver a contestação e se não houver bloqueio válido de Advogada ou Coronel, verifique os apoios atuais de Bruno. Se ele tiver Advogada, revela e perde uma cópia, mesmo que possua duas. Se não tiver, não perde apoio pelo Mandado.',
    highlight: 'O custo é gasto mesmo se o palpite errar ou a ação for cancelada.'
  },
  {
    id: 'ex-8',
    title: 'Marqueteira com um apoio',
    description: 'Bruno perdeu uma carta e conserva apenas um apoio ativo. Usa Marqueteira: compra 2 cartas, fica com 3 na mão, escolhe duas para devolver ao baralho e mantém um apoio secreto ativo. A carta já perdida permanece aberta na mesa.',
    highlight: 'A troca permite reorganizar a estratégia mesmo à beira da eliminação.'
  },
  {
    id: 'ex-9',
    title: 'Começou com exatamente C$ 10',
    description: 'Ana inicia o turno com C$ 10. Deve pagar os C$ 10 pelo Impeachment definitivo. Não pode escolher Caixa 2, Execução, troca, Mandado, Acordo de Bastidor ou Impeachment comum. O alvo escolhe um apoio e o perde, mesmo que tenha Intocável.',
    highlight: 'Com C$ 10 ou mais no início do turno, o Impeachment definitivo é compulsório.'
  },
  {
    id: 'ex-10',
    title: 'Acordo sem obrigação de aliança',
    description: 'Ana alega Articuladora e escolhe Bruno. Sem contestação, Ana recebe C$ 2 e Bruno recebe C$ 1, ambos do cofre. Bruno não precisa aceitar nem cumprir promessas de proteção.',
    highlight: 'O acordo distribui Contos do cofre; não transfere dinheiro entre jogadores.'
  },
  {
    id: 'ex-11',
    title: 'Acordo contestado',
    description: 'Ana alega Articuladora e escolhe Bruno. Carla contesta. Se Ana não comprovar, perde um apoio e ninguém recebe Contos. Se comprovar, Carla perde um apoio; se a partida continuar e Bruno estiver vivo, Ana repõe a carta e o acordo paga C$ 2 para Ana e C$ 1 para Bruno.',
    highlight: 'Resolva a contestação antes de distribuir os Contos.'
  },
  {
    id: 'ex-12',
    title: 'Beneficiário eliminado no desafio',
    description: 'Bruno tem um apoio, é escolhido no acordo e contesta Ana. Ela comprova Articuladora e Bruno perde o último apoio. O acordo é cancelado para ambos, sem escolher outro beneficiário. Se restar apenas um jogador vivo, a partida termina imediatamente.',
    highlight: 'Se o beneficiário for eliminado, ninguém recebe Contos pelo acordo.'
  }
] as const;

/**
 * Tabela de consulta rápida: O que bloqueia o quê?
 */
export const QUICK_REFERENCE_DATA: readonly QuickReferenceRow[] = [
  {
    action: 'Acordo de Bastidor (Articuladora)',
    allowedBlock: 'Nenhum',
    defender: '—',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Salário Oficial',
    allowedBlock: 'Nenhum',
    defender: '—',
    canChallengeAction: 'Não'
  },
  {
    action: 'Vaquinha Virtual',
    allowedBlock: 'Barão',
    defender: 'Qualquer adversário vivo',
    canChallengeAction: 'Não'
  },
  {
    action: 'Impeachment comum (C$ 7)',
    allowedBlock: 'Intocável (paga C$ 3)',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Não'
  },
  {
    action: 'Impeachment definitivo (C$ 10)',
    allowedBlock: 'Nenhum (inviolável)',
    defender: '—',
    canChallengeAction: 'Não'
  },
  {
    action: 'Caixa 2 (Barão)',
    allowedBlock: 'Nenhum',
    defender: '—',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Extorsão (Coronel)',
    allowedBlock: 'Coronel ou Marqueteira',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Execução (Executor - C$ 3)',
    allowedBlock: 'Advogada',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Troca de Cartas (Marqueteira)',
    allowedBlock: 'Nenhum',
    defender: '—',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Mandado de Busca (Investigador - C$ 5)',
    allowedBlock: 'Advogada ou Coronel',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Sim'
  }
] as const;

/**
 * Legenda de ícones dos personagens
 */
export const ICON_LEGEND_ITEMS: readonly IconLegendItem[] = [
  {
    role: 'Articuladora',
    iconName: 'Aperto de mãos',
    roleColor: ROLE_THEME_COLORS.articuladora,
    iconSrc: '/images/icons/coordinator.webp'
  },
  {
    role: 'Coronel',
    iconName: 'Mão e moedas',
    roleColor: ROLE_THEME_COLORS.coronel,
    iconSrc: '/images/icons/colonel.webp'
  },
  {
    role: 'Executor',
    iconName: 'Adaga e documento',
    roleColor: ROLE_THEME_COLORS.executor,
    iconSrc: '/images/icons/executor.webp'
  },
  {
    role: 'Intocável',
    iconName: 'Coluna e escudo',
    roleColor: ROLE_THEME_COLORS.intocavel,
    iconSrc: '/images/icons/untouchable.webp'
  },
  {
    role: 'Advogada',
    iconName: 'Balança e escudo',
    roleColor: ROLE_THEME_COLORS.advogado,
    iconSrc: '/images/icons/lawyer.webp'
  },
  {
    role: 'Barão',
    iconName: 'Cofre e moedas',
    roleColor: ROLE_THEME_COLORS.barao,
    iconSrc: '/images/icons/baron.webp'
  },
  {
    role: 'Marqueteira',
    iconName: 'Cartas e setas',
    roleColor: ROLE_THEME_COLORS.marqueteiro,
    iconSrc: '/images/icons/marketer.webp'
  },
  {
    role: 'Investigador',
    iconName: 'Pasta e lupa',
    roleColor: ROLE_THEME_COLORS.investigador,
    iconSrc: '/images/icons/investigator.webp'
  },
  {
    role: 'Guia de Mesa',
    iconName: 'Livro de consulta',
    roleColor: ROLE_THEME_COLORS.ajuda,
    iconSrc: '/images/icons/guide.webp'
  }
] as const;

/**
 * Tabela de preparação por número de jogadores
 */
export const SETUP_PLAYERS_TABLE: readonly PlayerSetupCount[] = [
  { players: 3, cardsPerRole: SUPPORT_CARDS_PER_ROLE, totalDeckCards: SUPPORT_CARDS_LENGTH, initialCoins: 2 },
  { players: 4, cardsPerRole: SUPPORT_CARDS_PER_ROLE, totalDeckCards: SUPPORT_CARDS_LENGTH, initialCoins: 2 },
  { players: 5, cardsPerRole: SUPPORT_CARDS_PER_ROLE, totalDeckCards: SUPPORT_CARDS_LENGTH, initialCoins: 2 },
  { players: 6, cardsPerRole: SUPPORT_CARDS_PER_ROLE, totalDeckCards: SUPPORT_CARDS_LENGTH, initialCoins: 2 },
  { players: 7, cardsPerRole: SUPPORT_CARDS_PER_ROLE, totalDeckCards: SUPPORT_CARDS_LENGTH, initialCoins: 2 },
  { players: 8, cardsPerRole: SUPPORT_CARDS_PER_ROLE, totalDeckCards: SUPPORT_CARDS_LENGTH, initialCoins: 2 },
] as const;

/**
 * Moedas oficiais do jogo (Contos)
 */
export const GAME_COINS: readonly GameCoin[] = [
  {
    id: 'coin-bronze',
    slug: 'bronze',
    name: 'Conto de Bronze',
    value: 1,
    label: 'C$ 1',
    material: 'Bronze',
    color: '#d39071',
    summary: 'Moeda básica de arrecadação oficial e saldo inicial.',
    description: 'A unidade elementar da economia do poder. Utilizada no Salário Oficial (C$ 1) e distribuída no início de cada partida (C$ 2 por jogador).',
    usage: 'Salário Oficial (+C$ 1), saldo inicial de jogadores (+C$ 2), e trocas fracionadas no cofre.',
    imageSrc: '/images/coins/bronze.webp',
    imageAlt: 'Moeda Conto de Bronze C$ 1 de Bastidores do Poder'
  },
  {
    id: 'coin-silver',
    slug: 'silver',
    name: 'Conto de Prata',
    value: 5,
    label: 'C$ 5',
    material: 'Prata',
    color: '#a8c2d1',
    summary: 'Moeda de influência tática, subornos e taxa judicial.',
    description: 'Moeda de peso intermediário nos corredores de Brasília. Cobre exatamente a taxa judicial do Mandado de Busca do Investigador.',
    usage: 'Taxa judicial do Mandado de Busca (C$ 5) e consolidação de trocas no cofre.',
    imageSrc: '/images/coins/silver.webp',
    imageAlt: 'Moeda Conto de Prata C$ 5 de Bastidores do Poder'
  },
  {
    id: 'coin-gold',
    slug: 'gold',
    name: 'Conto de Ouro',
    value: 10,
    label: 'C$ 10',
    material: 'Ouro',
    color: '#e6bf73',
    summary: 'Moeda de hegemonia máxima e Impeachment compulsório.',
    description: 'A moeda mais temida e cobiçada do jogo. Iniciar o turno com C$ 10 obriga a execução do Impeachment definitivo, um golpe irreversível e sem defesa.',
    usage: 'Impeachment definitivo compulsório (C$ 10), garantia de eliminação direta de rivais.',
    imageSrc: '/images/coins/gold.webp',
    imageAlt: 'Moeda Conto de Ouro C$ 10 de Bastidores do Poder'
  }
] as const;
