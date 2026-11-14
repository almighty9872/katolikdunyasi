// Verbum Domini offline reading. The Bible's books (bible/*.json) are kept once fetched and served from the cache first;
// everything else comes from the network, with the last copy used when there is no connection.
var BIBLE='vd-bible-v7',SITE='vd-site-v1';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(K){return Promise.all(K.filter(function(k){return k!==BIBLE&&k!==SITE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return;
  if(/\/bible\/(?!ccc\.json)[^?]+\.json$/.test(u.pathname)){e.respondWith(caches.open(BIBLE).then(function(c){return c.match(r).then(function(hit){return hit||fetch(r).then(function(n){if(n.ok)c.put(r,n.clone());return n})})}));return}
  e.respondWith(fetch(r).then(function(n){if(n.ok){var cp=n.clone();caches.open(SITE).then(function(c){c.put(r,cp)})}return n}).catch(function(){return caches.match(r).then(function(hit){return hit||(r.mode==='navigate'?caches.match('./'):Response.error())})}))});
