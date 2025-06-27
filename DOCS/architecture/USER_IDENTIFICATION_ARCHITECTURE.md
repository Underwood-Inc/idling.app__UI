# User Identification Architecture

## 🚨 Problem Solved

**Issue**: OAuth provider usernames can change, breaking profile URLs and causing inconsistent user identification across the application.

**Solution**: Implemented a database ID-based user identification system that remains stable regardless of username changes from OAuth providers.

## 🎯 New Architecture

### Primary User Identifier
- **Database ID (`users.id`)**: Primary identifier for all app operations
- **Stable**: Never changes, even if OAuth provider username changes
- **Reliable**: Always available and consistent across the application

### Secondary Identifiers (Reference Only)
- **OAuth Provider ID (`accounts.providerAccountId`)**: For OAuth integration only
- **Username (`users.name`)**: For display purposes, synchronized from OAuth providers
- **Email (`users.email`)**: For notifications and account recovery

## 🔧 Implementation Details

### 1. Profile URLs
```
NEW (Reliable):    /profile/123        <- Database ID
OLD (Unreliable):  /profile/johndoe-123  <- Username-based slug
```

### 2. Database Schema
```sql
-- Primary user identification
submissions.user_id -> users.id (FOREIGN KEY)

-- Reference only (not used for lookups)
submissions.author_provider_account_id (VARCHAR)
users.name (VARCHAR) -- Synchronized from OAuth
```

### 3. Authentication Flow
1. **User signs in**: OAuth provider returns `providerAccountId` + `name`
2. **Database lookup**: Find user by `providerAccountId` in `accounts` table
3. **Username sync**: Update `users.name` if provider username changed
4. **Session**: Store `users.id` as primary identifier

## 🔄 Username Synchronization

### Automatic Sync Process
```typescript
// In NextAuth adapter updateUser()
if (oldUser.name !== newName) {
  console.info('🔄 Username synced from provider:', {
    userId: id,
    oldUsername: oldUser.name,
    newUsername: newName,
    provider: 'oauth'
  });
}
```

### When Sync Happens
- **Every login**: Username is checked and updated if changed
- **Automatic**: No manual intervention required
- **Logged**: Changes are tracked for monitoring

## 🛠️ Post Authorship

### Current System
```sql
-- All submissions reference users by stable database ID
submissions.user_id -> users.id

-- Foreign key constraint ensures data integrity
CONSTRAINT fk_submissions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### Benefits
- ✅ **Stable**: Post authorship never breaks when usernames change
- ✅ **Reliable**: Profile URLs work regardless of username updates
- ✅ **Consistent**: Single source of truth for user identification
- ✅ **Performance**: Optimized indexes on `user_id`

## 🔍 API Endpoints

### Profile Lookup Strategy
```typescript
// Always try database ID first (most reliable)
if (/^\d+$/.test(identifier)) {
  profile = await getUserProfileByDatabaseId(identifier);
} else {
  // Fallback to username lookup for backward compatibility
  profile = await getUserProfile(identifier);
}
```

### Available Endpoints
- `GET /api/profile/id/123` - Lookup by database ID (recommended)
- `GET /api/profile/username` - Lookup by username (fallback)
- `PATCH /api/profile/123` - Update by database ID

## 🔄 Migration Path

### Backward Compatibility
- ✅ **Legacy URLs**: Username-based URLs redirect to ID-based URLs
- ✅ **API calls**: Both ID and username lookups supported
- ✅ **No breaking changes**: Existing integrations continue to work

### URL Redirection
```typescript
// Legacy: /profile/johndoe -> redirects to -> /profile/123
// Legacy: /profile/johndoe-123 -> redirects to -> /profile/123
// Current: /profile/123 -> works directly
```

## 📊 Data Flow

### User Creation
1. OAuth sign-in creates record in `users` table with auto-incrementing `id`
2. OAuth account info stored in `accounts` table with `providerAccountId`
3. All submissions reference `users.id` in `user_id` column

### Username Changes
1. User changes username on OAuth provider (e.g., GitHub, Google)
2. Next login triggers `updateUser()` in NextAuth adapter
3. `users.name` updated automatically to match provider
4. Profile URLs continue working (they use database ID)
5. Post authorship remains intact (uses database ID)

## 🔐 Security Benefits

### Reduced Attack Surface
- **No enumeration**: Profile URLs don't reveal usernames
- **Stable references**: Can't break user links by changing usernames
- **Data integrity**: Foreign key constraints prevent orphaned data

### Privacy Protection
- **Consistent identity**: Users can change display names without breaking links
- **Stable sharing**: Profile URLs remain valid long-term

## 🚀 Performance Optimizations

### Database Indexes
```sql
-- Primary lookup index
CREATE INDEX idx_submissions_user_id ON submissions(user_id);

-- Compound indexes for common queries
CREATE INDEX idx_submissions_user_datetime ON submissions(user_id, submission_datetime DESC);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
```

### Caching Strategy
- **Database ID**: Never changes, safe for long-term caching
- **Username**: Short-term cache only (can change from provider)
- **Profile data**: Cache by database ID for reliability

## 📝 Developer Guidelines

### Always Use Database ID For:
- ✅ Profile URLs: `/profile/{user.id}`
- ✅ API endpoints: `/api/profile/id/{user.id}`
- ✅ Database queries: `WHERE user_id = ${user.id}`
- ✅ Submissions: `user_id` foreign key

### Use Username Only For:
- ✅ Display purposes: Show `user.name` in UI
- ✅ Search functionality: Find users by name
- ✅ Backward compatibility: Legacy URL support

### Never Use Username For:
- ❌ Primary identification in URLs
- ❌ Database foreign keys
- ❌ Caching keys
- ❌ Long-term references

## 🧪 Testing

### Test Cases
- [ ] Username change on OAuth provider syncs to database
- [ ] Profile URLs work with database IDs
- [ ] Legacy username URLs redirect correctly
- [ ] Post authorship remains intact after username changes
- [ ] API endpoints handle both ID and username lookups

### Monitoring
- [ ] Track username synchronization events
- [ ] Monitor profile URL access patterns
- [ ] Alert on failed user lookups
- [ ] Track migration from username to ID URLs

## 📚 Related Files

### Core Implementation
- `src/lib/adapter.ts` - NextAuth adapter with username sync
- `src/lib/actions/profile.actions.ts` - Profile data access layer
- `src/app/profile/[username]/page.tsx` - Profile page with ID routing
- `src/app/components/author/Author.tsx` - Author links with ID URLs

### Database
- `migrations/0009-consolidate-user-identification.sql` - User ID consolidation
- Database schema uses `user_id` foreign keys consistently

### API Routes
- `src/app/api/profile/[username]/route.ts` - Profile API with ID/username support
- `src/app/api/profile/id/[id]/route.ts` - Direct ID lookup endpoint

---

*This architecture ensures robust, reliable user identification that remains stable regardless of OAuth provider username changes.* 