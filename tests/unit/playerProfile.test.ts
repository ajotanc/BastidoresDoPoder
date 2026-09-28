import { beforeEach, describe, expect, it } from 'vitest';
import { loadProfile, saveProfile, PROFILE_STORAGE_KEY, playerAvatar, isAvatarImage } from '@/utils/playerProfile';
import { isClientCommand } from '@/game/models/validation';
import { createInitialAuthoritativeState, executeCommand } from '@/game/engine/gameEngine';
const photo = 'data:image/jpeg;base64,YQ==';
describe('Perfil salvo e foto pública', () => {
  beforeEach(() => localStorage.clear());
  it('restaura nome, personagem e foto e tolera armazenamento inválido', () => {
    expect(saveProfile({ name: 'Ana', avatarSlug: 'baron', avatarImage: photo })).toBe(true);
    expect(loadProfile()).toEqual({ name: 'Ana', avatarSlug: 'baron', avatarImage: photo });
    localStorage.setItem(PROFILE_STORAGE_KEY, '{invalid');
    expect(loadProfile().name).toBe('');
  });
  it('rejeita URLs externas, SVG e fotos acima do limite', () => {
    for (const value of ['https://example.com/a.png', 'data:image/svg+xml;base64,YQ==', 'data:image/jpeg;base64,' + 'A'.repeat(50001)]) {
      expect(isAvatarImage(value)).toBe(false);
      expect(isClientCommand({ type: 'JOIN_ROOM', payload: { name: 'Ana', avatarSlug: 'baron', reconnectToken: 'token', avatarImage: value } })).toBe(false);
    }
    expect(playerAvatar({ avatarSlug: 'baron', avatarImage: 'invalid' })).toBe('/images/characters/baron.webp');
  });
  it('inclui foto do host e do convidado nos estados públicos', () => {
    const state = createInitialAuthoritativeState('ROOM', 'host', 'Host', 'colonel', 'token-host', undefined, photo);
    expect(state.publicState.players.host?.avatarImage).toBe(photo);
    const result = executeCommand(state, { type: 'JOIN_ROOM', payload: { name: 'Ana', avatarSlug: 'baron', reconnectToken: 'token-guest', avatarImage: photo } }, 'guest', 'join-photo');
    expect(result.broadcastPublicState.players.guest?.avatarImage).toBe(photo);
  });
  it('recusa entrada em sala finalizada com mensagem específica', () => {
    const state = createInitialAuthoritativeState('ROOM', 'host', 'Host', 'colonel', 'token-host');
    state.publicState = { ...state.publicState, phase: 'FINISHED' };
    const result = executeCommand(state, { type: 'JOIN_ROOM', payload: { name: 'Ana', avatarSlug: 'baron', reconnectToken: 'token-guest' } }, 'guest', 'join-ended');
    expect(result.rejection?.description).toContain('encerrada');
  });
});
