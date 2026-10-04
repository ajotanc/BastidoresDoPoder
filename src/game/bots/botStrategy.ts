import type { ClientCommand, ActionIntent } from '../models/commands';
import type { GameState, PrivatePlayerView, ActionType } from '../models/gameState';
import type { RoleSlug } from '@/types/game';
import { getEligibleBlockRoles, getBlockRoles, getEligibleChallengers } from '../engine/rules';
import { getActionCost, getRequiredRoleForAction } from '../engine/gameEngine';
import { BOT_DIFFICULTY_PROFILES, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from './botDifficulty';
import { PLAYABLE_ROLES } from '@/constants/gameData';
import { evaluateTable } from './botEvaluation';

export function decisionPlayerId(state: GameState): string | undefined {
  if (state.phase === 'WAITING_ACTION') return state.activePlayerId;
  if (state.phase === 'WAITING_CARD_CHOICE' || state.phase === 'WAITING_EXCHANGE_CHOICE') return state.cardChoicePlayerId ?? undefined;
  if (['WAITING_CHALLENGE_ACTION', 'WAITING_BLOCK', 'WAITING_CHALLENGE_BLOCK'].includes(state.phase)) return state.responsePlayerIds[0];
  return undefined;
}

/** Scores legal choices from public beliefs and the bot's own hand. Randomness
 * varies close decisions and willingness to bluff, never picks a target blindly. */
export function chooseBotCommand(state: GameState, view: PrivatePlayerView, random = Math.random, difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY): ClientCommand | null {
  if (!state.players[view.playerId]?.isAlive || decisionPlayerId(state) !== view.playerId) return null;
  const profile = BOT_DIFFICULTY_PROFILES[difficulty];
  const t = evaluateTable(state, view, profile);
  const pass: ClientCommand = { type: 'PASS_RESPONSE', payload: { pass: true } };
  const variation = () => (random() - 0.5) * profile.decisionVariation;
  const riskCost = t.lossValue / profile.riskTolerance;

  if (state.phase === 'WAITING_CARD_CHOICE') {
    const discarded = [...t.hand].sort((a, b) => t.handValue(t.hand.filter(c => c.id !== b.id)) - t.handValue(t.hand.filter(c => c.id !== a.id)))[0];
    return discarded ? { type: 'CHOOSE_CARD', payload: { cardId: discarded.id } } : null;
  }
  if (state.phase === 'WAITING_EXCHANGE_CHOICE') {
    let best: { score: number; ids: [string, string] } | undefined;
    for (let a = 0; a < t.hand.length; a++) for (let b = a + 1; b < t.hand.length; b++) {
      const score = t.handValue(t.hand.filter((_, index) => index !== a && index !== b));
      if (!best || score > best.score) best = { score, ids: [t.hand[a]!.id, t.hand[b]!.id] };
    }
    return best ? { type: 'CHOOSE_EXCHANGE', payload: { returnedCardIds: best.ids } } : null;
  }
  const blockedProbability = (action: ActionType, target?: string) => {
    const ids = action === 'crowdfunding' ? t.rivals.map(p => p.id) : target ? [target] : [];
    let allowed = 1;
    for (const id of ids) {
      if (action === 'commonImpeachment' && state.players[id]!.coins < 3) continue;
      let absent = 1;
      for (const role of getBlockRoles(action)) absent *= 1 - t.probability(id, role);
      allowed *= absent;
    }
    return 1 - allowed;
  };
  if (state.phase === 'WAITING_ACTION') {
    if (!t.rivals.length) return null;
    const candidates: { intent: ActionIntent; score: number }[] = [];
    const allowBluff = random() < profile.bluffWillingness;
    const currentExposure = profile.retaliationWeight ? t.rivals.reduce((sum, rival) => sum + t.retaliationRisk(rival.id), 0) : 0;
    const coinGain = (amount: number) => amount + (t.me.coins < 7 && t.me.coins + amount >= 7 ? 1.2 : 0) + (t.own('executor') && t.me.coins < 3 && t.me.coins + amount >= 3 ? 0.8 : 0)
      + profile.planningWeight * (t.coinPosition(t.me.coins + amount) - t.coinPosition(t.me.coins));
    const add = (actionType: ActionType, benefit: number, targetPlayerId?: string, namedRole?: RoleSlug) => {
      const cost = getActionCost(actionType);
      if (cost > t.me.coins || (t.me.coins >= 10 && actionType !== 'definitiveImpeachment')) return;
      const role = getRequiredRoleForAction(actionType);
      const bluff = role && !t.own(role);
      if (bluff && (!allowBluff || !t.remaining(role))) return;
      const eligible = getEligibleChallengers(state, { actionType, sourcePlayerId: t.me.id, targetPlayerId, costPaid: cost });
      const caught = bluff ? t.challengeRisk(role, eligible) : 0;
      const success = (1 - caught) * (1 - blockedProbability(actionType, targetPlayerId));
      const reserve = t.me.coins - cost;
      const preparation = profile.planningWeight * (t.coinPosition(reserve) - t.coinPosition(t.me.coins));
      const lethal = targetPlayerId && state.players[targetPlayerId]!.activeSupportCount === 1
        && ['execution', 'commonImpeachment', 'definitiveImpeachment'].includes(actionType);
      // A certain immediate win must outrank saving money for a turn that won't happen.
      const certainWin = profile.planningWeight && lethal && t.rivals.length === 1 && success === 1;
      let safety = 0;
      if (profile.retaliationWeight) {
        const stolen = targetPlayerId ? Math.min(2, state.players[targetPlayerId]!.coins) : 0;
        const income = actionType === 'salary' ? 1 : actionType === 'crowdfunding' || actionType === 'backroomDeal' ? 2
          : actionType === 'slushFund' ? 3 : actionType === 'extortion' ? stolen : 0;
        let exposure = 0;
        for (const rival of t.rivals) {
          const target = rival.id === targetPlayerId;
          const coinsAfter = rival.coins + (target && actionType === 'backroomDeal' ? 1 : 0) - (target && actionType === 'extortion' ? stolen : 0);
          const removed = target && rival.activeSupportCount === 1
            ? lethal ? 1 : actionType === 'searchWarrant' && namedRole ? t.probability(rival.id, namedRole) : 0 : 0;
          // Failed or blocked actions still spend their cost; successful actions
          // may remove a threat, disarm it or replenish the bot's defense budget.
          exposure += success * (1 - removed) * t.retaliationRisk(rival.id, coinsAfter, reserve + income)
            + (1 - success) * t.retaliationRisk(rival.id, rival.coins, reserve);
        }
        safety = profile.retaliationWeight * (currentExposure - exposure);
      }
      const score = certainWin ? 1000 - cost : preparation + safety + benefit * success - cost * 0.8 - caught * riskCost * profile.bluffPenalty + variation();
      candidates.push({ intent: { actionType, ...(targetPlayerId ? { targetPlayerId } : {}), ...(namedRole ? { namedRole } : {}) }, score });
    };
    add('salary', coinGain(1));
    add('crowdfunding', coinGain(2));
    add('slushFund', coinGain(3));
    const weak = Math.min(...t.hand.map(c => t.roleValue(c.roleSlug)));
    const duplicate = new Set(t.hand.map(c => c.roleSlug)).size < t.hand.length;
    const recentlyExchanged = state.history.slice(0, 12).some(e => e.playerId === t.me.id && e.actionType === 'exchange' && e.type === 'ACTION_RESOLVED');
    add('exchange', Math.max(0, 4.8 - weak) + (duplicate ? 1.2 : 0) - (recentlyExchanged ? 2 : 0));
    for (const rival of t.rivals) {
      const attack = t.attackValue(rival.id);
      add('definitiveImpeachment', attack, rival.id);
      add('commonImpeachment', attack, rival.id);
      add('execution', attack, rival.id);
      if (rival.coins > 0) add('extortion', coinGain(Math.min(2, rival.coins)) + Math.min(2, rival.coins) * (0.35 + t.threat(rival.id) * 0.08) + profile.planningWeight * t.denialValue(rival.id, 2), rival.id);
      const armsRival = profile.planningWeight * (rival.coins === 2 ? t.probability(rival.id, 'executor') * 3 : rival.coins === 6 || rival.coins === 9 ? 3 : 0);
      add('backroomDeal', coinGain(2) - (t.rivals.length === 1 ? 1.1 : 0.35) - (rival.coins === 6 || rival.coins === 9 ? 1.5 : 0) - t.threat(rival.id) * 0.08 - armsRival, rival.id);
      const likelyRole = [...PLAYABLE_ROLES].sort((a, b) => t.probability(rival.id, b) - t.probability(rival.id, a))[0]!;
      add('searchWarrant', attack * t.probability(rival.id, likelyRole), rival.id, likelyRole);
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] ? { type: 'DECLARE_ACTION', payload: candidates[0].intent } : null;
  }
  const pending = state.pendingAction;
  if (!pending) return null;
  const targeted = pending.targetPlayerId === t.me.id;
  const damaging = ['execution', 'commonImpeachment', 'definitiveImpeachment'].includes(pending.actionType) || (pending.actionType === 'searchWarrant' && (!targeted || !!(pending.namedRole && t.own(pending.namedRole))));
  const harm = targeted ? (damaging ? t.lossValue : pending.actionType === 'extortion' ? Math.min(t.me.coins, 2) * 1.5 : 0) : 0;
  if (state.phase === 'WAITING_BLOCK') {
    const eligible = getEligibleBlockRoles(state, pending, t.me.id);
    const honest = eligible.find(role => t.own(role));
    if (honest) return { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: honest } };
    const prevented = harm || (pending.actionType === 'crowdfunding' ? 1 + t.threat(pending.sourcePlayerId) * 0.3 : 0);
    const fee = pending.actionType === 'commonImpeachment' ? 2.4 : 0;
    const desperate = targeted && damaging && t.me.activeSupportCount === 1;
    if (!desperate && random() >= profile.bluffWillingness) return pass;
    const choices = eligible.filter(role => t.remaining(role) > 0).map(role => {
      const eligible = getEligibleChallengers(state, { ...pending, blockedByPlayerId: t.me.id }, true);
      const caught = t.challengeRisk(role, eligible);
      return { role, score: prevented * (1 - caught) - caught * (desperate ? 0 : riskCost) - fee };
    }).sort((a, b) => b.score - a.score);
    if (choices[0] && choices[0].score > 0) return { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: choices[0].role } };
    return pass;
  }
  const onBlock = state.phase === 'WAITING_CHALLENGE_BLOCK';
  if (!getEligibleChallengers(state, pending, onBlock).includes(t.me.id)) return null;
  const suspect = onBlock ? pending.blockedByPlayerId : pending.sourcePlayerId;
  const role = onBlock ? pending.claimedBlockRole : pending.claimedRole;
  if (!suspect || !role) return pass;
  const truth = t.probability(suspect, role, true);
  if (truth === 0) return { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: onBlock } };
  const canDefend = !onBlock && getEligibleBlockRoles(state, pending, t.me.id).some(r => t.own(r));
  const saved = onBlock ? (pending.sourcePlayerId === t.me.id ? (damaging ? t.attackValue(suspect) : 2) : 0) : (canDefend ? 0 : harm);
  const gain = t.attackValue(suspect) * (t.rivals.length === 1 ? 0.7 : 0.45) + saved;
  const unavoidableLoss = !onBlock && targeted && damaging && !canDefend && t.me.activeSupportCount === 1;
  // Losing a challenge can cost one support and leave the original attack pending.
  const doubleLoss = profile.planningWeight && !onBlock && targeted && damaging && !canDefend && t.me.activeSupportCount === 2;
  const failure = unavoidableLoss ? 0 : riskCost + (doubleLoss ? 10 : 0);
  return (1 - truth) * gain - truth * failure + variation() > 0 ? { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: onBlock } } : pass;
}
