import type { GameState } from '../models/gameState';
import { decisionPlayerId } from './botStrategy';
import { BOT_DECISION_DELAY_MS } from '@/constants/gameConfig';
import dayjs from 'dayjs';

/** Think for 20–100% of the configured maximum, leaving time before the deadline. */
export function getBotDecisionDelay(maximumMs: number, remainingMs = Infinity, random = Math.random): number {
  const maximum = Math.max(0, maximumMs);
  const sampled = maximum * (0.2 + 0.8 * random());
  return Math.floor(Math.max(0, Math.min(sampled, maximum, remainingMs * 0.8)));
}

/** One delayed decision at a time; the host re-reads the state before executing. */
export class BotController {
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private readonly act: (playerId: string) => void) {}

  update(state: GameState): void {
    this.stop();
    const id = decisionPlayerId(state);
    if (!id || !state.players[id]?.isBot || !state.players[id]?.isAlive) return;
    const remaining = state.deadlineAt === null ? Infinity : state.deadlineAt - dayjs().valueOf();
    const delay = getBotDecisionDelay(BOT_DECISION_DELAY_MS, remaining);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.act(id);
    }, delay);
  }

  stop(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
