import { randName } from 'randino';
import type { RoleSlug } from '@/types/game';

export type PlayerGender = 'all' | 'male' | 'female';
export const characterGender = (role: RoleSlug): Exclude<PlayerGender, 'all'> =>
  ['lawyer', 'marketer', 'coordinator'].includes(role) ? 'female' : 'male';

export function createPlayerName(gender: PlayerGender = 'all', previousName = ''): string {
  const names = randName({ language: 'en', gender, includeSurname: true, includeMiddleName: false, count: 2, unique: true });
  return names.find(name => name !== previousName) ?? names[0]!;
}
