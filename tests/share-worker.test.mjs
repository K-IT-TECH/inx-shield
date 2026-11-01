import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const source=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
function worker({online=false,cacheEntries={},now=0}={}){
  const handlers={},cache=new Map(Object.entries(cacheEntries)),writes=[],network=[],deleted=[];
  let clock=now;
  const cacheApi={open:async()=>({put:async(key,response)=>{writes.push(key);cache.set(key,response.clone());},addAll:async()=>{}}),match:async key=>cache.get(key)?.clone(),keys:async()=>['inx-shield-old','unrelated-cache'],delete:async key=>{deleted.push(key);return true;}};
  const ctx={URL,Response,crypto:webcrypto,Date:{now:()=>clock},caches:cacheApi,fetch:async request=>{network.push(request);if(!online)throw Error('offline');return new Response('asset',{headers:{'Content-Type':'text/javascript'}});},self:{location:{origin:'https://shield.example'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(event,fn)=>{handlers[event]=fn;}}};
  vm.runInNewContext(source,ctx);
  async function request(request){let response;const pending=[];handlers.fetch({request,respondWith:r=>{response=r;},waitUntil:p=>pending.push(p)});const result=await response;await Promise.all(pending);return result;}
  async function share(text,title='',url=''){
    const form=new FormData();form.set('text',text);form.set('title',title);form.set('url',url);
    return request(new Request('https://shield.example/share',{method:'POST',body:form}));
  }
  function consume(id,origin='https://shield.example'){const messages=[];handlers.message({data:{type:'GET_SHARE',id},source:{url:origin+'/',postMessage:m=>messages.push(JSON.parse(JSON.stringify(m)))}});return messages;}
  return {request,share,consume,writes,network,cache,deleted,handlers,tick:ms=>{clock+=ms;}};
}
test('POST share stays local, redirects with opaque ID, then is consumed only once',async()=>{
  const w=worker();const response=await w.share('A private message with no upload');
  assert.equal(response.status,303);const location=response.headers.get('location');assert.ok(!location.includes('private'));
  const id=new URL(location).searchParams.get('share');
  assert.equal(w.consume(id)[0].text,'A private message with no upload');assert.equal(w.consume(id)[0].type,'SHARE_MISSING');
  assert.deepEqual(w.writes,[]);assert.deepEqual(w.network,[]);
});
test('No message is released to a foreign client',async()=>{
  const w=worker();const id=new URL((await w.share('private message')).headers.get('location')).searchParams.get('share');
  assert.deepEqual(w.consume(id,'https://other.example'),[]);assert.equal(w.consume(id)[0].type,'SHARED_MESSAGE');
});
test('Expired shares and a restarted worker report missing',async()=>{
  const w=worker();const id=new URL((await w.share('private message')).headers.get('location')).searchParams.get('share');
  w.tick(60000);assert.equal(w.consume(id)[0].type,'SHARE_MISSING');assert.equal(worker().consume(id)[0].type,'SHARE_MISSING');
});
test('Long shares are rejected rather than truncated, including combined fields',async()=>{
  const w=worker();assert.equal(new URL((await w.share('a'.repeat(12001))).headers.get('location')).searchParams.get('share'),'too-long');
  assert.equal(new URL((await w.share('a'.repeat(12000),'title')).headers.get('location')).searchParams.get('share'),'too-long');
  assert.equal(new URL((await w.share('a'.repeat(12000))).headers.get('location')).searchParams.get('share').length,36);
});
test('Empty shares report missing and title/text/url are retained in order',async()=>{
  const w=worker();assert.equal(new URL((await w.share(' ')).headers.get('location')).searchParams.get('share'),'missing');
  const id=new URL((await w.share('Message','Title','https://example.com')).headers.get('location')).searchParams.get('share');
  assert.equal(w.consume(id)[0].text,'Title\nMessage\nhttps://example.com');
});
test('Query-bearing offline navigation uses the cached shell',async()=>{
  const w=worker({cacheEntries:{'/index.html':new Response('<h1>Shield</h1>')}});
  const result=await w.request(new Request('https://shield.example/?share=opaque-id'));
  assert.equal(await result.text(),'<h1>Shield</h1>');
});
test('Missing JS/CSS does not incorrectly receive cached HTML',async()=>{
  const w=worker({cacheEntries:{'/index.html':new Response('html')}});
  assert.equal((await w.request(new Request('https://shield.example/app.js'))).type,'error');
});
test('Network assets cache by pathname without share IDs or query data',async()=>{
  const w=worker({online:true});await w.request(new Request('https://shield.example/?share=opaque-id'));
  assert.deepEqual(w.writes,['/']);
});
test('Cache cleanup preserves unrelated application caches',async()=>{
  const w=worker();let pending;w.handlers.activate({waitUntil:p=>{pending=p;}});await pending;assert.deepEqual(w.deleted,['inx-shield-old']);
});
