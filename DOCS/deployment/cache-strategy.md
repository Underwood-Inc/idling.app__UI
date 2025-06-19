---
title: "Production Cache Strategy"
description: "Comprehensive caching strategy for production deployment"
category: deployment
layout: default
nav_order: 3
---

# Production Cache Strategy

This document outlines the comprehensive caching strategy for production deployment, covering all layers from CDN to database.

## Cache Architecture Overview

Our multi-layer caching strategy provides optimal performance and user experience:

```
User Request → CDN → Next.js Cache → Application Cache → Database
```

## CDN Layer (Cloudflare/Vercel)

### Static Assets
- **Cache Duration**: 1 year (31536000 seconds)
- **Files**: CSS, JS, images, fonts
- **Headers**: `Cache-Control: public, max-age=31536000, immutable`

### HTML Pages
- **Cache Duration**: 1 hour (3600 seconds)
- **Revalidation**: Stale-while-revalidate
- **Headers**: `Cache-Control: public, max-age=3600, s-maxage=3600`

### API Routes
- **Cache Duration**: Varies by endpoint
- **Dynamic content**: No cache
- **Static data**: 5-15 minutes

## Next.js Cache Layer

### Static Generation (SSG)

```javascript
// pages/posts/index.js
export async function getStaticProps() {
  return {
    props: { posts },
    revalidate: 300 // 5 minutes
  };
}
```

### Server-Side Rendering (SSR)

```javascript
// pages/posts/[id].js
export async function getServerSideProps({ req, res }) {
  // Set cache headers
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=300'
  );
  
  return { props: { post } };
}
```

### Incremental Static Regeneration (ISR)

- **Trigger**: On-demand revalidation
- **Fallback**: Show stale content while regenerating
- **Frequency**: 5-15 minutes depending on content type

## Application Cache Layer

### In-Memory Caching

```javascript
// lib/cache.js
const cache = new Map();

export function getCached(key, ttl = 300000) { // 5 minutes default
  const item = cache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

export function setCached(key, data, ttl = 300000) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}
```

### Redis Caching (Future)

For horizontal scaling:

```javascript
// lib/redis-cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getFromRedis(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setInRedis(key, data, ttl = 300) {
  await redis.setex(key, ttl, JSON.stringify(data));
}
```

## Database Query Optimization

### Materialized Views

```sql
-- Refresh materialized views periodically
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  author_id,
  COUNT(*) as post_count,
  MAX(created_at) as last_post
FROM submissions 
GROUP BY author_id;

-- Refresh every hour via cron job
REFRESH MATERIALIZED VIEW user_stats;
```

### Query Result Caching

```javascript
// lib/db-cache.js
const queryCache = new Map();

export async function cachedQuery(sql, params, ttl = 300000) {
  const key = `${sql}:${JSON.stringify(params)}`;
  
  let result = getCached(key);
  if (!result) {
    result = await db.query(sql, params);
    setCached(key, result, ttl);
  }
  
  return result;
}
```

## Cache Invalidation Strategy

### Time-Based Invalidation

```javascript
// Different TTL for different content types
const CACHE_TTL = {
  USER_PROFILE: 15 * 60 * 1000,    // 15 minutes
  POST_LIST: 5 * 60 * 1000,        // 5 minutes
  POST_CONTENT: 10 * 60 * 1000,    // 10 minutes
  STATIC_DATA: 60 * 60 * 1000      // 1 hour
};
```

### Event-Based Invalidation

```javascript
// lib/cache-invalidation.js
export function invalidateUserCache(userId) {
  // Clear user-specific caches
  cache.delete(`user:${userId}`);
  cache.delete(`user:${userId}:posts`);
  
  // Clear related caches
  cache.delete('recent-posts');
  cache.delete('user-list');
}

export function invalidatePostCache(postId) {
  cache.delete(`post:${postId}`);
  cache.delete('recent-posts');
  cache.delete('trending-posts');
}
```

### Tag-Based Invalidation

```javascript
// lib/tagged-cache.js
const taggedCache = new Map();
const tags = new Map();

export function setWithTags(key, data, cacheTags, ttl) {
  setCached(key, data, ttl);
  
  cacheTags.forEach(tag => {
    if (!tags.has(tag)) tags.set(tag, new Set());
    tags.get(tag).add(key);
  });
}

export function invalidateByTag(tag) {
  const keys = tags.get(tag);
  if (keys) {
    keys.forEach(key => cache.delete(key));
    tags.delete(tag);
  }
}
```

## Performance Monitoring

### Cache Hit Rates

```javascript
// lib/cache-metrics.js
let metrics = {
  hits: 0,
  misses: 0,
  total: 0
};

export function recordHit() {
  metrics.hits++;
  metrics.total++;
}

export function recordMiss() {
  metrics.misses++;
  metrics.total++;
}

export function getCacheStats() {
  return {
    ...metrics,
    hitRate: metrics.total > 0 ? metrics.hits / metrics.total : 0
  };
}
```

### Performance Alerts

```javascript
// Monitor cache performance
setInterval(() => {
  const stats = getCacheStats();
  
  if (stats.hitRate < 0.7) { // Less than 70% hit rate
    console.warn('Low cache hit rate:', stats);
    // Send alert to monitoring service
  }
}, 60000); // Check every minute
```

## Environment-Specific Configuration

### Development
```javascript
const CACHE_CONFIG = {
  enabled: false, // Disable for development
  ttl: 1000,     // Short TTL for testing
  debug: true    // Enable cache debugging
};
```

### Staging
```javascript
const CACHE_CONFIG = {
  enabled: true,
  ttl: 60000,    // 1 minute TTL
  debug: true    // Keep debugging enabled
};
```

### Production
```javascript
const CACHE_CONFIG = {
  enabled: true,
  ttl: 300000,   // 5 minute TTL
  debug: false   // Disable debugging
};
```

## Cache Headers Reference

### Static Assets
```
Cache-Control: public, max-age=31536000, immutable
ETag: "hash-of-content"
```

### Dynamic Content
```
Cache-Control: public, max-age=300, s-maxage=300
Vary: Accept-Encoding, Accept-Language
```

### Private Content
```
Cache-Control: private, max-age=0, no-cache, no-store
```

### API Responses
```
Cache-Control: public, max-age=60, stale-while-revalidate=300
ETag: "response-hash"
```

## Best Practices

### Do's
- ✅ Use appropriate TTL for content type
- ✅ Implement cache warming strategies
- ✅ Monitor cache hit rates
- ✅ Use ETags for conditional requests
- ✅ Implement graceful degradation

### Don'ts
- ❌ Cache user-specific data globally
- ❌ Set infinite cache durations
- ❌ Ignore cache invalidation
- ❌ Cache error responses
- ❌ Over-cache dynamic content

## Troubleshooting

### Common Issues

**Low Hit Rates**
- Check TTL settings
- Verify cache key generation
- Monitor invalidation frequency

**Stale Data**
- Review invalidation logic
- Check cache expiration
- Verify update triggers

**Memory Usage**
- Monitor cache size
- Implement LRU eviction
- Set memory limits

### Debugging Tools

```javascript
// Enable cache debugging
process.env.CACHE_DEBUG = 'true';

// Cache inspection utilities
export function inspectCache() {
  console.table(Array.from(cache.entries()));
}

export function clearAllCache() {
  cache.clear();
  console.log('All cache cleared');
}
```

## Related Documentation

- [Cache Management](cache-management.md)
- [Performance Optimization](../development/optimization.md)
- [Monitoring and Alerts](monitoring.md) 