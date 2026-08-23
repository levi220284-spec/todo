// Bump this version string every time you redeploy changed files.
// Changing it forces the service worker to throw out the old cache
// and store fresh copies instead of serving stale ones forever.
const CACHE_NAME = 'sefat-tasks-v1';

// Every file the app needs to fully load with zero internet.
const APP_SHELL = [
    './sefat.html',
    './sefat.css',
    './sefat.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Runs once when the service worker is first installed.
// Downloads and stores every app-shell file into a named cache.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Runs after install. Deletes any old cache versions left over
// from a previous deploy so storage doesn't pile up.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Runs on every network request the page makes (HTML, CSS, JS, etc).
// Strategy: try the cache first (works offline instantly), and only
// fall back to the real network if the file isn't cached yet.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
