import { auth } from '@lib/auth';
import { PERMISSIONS, requirePermission } from '@lib/permissions/permissions';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

// Force dynamic rendering for all admin routes
export const dynamic = 'force-dynamic';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin Layout - Server Component
 *
 * Protects all admin routes using the existing robust permission system.
 * Server-side validation ensures no client-side bypassing.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Check authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/admin');
  }

  // Check admin permission using existing system
  const hasAdminAccess = await requirePermission(PERMISSIONS.ADMIN.ACCESS);

  if (!hasAdminAccess) {
    redirect('/api/auth/signin?error=insufficient_permissions');
  }

  return (
    <div className="admin-layout">
      <div className="admin-content">{children}</div>
    </div>
  );
}
