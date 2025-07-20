# 🔒 Security System

**SECURITY CRITICAL**: This directory contains security utilities that work with the existing robust permission system.

## 🛡️ Existing Security System

The application uses a mature, well-tested permission system:

### **API Routes**: Use `withUniversalEnhancements`

All admin API routes already use `withUniversalEnhancements` which provides:
- **Permissions**: Every response includes `userPermissions` grouped by role  
- **Timeout Info**: User timeout and validation status
- **Active Alerts**: System alerts for the user
- **Rate Limiting**: Automatic rate limiting protection

```typescript
// Admin API routes already use this:
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';

export const GET = withUniversalEnhancements(getHandler);
```

### **Server Actions**: Use `PermissionsService`

```typescript
import { PermissionsService } from '@lib/permissions/permissions';

// Check single permission
const hasPermission = await PermissionsService.hasPermission('admin.access');

// Get all user permissions  
const permissions = await PermissionsService.getUserPermissions(userId);
```

### **Server Components**: Use `requirePermission`

```typescript
import { requirePermission, PERMISSIONS } from '@lib/permissions/permissions';

export default async function AdminPage() {
  const hasAdminAccess = await requirePermission(PERMISSIONS.ADMIN.ACCESS);
  
  if (!hasAdminAccess) {
    redirect('/api/auth/signin?error=insufficient_permissions');
  }
  
  return <div>Admin Content</div>;
}
```

## 🎯 Client-Side Permission Checking

**IMPORTANT**: Permissions are included in EVERY API response via `withUniversalEnhancements`.

Client components should check permissions from API responses:

```typescript
// API responses automatically include:
{
  "data": { /* your data */ },
  "userPermissions": {
    "admin": ["admin.access", "admin.users.view"],
    "user": ["content.create.post", "content.edit.own"]
  },
  "userRoles": ["admin"]
}
```

## 🔐 Security Features in Place

### Cache Prevention 
- `noCacheFetch()` utility ensures NO requests are cached
- All admin API calls use no-cache fetch
- Complete cache clearing on logout

### Permission Enforcement
- Database-level permission checking functions
- Role-based access control  
- Real-time permission validation
- Permissions included in every API response

### Authentication
- NextAuth.js session management
- Middleware protection for routes
- Server-side auth checks in layouts

## 📁 Files in this Directory

- `secure-logout.ts`: Cache clearing and secure logout utilities
- `useSecureLogout.ts`: Client hook for secure logout  
- `validation.ts`: User existence and permission validation helpers

## ⚠️ What NOT to Use

- Don't create new security guards or wrappers
- Don't duplicate the existing permission system
- Don't create client-side admin permission checking
- Don't bypass the existing `withUniversalEnhancements` system

## ✅ Correct Pattern

1. **API Routes**: Use `withUniversalEnhancements` (already done)
2. **Server Actions**: Use `PermissionsService.hasPermission()`  
3. **Server Components**: Use `requirePermission()`
4. **Client Components**: Check permissions from API response data
5. **Logout**: Use `performSecureLogout()` for cache clearing

---

**🔒 The existing system is robust and complete. Don't recreate what already exists.**
