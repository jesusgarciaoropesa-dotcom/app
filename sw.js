// Service Worker — Hostal La Plata PWA
const CACHE = 'hostal-la-plata-v2';
const ASSETS = ['/app/index.html', '/app/manifest.json', '/app/icon-192.png', '/app/icon-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if(url.indexOf('supabase.co') !== -1 || url.indexOf('workers.dev') !== -1) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(err){} });
      return res;
    }).catch(function(){ return caches.match(e.request); })
  );
});
