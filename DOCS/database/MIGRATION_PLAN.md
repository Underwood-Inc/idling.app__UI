# Migration Plan: Username Change Resilience

## Overview

This migration plan addresses the issue where OAuth provider username changes break profile URLs and post authorship. The solution involves a two-phase migration that consolidates user identification around stable database IDs.

## 🎯 Problem Statement

- **OAuth usernames can change**: Users can modify their usernames on GitHub, Google, etc.
- **Broken profile URLs**: Username-based URLs become invalid when usernames change
- **Inconsistent authorship**: Posts may lose connection to their authors
- **Mixed identification**: System uses both OAuth provider IDs and database IDs inconsistently

## 📋 Two-Phase Migration Approach

### Phase 1: Migration 0009 - Data Consolidation
**File**: `migrations/0009-consolidate-user-identification.sql`

#### What it does:
- ✅ **Migrates existing data** to use `user_id` (database ID) consistently
- ✅ **Populates missing user_id** values by matching OAuth provider accounts
- ✅ **Adds foreign key constraints** for data integrity
- ✅ **Creates optimized indexes** for database ID lookups
- ✅ **Marks orphaned submissions** for manual review
- ✅ **Maintains backward compatibility** during transition

#### Safety features:
- Non-destructive: Keeps legacy columns during migration
- Identifies problematic data before proceeding
- Provides verification queries
- Maintains existing functionality

### Phase 2: Migration 0010 - Remove Backward Compatibility
**File**: `migrations/0010-remove-backward-compatibility.sql`

#### What it does:
- ✅ **Removes legacy columns** (`author_provider_account_id`, `provider_account_id`)
- ✅ **Enforces data integrity** with stricter constraints
- ✅ **Optimizes database schema** for ID-only operations
- ✅ **Cleans up indexes** on dropped columns
- ✅ **Updates documentation** in database comments

#### Safety checks:
- Verifies all submissions have `user_id` before proceeding
- Prevents execution if orphaned data exists
- Provides comprehensive verification queries

## 🔧 Code Changes Required

### Application Code Updates (Post-Migration)

#### 1. Profile URLs
```typescript
// BEFORE: Username-based URLs with fallback
/profile/johndoe-123  // Unreliable
/profile/johndoe      // Can break

// AFTER: Database ID only
/profile/123          // Reliable, stable
```

#### 2. API Endpoints
```typescript
// BEFORE: Accept both username and ID
if (/^\d+$/.test(identifier)) {
  // Try ID lookup
} else {
  // Fallback to username
}

// AFTER: Database ID only
if (!/^\d+$/.test(identifier)) {
  return error('Only database IDs supported');
}
```

#### 3. Profile Actions
```typescript
// BEFORE: Multiple identification methods
const profile = await getUserProfile(usernameOrSlug);

// AFTER: Database ID only  
const profile = await getUserProfileByDatabaseId(databaseId);
```

## 📊 Migration Timeline

### Step 1: Run Migration 0009 (Safe)
```bash
# This migration is safe and non-destructive
npm run migrate # or your migration command
```

**Expected results:**
- All submissions have `user_id` populated
- Foreign key constraints added
- Backward compatibility maintained
- Any orphaned data identified

### Step 2: Resolve Orphaned Data (If Any)
```sql
-- Check for orphaned submissions
SELECT * FROM submissions WHERE user_id IS NULL;

-- Manual cleanup required for any orphaned records
```

### Step 3: Deploy Code Changes
- Update profile URLs to use database IDs
- Update API endpoints to require database IDs
- Remove username fallback logic
- Update frontend components

### Step 4: Run Migration 0010 (Final)
```bash
# This migration removes backward compatibility
npm run migrate # or your migration command
```

**Expected results:**
- Legacy columns removed
- Schema optimized for ID-only operations
- Backward compatibility code can be removed

## 🛡️ Safety Measures

### Pre-Migration Checks
- [ ] Backup database before migrations
- [ ] Verify all users have accounts table entries
- [ ] Check for any orphaned submissions
- [ ] Test migration on staging environment

### Post-Migration Verification
- [ ] All submissions have valid `user_id`
- [ ] Profile URLs work with database IDs
- [ ] Post authorship intact after username changes
- [ ] API endpoints reject invalid identifiers
- [ ] Foreign key constraints active

### Rollback Plan
- **Phase 1**: Can be rolled back by dropping added constraints and indexes
- **Phase 2**: Requires restoring legacy columns from backup (not recommended)

## 📈 Benefits After Migration

### Stability
- ✅ **Profile URLs never break** when usernames change
- ✅ **Post authorship always intact** regardless of username updates
- ✅ **Consistent user identification** across the entire application

### Performance
- ✅ **Optimized database queries** using numeric ID lookups
- ✅ **Simplified caching** with stable identifiers
- ✅ **Reduced complexity** with single identification method

### Security
- ✅ **No username enumeration** via profile URLs
- ✅ **Data integrity enforced** by foreign key constraints
- ✅ **Stable references** prevent broken relationships

## 🧪 Testing Strategy

### Before Migration
- [ ] Test username changes on OAuth providers
- [ ] Verify profile URL behavior
- [ ] Check post authorship consistency

### After Migration
- [ ] Test that username changes don't break anything
- [ ] Verify database ID-based URLs work
- [ ] Confirm API endpoints reject usernames
- [ ] Test foreign key constraint enforcement

## 📚 Documentation Updates

### Files Updated
- `USER_IDENTIFICATION_ARCHITECTURE.md` - New architecture documentation
- `src/lib/utils/user-slug.ts` - Marked as deprecated
- `src/app/components/submission-forms/schema.ts` - Removed legacy fields
- Profile and API components - Removed backward compatibility

### Database Schema
- Submissions table now uses only `user_id` for user identification
- Users table stores OAuth data in separate `accounts` table
- Foreign key constraints ensure referential integrity

---

**Result**: A robust, username-change-resilient user identification system that maintains data integrity and provides optimal performance. 