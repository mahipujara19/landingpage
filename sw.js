// ==================================================
// BREW HAVEN SERVICE WORKER
// Bump CACHE_VERSION whenever you change HTML/CSS/JS/images
// so visitors pick up the new files.
// ==================================================
const CACHE_VERSION = "v3";
const CACHE_NAME = `brew-haven-${CACHE_VERSION}`;

const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./assets/logo.jpg",
    "./assets/mainlogo.jpg",
    "./assets/latte.jpg",
    "./assets/capp.jpg",
    "./assets/ameri.jpg",
    "./assets/mocha.jpg",
    "./assets/coldbrew.jpg",
    "./assets/cc.jpg",
    "./assets/artson.jpg"
];

// Install: download the core files so the site works offline
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate: remove caches from older versions
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith("brew-haven-") && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle our own GET requests. Form posts, reCAPTCHA and the map go straight to the network.
    if (request.method !== "GET" || url.origin !== self.location.origin) return;

    // Pages: network first so content stays fresh, cached copy when offline
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
                    }
                    return response;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    // Static assets: stale-while-revalidate (serve cache instantly, refresh in background)
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(request).then(cached => {
                const network = fetch(request)
                    .then(response => {
                        if (response.ok) cache.put(request, response.clone());
                        return response;
                    })
                    .catch(() => cached);
                return cached || network;
            })
        )
    );
});
