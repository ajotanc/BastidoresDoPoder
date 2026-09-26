/**
 * Geração determinística de códigos de sala para Bastidores do Poder.
 * Sem backend: o roomCode mapeia diretamente para o PeerId do Host.
 */

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem 0, 1, I, O para evitar confusão visual

/**
 * Gera um código curto de 4 caracteres alfanuméricos legíveis.
 */
export const generateRoomCode = (length = 4): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET.charAt(randomIndex);
  }
  return result;
};

/**
 * Converte um código de sala para o PeerId público oficial do Host.
 * Exemplo: '7K3F' -> 'bdp-7k3f'
 */
export const roomCodeToPeerId = (roomCode: string): string => {
  const sanitized = roomCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `bdp-${sanitized}`;
};

/**
 * Converte um PeerId de volta para o código legível da sala.
 */
export const peerIdToRoomCode = (peerId: string): string => {
  if (peerId.startsWith('bdp-')) {
    return peerId.replace('bdp-', '').toUpperCase();
  }
  return peerId.toUpperCase();
};

/**
 * Normaliza qualquer código digitado pelo usuário.
 */
export const normalizeRoomCode = (input: string): string => {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};
