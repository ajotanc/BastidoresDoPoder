import { BOT_DIFFICULTIES, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from '@/game/bots/botDifficulty';

const STORAGE_KEY = 'bdp-bot-difficulty';
const ENABLED_STORAGE_KEY = 'bdp-bots-enabled';

export function loadBotsEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveBotsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    // A preferência continua válida nesta tela quando o armazenamento está indisponível.
  }
}

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
