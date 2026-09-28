import type { GameState } from '../models/gameState';
import { decisionPlayerId } from './botStrategy';
import { BOT_DECISION_DELAY_MS } from '@/constants/gameConfig';

/** One delayed decision at a time; the host re-reads the state before executing. */
export class BotController {
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private readonly act: (playerId: string) => void) {}

  update(state: GameState): void {
    this.stop();
    const id = decisionPlayerId(state);
    if (!id || !state.players[id]?.isBot || !state.players[id]?.isAlive) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.act(id);
    }, BOT_DECISION_DELAY_MS);
  }

  stop(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
