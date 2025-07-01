// Enhanced Service Worker with Aggressive Cache Management and Registration Cleanup
const CACHE_VERSION = '0.302.0'; // Will be replaced with package.json version during build
const CACHE_NAME = `idling-app-cache-${CACHE_VERSION}`;
const CACHE_METADATA_NAME = `idling-app-cache-metadata-${CACHE_VERSION}`;

// Maximum cache age - NOTHING can be cached longer than 12 hours
const MAX_CACHE_AGE = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const DAILY_REFRESH_KEY = 'sw-daily-refresh';

// ServiceWorker Logger - Embedded for standalone operation
class ServiceWorkerLogger {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      level: 'INFO',
      context: 'ServiceWorker',
      version: CACHE_VERSION,
      ...config
    };
    this.activeGroups = [];
  }

  shouldLog(level) {
    if (!this.config.enabled) return false;
    
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= currentLevelIndex;
  }

  getPrefix() {
    return `🔧 ${this.config.context} v${this.config.version}`;
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString().slice(11, 23);
    const emoji = {
      'DEBUG': '🔍',
      'INFO': 'ℹ️',
      'WARN': '⚠️',
      'ERROR': '❌'
    }[level] || 'ℹ️';
    
    return `${emoji} [${timestamp}] ${this.getPrefix()} ${message}`;
  }

  debug(message, data) {
    if (!this.shouldLog('DEBUG')) return;
    
    const formatted = this.formatMessage('DEBUG', message);
    if (data) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  info(message, data) {
    if (!this.shouldLog('INFO')) return;
    
    const formatted = this.formatMessage('INFO', message);
    if (data) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  warn(message, data) {
    if (!this.shouldLog('WARN')) return;
    
    const formatted = this.formatMessage('WARN', message);
    if (data) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  error(message, error, data) {
    if (!this.shouldLog('ERROR')) return;
    
    const formatted = this.formatMessage('ERROR', message);
    const logData = {
      ...(data || {}),
      ...(error ? { error: this.serializeError(error) } : {})
    };
    
    if (Object.keys(logData).length > 0) {
      console.error(formatted, logData);
    } else {
      console.error(formatted);
    }
  }

  group(title) {
    if (!this.config.enabled) return;
    
    this.activeGroups.push(title);
    const formatted = `${this.getPrefix()} ${title}`;
    
    // Always use collapsed groups by default for cleaner output
    if (console.groupCollapsed) {
      console.groupCollapsed(formatted);
    } else if (console.group) {
      console.group(formatted);
    }
  }

  groupEnd() {
    if (!this.config.enabled || this.activeGroups.length === 0) return;
    
    this.activeGroups.pop();
    
    // Always call groupEnd to properly close groups and prevent nesting
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  serializeError(error) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    return error;
  }

  // Cache-specific logging methods
  cacheExpired(url, age, maxAge) {
    this.info('Cache expired', { 
      url, 
      age: `${age}ms`, 
      maxAge: `${maxAge}ms`,
      expired: age > maxAge
    });
  }

  cacheStored(url, ttl) {
    this.debug('Cache stored', { 
      url, 
      ttl: `${Math.round(ttl / 1000 / 60)}min` 
    });
  }

  cleanup(operation, count) {
    this.info(`Cleanup: ${operation}`, { count });
  }

  registration(event, details) {
    this.info(`Registration: ${event}`, details);
  }
}

// Initialize logger
const logger = new ServiceWorkerLogger();

// Cache TTL configurations (all limited to MAX_CACHE_AGE)
const CACHE_TTLS = {
  static: Math.min(6 * 60 * 60 * 1000, MAX_CACHE_AGE),    // 6 hours for static assets
  dynamic: Math.min(2 * 60 * 60 * 1000, MAX_CACHE_AGE),   // 2 hours for dynamic content  
  api: Math.min(30 * 60 * 1000, MAX_CACHE_AGE),           // 30 minutes for API responses
  images: Math.min(4 * 60 * 60 * 1000, MAX_CACHE_AGE),    // 4 hours for images
  pages: Math.min(1 * 60 * 60 * 1000, MAX_CACHE_AGE)      // 1 hour for pages
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

// Helper function to check if we need a daily refresh
function shouldPerformDailyRefresh() {
  try {
    const lastRefresh = localStorage.getItem(DAILY_REFRESH_KEY);
    if (!lastRefresh) return true;
    
    const lastRefreshTime = parseInt(lastRefresh);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return (now - lastRefreshTime) > oneDayMs;
  } catch (e) {
    return true; // Default to refresh if we can't check
  }
}

// Helper function to mark daily refresh as completed
function markDailyRefreshCompleted() {
  try {
    localStorage.setItem(DAILY_REFRESH_KEY, Date.now().toString());
  } catch (e) {
    // Silent fail if localStorage unavailable
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
  
  // API routes (shorter cache for dynamic data)
  if (url.pathname.startsWith('/api/')) {
    return CACHE_TTLS.api;
  }
  
  // Images
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)) {
    return CACHE_TTLS.images;
  }
  
  // HTML pages
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    return CACHE_TTLS.pages;
  }
  
  // Default to dynamic content TTL
  return CACHE_TTLS.dynamic;
}

// Helper function to create response with cache metadata
function createResponseWithMetadata(response, ttl) {
  const headers = new Headers(response.headers);
  const now = Date.now();
  
  headers.set('Cache-Timestamp', now.toString());
  headers.set('Cache-TTL', ttl.toString());
  headers.set('SW-Cache-Version', CACHE_VERSION);
  headers.set('Cache-Expires', (now + ttl).toString());
  headers.set('Max-Cache-Age', MAX_CACHE_AGE.toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Enhanced cache validation with strict 12-hour limit
function isCacheValid(cachedResponse, ttl) {
  const cacheTimestamp = cachedResponse.headers.get('Cache-Timestamp');
  const cacheVersion = cachedResponse.headers.get('SW-Cache-Version');
  const cacheExpires = cachedResponse.headers.get('Cache-Expires');
  
  if (!cacheTimestamp || cacheVersion !== CACHE_VERSION) {
    return false;
  }
  
  const now = Date.now();
  const timestamp = parseInt(cacheTimestamp);
  const expires = parseInt(cacheExpires || '0');
  
  // Check if cache is older than maximum allowed age (12 hours)
  const age = now - timestamp;
  if (age > MAX_CACHE_AGE) {
    logger.cacheExpired('cache entry', age, MAX_CACHE_AGE);
    return false;
  }
  
  // Check if cache has exceeded its specific TTL
  if (age > ttl) {
    return false;
  }
  
  // Check explicit expiration time
  if (expires > 0 && now > expires) {
    return false;
  }
  
  return true;
}

// Aggressive cleanup of old service workers and caches
async function cleanupOldServiceWorkers() {
  try {
    logger.group('Service Worker Cleanup');
    
    // Get all registrations
    const registrations = await self.registration.scope ? 
      [self.registration] : 
      await navigator.serviceWorker?.getRegistrations() || [];
    
    logger.info('Found service worker registrations', { count: registrations.length });
    
    // Unregister old service workers (keep only current)
    for (const registration of registrations) {
      if (registration !== self.registration) {
        try {
          await registration.unregister();
          logger.info('Unregistered old service worker');
        } catch (e) {
          logger.warn('Failed to unregister old service worker', { error: e });
        }
      }
    }
    
    // Clean up ALL old caches (be aggressive)
    const cacheNames = await caches.keys();
    const currentCaches = [CACHE_NAME, CACHE_METADATA_NAME];
    const oldCaches = cacheNames.filter(name => !currentCaches.includes(name));
    
    if (oldCaches.length > 0) {
      logger.cleanup('old caches', oldCaches.length);
      await Promise.all(oldCaches.map(async (name) => {
        try {
          await caches.delete(name);
          logger.debug('Deleted cache', { name });
        } catch (e) {
          logger.warn('Failed to delete cache', { name, error: e });
        }
      }));
    }
    
    logger.info('Service worker cleanup completed');
    logger.groupEnd();
  } catch (error) {
    logger.error('Service worker cleanup failed', error);
    logger.groupEnd();
  }
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
      cacheVersion: CACHE_VERSION,
      maxAge: MAX_CACHE_AGE,
      expiresAt: new Date(timestamp + MAX_CACHE_AGE).toISOString()
    };
    
    const response = new Response(JSON.stringify(metadata), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Timestamp': timestamp.toString(),
        'Cache-Expires': (timestamp + MAX_CACHE_AGE).toString()
      }
    });
    
    // Use a simple string key to avoid URL scheme issues
    const cacheKey = `metadata-cache-${btoa(url).replace(/[+/=]/g, '')}`;
    await metadataCache.put(new Request(cacheKey), response);
  } catch (error) {
    logger.warn('Failed to store cache metadata', { error });
  }
}

// Install event - cache static assets with aggressive cleanup
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      logger.group('Service Worker Install');
      logger.registration('install', { version: CACHE_VERSION });
      
      // Immediately clean up old service workers and caches
      await cleanupOldServiceWorkers();
      
      const cache = await caches.open(CACHE_NAME);
      const now = Date.now();
      
      // Check if daily refresh is needed
      const needsDailyRefresh = shouldPerformDailyRefresh();
      if (needsDailyRefresh) {
        logger.info('Daily refresh required - clearing all caches');
        
        // Clear current cache for fresh start
        const keys = await cache.keys();
        await Promise.all(keys.map(key => cache.delete(key)));
        
        markDailyRefreshCompleted();
      }
      
      // Cache static assets with timestamp
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { 
            credentials: 'same-origin',
            cache: 'no-cache' // Force fresh fetch
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
          }
          
          const ttl = getCacheTTL({ url });
          const timestampedResponse = createResponseWithMetadata(response, ttl);
          
          await cache.put(url, timestampedResponse);
          await storeCacheMetadata(url, now, CACHE_VERSION);
          
          logger.cacheStored(url, ttl);
          return Promise.resolve();
        } catch (error) {
          logger.warn('Failed to cache asset', { url, error });
          return Promise.resolve(); // Don't fail installation
        }
      });
      
      await Promise.all(cachePromises);
      
      logger.info('Service worker installation complete');
      logger.groupEnd();
      
      // Skip waiting to activate immediately and take control
      self.skipWaiting();
    })()
  );
});

// Activate event - aggressive cleanup and immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      logger.group('Service Worker Activate');
      logger.registration('activate', { version: CACHE_VERSION });
      
      // Perform another cleanup during activation
      await cleanupOldServiceWorkers();
      
      // Immediately take control of all clients
      logger.info('Taking control of all clients');
      await self.clients.claim();
      
      // Notify all clients of the new service worker
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: CACHE_VERSION,
          timestamp: Date.now()
        });
      });
      
      logger.info('Service worker activation complete');
      logger.groupEnd();
    })()
  );
});

// Enhanced fetch event with strict cache management
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
      const now = Date.now();
      
      // Check if we have a valid cached response
      if (cachedResponse && isCacheValid(cachedResponse, ttl)) {
        // For critical paths, also verify freshness with HEAD request
        if (event.request.url.includes('/api/') && !event.request.url.includes('/api/auth/')) {
          try {
            const headResponse = await fetch(event.request.url, { 
              method: 'HEAD',
              cache: 'no-cache'
            });
            
            const currentVersion = headResponse.headers.get('X-App-Version');
            const cachedVersion = cachedResponse.headers.get('X-App-Version');
            
            if (currentVersion && cachedVersion && currentVersion !== cachedVersion) {
              logger.info('Version mismatch detected', { 
                url: event.request.url,
                cached: cachedVersion,
                current: currentVersion
              });
              
              // Version mismatch, fetch fresh
              const freshResponse = await fetch(event.request, { cache: 'no-cache' });
              if (freshResponse.ok) {
                const responseToCache = createResponseWithMetadata(freshResponse.clone(), ttl);
                await cache.put(event.request, responseToCache);
                await storeCacheMetadata(event.request.url, now, currentVersion);
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
        const response = await fetch(event.request, {
          cache: 'no-cache' // Always fetch fresh for better reliability
        });
        
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the response with metadata
        const responseToCache = createResponseWithMetadata(response.clone(), ttl);
        await cache.put(event.request, responseToCache);
        
        // Store metadata
        const version = response.headers.get('X-App-Version') || CACHE_VERSION;
        await storeCacheMetadata(event.request.url, now, version);

        return response;
      } catch (error) {
        logger.warn('Fetch failed', { url: event.request.url, error });
        
        // Return cached response even if expired, or offline page
        if (cachedResponse) {
          logger.info('Returning stale cached response due to network error');
          return cachedResponse;
        }
        
        logger.info('Returning offline page');
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      }
    })()
  );
});

// Enhanced message listener for cache management
self.addEventListener('message', (event) => {
  // Handle skip waiting message
  if (event.data && event.data.type === 'SKIP_WAITING') {
    logger.info('Skipping waiting and activating immediately');
    self.skipWaiting();
    return;
  }
  
  // Handle cache refresh with cleanup
  if (event.data && event.data.type === 'REFRESH_CACHE') {
    event.waitUntil(
      (async () => {
        logger.group('Service Worker Cache Refresh');
        
        try {
          const cache = await caches.open(CACHE_NAME);
          const metadataCache = await caches.open(CACHE_METADATA_NAME);
          
          if (event.data.url) {
            // Refresh specific URL
            logger.info('Refreshing cache for specific URL', { url: event.data.url });
            await cache.delete(event.data.url);
            await metadataCache.delete(`metadata-${event.data.url}`);
            
            // Fetch fresh content
            const response = await fetch(event.data.url, { cache: 'no-cache' });
            if (response.ok) {
              const ttl = getCacheTTL({ url: event.data.url });
              const timestampedResponse = createResponseWithMetadata(response.clone(), ttl);
              await cache.put(event.data.url, timestampedResponse);
              await storeCacheMetadata(event.data.url, Date.now(), CACHE_VERSION);
            }
          } else {
            // Clear all cache and mark for daily refresh
            logger.info('Clearing all cache');
            const keys = await cache.keys();
            await Promise.all(keys.map(key => cache.delete(key)));
            
            const metadataKeys = await metadataCache.keys();
            await Promise.all(metadataKeys.map(key => metadataCache.delete(key)));
            
            // Mark daily refresh as completed
            markDailyRefreshCompleted();
          }
          
          logger.info('Cache refresh completed');
          logger.groupEnd();
          
          event.ports[0]?.postMessage({ 
            success: true, 
            timestamp: Date.now(),
            version: CACHE_VERSION
          });
        } catch (error) {
          logger.error('Cache refresh failed', error);
          logger.groupEnd();
          
          event.ports[0]?.postMessage({ 
            success: false, 
            error: error.message 
          });
        }
      })()
    );
  }
  
  // Get enhanced cache info
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          const now = Date.now();
          
          // Calculate cache statistics
          let expiredCount = 0;
          let validCount = 0;
          
          for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
              const ttl = getCacheTTL(request);
              if (isCacheValid(response, ttl)) {
                validCount++;
              } else {
                expiredCount++;
              }
            }
          }
          
          const cacheInfo = {
            version: CACHE_VERSION,
            totalEntries: keys.length,
            validEntries: validCount,
            expiredEntries: expiredCount,
            maxCacheAge: MAX_CACHE_AGE,
            ttls: CACHE_TTLS,
            timestamp: now,
            lastDailyRefresh: localStorage.getItem(DAILY_REFRESH_KEY),
            nextDailyRefresh: shouldPerformDailyRefresh() ? 'Due now' : 'Within 24 hours'
          };
          
          event.ports[0]?.postMessage({ 
            success: true, 
            cacheInfo 
          });
        } catch (error) {
          event.ports[0]?.postMessage({ 
            success: false, 
            error: error.message 
          });
        }
      })()
    );
  }

  // Force cleanup of old caches
  if (event.data && event.data.type === 'CLEANUP_OLD_CACHES') {
    event.waitUntil(cleanupOldServiceWorkers());
  }
}); 