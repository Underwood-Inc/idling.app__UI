// Smart Caching Service Worker with Version-Based Cache Busting
const CACHE_VERSION = '0.52.1'; // Will be replaced with package.json version during build
const CACHE_NAME = `idling-app-cache-${CACHE_VERSION}`;
const CACHE_METADATA_NAME = `idling-app-cache-metadata-${CACHE_VERSION}`;

// Cache TTL configurations (in milliseconds)
const CACHE_TTLS = {
  static: 24 * 60 * 60 * 1000,    // 24 hours for static assets
  dynamic: 5 * 60 * 1000,         // 5 minutes for dynamic content
  api: 1 * 60 * 1000,             // 1 minute for API responses
  images: 7 * 24 * 60 * 60 * 1000 // 7 days for images
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png'
];

// Helper function to get app version from headers or fetch
async function getAppVersion() {
  try {
    const response = await fetch('/', { method: 'HEAD' });
    return response.headers.get('X-App-Version') || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Helper function to determine cache TTL based on request
function getCacheTTL(request) {
  const url = new URL(request.url);
  
  // Static assets (JS, CSS, images)
  if (url.pathname.startsWith('/_next/static/') || 
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/.test(url.pathname)) {
    return CACHE_TTLS.static;
  }
  
  // API routes
  if (url.pathname.startsWith('/api/')) {
    return CACHE_TTLS.api;
  }
  
  // Images
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)) {
    return CACHE_TTLS.images;
  }
  
  // Dynamic pages
  return CACHE_TTLS.dynamic;
}

// Helper function to create response with cache metadata
function createResponseWithMetadata(response, ttl) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Timestamp', Date.now().toString());
  headers.set('Cache-TTL', ttl.toString());
  headers.set('SW-Cache-Version', CACHE_VERSION);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Helper function to check if cached response is still valid
function isCacheValid(cachedResponse, ttl) {
  const cacheTimestamp = cachedResponse.headers.get('Cache-Timestamp');
  const cacheVersion = cachedResponse.headers.get('SW-Cache-Version');
  
  if (!cacheTimestamp || cacheVersion !== CACHE_VERSION) {
    return false;
  }
  
  const age = Date.now() - parseInt(cacheTimestamp);
  return age < ttl;
}

// Store cache metadata for UI display
async function storeCacheMetadata(url, timestamp, version) {
  try {
    const metadataCache = await caches.open(CACHE_METADATA_NAME);
    const metadata = {
      url,
      timestamp,
      version,
      cachedAt: new Date().toISOString(),
      cacheVersion: CACHE_VERSION
    };
    
    const response = new Response(JSON.stringify(metadata), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Timestamp': timestamp.toString()
      }
    });
    
    await metadataCache.put(`metadata-${url}`, response);
  } catch (error) {
    console.warn('Failed to store cache metadata:', error);
  }
}

// Install event - cache static assets with version check
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const appVersion = await getAppVersion();
      
      // Cache static assets
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { credentials: 'same-origin' });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`);
          }
          
          const ttl = getCacheTTL({ url });
          const timestampedResponse = createResponseWithMetadata(response, ttl);
          
          await cache.put(url, timestampedResponse);
          await storeCacheMetadata(url, Date.now(), appVersion);
          
          return Promise.resolve();
        } catch (error) {
          console.warn(`Failed to cache ${url}:`, error);
          return Promise.resolve(); // Don't fail installation
        }
      });
      
      await Promise.all(cachePromises);
      
      // Clean up old cache versions
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('idling-app-cache-') && name !== CACHE_NAME
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      
      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        (name.startsWith('idling-app-cache-') && name !== CACHE_NAME) ||
        (name.startsWith('idling-app-cache-metadata-') && name !== CACHE_METADATA_NAME)
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      
      // Take control of all clients
      return self.clients.claim();
    })()
  );
});

// Fetch event - smart caching with version awareness
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip authentication routes - they should never be cached
  if (event.request.url.includes('/api/auth/')) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      const ttl = getCacheTTL(event.request);
      
      // Check if we have a valid cached response
      if (cachedResponse && isCacheValid(cachedResponse, ttl)) {
        // For API routes (excluding auth routes), also check version header
        if (event.request.url.includes('/api/') && !event.request.url.includes('/api/auth/')) {
          try {
            const headResponse = await fetch(event.request.url, { method: 'HEAD' });
            const currentVersion = headResponse.headers.get('X-App-Version');
            const cachedVersion = cachedResponse.headers.get('X-App-Version');
            
            if (currentVersion && cachedVersion && currentVersion !== cachedVersion) {
              // Version mismatch, fetch fresh
              const freshResponse = await fetch(event.request);
              if (freshResponse.ok) {
                const responseToCache = createResponseWithMetadata(freshResponse.clone(), ttl);
                await cache.put(event.request, responseToCache);
                await storeCacheMetadata(event.request.url, Date.now(), currentVersion);
              }
              return freshResponse;
            }
          } catch {
            // If version check fails, use cached response
          }
        }
        
        return cachedResponse;
      }

      // Fetch fresh response
      try {
        const response = await fetch(event.request);
        
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the response
        const responseToCache = createResponseWithMetadata(response.clone(), ttl);
        await cache.put(event.request, responseToCache);
        
        // Store metadata
        const version = response.headers.get('X-App-Version') || 'unknown';
        await storeCacheMetadata(event.request.url, Date.now(), version);

        return response;
      } catch (error) {
        console.warn('Fetch failed:', error);
        
        // Return cached response even if expired, or offline page
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      }
    })()
  );
});

// Message listener for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REFRESH_CACHE') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const metadataCache = await caches.open(CACHE_METADATA_NAME);
          
          // Clear specific URL or all cache
          if (event.data.url) {
            await cache.delete(event.data.url);
            await metadataCache.delete(`metadata-${event.data.url}`);
          } else {
            // Clear all cache
            const keys = await cache.keys();
            await Promise.all(keys.map(key => cache.delete(key)));
            
            const metadataKeys = await metadataCache.keys();
            await Promise.all(metadataKeys.map(key => metadataCache.delete(key)));
          }
          
          // Fetch fresh content if URL specified
          if (event.data.url) {
            const response = await fetch(event.data.url, { 
              cache: 'no-cache',
              headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (response.ok) {
              const ttl = getCacheTTL({ url: event.data.url });
              const timestampedResponse = createResponseWithMetadata(response.clone(), ttl);
              await cache.put(event.data.url, timestampedResponse);
              
              const version = response.headers.get('X-App-Version') || 'unknown';
              await storeCacheMetadata(event.data.url, Date.now(), version);
            }
          }
          
          event.ports[0].postMessage({ 
            success: true, 
            timestamp: Date.now(),
            version: CACHE_VERSION
          });
        } catch (error) {
          console.error('Cache refresh failed:', error);
          event.ports[0].postMessage({ 
            success: false, 
            error: error.message 
          });
        }
      })()
    );
  }
  
  // Get cache info for UI
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          const metadataCache = await caches.open(CACHE_METADATA_NAME);
          
          const cacheInfo = {
            version: CACHE_VERSION,
            totalEntries: keys.length,
            ttls: CACHE_TTLS,
            timestamp: Date.now()
          };
          
          event.ports[0].postMessage({ 
            success: true, 
            cacheInfo 
          });
        } catch (error) {
          event.ports[0].postMessage({ 
            success: false, 
            error: error.message 
          });
        }
      })()
    );
  }
}); 