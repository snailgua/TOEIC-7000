// Minimal offline-first service worker (cache-first for app shell + data).
// Bumped CACHE version on each deploy via the build hash isn't available here,
// so we use a date-ish tag; the install step pre-caches nothing and we cache
// lazily on first fetch, which keeps it robust across Vite's hashed filenames.
const CACHE = "toeic7000-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      // Cache-first for instant offline; revalidate in background.
      return cached || fetchPromise;
    })
  );
});
