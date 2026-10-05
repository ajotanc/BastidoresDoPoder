import type { GameState } from './models/gameState';

export interface ResultSummary {
  gameId: string;
  roomCode: string;
  winnerName: string;
  turns: number;
  durationSeconds: number | null;
  decisivePlay: string;
  supports: number;
  coins: number;
  finishedAt: number;
}
export function buildResultSummary(state: GameState): ResultSummary | null {
  const winner = state.players[state.winnerPlayerId ?? ''];
  if (state.phase !== 'FINISHED' || !winner) return null;
  const events = [...state.history].sort((a, b) => b.timestamp - a.timestamp);
  const final = events.find(event => ['SUPPORT_LOST', 'PLAYER_LEFT'].includes(event.type));
  const start = state.startedAt ?? events.find(event => event.type === 'GAME_STARTED')?.timestamp;
  const end = state.finishedAt ?? events.find(event => event.type === 'GAME_FINISHED')?.timestamp ?? events[0]?.timestamp ?? 0;
  return { gameId: state.gameId, roomCode: state.roomCode, winnerName: winner.name, turns: state.turn,
    durationSeconds: start === undefined ? null : Math.max(0, Math.round((end - start - (state.recoveryPausedMs ?? 0)) / 1000)),
    decisivePlay: final?.message.replaceAll('**', '') ?? 'Todos os outros jogadores perderam os apoios. Sobrou só o vencedor.',
    supports: winner.activeSupportCount, coins: winner.coins, finishedAt: end };
}
export function durationLabel(seconds: number | null): string {
  if (seconds === null) return 'Duração não registrada';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`;
}
export function resultText(summary: ResultSummary): string {
  return `${summary.winnerName} conquistou o poder.
Mesa ${summary.roomCode} · ${summary.turns} turnos · ${durationLabel(summary.durationSeconds)}

Jogada decisiva
${summary.decisivePlay}

Terminou com
${summary.supports} ${summary.supports === 1 ? 'apoio ativo' : 'apoios ativos'} · C$ ${summary.coins}`;
}
