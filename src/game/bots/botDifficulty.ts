import { BOT_STRATEGY } from '@/constants/gameConfig';

export type BotDifficulty = 'easy' | 'intermediate' | 'hard';
export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = 'intermediate';
export const BOT_DIFFICULTIES = [
  { value: 'easy', label: 'Fácil', description: 'Para conhecer a mesa. Menos leitura dos rivais e decisões mais imprecisas.' },
  { value: 'intermediate', label: 'Intermediário', description: 'Equilíbrio entre cautela e blefe. Observa ameaças e as últimas jogadas.' },
  { value: 'hard', label: 'Difícil', description: 'Analisa o histórico disponível, calcula riscos e prepara as próximas ações.' },
] as const;

export const BOT_DIFFICULTY_PROFILES = {
  easy: { ...BOT_STRATEGY, decisionVariation: 3, bluffWillingness: 0.3, riskTolerance: 1.2, historyDepth: 0, threatWeight: 0.3, planningWeight: 0 },
  intermediate: { ...BOT_STRATEGY, historyDepth: 12, threatWeight: 1, planningWeight: 0 },
  hard: { ...BOT_STRATEGY, decisionVariation: 0.05, historyDepth: 50, threatWeight: 1.3, planningWeight: 1 },
} satisfies Record<BotDifficulty, object>;
