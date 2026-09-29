import { BOT_DIFFICULTIES, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from '@/game/bots/botDifficulty';

const STORAGE_KEY = 'bdp-bot-difficulty';

export function loadBotDifficulty(): BotDifficulty {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return BOT_DIFFICULTIES.find(level => level.value === stored)?.value ?? DEFAULT_BOT_DIFFICULTY;
  } catch {
    return DEFAULT_BOT_DIFFICULTY;
  }
}

export function saveBotDifficulty(difficulty: BotDifficulty): void {
  try {
    localStorage.setItem(STORAGE_KEY, difficulty);
  } catch {
    // A preferência continua válida nesta tela quando o armazenamento está indisponível.
  }
}
