import type { PeerOptions } from 'peerjs';

const env = import.meta.env;

const turnServers = [env.VITE_TURN_URL_UDP, env.VITE_TURN_URL_TCP, env.VITE_TURN_URL_TLS]
  .filter((urls): urls is string => Boolean(urls))
  .map(urls => ({ urls, username: env.VITE_TURN_USER, credential: env.VITE_TURN_CREDENTIAL }));

/**
 * Servidor PeerJS de sinalização e servidores ICE (STUN/TURN).
 * Sem variáveis de ambiente, usa o servidor oficial e só o STUN do Google.
 */
export const PEER_SERVER_CONFIG: PeerOptions = {
  host: env.VITE_PEERJS_HOST || 'peer.ajotanc.com.br',
  port: Number(env.VITE_PEERJS_PORT) || 443,
  path: env.VITE_PEERJS_PATH || '/peerjs',
  secure: env.VITE_PEERJS_SECURE ? env.VITE_PEERJS_SECURE === 'true' : true,
  debug: 1,
  config: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, ...turnServers],
  },
};
