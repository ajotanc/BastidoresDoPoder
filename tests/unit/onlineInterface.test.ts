import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import GameNewsFeed from '@/components/online/GameNewsFeed.vue';
import { nextTick } from 'vue';
import GameBoard from '@/components/online/GameBoard.vue';
import LobbyRoom from '@/components/online/LobbyRoom.vue';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import type { GameState } from '@/game/models/gameState';

vi.mock('@/constants/gameConfig', async importOriginal => ({
  ...await importOriginal<typeof import('@/constants/gameConfig')>(), MIN_PLAYERS_TO_START: 2,
}));

function state(): GameState {
  const s = createInitialAuthoritativeState('ROOM', 'a', 'Ana', 'baron', 'token-a').publicState;
  return { ...s, phase: 'WAITING_BLOCK', responsePlayerIds: ['b'], playerOrder: ['a', 'b'],
    players: { a: { ...s.players.a!, coins: 7, activeSupportCount: 2 },
      b: { ...s.players.a!, id: 'b', name: 'Bruno', coins: 2, activeSupportCount: 2 } },
    pendingAction: { actionType: 'commonImpeachment', sourcePlayerId: 'a', targetPlayerId: 'b', costPaid: 7 },
  };
}

describe('Controles online seguem a elegibilidade da engine', () => {
  it('terceiro recebe botão de contestar uma ação direcionada na sua vez', () => {
    const s = state();
    const directed: GameState = { ...s, phase: 'WAITING_CHALLENGE_ACTION', playerOrder: ['a', 'b', 'c'],
      players: { ...s.players, c: { ...s.players.b!, id: 'c', name: 'Carlos' } }, responsePlayerIds: ['c'],
      pendingAction: { actionType: 'execution', sourcePlayerId: 'a', targetPlayerId: 'b', claimedRole: 'executor', costPaid: 3 } };
    const wrapper = shallowMount(GameBoard, { props: { gameState: directed, myPlayerId: 'c', privateView: null, isHost: false } });
    expect(wrapper.findAll('button').some(button => button.text().includes('Contestar'))).toBe(true);
    expect(wrapper.text()).toContain('Qualquer outro jogador ativo pode contestar esta ação');
    wrapper.unmount();
  });
  it('mantém notícia nova no topo e reinicia a rolagem do histórico', async () => {
    const event = state().history[0]!;
    const wrapper = shallowMount(GameNewsFeed, { props: { history: [event, { ...event, id: 'older' }] }, global: { stubs: { GameEventMessage: false } } });
    const list = wrapper.get('.news-history').element as HTMLElement;
    list.scrollTop = 200;
    await wrapper.setProps({ history: [{ ...event, id: 'new', message: 'Notícia mais recente' }, event, { ...event, id: 'older' }] });
    await nextTick();
    expect(list.scrollTop).toBe(0);
    expect(wrapper.get('p').text()).toBe('Notícia mais recente');
    wrapper.unmount();
  });

  it('exibe 584 segundos como 09:44 e continua em minutos e segundos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    const wrapper = shallowMount(GameBoard, { props: {
      gameState: { ...state(), phase: 'WAITING_ACTION', deadlineAt: 684000 },
      myPlayerId: 'a', privateView: null, isHost: true
    } });
    try {
      expect(wrapper.get('[data-testid="game-timer"]').text()).toBe('09:44');
      await vi.advanceTimersByTimeAsync(1000);
      expect(wrapper.get('[data-testid="game-timer"]').text()).toBe('09:43');
    } finally { wrapper.unmount(); vi.useRealTimers(); }
  });

  it('Intocável exige C$3 e não exige a carta na mão para permitir blefe', async () => {
    const s = state();
    const wrapper = shallowMount(GameBoard, { props: { gameState: s, myPlayerId: 'b', privateView: { playerId: 'b', supports: [] }, isHost: false } });
    expect(wrapper.text()).not.toContain('Bloquear como Intocável');
    await wrapper.setProps({ gameState: { ...s, players: { ...s.players, b: { ...s.players.b!, coins: 3 } } } });
    expect(wrapper.text()).toContain('Bloquear como Intocável');
    await wrapper.findAll('button').find(button => button.text().includes('Bloquear como Intocável'))!.trigger('click');
    expect(wrapper.emitted('declare-block')).toEqual([[{ claimedBlockRole: 'untouchable' }]]);
    wrapper.unmount();
  });

  it('declarante não pode passar a própria alegação e só o respondente recebe controles', async () => {
    const s: GameState = { ...state(), phase: 'WAITING_CHALLENGE_ACTION',
      pendingAction: { actionType: 'execution', sourcePlayerId: 'a', targetPlayerId: 'b', costPaid: 3, claimedRole: 'executor' } };
    const wrapper = shallowMount(GameBoard, { props: { gameState: s, myPlayerId: 'a', privateView: null, isHost: true } });
    expect(wrapper.text()).not.toContain('Passar / Permitir');
    expect(wrapper.text()).toContain('Aguardando deliberação de Bruno');
    await wrapper.setProps({ myPlayerId: 'b' });
    expect(wrapper.text()).toContain('Passar / Permitir');
    expect(wrapper.text()).toContain('Contestar Alegação');
    wrapper.unmount();
  });

  it('autor da Vaquinha não recebe botão de bloqueio', () => {
    const s: GameState = { ...state(), pendingAction: { actionType: 'crowdfunding', sourcePlayerId: 'a', costPaid: 0 } };
    const wrapper = shallowMount(GameBoard, { props: { gameState: s, myPlayerId: 'a', privateView: null, isHost: true } });
    expect(wrapper.text()).not.toContain('Bloquear como Barão');
    wrapper.unmount();
  });

  it('lobby exige jogadores conectados e prontos', async () => {
    const s: GameState = { ...state(), phase: 'LOBBY', players: { ...state().players, b: { ...state().players.b!, isReady: false } } };
    const wrapper = shallowMount(LobbyRoom, { props: { gameState: s, roomCode: 'ROOM', myPlayerId: 'a', isHost: true } });
    const start = () => wrapper.find('button[aria-label="Iniciar disputa"]');
    expect(start().attributes('disabled')).toBeDefined();
    await wrapper.setProps({ gameState: { ...s, players: { ...s.players, b: { ...s.players.b!, isReady: true } } } });
    expect(start().attributes('disabled')).toBeUndefined();
    wrapper.unmount();
  });
});

