import type {
  RoleCard,
  MetaStat,
  NavigationItem,
  GeneralAction,
  TurnStep,
  GameExample,
  QuickReferenceRow,
  IconLegendItem,
  PlayerSetupCount
} from '@/types/game';

/**
 * Estatísticas rápidas exibidas no banner principal (Masthead)
 */
export const GAME_META_STATS: readonly MetaStat[] = [
  { value: '3–8', label: 'jogadores' },
  { value: '7', label: 'personagens' },
  { value: '21', label: 'cartas de influência' },
  { value: 'C$', label: 'Conto · moeda do jogo' },
] as const;

/**
 * Navegação rápida do manual
 */
export const NAVIGATION_SECTIONS: readonly NavigationItem[] = [
  { id: 'manual', label: 'Home' },
  { id: 'objetivo', label: 'O jogo' },
  { id: 'personagens', label: 'Cartas' },
  { id: 'preparacao', label: 'Preparação' },
  { id: 'acoes', label: 'Ações' },
  { id: 'resolucao', label: 'Resolução' },
  { id: 'investigacao', label: 'Investigação' },
  { id: 'exemplos', label: 'Exemplos' },
  { id: 'consulta', label: 'Consulta' },
] as const;

/**
 * Definição completa dos 7 personagens e da carta de ajuda
 */
export const ROLE_CARDS: readonly RoleCard[] = [
  {
    id: 'card-colonel',
    slug: 'colonel',
    name: 'Coronel',
    category: 'Pressão',
    copies: '3 cópias',
    roleColor: '#d39071',
    kind: 'Extorsão',
    summary: 'Ataque econômico com bloqueio próprio e defesa contra Investigador.',
    imageSrc: '/images/cards/colonel.png',
    imageAlt: 'Carta Coronel de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/colonel.png',
    iconSrc: '/images/icons/colonel.svg',
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
    officialRuleNotice: 'O Coronel bloqueia o próprio ataque (Extorsão) e também a investigação alheia.'
  },
  {
    id: 'card-executor',
    slug: 'executor',
    name: 'Executor',
    category: 'Eliminação',
    copies: '3 cópias',
    roleColor: '#bf9955',
    kind: 'Eliminação',
    summary: 'Eliminação rápida com custo moderado, bloqueável por Advogado.',
    imageSrc: '/images/cards/executor.png',
    imageAlt: 'Carta Executor de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/executor.png',
    iconSrc: '/images/icons/executor.svg',
    rules: [
      {
        title: 'Execução (ação)',
        description: 'Pague C$ 3 ao cofre e escolha um adversário vivo. Se não houver contestação nem bloqueio, ele perde uma influência à escolha dele.',
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
    roleColor: '#6ba292',
    kind: 'Blindagem',
    summary: 'Defesa paga contra Impeachment comum. Não protege do definitivo.',
    imageSrc: '/images/cards/untouchable.png',
    imageAlt: 'Carta Intocável de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/untouchable.png',
    iconSrc: '/images/icons/untouchable.svg',
    rules: [
      {
        title: 'Bloqueio de Impeachment comum (defesa)',
        description: 'Quando você for o alvo de um Impeachment comum de C$ 7, pague C$ 3 ao cofre para cancelar o ataque.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'Requer saldo prévio de C$ 3 para declarar a defesa. O valor vai para o cofre e nunca retorna.'
  },
  {
    id: 'card-lawyer',
    slug: 'lawyer',
    name: 'Advogado',
    category: 'Habeas Corpus',
    copies: '3 cópias',
    roleColor: '#c4ac7b',
    kind: 'Habeas Corpus',
    summary: 'Defesa contra eliminação e contra investigação.',
    imageSrc: '/images/cards/lawyer.png',
    imageAlt: 'Carta Advogado de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/lawyer.png',
    iconSrc: '/images/icons/lawyer.svg',
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
    roleColor: '#e5a93c',
    kind: 'Finanças',
    summary: 'Receita rápida e bloqueio de Vaquinha Virtual.',
    imageSrc: '/images/cards/baron.png',
    imageAlt: 'Carta Barão de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/baron.png',
    iconSrc: '/images/icons/baron.svg',
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
    name: 'Marqueteiro',
    category: 'Manipulação',
    copies: '3 cópias',
    roleColor: '#c67b93',
    kind: 'Manipulação',
    summary: 'Troca de cartas no baralho e bloqueio de Extorsão.',
    imageSrc: '/images/cards/marketer.png',
    imageAlt: 'Carta Marqueteiro de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/marketer.png',
    iconSrc: '/images/icons/marketer.svg',
    rules: [
      {
        title: 'Troca de Cartas (ação)',
        description: 'Compre 2 cartas do baralho central. Junte-as às suas influências vivas, escolha duas para devolver ao baralho e reembaralhe-o.',
        type: 'action'
      },
      {
        title: 'Bloqueio de Extorsão (defesa)',
        description: 'Bloqueie a Extorsão do Coronel quando você for o alvo.',
        type: 'defense'
      }
    ],
    officialRuleNotice: 'Se possuir apenas uma influência viva, compra 2 cartas, fica com 3 temporariamente e devolve 2, mantendo uma viva.'
  },
  {
    id: 'card-investigator',
    slug: 'investigator',
    name: 'Investigador',
    category: 'Investigação',
    copies: '3 cópias',
    roleColor: '#7ba0c0',
    kind: 'Mandado de Busca',
    summary: 'Ataque focado por nome de personagem contra um rival.',
    imageSrc: '/images/cards/investigator.png',
    imageAlt: 'Carta Investigador de Bastidores do Poder: ilustração do personagem e resumo das habilidades',
    characterSrc: '/images/characters/investigator.png',
    iconSrc: '/images/icons/investigator.svg',
    rules: [
      {
        title: 'Mandado de Busca (ação)',
        description: 'Pague C$ 5, aponte um adversário vivo e nomeie um personagem. Se o alvo possuir essa carta em segredo, deve revelá-la e perdê-la.',
        type: 'action'
      }
    ],
    officialRuleNotice: 'Pode ser bloqueado pelo alvo se alegar Advogado ou Coronel. O custo de C$ 5 é gasto mesmo se o palpite errar.'
  },
  {
    id: 'card-guide',
    slug: 'guide',
    name: 'Guia de Mesa',
    category: 'Guia de mesa',
    copies: 'Fora do baralho',
    roleColor: '#e4c682',
    kind: 'Referência',
    summary: 'Carta de consulta rápida com resumo de todos os poderes e ações.',
    imageSrc: '/images/cards/guide.png',
    imageAlt: 'Carta de ajuda com ícones, ações, bloqueios dos sete personagens e ações gerais',
    iconSrc: '/images/icons/guide.webp',
    rules: [
      {
        title: 'Distribuição',
        description: 'Cada jogador recebe 1 cópia da carta de ajuda no início da partida para manter à sua frente durante todo o jogo.',
        type: 'passive'
      }
    ],
    officialRuleNotice: 'Não entra no baralho de influências nem pode ser perdida em desafios ou ataques.'
  }
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
    effect: 'Escolha um adversário vivo; ele perde uma influência à escolha dele.',
    defense: 'Somente o alvo pode alegar Intocável e pagar C$ 3 ao cofre para bloquear.',
    isAggressive: true
  },
  {
    name: 'Impeachment definitivo',
    cost: 'C$ 10',
    effect: 'Escolha um adversário vivo; ele perde uma influência à escolha dele.',
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
    description: 'Informe a ação, o alvo quando houver e o personagem procurado no Mandado. Pague o custo. Alvos de ataque e roubo devem ser adversários vivos. Não é permitido mudar de alvo, ação ou palpite após a declaração.'
  },
  {
    stepNumber: 2,
    title: 'Resolva o desafio à ação',
    description: 'Se a ação exige personagem, os adversários podem contestar antes de qualquer efeito.',
    details: [
      'Alegação comprovada: o declarante mostra uma influência viva do personagem; o contestador perde uma influência. Se a partida continuar, a carta comprovada volta ao baralho, é embaralhada e substituída por uma carta secreta. A ação segue para a etapa de bloqueio.',
      'Alegação não comprovada: o declarante perde uma influência à escolha dele; a ação é cancelada e o turno termina. Ele também pode optar por não comprovar, aceitando a penalidade.',
      'Sem contestação: avance normalmente. A carta permanece secreta.'
    ]
  },
  {
    stepNumber: 3,
    title: 'Declare um bloqueio permitido',
    description: 'Se existir defesa para a ação, o jogador autorizado pode alegá-la. O Intocável paga C$ 3 neste momento. As demais defesas são gratuitas. Se ninguém bloquear, avance ao efeito. Comprovar Executor, Coronel ou Barão na etapa anterior não impede que a ação seja bloqueada agora.'
  },
  {
    stepNumber: 4,
    title: 'Resolva o desafio ao bloqueio',
    description: 'Qualquer outro jogador vivo, inclusive o autor da ação, pode contestar o bloqueio declarado.',
    details: [
      'Bloqueio comprovado: o contestador perde uma influência. O defensor devolve a carta comprovada, embaralha e compra uma substituta. O bloqueio vale e a ação é cancelada.',
      'Bloqueio não comprovado: o defensor perde uma influência, o bloqueio é cancelado e a ação original continua.',
      'Sem contestação: o bloqueio vale e a ação é cancelada, mesmo que tenha sido um blefe.'
    ]
  },
  {
    stepNumber: 5,
    title: 'Aplique o efeito e encerre o turno',
    description: 'Se a ação ainda estiver válida, receba ou transfira dinheiro, faça a troca ou aplique a perda de influência. O próximo jogador vivo inicia o turno.'
  }
] as const;

/**
 * Regras estritas de desempate e disputa de ordem
 */
export const RESOLUTION_RULES: readonly string[] = [
  'Uma contestação por alegação: a ação pode ter um desafio e o bloqueio pode ter outro. Uma alegação já resolvida não é contestada novamente.',
  'Uma tentativa de bloqueio por ação: se for desmascarada, ninguém apresenta uma segunda defesa, nem mesmo usando outro personagem.',
  'Prioridade em sentido horário: comece pelo próximo jogador após quem declarou. O primeiro que aceitar usa a oportunidade. Depois que todos passam, a janela fecha.',
  'Sem voltar no tempo: não se contesta depois de resolvido o efeito; o Marqueteiro só olha as novas cartas quando sua ação já foi validada.',
  'Alvo eliminado em desafio: o ataque ou roubo termina sem novo alvo e sem devolução de custo.',
  'Vitória imediata: ao restar apenas um jogador vivo, encerra-se a partida imediatamente sem resolver efeitos pendentes.'
] as const;

/**
 * Exemplos práticos de situações de mesa
 */
export const GAME_EXAMPLES: readonly GameExample[] = [
  {
    id: 'ex-1',
    title: 'Intocável + Advogado',
    description: 'Bruno tem essa dupla. Pode bloquear Executor gratuitamente com Advogado. Se Ana pagar C$ 7 pelo Impeachment comum, Bruno pode pagar C$ 3 com Intocável para bloquear. Mas se Ana pagar C$ 10 pelo Impeachment definitivo, Bruno é obrigado a perder uma de suas influências. A dupla é forte, mas não é imune.',
    highlight: 'A dupla é forte, mas não é imune.'
  },
  {
    id: 'ex-2',
    title: 'Intocável sem saldo',
    description: 'Bruno tem Intocável e apenas C$ 2. Ana paga C$ 7 pelo Impeachment comum. Bruno não pode declarar a defesa porque precisa de C$ 3 no momento do bloqueio. Ele escolhe uma influência e a perde.',
    highlight: 'Saldo insuficiente impede a declaração de bloqueio do Intocável.'
  },
  {
    id: 'ex-3',
    title: 'O Advogado era um blefe',
    description: 'Ana usa Executor contra Bruno. Ele alega Advogado para se defender sem tê-lo. Ana contesta. Bruno não comprova: perde a influência no desafio e o ataque termina ali.',
    highlight: 'Desafio ao bloqueio elimina o blefe defensivo.'
  },
  {
    id: 'ex-4',
    title: 'Provar Executor não vence Advogado',
    description: 'Ana declara Executor. Um terceiro contesta. Ana prova a carta; o contestador perde influência. Em seguida, Bruno alega Advogado. A ação é bloqueada se ninguém contestar Bruno. Ana não recebe os C$ 3 de volta.',
    highlight: 'Provar o ataque na etapa 2 não anula o direito de bloqueio na etapa 3.'
  },
  {
    id: 'ex-5',
    title: 'Bloqueio falso do Intocável',
    description: 'Ana paga C$ 7 para atacar Bruno com Impeachment. Bruno paga C$ 3 e blefa Intocável. Ana contesta. Bruno perde uma influência pelo blefe e depois perde outra influência pelo ataque de Ana que seguiu válido. Os dois pagamentos permanecem no cofre.',
    highlight: 'Cuidado extremo: blefar o Intocável e falhar resulta na perda de duas cartas!'
  },
  {
    id: 'ex-6',
    title: 'Caixa 2 bloqueado',
    description: 'Ana alega Barão para receber C$ 3. Bruno bloqueia alegando que não se pode bloquear Caixa 2 (regra incorreta: Caixa 2 não tem bloqueio, tem contestação). Ana esclarece ou contesta e garante os C$ 3, desde que a partida continuasse.',
    highlight: 'Caixa 2 não possui bloqueio — apenas contestação direta.'
  },
  {
    id: 'ex-7',
    title: 'Mandado certo e Mandado errado',
    description: 'Ana paga C$ 5 e procura Advogado em Bruno. Se Bruno tem a carta, perde-a. Se não tem, nada acontece. O dinheiro de Ana é gasto nos dois casos.',
    highlight: 'O custo do Mandado de Busca nunca é estornado.'
  },
  {
    id: 'ex-8',
    title: 'Marqueteiro com uma influência',
    description: 'Bruno perdeu uma carta e conserva apenas uma influência viva. Usa Marqueteiro: compra 2 cartas, fica com 3 na mão, escolhe duas para devolver ao baralho e mantém uma secreta viva. A carta já perdida permanece aberta na mesa.',
    highlight: 'A troca permite reorganizar a estratégia mesmo à beira da eliminação.'
  },
  {
    id: 'ex-9',
    title: 'Começou com exatamente C$ 10',
    description: 'Ana inicia o turno com C$ 10. Deve pagar os C$ 10 pelo Impeachment definitivo. Não pode escolher Caixa 2, Executor, troca, Mandado ou Impeachment comum. O alvo escolhe uma influência e a perde, mesmo que tenha Intocável.',
    highlight: 'Com C$ 10 ou mais no início do turno, o Impeachment definitivo é compulsório.'
  }
] as const;

/**
 * Tabela de consulta rápida: O que bloqueia o quê?
 */
export const QUICK_REFERENCE_DATA: readonly QuickReferenceRow[] = [
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
    allowedBlock: 'Coronel ou Marqueteiro',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Execução (Executor - C$ 3)',
    allowedBlock: 'Advogado',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Troca de Cartas (Marqueteiro)',
    allowedBlock: 'Nenhum',
    defender: '—',
    canChallengeAction: 'Sim'
  },
  {
    action: 'Mandado de Busca (Investigador - C$ 5)',
    allowedBlock: 'Advogado ou Coronel',
    defender: 'Somente o alvo atacado',
    canChallengeAction: 'Sim'
  }
] as const;

/**
 * Legenda de ícones dos personagens
 */
export const ICON_LEGEND_ITEMS: readonly IconLegendItem[] = [
  {
    role: 'Coronel',
    iconName: 'Moedas e Pressão',
    roleColor: '#d39071',
    iconSrc: '/images/icons/colonel.svg'
  },
  {
    role: 'Executor',
    iconName: 'Alvo e Eliminação',
    roleColor: '#bf9955',
    iconSrc: '/images/icons/executor.svg'
  },
  {
    role: 'Intocável',
    iconName: 'Escudo e Blindagem',
    roleColor: '#6ba292',
    iconSrc: '/images/icons/untouchable.svg'
  },
  {
    role: 'Advogado',
    iconName: 'Balança da Justiça',
    roleColor: '#c4ac7b',
    iconSrc: '/images/icons/lawyer.svg'
  },
  {
    role: 'Barão',
    iconName: 'Coroa e Finanças',
    roleColor: '#e5a93c',
    iconSrc: '/images/icons/baron.svg'
  },
  {
    role: 'Marqueteiro',
    iconName: 'Megafone e Mídia',
    roleColor: '#c67b93',
    iconSrc: '/images/icons/marketer.svg'
  },
  {
    role: 'Investigador',
    iconName: 'Lupa e Mandado',
    roleColor: '#7ba0c0',
    iconSrc: '/images/icons/investigator.svg'
  },
  {
    role: 'Guia de Mesa',
    iconName: 'Referência',
    roleColor: '#e4c682',
    iconSrc: '/images/icons/guide.webp'
  }
] as const;

/**
 * Tabela de preparação por número de jogadores
 */
export const SETUP_PLAYERS_TABLE: readonly PlayerSetupCount[] = [
  { players: 3, cardsPerRole: 3, totalDeckCards: 21, initialCoins: 2 },
  { players: 4, cardsPerRole: 3, totalDeckCards: 21, initialCoins: 2 },
  { players: 5, cardsPerRole: 3, totalDeckCards: 21, initialCoins: 2 },
  { players: 6, cardsPerRole: 3, totalDeckCards: 21, initialCoins: 2 },
  { players: 7, cardsPerRole: 3, totalDeckCards: 21, initialCoins: 2 },
  { players: 8, cardsPerRole: 3, totalDeckCards: 21, initialCoins: 2 },
] as const;
