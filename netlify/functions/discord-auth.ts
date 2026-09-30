import { randomUUID } from 'node:crypto';
import { cookie, readSession, sessionCookie, signSession } from '../lib/discordAuth';
export default async function auth(request: Request): Promise<Response> {
 const url=new URL(request.url);
 const headers=new Headers({'Cache-Control':'no-store'});
 if(request.method!=='GET')return new Response('Método não permitido.',{status:405,headers});
 const clientId=process.env.DISCORD_CLIENT_ID;
 const clientSecret=process.env.DISCORD_CLIENT_SECRET;
 if(!clientId||!clientSecret)return new Response('Login Discord ainda não configurado no servidor.',{status:503,headers});
 const redirectUri=`${url.origin}/.netlify/functions/discord-auth`;
 if(!url.searchParams.has('code')&&!url.searchParams.has('error')) {
  const state=randomUUID();
  headers.set('Set-Cookie',sessionCookie('bdp_discord_oauth',signSession({kind:'oauth',state,origin:url.origin,expiresAt:Date.now()+600000}),600));
  const authorize=new URL('https://discord.com/oauth2/authorize');
  authorize.search=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',scope:'identify',state}).toString();
  headers.set('Location',authorize.toString());return new Response(null,{status:302,headers});
 }
 const pending=readSession(cookie(request,'bdp_discord_oauth'));
 headers.append('Set-Cookie',sessionCookie('bdp_discord_oauth','',0));
 if(!pending||pending.kind!=='oauth'||pending.origin!==url.origin||pending.state!==url.searchParams.get('state'))return new Response('Autorização inválida ou expirada. Feche esta janela e tente novamente.',{status:400,headers});
 if(url.searchParams.has('error'))return new Response('Autorização cancelada. Você pode fechar esta janela e continuar jogando.',{status:400,headers});
 try {
  const tokenResponse=await fetch('https://discord.com/api/v10/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',code:url.searchParams.get('code')!,redirect_uri:redirectUri}),signal:AbortSignal.timeout(5000)});
  if(!tokenResponse.ok)throw new Error('TOKEN_EXCHANGE_FAILED');
  const token=await tokenResponse.json();
  if(typeof token.access_token!=='string')throw new Error('INVALID_TOKEN_RESPONSE');
  const userResponse=await fetch('https://discord.com/api/v10/users/@me',{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(5000)});
  if(!userResponse.ok)throw new Error('USER_LOOKUP_FAILED');
  const user=await userResponse.json();
  if(typeof user.id!=='string'||!/^\d{17,20}$/.test(user.id))throw new Error('INVALID_USER');
  headers.append('Set-Cookie',sessionCookie('bdp_discord_session',signSession({kind:'user',userId:user.id,expiresAt:Date.now()+8*3600000}),8*3600));
  const nonce=randomUUID();
  headers.set('Content-Type','text/html; charset=utf-8');
  headers.set('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'`);
  const origin=JSON.stringify(url.origin).replaceAll('<','\\u003c');
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Discord conectado</title><p>Discord conectado. Você pode voltar à partida.</p><script nonce="${nonce}">if(window.opener){window.opener.postMessage({type:'bdp-discord-authenticated'},${origin});window.close();}</script></html>`,{headers});
 }catch { console.error('Discord OAuth: falha na autorização');return new Response('Não foi possível conectar ao Discord. Feche esta janela e tente novamente.',{status:502,headers}); }
}
export const config={rateLimit:{windowLimit:12,windowSize:180,aggregateBy:['ip','domain']}};
