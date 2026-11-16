const CACHE='bugetul-meu-iphone-v31.0.0',ASSETS=['./','./index.html','./app.css','./core.js','./features.js','./dashboard.js','./reports.js','./crud.js','./security-ui.js','./v28.js','./bon-parser.js','./scanner.js','./produse.js','./main.js','./store.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('bugetul-meu-iphone-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;e.respondWith((async()=>{const c=await caches.open(CACHE);
/* fișierele mari ale cititorului de text (tesseract*, worker.min.js, ron.traineddata) se descarcă o singură dată și apoi se citesc din cache */
if(/(tesseract|worker\.min|traineddata)/.test(new URL(r.url).pathname)){const h=await caches.match(r);if(h)return h;const f=await fetch(r);if(f.ok){const o=await caches.open('bugetul-meu-ocr-v1');o.put(r,f.clone())}return f}
try{const f=await fetch(r,{cache:'no-store'});if(f.ok)c.put(r,f.clone());return f}catch{return await c.match(r)||await c.match('./index.html')||Response.error()}})())});
