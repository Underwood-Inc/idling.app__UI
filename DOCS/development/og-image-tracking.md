---
layout: default
title: OG Image Generation Tracking
parent: Development
nav_order: 6
---

# OG Image Generation Tracking

The OG Image service includes comprehensive database tracking to monitor generation patterns, usage analytics, and provide insights into how the service is being used.

## Overview

Every OG image generation is tracked in the `og_generations` table with the following information:

- Unique generation ID and seed
- Aspect ratio and dimensions
- Quote text and author
- Custom parameters (width, height, shape count)
- Client information (IP address, user agent)
- Timestamp for analytics

## Database Schema

```sql
CREATE TABLE og_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed VARCHAR(255) NOT NULL,
  aspect_ratio VARCHAR(50) NOT NULL,
  quote_text TEXT,
  quote_author VARCHAR(255),
  custom_width INTEGER,
  custom_height INTEGER,
  shape_count INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Setup

### 1. Run the Migration

```bash
# Run the OG generations table migration
yarn migrate:og-table
```

### 2. Verify Setup

```bash
# Test the database tracking functionality
yarn test:og-tracking
```

## Usage

The tracking is automatic and non-blocking. When the OG Image API is called:

1. **Image Generation**: The service generates the SVG image as normal
2. **Background Tracking**: Database tracking happens asynchronously
3. **Graceful Degradation**: If database is unavailable, image generation continues normally

### API Integration

The tracking captures client information from request headers:

```typescript
// Extract client information
const clientIp =
  request.headers.get('x-forwarded-for') ||
  request.headers.get('x-real-ip') ||
  'unknown';
const userAgent = request.headers.get('user-agent') || 'unknown';

// Pass to service
const result = await ogImageService.generateImage({
  // ... other params
  clientIp,
  userAgent
});
```

## Analytics

### Generation Statistics

```typescript
const stats = await databaseService.getOGGenerationStats();

// Returns:
// {
//   total: 1250,
//   today: 45,
//   uniqueSeeds: 892,
//   topAspectRatios: [
//     { aspect_ratio: 'default', count: 650 },
//     { aspect_ratio: 'square', count: 300 },
//     { aspect_ratio: 'youtube', count: 200 }
//   ]
// }
```

### Query by Seed

```typescript
// Get all generations with a specific seed
const generations =
  await databaseService.getOGGenerationsBySeed('user-123-seed');
```

### Individual Generation

```typescript
// Get specific generation details
const generation = await databaseService.getOGGenerationById('uuid-here');
```

## Configuration

### Environment Variables

The service uses the same database configuration as the rest of the app:

```env
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_DB=idling
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
```

### Connection Pooling

The service uses the `postgres` package with built-in connection pooling:

```typescript
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});
```

## Error Handling

### Graceful Degradation

If the database is unavailable:

- Image generation continues normally
- Tracking failures are logged but don't affect the response
- Service remains fully functional

### Monitoring

Database tracking errors are logged with context:

```typescript
console.error('Failed to record OG generation:', error);
// Service continues without throwing
```

## Performance Considerations

### Non-Blocking Operations

Database tracking is designed to not impact image generation performance:

```typescript
// Non-blocking database tracking
if (clientIp || userAgent) {
  this.databaseService
    .recordGeneration({
      // ... params
    })
    .catch((error) => {
      console.error('Failed to track generation:', error);
    });
}
```

### Connection Management

- Uses connection pooling to prevent connection exhaustion
- Automatic connection cleanup on service shutdown
- Optimized for Edge Runtime environments

## Troubleshooting

### Database Connection Issues

1. **Check Environment Variables**: Ensure all required database variables are set
2. **Test Connection**: Use `yarn test:og-tracking` to verify connectivity
3. **Check Logs**: Database errors are logged with full context

### Migration Issues

1. **Manual Migration**: If automated migration fails, run SQL manually
2. **Table Exists**: Migration is idempotent and can be run multiple times
3. **Permissions**: Ensure database user has CREATE TABLE permissions

### Performance Issues

1. **Connection Pool**: Adjust `max` connections based on load
2. **Indexing**: Add indexes on frequently queried columns
3. **Cleanup**: Implement periodic cleanup of old records

## Future Enhancements

Potential improvements to the tracking system:

- **Real-time Analytics Dashboard**: Web interface for viewing statistics
- **Usage Quotas**: Track and enforce usage limits per IP/user
- **Performance Metrics**: Track generation times and success rates
- **Geographic Analytics**: IP-based location tracking
- **Export Capabilities**: CSV/JSON export of tracking data
