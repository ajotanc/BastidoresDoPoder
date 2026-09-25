/**
 * Paleta de cores oficial do jogo Bastidores do Poder.
 * Extraída do manual original para garantir consistência visual e reuso.
 */

export const THEME_COLORS = {
  paper: '#0b1219',
  surface: '#131d27',
  surfaceElevated: '#17232e',
  surfaceHover: '#1e2c38',
  ink: '#eee9dd',
  muted: '#adb5bb',
  subtle: '#8a9298',
  line: '#2b3540',
  lineGold: '#514733',
  gold: '#e6bf73',
  goldLight: '#f5dcad',
  goldMuted: '#ad9873',
  goldDark: '#8d784f',
  statusGreen: '#94c7b2',
  statusGreenBg: '#152b28',
  statusRed: '#eaa3a0',
  statusRedBg: '#2d2028',
} as const;

export const ROLE_THEME_COLORS = {
  colonel: '#d39071',
  executor: '#bf9955',
  untouchable: '#6ba292',
  lawyer: '#c4ac7b',
  baron: '#e5a93c',
  marketer: '#c67b93',
  investigator: '#7ba0c0',
  coordinator: '#c9b77e',
  guide: '#e4c682',
  // Aliases em português para compatibilidade
  coronel: '#d39071',
  intocavel: '#6ba292',
  advogado: '#c4ac7b',
  barao: '#e5a93c',
  marqueteiro: '#c67b93',
  investigador: '#7ba0c0',
  articuladora: '#c9b77e',
  ajuda: '#e4c682',
} as const;
