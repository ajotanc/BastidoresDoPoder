import { describe, expect, it } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import GameBoard from '@/components/online/GameBoard.vue';
import LobbyRoom from '@/components/online/LobbyRoom.vue';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import type { GameState } from '@/game/models/gameState';

function state(): GameState {
  const s = createInitialAuthoritativeState('ROOM', 'a', 'Ana', 'baron', 'token-a').publicState;
  return { ...s, phase: 'WAITING_BLOCK', responsePlayerIds: ['b'], playerOrder: ['a', 'b'],
    players: { a: { ...s.players.a!, coins: 7, activeSupportCount: 2 },
      b: { ...s.players.a!, id: 'b', name: 'Bruno', coins: 2, activeSupportCount: 2 } },
    pendingAction: { actionType: 'commonImpeachment', sourcePlayerId: 'a', targetPlayerId: 'b', costPaid: 7 },
  };
}

describe('Controles online seguem a elegibilidade da engine', () => {
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
    expect(wrapper.text()).toContain('Aguardando a resposta de Bruno');
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
