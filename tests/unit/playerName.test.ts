import { describe, it, expect, vi } from 'vitest';
import { randName } from 'randino';
import { createPlayerName, characterGender } from '@/utils/playerName';
import { loadProfile, saveProfile } from '@/utils/playerProfile';

vi.mock('randino', () => ({ randName: vi.fn(() => ['Jane Smith', 'Alice Jones']) }));

describe('Nomes e gênero do perfil', () => {
  it.each(['all', 'male', 'female'] as const)('gera nome e sobrenome em inglês com filtro %s', gender => {
    expect(createPlayerName(gender, 'Jane Smith')).toBe('Alice Jones');
    expect(randName).toHaveBeenLastCalledWith({ language: 'en', gender, includeSurname: true, includeMiddleName: false, count: 2, unique: true });
  });
  it('preserva o filtro salvo e identifica os personagens femininos', () => {
    saveProfile({ name: 'Alice Jones', avatarSlug: 'lawyer', gender: 'female' });
    expect(loadProfile().gender).toBe('female');
    for (const role of ['lawyer', 'marketer', 'coordinator'] as const) expect(characterGender(role)).toBe('female');
    expect(characterGender('colonel')).toBe('male');
    localStorage.clear();
  });
});
