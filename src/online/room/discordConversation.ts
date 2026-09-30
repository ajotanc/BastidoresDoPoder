export interface DiscordConversation {
  status: 'loading' | 'ready' | 'error' | 'auth-required';
  url?: string;
  expiresAt?: number;
  retryAt?: number;
}
export async function createDiscordConversation(roomCode: string, sessionId: string): Promise<DiscordConversation> {
  try {
    const response = await fetch('/.netlify/functions/discord-room', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, sessionId }), signal: AbortSignal.timeout(25000),
    });
    if (response.status === 401) return { status: 'auth-required' };
    if (response.status === 429) return { status: 'error', retryAt: Date.now() + 180000 };
    if (!response.ok) throw new Error('Discord indisponível');
    const result = await response.json();
    if (!/^https:\/\/discord\.gg\/[\w-]+$/.test(result.url) || !Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) throw new Error('Convite inválido');
    return { status: 'ready', url: result.url, expiresAt: result.expiresAt };
  } catch { return { status: 'error', retryAt: Date.now() + 15000 }; }
}

export function connectDiscordAccount(): Promise<void> {
  const popup = window.open('/.netlify/functions/discord-auth', 'bdp-discord-auth', 'popup,width=520,height=720');
  if (!popup) return Promise.reject(new Error('Permita a janela de autorização do Discord.'));
  return new Promise((resolve, reject) => {
    const cleanup = () => { window.removeEventListener('message', onMessage); window.clearInterval(poll); window.clearTimeout(timeout); };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup || event.data?.type !== 'bdp-discord-authenticated') return;
      cleanup(); resolve();
    };
    const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error('Autorização do Discord encerrada.')); } }, 1000);
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Autorização do Discord expirou.')); }, 600000);
    window.addEventListener('message', onMessage);
  });
}
