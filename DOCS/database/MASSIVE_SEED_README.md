# Massive Scale Seed Script - 1 Million Records

This document describes the algorithmic approach to generating one million database records efficiently for testing and performance evaluation.

## Overview

The seed script (`seed-db.js`) has been optimized to generate **1,000,000 posts** using algorithmic generation and batch processing for maximum efficiency.

### Configuration

- **Users**: 5,000 users
- **Main Posts**: 200,000 posts  
- **Replies**: 800,000 replies
- **Total Posts**: 1,000,000 posts
- **Batch Size**: 1,000 records per batch

## Algorithmic Generation

Instead of using random generation (which is slow and memory-intensive), the script uses deterministic algorithms:

### User Generation
- Predefined name pools (first names × last names)
- Algorithmic email generation: `firstname.lastname{index}@domain.com`
- Deterministic avatar URLs using GitHub pattern
- Time-spread email verification dates

### Content Generation
- Pre-computed topic and hashtag combinations
- Template-based content with variable substitution
- Index-based hashtag selection (60% inclusion rate)
- Algorithmic mention generation (30% inclusion rate)
- Deterministic timestamp distribution over 90 days

### Performance Optimizations

1. **Batch Processing**: All inserts use batch operations (1,000 records per batch)
2. **Pre-computed Pools**: Hashtag combinations and topic templates generated once
3. **Algorithmic Selection**: Index-based selection instead of random generation
4. **Optimized SQL**: Bulk inserts using PostgreSQL's `SELECT * FROM` pattern
5. **Memory Management**: Process in chunks to avoid memory exhaustion

## Database Schema Support

The script populates:
- `users` table with realistic profiles
- `accounts` table with OAuth provider data
- `submissions` table with posts and threaded replies
- Proper foreign key relationships and threading structure

## Performance Metrics

Expected performance on modern hardware:
- **Generation Speed**: 2,000-5,000 posts per second
- **Total Time**: 3-10 minutes (depending on hardware)
- **Memory Usage**: <500MB peak
- **Database Size**: ~500MB for 1M posts

## Usage

```bash
# Standard run (1M records)
node seed-db.js

# For testing with smaller dataset
node test-seed.js

# For manual configuration, modify constants in seed-db.js:
# SEED_USERS_COUNT = 100
# SEED_POSTS_COUNT = 1000  
# SEED_REPLIES_COUNT = 4000
```

The scripts automatically detect the environment and use the appropriate database connection settings from your `.env` file.

## Data Quality

The generated data includes:
- ✅ Realistic conversation topics (22 categories)
- ✅ Technology-focused hashtags (40+ hashtags)
- ✅ User mentions with proper format `@[username|userId]`
- ✅ Threaded reply structure
- ✅ Time-realistic posting patterns
- ✅ Diverse user interactions

## Monitoring Progress

The script provides real-time progress updates:
```
🚀 Starting MASSIVE seed generation (1M records)...
📊 Target: 5000 users, 200000 posts, 800000 replies
🧹 Clearing existing data...
👥 Creating users in batches...
  Created 5000/5000 users...
✅ Created 5000 users
📝 Creating main posts in batches...
  Created 50000/200000 main posts...
```

## Performance Testing

This massive dataset enables testing:
- **Pagination performance** with large result sets
- **Search functionality** across millions of records  
- **Filter performance** with complex queries
- **UI responsiveness** with heavy data loads
- **Database indexing** effectiveness
- **Memory usage** patterns in production

## Production Considerations

⚠️ **Warning**: This script generates 1 million records and should only be used in:
- Development environments
- Testing environments  
- Performance testing scenarios

**Do not run in production** as it will:
- Clear all existing data
- Generate massive amounts of test data
- Consume significant database resources

## Customization

To modify the scale, adjust these constants in `seed-db.js`:

```javascript
const SEED_USERS_COUNT = 5000;    // Number of users
const SEED_POSTS_COUNT = 200000;  // Number of main posts  
const SEED_REPLIES_COUNT = 800000; // Number of replies
const BATCH_SIZE = 1000;          // Batch processing size
```

For smaller test runs, try:
- **Small**: 100 users, 1K posts, 4K replies (5K total)
- **Medium**: 500 users, 10K posts, 40K replies (50K total)  
- **Large**: 1K users, 50K posts, 200K replies (250K total)
- **Massive**: 5K users, 200K posts, 800K replies (1M total) 