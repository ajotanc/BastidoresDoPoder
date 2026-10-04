import { BOT_STRATEGY } from '@/constants/gameConfig';

export type BotDifficulty = 'easy' | 'intermediate' | 'hard' | 'pro';
export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = 'intermediate';
export const BOT_DIFFICULTIES = [
  { value: 'easy', label: 'Fácil', description: 'Para conhecer a mesa. Menos leitura dos rivais e decisões mais imprecisas.' },
  { value: 'intermediate', label: 'Intermediário', description: 'Equilíbrio entre cautela e blefe. Observa ameaças e as últimas jogadas.' },
  { value: 'hard', label: 'Difícil', description: 'Analisa o histórico disponível, calcula riscos e prepara as próximas ações.' },
  { value: 'pro', label: 'Pro', description: 'Antecipa retaliações, protege a reserva de defesa e calcula o risco de cada blefe.' },
] as const;

export const BOT_DIFFICULTY_TAG_CLASSES: Record<BotDifficulty, string> = {
  easy: 'border-status-green/30 bg-status-green/10 text-status-green',
  intermediate: 'border-gold/25 bg-gold/10 text-gold',
  hard: 'border-status-red/30 bg-status-red/10 text-status-red',
  pro: 'border-violet-300/30 bg-violet-300/10 text-violet-300',
};

export const BOT_DIFFICULTY_PROFILES = {
  easy: { ...BOT_STRATEGY, challengeBase: 0.12, challengeEvidence: 0, honestyEvidence: 0, bluffScrutiny: 1, bluffPenalty: 1, decisionVariation: 3, bluffWillingness: 0.3, riskTolerance: 1.2, historyDepth: 0, threatWeight: 0.3, planningWeight: 0, retaliationWeight: 0 },
  intermediate: { ...BOT_STRATEGY, challengeBase: 0.12, challengeEvidence: 0, honestyEvidence: 0, bluffScrutiny: 1, bluffPenalty: 1, historyDepth: 12, threatWeight: 1, planningWeight: 0, retaliationWeight: 0 },
  hard: { ...BOT_STRATEGY, challengeBase: 0.3, challengeEvidence: 0, honestyEvidence: 0, bluffScrutiny: 1, bluffPenalty: 2, decisionVariation: 0.05, historyDepth: 50, threatWeight: 1.3, planningWeight: 0.5, retaliationWeight: 0 },
  pro: { ...BOT_STRATEGY, challengeBase: 0.55, challengeEvidence: 12, honestyEvidence: 12, bluffScrutiny: 2, bluffPenalty: 5, decisionVariation: 0.02, bluffWillingness: 0.55, riskTolerance: 0.85, historyDepth: 50, threatWeight: 1.4, planningWeight: 0.5, retaliationWeight: 1 },
} satisfies Record<BotDifficulty, object>;
