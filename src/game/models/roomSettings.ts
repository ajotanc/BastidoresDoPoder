import { DEFAULT_GAME_SETTINGS, type GameSettings } from './gameState';

export interface RoomTimingInput { actionSeconds?: number | string; responseSeconds?: number | string }
export const MAX_ROOM_SECONDS = 3600;

export function resolveRoomSettings(input: RoomTimingInput = {}): GameSettings {
  const resolve = (value: number | string | undefined, fallback: number) => {
    if (value === undefined || (typeof value === 'string' && !value.trim())) return fallback;
    const seconds = Number(value);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_ROOM_SECONDS) {
      throw new Error(`Informe um tempo inteiro entre 1 e ${MAX_ROOM_SECONDS} segundos, ou deixe em branco para usar o padrão.`);
    }
    return seconds * 1000;
  };
  const response = resolve(input.responseSeconds, DEFAULT_GAME_SETTINGS.reactionTimeoutMs);
  return { ...DEFAULT_GAME_SETTINGS, actionTimeoutMs: resolve(input.actionSeconds, DEFAULT_GAME_SETTINGS.actionTimeoutMs), reactionTimeoutMs: response, challengeTimeoutMs: response, choiceTimeoutMs: response };
}
