const CACHE='bugetul-meu-iphone-v8.0.0';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bugetul-meu-iphone-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{if(x.ok){const copy=x.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy))}return x}).catch(()=>caches.match('./index.html')));return;}e.respondWith(caches.match(r).then(x=>x||fetch(r)))});
