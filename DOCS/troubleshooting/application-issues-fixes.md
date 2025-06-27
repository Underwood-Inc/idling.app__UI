---
layout: default
title: Application Issues & Fixes
parent: Troubleshooting
nav_order: 1
---

# Application Issues & Fixes

## Issue Analysis & Solutions

Based on codebase analysis, I've identified three specific issues and their fixes:

---

## 1. ❌ **Pagination Stuck on PageSize 100**

### Root Cause

**File:** `src/lib/state/atoms.ts:854`

```typescript
pageSize: pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 100;
```

The default pageSize is hardcoded to 100, and when URLs are generated, they always include `pageSize=100` which gets parsed and stuck at that value.

### Fix 1: Correct Default PageSize

```typescript
// CURRENT (WRONG):
pageSize: pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 100;

// FIXED:
pageSize: pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 10;
```

### Fix 2: Update URL Generation Logic

**File:** `src/lib/state/atoms.ts:897-904`

```typescript
// CURRENT:
if (filters.pageSize !== 10) {
  urlParams.set('pageSize', filters.pageSize.toString());
}

// ENHANCED:
// Only add pageSize to URL if it's not the default
if (filters.pageSize && filters.pageSize !== 10) {
  urlParams.set('pageSize', filters.pageSize.toString());
}
```

---

## 2. ❌ **Tag Filter Queries Failing (#my_posts Not Found)**

### Root Cause Analysis

The issue is in **tag normalization inconsistency** between different parts of the application:

#### Problem 1: Inconsistent Hash Prefix Handling

```typescript
// URL Processing strips # prefix:
.map((tag) => tag.trim().startsWith('#') ? tag.substring(1) : tag)

// Database Query expects # stripped:
.map((tag) => (tag.startsWith('#') ? tag.substring(1) : tag))

// Frontend adds # prefix:
const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
```

#### Problem 2: Case Sensitivity Mismatch

```typescript
// URL sanitization converts to lowercase:
.map((tag) => tag.trim().toLowerCase())

// But database comparison is case-sensitive on stored tags
```

### Comprehensive Fix

#### Fix A: Consistent Tag Normalization Function

**File:** `src/lib/utils/string/tag-regex.ts` (Update existing)

```typescript
/**
 * Universal tag normalization - single source of truth
 * Always normalizes to lowercase WITHOUT # prefix for database storage/queries
 * @param tag - Raw tag input
 * @returns string - normalized tag for database operations
 */
export function normalizeTagForDatabase(tag: string): string {
  if (!tag || typeof tag !== 'string') return '';

  const trimmed = tag.trim().toLowerCase();
  if (!trimmed) return '';

  // Remove # prefix if present, keep lowercase
  const withoutHash = trimmed.startsWith('#') ? trimmed.substring(1) : trimmed;

  // Validate format
  if (/^[a-z0-9_]+$/.test(withoutHash) && withoutHash.length <= 50) {
    return withoutHash;
  }

  return '';
}

/**
 * Format tag for display (with # prefix)
 */
export function formatTagForDisplay(tag: string): string {
  const normalized = normalizeTagForDatabase(tag);
  return normalized ? `#${normalized}` : '';
}
```

#### Fix B: Update Database Query Logic

**File:** `src/app/components/submissions-list/actions.ts:648`

```typescript
// CURRENT:
.map((tag) => (tag.startsWith('#') ? tag.substring(1) : tag))

// FIXED:
.map((tag) => normalizeTagForDatabase(tag))
```

#### Fix C: Update URL Parameter Processing

**File:** `src/lib/state/atoms.ts:780-785`

```typescript
// CURRENT:
.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))

// FIXED:
.map((tag) => formatTagForDisplay(normalizeTagForDatabase(tag)))
```

#### Fix D: Ensure Database Tag Storage Consistency

**Migration:** Create data cleanup migration

```sql
-- Clean up existing tag inconsistencies
UPDATE submissions
SET tags = ARRAY(
  SELECT DISTINCT LOWER(TRIM(BOTH '#' FROM tag))
  FROM unnest(tags) AS tag
  WHERE TRIM(tag) != ''
)
WHERE tags IS NOT NULL;
```

---

## 3. ❌ **Tag Display Inconsistencies (Mix of #tag and tag)**

### Root Cause

Different components handle tag display formatting inconsistently:

1. **Recent Tags Component** - sometimes shows `#tag`, sometimes `tag`
2. **Filter Bar** - inconsistent # prefix handling
3. **URL Generation** - strips # for URLs but readds inconsistently

### Fix: Standardized Display Rules

#### Rule 1: Database Storage (NO # prefix)

- All tags stored as: `my_posts`, `react`, `typescript`
- Consistent lowercase, no symbols

#### Rule 2: Display (WITH # prefix)

- All UI shows: `#my_posts`, `#react`, `#typescript`
- User-facing always has #

#### Rule 3: URL Parameters (NO # prefix)

- URLs show: `?tags=my_posts,react`
- Clean URLs without symbols

### Implementation

#### Update FilterBar Component

**File:** `src/app/components/filter-bar/FilterBar.tsx:119-130`

```typescript
// Ensure consistent display formatting
const values =
  filter.name === 'tags'
    ? dedupeStringArray(getTagsFromSearchParams(filter.value)).map((tag) =>
        formatTagForDisplay(tag)
      ) // Always show with #
    : dedupeStringArray(/* ... existing logic ... */);
```

#### Update Recent Tags Component

**File:** `src/app/components/recent-tags/RecentTagsClient.tsx:116`

```typescript
const handleTagClick = (tag: string) => {
  // Normalize for consistent processing
  const dbTag = normalizeTagForDatabase(tag);
  const displayTag = formatTagForDisplay(dbTag);

  const isSelected = tagState.currentTags.includes(displayTag);
  // ... rest of logic
};
```

---

## 🛠️ **Complete Fix Implementation**

### Step 1: Create Tag Normalization Utilities

Update `src/lib/utils/string/tag-regex.ts` with the normalization functions above.

### Step 2: Update Database Queries

Apply Fix B to all database query files that handle tags.

### Step 3: Update URL Processing

Apply Fix C to URL parameter processing in state management.

### Step 4: Update Display Components

Apply display fixes to FilterBar and Recent Tags components.

### Step 5: Database Migration

Run the SQL migration to clean up existing inconsistent data.

### Step 6: Testing

- Test tag filtering with various formats
- Verify URL generation and parsing
- Check display consistency across components
- Validate database queries return correct results

---

## 📋 **Verification Checklist**

- [ ] Pagination defaults to 10 items
- [ ] URL parameters don't include default pageSize
- [ ] Tag filtering works with `#my_posts` format
- [ ] Database queries find tags regardless of # prefix
- [ ] All UI components show tags with # prefix
- [ ] URLs contain clean tag names without #
- [ ] Case-insensitive tag matching works
- [ ] No duplicate or malformed tags in database

## Related Documentation

- [Tag System Architecture](../architecture/tag-system.html)
- [Database Schema](../database/schema.html)
- [URL Parameter Handling](../development/routing.html)
