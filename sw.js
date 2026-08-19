/**
 * sw.js - MedBento AI Progressive Web App Service Worker
 * Provides offline caching, lightning-fast reloads, and background synchronization.
 */

const CACHE_NAME = "medbento-pwa-v1.1.3";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/manifest.json",
  "/css/style.css",
  "/js/app.js",
  "/js/card_slicer.js",
  "/js/exporter.js",
  "/js/medical_analyzer.js",
  "/js/pdf_extractor.js",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // External CDN libraries cached for offline use
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js"
];

// 1. Install Event: Pre-cache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline WebApp shell assets...");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[ServiceWorker] Pre-cache partial warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Smart Routing
// - API routes (/api/*): Network First
// - Static assets & CDN: Stale-While-Revalidate or Cache First
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass non-GET requests and browser extensions
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Network-First for API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "网络离线模式：当前设备未连接网络，请检查网络连接。" }),
          { headers: { "Content-Type": "application/json; charset=utf-8" } }
        );
      })
    );
    return;
  }

  // Stale-While-Revalidate for Static Assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type !== "opaque") {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // If network fails and no cache, return offline fallback if requesting page
            if (!cachedResponse && event.request.mode === "navigate") {
              return cache.match("/index.html");
            }
            return null;
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
