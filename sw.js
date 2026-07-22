const CACHE = "pool-tracker-v5";
// Only cache same-origin assets — CDN URLs are cross-origin and will fail addAll
const ASSETS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(ASSETS.map(url =>
        c.add(url).catch(() => {}) // ignore individual failures
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // CDN requests: network first, fall back to cache
  if (!e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // index.html: always network first so updates appear immediately
  if (e.request.url.endsWith("/") || e.request.url.endsWith("/index.html")) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Other local assets: cache first
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
