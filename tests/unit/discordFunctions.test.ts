// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import handler from '../../netlify/functions/discord-room';
import cleanup from '../../netlify/functions/discord-cleanup';
import auth from '../../netlify/functions/discord-auth';
import { signSession, authenticatedUser } from '../../netlify/lib/discordAuth';
import { channelName, sessionMarker, CHANNEL_TTL_MS, ownedChannel } from '../../netlify/lib/discord';
const sessionId='a24da0b6-8701-4dc0-a117-9ca922589e65';
const userId='1554705904413446154';
const botId='1554706881035898992';
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
beforeEach(()=>{vi.stubEnv('DISCORD_BOT_TOKEN','test-token');vi.stubEnv('DISCORD_CLIENT_SECRET','test-secret');vi.stubEnv('DISCORD_CLIENT_ID',botId);vi.stubEnv('DISCORD_GUILD_ID','guild');vi.stubEnv('DISCORD_CATEGORY_ID','category');});
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
