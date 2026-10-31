const CACHE = 'inx-shield-__BUILD__';
const ASSETS = ['/', '/index.html','/app.js','/styles.css','/icon.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'];
const shares = new Map();
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('inx-shield-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname==='/share'&&event.request.method==='POST'){
    event.respondWith((async()=>{try{const data=await event.request.formData();const text=['title','text','url'].map(k=>data.get(k)).filter(v=>typeof v==='string').join('\n').slice(0,12000);const id=crypto.randomUUID();for(const [key,value] of shares)if(Date.now()-value.created>60000)shares.delete(key);shares.set(id,{text,created:Date.now()});return Response.redirect(new URL('/?share='+id,self.location.origin).href,303);}catch{return Response.redirect(new URL('/?share=missing',self.location.origin).href,303);}})());return;
  }
  if(event.request.method!=='GET'||!ASSETS.includes(url.pathname))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>await caches.match(event.request)||await caches.match('/index.html')));
});
self.addEventListener('message',event=>{if(event.data?.type==='GET_SHARE'){const value=shares.get(event.data.id);shares.delete(event.data.id);if(value&&Date.now()-value.created<60000)event.source?.postMessage({type:'SHARED_MESSAGE',text:value.text});else event.source?.postMessage({type:'SHARE_MISSING'});}});
