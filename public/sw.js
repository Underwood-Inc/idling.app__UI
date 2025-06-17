const CACHE_NAME = 'idling-app-cache-v1';
const CACHE_METADATA_NAME = 'idling-app-cache-metadata-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
];

// Helper function to store cache metadata
async function storeCacheMetadata(url, timestamp) {
  try {
    const metadataCache = await caches.open(CACHE_METADATA_NAME);
    const metadataResponse = new Response(JSON.stringify({
      url,
      timestamp,
      cachedAt: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Timestamp': timestamp.toString()
      }
    });
    await metadataCache.put(`metadata-${url}`, metadataResponse);
  } catch (error) {
    console.warn('Failed to store cache metadata:', error);
  }
}

// Helper function to create response with cache timestamp
function createResponseWithTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Timestamp', Date.now().toString());
  headers.set('Cache-Date', new Date().toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((url) => {
          return fetch(url, { credentials: 'same-origin' })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${url}`);
              }
              
              const timestampedResponse = createResponseWithTimestamp(response);
              const timestamp = Date.now();
              
              // Store both the response and metadata
              storeCacheMetadata(url, timestamp);
              
              return cache.put(url, timestampedResponse);
            })
            .catch((error) => {
              console.warn(`Failed to cache ${url}:`, error);
              // Don't fail the installation if a single asset fails to cache
              return Promise.resolve();
            });
        })
      );
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== CACHE_METADATA_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API routes
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();
          const timestampedResponse = createResponseWithTimestamp(responseToCache);
          const timestamp = Date.now();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, timestampedResponse);
            // Store metadata for this cached item
            storeCacheMetadata(event.request.url, timestamp);
          });

          return response;
        })
        .catch((error) => {
          console.warn('Fetch failed:', error);
          // Return a fallback response if available
          return caches.match('/offline.html');
        });
    })
  );
});

// Add message listener for cache refresh requests from the UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REFRESH_CACHE') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const metadataCache = await caches.open(CACHE_METADATA_NAME);
          
          // Clear existing cache for this URL
          await cache.delete(event.data.url);
          await metadataCache.delete(`metadata-${event.data.url}`);
          
          // Fetch fresh content
          const response = await fetch(event.data.url, { 
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          if (response.ok) {
            const timestampedResponse = createResponseWithTimestamp(response.clone());
            const timestamp = Date.now();
            
            await cache.put(event.data.url, timestampedResponse);
            await storeCacheMetadata(event.data.url, timestamp);
            
            // Notify the client that refresh is complete
            event.ports[0].postMessage({ success: true, timestamp });
          } else {
            event.ports[0].postMessage({ success: false, error: 'Failed to fetch' });
          }
        } catch (error) {
          console.error('Cache refresh failed:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })()
    );
  }
}); 