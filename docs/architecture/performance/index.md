---
layout: default
title: '📊 Performance'
description: 'Performance optimization strategies and implementation'
nav_order: 3
parent: '🏗️ Architecture'
grand_parent: '📚 Documentation'
---

# 📊 Performance

Comprehensive performance optimization strategies for Idling.app covering frontend, backend, and infrastructure optimizations.

## Performance Overview

Our performance strategy focuses on **Core Web Vitals** and **user experience metrics**:

- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to First Byte (TTFB)**: < 600 milliseconds

## Frontend Performance

### Next.js Optimizations

#### Static Site Generation (SSG)

```typescript
// Pre-generate pages at build time
export async function getStaticProps() {
  const data = await fetchData();
  return {
    props: { data },
    revalidate: 3600 // Regenerate every hour
  };
}
```

#### Server-Side Rendering (SSR)

```typescript
// Server-side rendering for dynamic content
export async function getServerSideProps(context) {
  const data = await fetchUserData(context.req);
  return { props: { data } };
}
```

#### Incremental Static Regeneration (ISR)

```typescript
// Hybrid approach for dynamic static content
export async function getStaticProps() {
  return {
    props: { data: await fetchData() },
    revalidate: 60 // Regenerate every minute
  };
}
```

### Code Splitting & Lazy Loading

#### Component-Level Splitting

```typescript
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

#### Route-Level Splitting

```typescript
// Automatic code splitting with Next.js App Router
// Each page is automatically split into separate bundles
```

### Image Optimization

#### Next.js Image Component

```typescript
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority // Load above-the-fold images first
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### Responsive Images

```typescript
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

### Bundle Optimization

#### Webpack Bundle Analyzer

```bash
npm run build:analyze
```

#### Tree Shaking

```typescript
// Import only what you need
import { debounce } from 'lodash/debounce';
// Instead of: import _ from 'lodash'
```

## Backend Performance

### Database Optimization

#### Query Optimization

```sql
-- Use indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Optimize complex queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

#### Connection Pooling

```typescript
// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

#### Database Caching

```typescript
// Redis caching layer
const getCachedUser = async (id: string) => {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.user.findUnique({ where: { id } });
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
};
```

### API Performance

#### Response Caching

```typescript
// Cache API responses
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = `api:${searchParams.toString()}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
  }

  const data = await fetchData();
  await redis.setex(cacheKey, 3600, JSON.stringify(data));

  return Response.json(data);
}
```

#### Compression

```typescript
// Enable gzip compression
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      return compression.filter(req, res);
    }
  })
);
```

### Async Processing

#### Background Jobs

```typescript
// Queue heavy operations
import { Queue } from 'bull';

const emailQueue = new Queue('email processing', {
  redis: { host: 'localhost', port: 6379 }
});

// Add job to queue
await emailQueue.add('send-welcome-email', {
  userId: user.id
});

// Process jobs
emailQueue.process('send-welcome-email', async (job) => {
  await sendWelcomeEmail(job.data.userId);
});
```

## Caching Strategy

### Multi-Layer Caching

#### Browser Caching

```typescript
// Set appropriate cache headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      ETag: generateETag(data),
      'Last-Modified': new Date().toUTCString()
    }
  });
}
```

#### CDN Caching

```typescript
// Cloudflare/CDN configuration
const cdnConfig = {
  cacheTtl: 86400, // 24 hours
  browserTtl: 3600, // 1 hour
  edgeTtl: 86400, // 24 hours
  bypassCacheOnCookie: true
};
```

#### Application Caching

```typescript
// In-memory caching with TTL
const cache = new Map();

const getCachedData = (key: string) => {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any, ttl: number) => {
  cache.set(key, {
    data,
    expires: Date.now() + ttl
  });
};
```

## Performance Monitoring

### Core Web Vitals Tracking

```typescript
// Track performance metrics
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Real User Monitoring (RUM)

```typescript
// Send performance data to analytics
const sendToAnalytics = (metric) => {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric)
  });
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

### Server Performance Monitoring

```typescript
// Monitor API response times
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);

    // Send to monitoring service
    metrics.timing('api.response_time', duration, {
      method: req.method,
      route: req.route?.path
    });
  });

  next();
};
```

## Infrastructure Performance

### Load Balancing

```nginx
# NGINX load balancer configuration
upstream app_servers {
    server app1:3000 weight=3;
    server app2:3000 weight=2;
    server app3:3000 weight=1;
}

server {
    listen 80;
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Scaling

```typescript
// Read/write splitting
const readDB = new Pool({ host: 'read-replica' });
const writeDB = new Pool({ host: 'master' });

const getUser = (id: string) =>
  readDB.query('SELECT * FROM users WHERE id = $1', [id]);
const createUser = (data: any) => writeDB.query('INSERT INTO users ...', data);
```

### CDN Configuration

```typescript
// Static asset optimization
const cdnConfig = {
  domains: ['cdn.idling.app'],
  paths: ['/images/*', '/css/*', '/js/*'],
  compression: true,
  minify: true,
  cacheControl: {
    images: 'max-age=31536000', // 1 year
    css: 'max-age=31536000',
    js: 'max-age=31536000'
  }
};
```

## Performance Budgets

### Bundle Size Limits

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "2kb",
      "maximumError": "4kb"
    }
  ]
}
```

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Total Blocking Time**: < 200ms
- **Cumulative Layout Shift**: < 0.1

## Optimization Checklist

### Frontend

- [ ] Enable Next.js Image optimization
- [ ] Implement code splitting
- [ ] Use lazy loading for components
- [ ] Optimize bundle size
- [ ] Enable compression
- [ ] Set up proper caching headers

### Backend

- [ ] Optimize database queries
- [ ] Implement connection pooling
- [ ] Add Redis caching
- [ ] Enable response compression
- [ ] Set up background job processing
- [ ] Monitor API performance

### Infrastructure

- [ ] Configure CDN
- [ ] Set up load balancing
- [ ] Implement database replication
- [ ] Monitor server metrics
- [ ] Set up alerts for performance issues

## Performance Testing

### Load Testing

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/users

# Artillery.js
artillery run load-test.yml
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

## Next Steps

- Review [System Design](../system/) for architecture context
- Check [Security](../security/) performance implications
- Explore [Deployment](../../deployment/) performance configurations
- Monitor [API Reference](../../api/) response times
