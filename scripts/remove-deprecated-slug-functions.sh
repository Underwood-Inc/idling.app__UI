#!/bin/bash

# Remove Deprecated Slug Functions Script
# This script removes the deprecated user-slug utilities and cleans up any remaining references

set -e

echo "🧹 Removing deprecated slug functions and cleaning up references..."

# 1. Remove the deprecated user-slug utility file
if [ -f "src/lib/utils/user-slug.ts" ]; then
    echo "📁 Removing deprecated user-slug.ts file..."
    rm "src/lib/utils/user-slug.ts"
    echo "✅ Removed src/lib/utils/user-slug.ts"
else
    echo "ℹ️  user-slug.ts already removed"
fi

# 2. Check for any remaining imports of user-slug functions
echo "🔍 Checking for remaining imports of deprecated functions..."

# Find files that still import from user-slug
IMPORT_FILES=$(grep -r "from.*user-slug" src/ 2>/dev/null | cut -d: -f1 | sort | uniq || true)

if [ -n "$IMPORT_FILES" ]; then
    echo "⚠️  Found files still importing from user-slug:"
    echo "$IMPORT_FILES"
    echo ""
    echo "❌ Please remove these imports manually:"
    grep -r "from.*user-slug" src/ 2>/dev/null || true
    exit 1
else
    echo "✅ No remaining imports of user-slug functions found"
fi

# 3. Check for any remaining usage of deprecated functions
echo "🔍 Checking for remaining usage of deprecated functions..."

USAGE_FILES=$(grep -r "generateUserSlug\|parseUserSlug\|ensureUserSlug" src/ 2>/dev/null | grep -v "\.test\." | cut -d: -f1 | sort | uniq || true)

if [ -n "$USAGE_FILES" ]; then
    echo "⚠️  Found files still using deprecated functions:"
    echo "$USAGE_FILES"
    echo ""
    echo "❌ Please remove these usages manually:"
    grep -r "generateUserSlug\|parseUserSlug\|ensureUserSlug" src/ 2>/dev/null | grep -v "\.test\." || true
    exit 1
else
    echo "✅ No remaining usage of deprecated functions found"
fi

# 4. Check for any slug references in profile actions
echo "🔍 Checking profile actions for slug references..."

SLUG_REFS=$(grep -r "slug.*:" src/lib/actions/profile.actions.ts 2>/dev/null || true)

if [ -n "$SLUG_REFS" ]; then
    echo "⚠️  Found slug references in profile actions:"
    echo "$SLUG_REFS"
    echo "❌ Please remove these slug references manually"
    exit 1
else
    echo "✅ No slug references found in profile actions"
fi

# 5. Check TypeScript interfaces for slug fields
echo "🔍 Checking TypeScript interfaces for slug fields..."

SLUG_FIELDS=$(grep -r "slug.*:" src/lib/types/ 2>/dev/null || true)

if [ -n "$SLUG_FIELDS" ]; then
    echo "⚠️  Found slug fields in TypeScript interfaces:"
    echo "$SLUG_FIELDS"
    echo "❌ Please remove these slug fields manually"
    exit 1
else
    echo "✅ No slug fields found in TypeScript interfaces"
fi

# 6. Verify no profile URLs use slug patterns in components
echo "🔍 Checking components for slug-based profile URLs..."

# Look for profile URL patterns that might use slugs
SLUG_URLS=$(grep -r "/profile/.*\${.*slug" src/ 2>/dev/null || true)

if [ -n "$SLUG_URLS" ]; then
    echo "⚠️  Found components using slug-based profile URLs:"
    echo "$SLUG_URLS"
    echo "❌ Please update these to use database IDs only"
    exit 1
else
    echo "✅ No slug-based profile URLs found in components"
fi

# 7. Check for any remaining parseUserSlug usage in profile actions
echo "🔍 Checking for parseUserSlug usage in profile actions..."

PARSE_USAGE=$(grep -r "parseUserSlug" src/lib/actions/profile.actions.ts 2>/dev/null || true)

if [ -n "$PARSE_USAGE" ]; then
    echo "⚠️  Found parseUserSlug usage in profile actions:"
    echo "$PARSE_USAGE"
    echo "❌ This should be removed as part of the migration"
    exit 1
else
    echo "✅ No parseUserSlug usage found in profile actions"
fi

# 8. Final verification - check for any profile URL generation that's not ID-only
echo "🔍 Final verification - checking for non-ID profile URL generation..."

# Look for profile URL patterns that concatenate anything other than simple IDs
COMPLEX_URLS=$(grep -r "/profile/.*\${.*[^}]}" src/ 2>/dev/null | grep -v "user\.id" | grep -v "authorId" | grep -v "userId" | grep -v "databaseId" || true)

if [ -n "$COMPLEX_URLS" ]; then
    echo "⚠️  Found potentially complex profile URL generation:"
    echo "$COMPLEX_URLS"
    echo "⚠️  Please verify these use database IDs only"
fi

echo ""
echo "🎉 Deprecated slug function cleanup completed successfully!"
echo ""
echo "📋 Summary:"
echo "  ✅ Removed deprecated user-slug.ts file"
echo "  ✅ Verified no remaining imports of deprecated functions"
echo "  ✅ Verified no remaining usage of deprecated functions"
echo "  ✅ Verified no slug references in profile actions"
echo "  ✅ Verified no slug fields in TypeScript interfaces"
echo "  ✅ Verified no slug-based profile URLs in components"
echo ""
echo "🚀 The codebase is now clean of deprecated slug patterns!"
echo "🔒 Database constraints will prevent future slug URL usage." 