import type { RoleSlug } from '@/types/game';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
export const PROFILE_STORAGE_KEY = 'bdp-player-profile';
export const isAvatarImage = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 50000 && /^data:image[/](?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
export interface PlayerProfile { name: string; avatarSlug: RoleSlug; avatarImage?: string }
export function loadProfile(): PlayerProfile {
  const fallback: PlayerProfile = { name: '', avatarSlug: 'colonel' };
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null');
    if (!value || typeof value !== 'object') return fallback;
    return { name: typeof value.name === 'string' ? value.name.slice(0, 60) : '',
      avatarSlug: PLAYABLE_ROLES.includes(value.avatarSlug) ? value.avatarSlug : 'colonel',
      ...(isAvatarImage(value.avatarImage) ? { avatarImage: value.avatarImage } : {}) };
  } catch { return fallback; }
}
export function saveProfile(profile: PlayerProfile): boolean {
  try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile)); return true; } catch { return false; }
}
export function playerAvatar(player: { avatarSlug: RoleSlug; avatarImage?: string }): string {
  return isAvatarImage(player.avatarImage) ? player.avatarImage : '/images/characters/' + player.avatarSlug + '.webp';
}
export async function prepareAvatar(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
    throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 10 MB.');
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 192;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível preparar a foto.');
    const side = Math.min(image.width, image.height);
    ctx.drawImage(image, (image.width-side)/2, (image.height-side)/2, side, side, 0, 0, 192, 192);
    const result = canvas.toDataURL('image/jpeg', .75);
    if (!isAvatarImage(result)) throw new Error('Escolha uma imagem mais simples.');
    return result;
  } finally { image.close(); }
}
