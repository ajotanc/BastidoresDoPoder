import { buildResultSummary, resultText } from '@/game/resultSummary';
import { describe, expect, it } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import GameResultBanner from '@/components/online/GameResultBanner.vue';
import GameBoard from '@/components/online/GameBoard.vue';
import GameNewsFeed from '@/components/online/GameNewsFeed.vue';
import GameEventMessage from '@/components/online/GameEventMessage.vue';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import type { GameState, GameEvent } from '@/game/models/gameState';

const event = (id: string, type: string, message: string): GameEvent => ({ id, type, message, timestamp: 1, importance: 'normal' });
function finished(): GameState {
  const base = createInitialAuthoritativeState('FINAL', 'a', 'Ana', 'baron', 'token').publicState;
  return { ...base, phase: 'FINISHED', winnerPlayerId: 'a', deadlineAt: null, history: [
    event('win', 'GAME_FINISHED', 'Ana venceu'),
    event('out', 'PLAYER_ELIMINATED', 'Bruno perdeu todos os apoios.'),
    event('loss', 'SUPPORT_LOST', 'Bruno perdeu Barão.'),
    event('action', 'ACTION_DECLARED', 'Ana declarou Impeachment Definitivo contra Bruno.'),
    event('turn', 'TURN_CHANGED', 'Turno 10'),
    event('old', 'ACTION_RESOLVED', 'Jogada do turno anterior'),
  ] };
}

describe('Resultado visível na mesa', () => {
  it('permite virar os apoios do vencedor apenas após encerrar', async () => {
    const end = { ...finished(), winnerSupports: [{ id: 'remaining', roleSlug: 'baron' as const }] };
    const wrapper = shallowMount(GameBoard, { props: { gameState: { ...end, phase: 'WAITING_ACTION' }, myPlayerId: 'b', privateView: null, isHost: false } });
    expect(wrapper.find('button[aria-label^="Revelar apoio"]').exists()).toBe(false);
    await wrapper.setProps({ gameState: end });
    await wrapper.get('button[aria-label^="Revelar apoio"]').trigger('click');
    expect(wrapper.find('button[aria-label^="Ampliar apoio"]').exists()).toBe(true);
    expect(wrapper.emitted('choose-card')).toBeUndefined();
    wrapper.unmount();
  });
  it('remove emojis de mensagens antigas e destaca chamadas sem interpretar HTML', () => {
    const wrapper = mount(GameEventMessage, { props: { message: '🚨 FAKE NEWS! <img src=x> contestou. 🛡️ BLOQUEIO!' } });
    expect(wrapper.text()).toBe('FAKE NEWS! <img src=x> contestou.  BLOQUEIO!');
    expect(wrapper.findAll('strong').map(el => el.text())).toEqual(['FAKE NEWS!', 'BLOQUEIO!']);
    expect(wrapper.find('img').exists()).toBe(false);
    wrapper.unmount();
  });
  it('identifica vencedor e explica a jogada final em ordem, sem modal nem saída automática', async () => {
    const wrapper = mount(GameResultBanner, { props: { gameState: finished(), isHost: true } });
    expect(wrapper.get('h3').text()).toBe('Ana conquistou o poder.');
    expect(wrapper.findAll('li').map(li => li.text())).toEqual([
      'Ana declarou Impeachment Definitivo contra Bruno.', 'Bruno perdeu Barão.', 'Bruno perdeu todos os apoios.',
    ]);
    expect(wrapper.text()).not.toContain('Jogada do turno anterior');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').text()).toBe('Preparar revanche');
    expect(wrapper.emitted('play-again')).toHaveLength(1);
    expect(wrapper.emitted('leave')).toBeUndefined();
    wrapper.unmount();
  });
  it('mostra abandono e encerramento sem vencedor sem inventar uma vitória', () => {
    const wrapper = mount(GameResultBanner, { props: { gameState: { ...finished(), winnerPlayerId: null, history: [event('left', 'PLAYER_LEFT', 'O anfitrião abandonou a partida.')] } } });
    expect(wrapper.text()).toContain('Sessão encerrada sem vencedor');
    expect(wrapper.get('li').text()).toContain('abandonou');
    expect(wrapper.text()).not.toContain('Ana venceu');
    wrapper.unmount();
  });
  it.each(['a', 'b'])('mantém gabinetes e histórico após finalizar, para o jogador %s', async myPlayerId => {
    const end = finished();
    const wrapper = shallowMount(GameBoard, { props: { gameState: { ...end, phase: 'WAITING_ACTION', winnerPlayerId: null }, privateView: null, myPlayerId, isHost: myPlayerId === 'a' } });
    await wrapper.setProps({ gameState: end });
    expect(wrapper.findComponent(GameResultBanner).exists()).toBe(true);
    expect(wrapper.find('app-modal-overlay-stub').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Seu Gabinete Pessoal"]').exists()).toBe(true);
    expect(wrapper.findComponent(GameNewsFeed).props('history')).toEqual(end.history);
    expect(wrapper.text()).not.toContain('Sessão em Andamento');
    expect(wrapper.text()).not.toContain('Escolher Ação do Turno');
    expect(wrapper.emitted('leave')).toBeUndefined();
    wrapper.unmount();
  });
});

it('resumo usa a perda real na contestação e desconta o tempo de recuperação', () => {
  const state = { ...finished(), startedAt: 1000, finishedAt: 91000, recoveryPausedMs: 30000, turn: 12,
    history: [event('loss', 'SUPPORT_LOST', 'Bruno perdeu Barão. Motivo: contestação malsucedida.'), event('action', 'ACTION_DECLARED', 'Ana declarou Extorsão.')],
  };
  const summary = buildResultSummary(state)!;
  expect(summary.durationSeconds).toBe(60);
  expect(summary.decisivePlay).toContain('contestação malsucedida');
  expect(resultText(summary)).toContain('Mesa FINAL · 12 turnos · 1 min');
  expect(buildResultSummary({ ...state, winnerPlayerId: null })).toBeNull();
  expect(buildResultSummary(finished())!.durationSeconds).toBeNull();
});
it('convidado pode compartilhar mas não iniciar revanche', () => {
  const wrapper = mount(GameResultBanner, { props: { gameState: finished(), isHost: false } });
  expect(wrapper.text()).toContain('Compartilhar resultado');
  expect(wrapper.text()).not.toContain('Preparar revanche');
  wrapper.unmount();
});
