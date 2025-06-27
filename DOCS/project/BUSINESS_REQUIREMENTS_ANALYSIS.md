# Business Requirements Analysis - Idling.app
## Reverse-Engineered from Codebase Analysis

**Document Version:** 1.0  
**Date:** January 2025  
**Analysis Method:** Codebase reverse engineering

---

## Executive Summary

Based on comprehensive codebase analysis, Idling.app is a **social media content platform** with sophisticated tagging, threading, and filtering capabilities. The application demonstrates characteristics of a hybrid between Reddit-style discussions and Twitter-like tag-based content discovery.

**Core Value Proposition:** Organized content discovery through intelligent tagging and threading with real-time social interactions.

---

## Core Business Functions

### 1. **Content Management System**
- **Primary Entity:** `submissions` table (social media posts)
- **Content Types:** Text posts with titles, rich content, embedded media
- **Content Features:**
  - Automatic hashtag extraction from content (`#tag`)
  - Manual tag assignment
  - Thread/reply system via `thread_parent_id`
  - User mentions (`@user`)

### 2. **User Management & Authentication**
- **Authentication:** NextAuth.js with provider-based login
- **User Roles:** Standard users with author permissions
- **User Actions:**
  - Create posts/submissions
  - Reply to posts (threading)
  - Tag content
  - Filter and search content

### 3. **Advanced Content Discovery**
```typescript
// From analysis: Complex filtering system
interface ContentFilters {
  tags: string[];        // #hashtag filtering
  author: string;        // @user filtering  
  mentions: string[];    // User mentions
  tagLogic: 'AND' | 'OR'; // Complex tag combinations
  globalLogic: 'AND' | 'OR'; // Cross-filter logic
}
```

### 4. **Social Features**
- **Threading System:** Parent-child post relationships
- **Tag-based Discovery:** Sophisticated hashtag system
- **User Mentions:** `@username` linking and filtering
- **Real-time Updates:** Dynamic content loading with caching

---

## Data Model Analysis

### Primary Entities

#### Submissions Table (Core Content)
```sql
-- Primary content entity
submissions {
  submission_id: SERIAL PRIMARY KEY
  submission_name: VARCHAR(255)      -- Content/body
  submission_title: VARCHAR(255)     -- Title/headline
  submission_datetime: TIMESTAMP     -- Creation time
  author_id: VARCHAR                 -- User identifier
  author: VARCHAR                    -- Display name
  tags: TEXT[]                       -- Hashtag array
  thread_parent_id: INTEGER NULL     -- Threading support
}
```

#### Performance-Critical Features
- **Materialized Views:** `user_submission_stats`, `tag_statistics`
- **Advanced Indexing:** GIN indexes for tag arrays, composite indexes for performance
- **Caching Strategy:** Multi-layer service worker + response caching

### Threading Architecture
```
Post (thread_parent_id: NULL)
├── Reply 1 (thread_parent_id: POST_ID)
├── Reply 2 (thread_parent_id: POST_ID)
└── Reply 3 (thread_parent_id: POST_ID)
```

---

## Performance Requirements (Inferred from Code)

### Scale Indicators
1. **Database Optimizations:** 15+ specialized indexes suggest large-scale operations
2. **Pagination Strategy:** Keyset pagination for offsets >1000 indicates millions of records
3. **Materialized Views:** Performance optimization for tag/user statistics
4. **Query Limits:** Aggressive LIMIT clauses (10-100 records) suggest performance concerns

### Performance Targets (from migrations)
```sql
-- From optimization docs found in codebase:
-- Target: <3s for index operations
-- Current issue: Tag searches taking 1,800ms at scale
-- Goal: Sub-200ms hashtag searches
```

### Current Performance Issues
1. **Pagination Bottleneck:** pageSize=100 appears to be hitting limits
2. **Tag Filter Failures:** Complex tag queries failing with large datasets
3. **Index Bloat:** 15+ indexes causing write performance degradation

---

## User Experience Requirements

### Core User Flows
1. **Content Creation Flow:**
   ```
   Create Post → Auto-extract tags → Apply manual tags → Publish → Thread replies
   ```

2. **Content Discovery Flow:**
   ```
   Browse/Search → Apply filters → Tag-based drilling → Thread exploration
   ```

3. **Social Interaction Flow:**
   ```
   View content → Tag click → Filter by tag → Discover related content
   ```

### Advanced Filter Requirements
```typescript
// Complex filtering logic discovered:
- Multi-tag filtering: #react #typescript (AND/OR logic)
- Author filtering: @username
- Mention filtering: content containing @mentions
- Combined filters with global AND/OR logic
- Real-time filter persistence across navigation
```

---

## Technical Requirements Analysis

### Database Requirements
1. **High-Volume Text Search:** Full-text search on submissions
2. **Complex Array Operations:** Tag array filtering and indexing
3. **Real-time Analytics:** User stats, tag trending, content metrics
4. **Threading Support:** Hierarchical post relationships
5. **Performance at Scale:** Sub-3s response times for millions of records

### API Requirements
1. **Paginated Data Loading:** Efficient pagination with large datasets
2. **Complex Filtering:** Multi-dimensional filter combinations
3. **Real-time Updates:** Live content updates and notifications
4. **Caching Strategy:** Multi-layer caching for performance

### Frontend Requirements
1. **Infinite Scroll:** Seamless content loading
2. **Real-time Filtering:** Instant filter application
3. **Responsive Design:** Mobile-first approach
4. **Accessibility:** Full keyboard navigation and screen reader support

---

## Business Logic Complexity

### Tag System Intelligence
```typescript
// Sophisticated tag handling discovered:
1. Auto-extraction from content: extractTagsFromText()
2. Hashtag normalization: # prefix handling
3. Tag deduplication and validation
4. Tag trending and statistics
5. Recent tag recommendations
```

### Filter System Architecture
```typescript
// Multi-layered filtering system:
1. URL-based filter persistence
2. Client-side filter state management (Jotai)
3. Server-side filter optimization
4. Real-time filter updates across components
```

---

## Scalability Challenges (Current Issues)

### Identified Performance Bottlenecks
1. **PostgreSQL Limitations at Scale:**
   - Tag array queries becoming slow (>1s for complex filters)
   - Index maintenance overhead with 15+ indexes
   - OFFSET pagination failing at large offsets

2. **Complex Query Performance:**
   ```sql
   -- Example complex query from codebase:
   SELECT * FROM submissions s 
   WHERE EXISTS (SELECT 1 FROM unnest(s.tags) tag WHERE tag = $1)
   AND author_id = $2 
   ORDER BY submission_datetime DESC 
   LIMIT 100 OFFSET 5000; -- Slow at scale
   ```

3. **Filter State Complexity:**
   - Multiple filter types with complex logic
   - Real-time synchronization across components
   - URL state management complexity

---

## Business Requirements Summary

### Core Requirements
✅ **Content Creation & Management**  
✅ **Social Threading & Replies**  
✅ **Advanced Tag-based Discovery**  
✅ **Real-time Content Filtering**  
✅ **User Authentication & Authorization**

### Performance Requirements
⚠️ **Sub-3s Query Response Times** (Currently failing at scale)  
⚠️ **Millions of Records Support** (PostgreSQL struggling)  
⚠️ **Complex Filter Combinations** (Performance degrading)  
✅ **Responsive Mobile Experience**  
✅ **Real-time Updates**

### Scale Requirements  
📈 **Target:** Millions of posts with complex relationships  
📈 **Current Challenge:** PostgreSQL performance degradation  
📈 **Critical Need:** Database architecture that supports complex social features at scale  

---

## Recommendation for Hybrid Architecture

### Why Current PostgreSQL Setup Is Insufficient
1. **Complex Social Features:** Threading + tagging + filtering exceeds traditional RDBMS optimization
2. **Scale Characteristics:** Social media workload patterns (high read, complex queries)
3. **Performance Requirements:** Sub-3s response times for complex multi-dimensional queries

### Hybrid Architecture Justification
The business requirements analysis **strongly supports** the hybrid ScyllaDB + ClickHouse recommendation:

**ScyllaDB for:** Real-time social interactions, user sessions, threading
**ClickHouse for:** Tag analytics, content search, complex filtering, user statistics  
**PostgreSQL for:** User authentication, administrative data, transactions

This architecture aligns perfectly with the identified business requirements for a social media platform requiring both real-time interactions and complex analytical queries at massive scale. 