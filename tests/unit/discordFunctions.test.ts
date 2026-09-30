// @vitest-environment node
import resultHandler from '../../netlify/functions/discord-result';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import handler from '../../netlify/functions/discord-room';
import cleanup from '../../netlify/functions/discord-cleanup';
import auth from '../../netlify/functions/discord-auth';
import { signSession, authenticatedUser } from '../../netlify/lib/discordAuth';
import { channelName, sessionMarker, CHANNEL_TTL_MS, ownedChannel } from '../../netlify/lib/discord';
const sessionId='a24da0b6-8701-4dc0-a117-9ca922589e65';
// Synthetic Discord IDs: fixtures must never reuse production environment values.
const userId='100000000000000001';
const botId='100000000000000002';
const resultsId='100000000000000003';
const resultsChannel = { id: resultsId, name: 'resultados', type: 0 };
const snowflake=(time:number)=>((BigInt(time)-1420070400000n)<<22n).toString();
const authCookie=()=>`bdp_discord_session=${signSession({kind:'user',userId,expiresAt:Date.now()+3600000})}`;
const request=(body:object, origin='https://game.test', authenticated=true)=>new Request('https://game.test/.netlify/functions/discord-room',{method:'POST',headers:{origin,'Content-Type':'application/json',...(authenticated?{cookie:authCookie()}:{})},body:JSON.stringify(body)});
const marker=()=>sessionMarker('ABCD',`${userId}:${sessionId}`);
function upstream(list:object[]=[], records:object[]=[]) {
 const fetch=vi.fn(async (url:string,init?:RequestInit)=>{
  if(url.endsWith('/users/@me'))return Response.json({id:botId});
  if(url.includes('/audit-logs'))return Response.json({audit_log_entries:records});
  if(init?.method==='DELETE')return new Response(null,{status:204});
  if(url.endsWith('/invites'))return Response.json({code:'abc123'});
  if(init?.method==='POST')return Response.json({id:snowflake(Date.now())});
  return Response.json(list);
 });vi.stubGlobal('fetch',fetch);return fetch;
}
beforeEach(()=>{vi.stubEnv('DISCORD_BOT_TOKEN','test-token');vi.stubEnv('DISCORD_CLIENT_SECRET','test-secret');vi.stubEnv('DISCORD_CLIENT_ID',botId);vi.stubEnv('DISCORD_GUILD_ID','guild');vi.stubEnv('DISCORD_CATEGORY_ID','category');vi.stubEnv('DISCORD_RESULTS_CHANNEL_ID',resultsId);});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
it('rejects unauthenticated requests, foreign origins and invalid rooms',async()=>{
 const fetch=upstream();
 expect((await handler(request({roomCode:'ABCD',sessionId},'https://game.test',false))).status).toBe(401);
 expect((await handler(request({roomCode:'ABCD',sessionId},'https://foreign.test'))).status).toBe(403);
 expect((await handler(request({roomCode:'../x',sessionId}))).status).toBe(400);
 expect(fetch).not.toHaveBeenCalled();
});
it('creates the clean channel with audit metadata for the authenticated session',async()=>{
 const fetch=upstream();const response=await handler(request({roomCode:'ABCD',sessionId}));
 expect(response.status).toBe(200);expect(await response.json()).toMatchObject({url:'https://discord.gg/abc123'});
 const call=fetch.mock.calls.find(([url,init])=>url.endsWith('/channels')&&init?.method==='POST')!;
 expect(JSON.parse(call[1]!.body as string)).toMatchObject({name:'Mesa (ABCD)',type:2,parent_id:'category',user_limit:8});
 expect(call[1]!.headers).toHaveProperty('X-Audit-Log-Reason',encodeURIComponent(`bdp:${marker()}`));
});
it('reuses the same session after token rotation',async()=>{
 const id=snowflake(Date.now());const saved=marker();vi.stubEnv('DISCORD_BOT_TOKEN','rotated-token');expect(marker()).toBe(saved);
 const fetch=upstream([{id,name:channelName('ABCD'),type:2,parent_id:'category'}],[{id,target_id:id,user_id:botId,action_type:10,reason:`bdp:${saved}`}]);
 expect((await handler(request({roomCode:'ABCD',sessionId}))).status).toBe(200);
 expect(fetch.mock.calls.filter(([url,init])=>url.endsWith('/channels')&&init?.method==='POST')).toHaveLength(0);
});
it('coalesces concurrent creation attempts within an instance',async()=>{
 const fetch=upstream();await Promise.all([handler(request({roomCode:'ABCD',sessionId})),handler(request({roomCode:'ABCD',sessionId}))]);
 expect(fetch.mock.calls.filter(([url,init])=>url.endsWith('/channels')&&init?.method==='POST')).toHaveLength(1);
});
it('does not create when the audit scan is incomplete',async()=>{
 const records=Array.from({length:100},(_,i)=>({id:String(i),target_id:String(i),user_id:botId,action_type:10}));const fetch=upstream([],records);vi.spyOn(console,'error').mockImplementation(()=>{});
 expect((await handler(request({roomCode:'ABCD',sessionId}))).status).toBe(503);
 expect(fetch.mock.calls.some(([,init])=>init?.method==='POST')).toBe(false);
});
it('cleans only expired channels with verified bot creation records',async()=>{
 const expired={id:snowflake(Date.now()-CHANNEL_TTL_MS-1000),name:'Mesa (ABCD)',type:2,parent_id:'category'};
 const foreign={...expired,id:snowflake(Date.now()-CHANNEL_TTL_MS-2000)};
 const records=[expired,foreign].map((c,i)=>({id:c.id,target_id:c.id,user_id:i?'another-user':botId,action_type:10,reason:`bdp:${marker()}`}));
 const fetch=upstream([expired,foreign,{...expired,id:snowflake(Date.now())}],records);
 await cleanup();const deletions=fetch.mock.calls.filter(([,init])=>init?.method==='DELETE');expect(deletions).toHaveLength(1);expect(deletions[0]![0]).toContain(expired.id);
 expect(ownedChannel(foreign)).toBe(false);
});
it('rejects tampered and expired login cookies',()=>{
 const cookie=`bdp_discord_session=${signSession({kind:'user',userId,expiresAt:Date.now()-1})}`;
 expect(authenticatedUser(new Request('https://game.test',{headers:{cookie}}))).toBeNull();
 expect(authenticatedUser(new Request('https://game.test',{headers:{cookie:`${authCookie()}x`}}))).toBeNull();
});
it('OAuth begins with signed HttpOnly state and requests only identify',async()=>{
 const response=await auth(new Request('https://game.test/.netlify/functions/discord-auth'));expect(response.status).toBe(302);
 expect(new URL(response.headers.get('location')!).searchParams.get('scope')).toBe('identify');
 expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Lax');
});
it('OAuth rejects forged callback state before contacting Discord',async()=>{
 const fetch=upstream();const response=await auth(new Request('https://game.test/.netlify/functions/discord-auth?code=x&state=forged'));expect(response.status).toBe(400);expect(fetch).not.toHaveBeenCalled();
});
it('OAuth successful callback sets a signed user cookie without exposing tokens',async()=>{
 const start=await auth(new Request('https://game.test/.netlify/functions/discord-auth'));
 const state=new URL(start.headers.get('location')!).searchParams.get('state')!;
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json({access_token:'private-access-token'})).mockResolvedValueOnce(Response.json({id:userId})));
 const response=await auth(new Request(`https://game.test/.netlify/functions/discord-auth?code=code&state=${state}`,{headers:{cookie:start.headers.get('set-cookie')!.split(';')[0]!}}));
 expect(response.status).toBe(200);expect(response.headers.get('set-cookie')).toContain('bdp_discord_session=');expect(await response.text()).not.toContain('private-access-token');
});

const summary = () => ({ gameId: sessionId, roomCode: 'ABCD', winnerName: '@everyone', turns: 15, durationSeconds: 60, decisivePlay: 'Bruno perdeu o último apoio.', supports: 1, coins: 4, finishedAt: Date.now() });
function resultUpstream(messages: object[] = [], destination: object[] = [resultsChannel]) {
 return vi.fn(async (url: string, init?: RequestInit) => {
   if (url.endsWith('/users/@me')) return Response.json({ id: botId });
   if (url.endsWith('/channels')) return Response.json(destination);
   if (init?.method === 'POST') return Response.json({ id: 'result' });
   return Response.json(messages);
 });
}
it('publica sem login nem sala de voz e usa apenas o destino configurado', async () => {
 vi.stubEnv('DISCORD_CATEGORY_ID', ''); vi.stubEnv('DISCORD_CLIENT_SECRET', '');
 const fetch = resultUpstream(); vi.stubGlobal('fetch', fetch);
 expect((await resultHandler(request({ summary: summary(), channelId: 'ignored' }, 'https://game.test', false))).status).toBe(200);
 const post = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
 expect(post[0]).toBe(`https://discord.com/api/v10/channels/${resultsId}/messages`);
 const body = JSON.parse(post[1]!.body as string);
 expect(body).toMatchObject({ allowed_mentions: { parse: [] }, enforce_nonce: true });
 expect(body.nonce).toHaveLength(24);
 expect(body.embeds[0].description).toContain('Mesa ABCD · 15 turnos · 1 min');
 expect(fetch.mock.calls.some(([url]) => url.includes('audit-logs') || url.includes('invites'))).toBe(false);
 const dedup = resultUpstream([{ id: snowflake(Date.now()), author: { id: botId }, embeds: body.embeds }]); vi.stubGlobal('fetch', dedup);
 expect((await resultHandler(request({ summary: summary() }, 'https://game.test', false))).status).toBe(200);
 expect(dedup.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
});
it('rejeita origem diferente, resultado inválido e resultado expirado', async () => {
 const fetch = resultUpstream(); vi.stubGlobal('fetch', fetch);
 expect((await resultHandler(request({ summary: summary() }, 'https://foreign.test', false))).status).toBe(403);
 expect((await resultHandler(request({ summary: { ...summary(), supports: 99 } }))).status).toBe(400);
 expect((await resultHandler(request({ summary: { ...summary(), finishedAt: Date.now() - 86400001 } }))).status).toBe(400);
 expect(fetch).not.toHaveBeenCalled();
});
it.each(['', 'invalid', '100000000000000004'])('falha com código diagnóstico para destino inválido: %s', async destination => {
 vi.spyOn(console, 'error').mockImplementation(() => {});
 vi.stubEnv('DISCORD_RESULTS_CHANNEL_ID', destination);
 const fetch = resultUpstream(); vi.stubGlobal('fetch', fetch);
 const response = await resultHandler(request({ summary: summary() }));
 expect(response.status).toBe(503);
 expect((await response.json()).code).toBe(destination.length === 18 ? 'INVALID_RESULTS_CHANNEL' : 'RESULTS_CHANNEL_NOT_CONFIGURED');
 expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
});
it('falha fechada quando não consegue concluir a busca de duplicatas', async () => {
 vi.spyOn(console, 'error').mockImplementation(() => {});
 const fetch = resultUpstream(Array.from({ length: 100 }, (_, index) => ({ id: snowflake(Date.now() - index), author: { id: botId } }))); vi.stubGlobal('fetch', fetch);
 expect((await resultHandler(request({ summary: summary() }))).status).toBe(503);
 expect(fetch.mock.calls.filter(([url]) => url.includes('/messages?'))).toHaveLength(5);
 expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
});
it('ignora histórico anterior à janela de resultados aceitos', async () => {
 const fetch = resultUpstream(Array.from({ length: 100 }, (_, index) => ({ id: snowflake(Date.now() - 86400001 - index), author: { id: botId } }))); vi.stubGlobal('fetch', fetch);
 expect((await resultHandler(request({ summary: summary() }))).status).toBe(200);
 expect(fetch.mock.calls.filter(([url]) => url.includes('/messages?'))).toHaveLength(1);
});
it('registra falta de permissão sem expor token', async () => {
 const log = vi.spyOn(console, 'error').mockImplementation(() => {});
 vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
 const response = await resultHandler(request({ summary: summary() }));
 expect((await response.json()).code).toBe('Discord HTTP 403');
 expect(log).toHaveBeenCalledWith('Discord result failure', 'Discord HTTP 403');
 expect(JSON.stringify(log.mock.calls)).not.toContain('test-token');
});
