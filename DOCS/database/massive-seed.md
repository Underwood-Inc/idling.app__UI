---
title: "Massive Database Seeding"
description: "Guide for seeding large datasets in the database for performance testing"
category: database
layout: default
nav_order: 4
---

# Massive Database Seeding

This guide covers how to seed the database with large datasets for performance testing and development.

## Overview

The massive seed script can generate millions of records to test application performance under realistic load conditions.

## Usage

### Basic Seeding

```bash
# Seed with default settings (200k posts + 800k replies = 1M total)
yarn dev:seed
```

### Custom Configuration

The seed script supports various configuration options:

```bash
# Set custom record counts
POSTS_COUNT=100000 REPLIES_COUNT=500000 yarn dev:seed

# Generate specific user count
USERS_COUNT=10000 yarn dev:seed
```

## Performance Characteristics

### Generation Speed

- **Target**: ~1000 records/second
- **Actual**: ~995 records/second (tested)
- **Duration**: ~17 minutes for 1M records

### Database Impact

- **Storage**: ~500MB for 1M records
- **Indexes**: Automatically maintained
- **Constraints**: All foreign keys validated

## Data Distribution

### Users
- 5,000 unique users by default
- Realistic usernames (FirstName LastName format)
- No duplicate usernames enforced

### Posts
- 200,000 root posts (20% of total)
- Realistic content length (50-500 characters)
- Random hashtags and mentions
- Distributed across all users

### Replies
- 800,000 reply posts (80% of total)
- Threaded conversation structure
- Reply depth up to 5 levels
- Realistic engagement patterns

## Technical Implementation

### Database Strategy

```sql
-- Individual INSERT statements for reliability
INSERT INTO submissions (title, content, author_id, parent_id, created_at) 
VALUES ($1, $2, $3, $4, $5);
```

### Error Handling

- Graceful handling of constraint violations
- Automatic retry for transient failures
- Progress reporting every 1000 records
- Memory-efficient processing

### Performance Optimizations

- Prepared statements for speed
- Batch processing in chunks
- Optimized random data generation
- Efficient user distribution

## Monitoring Progress

The script provides real-time feedback:

```
Seeding 1000000 records...
Progress: 50000/1000000 (5%) - 995 records/sec
Progress: 100000/1000000 (10%) - 1001 records/sec
```

## Cleanup

To reset the database:

```bash
# Clear all seeded data
yarn dev:docker
# Enter option 3 to wipe database
```

## Troubleshooting

### Common Issues

**Memory Usage**
- Script uses minimal memory (~50MB)
- No memory leaks observed
- Safe for long-running operations

**Performance Degradation**
- Check database connection pool
- Monitor disk space
- Verify index health

**Constraint Violations**
- Rare due to proper ID management
- Automatically handled and retried
- Logged for debugging

### Best Practices

1. **Run on dedicated database** for testing
2. **Monitor system resources** during large seeds
3. **Use realistic data sizes** for your use case
4. **Clean up regularly** to maintain performance

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTS_COUNT` | 200000 | Number of root posts |
| `REPLIES_COUNT` | 800000 | Number of reply posts |
| `USERS_COUNT` | 5000 | Number of unique users |
| `BATCH_SIZE` | 1000 | Records per progress update |

## Related Documentation

- [Database Optimization](optimization.md)
- [Performance Testing](../development/testing.md)
- [Migrations](migrations.md) 