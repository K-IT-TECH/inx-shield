const CACHE = 'inx-shield-__BUILD__';
const ASSETS = ['/', '/index.html', '/app.js', '/styles.css', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];
// Ephemeral only: no message bodies in caches, storage or URLs.
const shares = new Map();
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('inx-shield-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith((async () => {
      const redirect = id => Response.redirect(new URL('/?share=' + id, self.location.origin).href, 303);
      try {
        const data = await event.request.formData();
        const text = ['title', 'text', 'url'].map(key => data.get(key)).filter(value => typeof value === 'string' && value.trim()).join('\n');
        if (!text.trim()) return redirect('missing');
        // Do not silently discard the end of a message and show a reassuring result.
        if (text.length > 12000) return redirect('too-long');
        for (const [key, value] of shares) if (Date.now() - value.created >= 60000) shares.delete(key);
        if (shares.size >= 10) shares.delete(shares.keys().next().value);
        const id = crypto.randomUUID();
        shares.set(id, {text, created:Date.now()});
        return redirect(id);
      } catch { return redirect('missing'); }
    })());
    return;
  }
  if (event.request.method !== 'GET' || !ASSETS.includes(url.pathname)) return;
  const key = url.pathname;
  const network = fetch(event.request);
  event.waitUntil(network.then(async response => {
    if (response.ok) { const copy = response.clone(); const cache = await caches.open(CACHE); await cache.put(key, copy); }
  }).catch(() => {}));
  // Query strings must not create cache entries containing share IDs. Missing JS/CSS
  // must not fall back to HTML and fail with a misleading MIME error.
  event.respondWith(network.catch(async () => await caches.match(key) || ((key === '/' || key === '/index.html') && await caches.match('/index.html')) || Response.error()));
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'GET_SHARE' || typeof event.data.id !== 'string') return;
  // Only a controlled app window may consume a one-time share.
  if (!event.source || new URL(event.source.url).origin !== self.location.origin) return;
  const value = shares.get(event.data.id);
  shares.delete(event.data.id);
  if (value && Date.now() - value.created < 60000) event.source.postMessage({type:'SHARED_MESSAGE',text:value.text});
  else event.source.postMessage({type:'SHARE_MISSING'});
});
