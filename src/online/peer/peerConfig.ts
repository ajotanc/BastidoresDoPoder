import type { PeerOptions } from 'peerjs';

/**
 * Configuração oficial do servidor PeerJS dedicado para Bastidores do Poder.
 */
export const PEER_SERVER_CONFIG: PeerOptions = {
  host: 'peer.ajotanc.com.br',
  port: 443,
  secure: true,
  path: '/peerjs',
  debug: 1,
};
