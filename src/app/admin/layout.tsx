import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { auth } from '../../lib/auth';
import { requireAdmin } from '../../lib/permissions/permissions';

// Force dynamic rendering for all admin routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin Layout - Protects ALL admin routes
 *
 * This layout ensures that:
 * 1. User is authenticated (has valid session)
 * 2. User has admin permissions
 * 3. Redirects unauthorized users to home page
 *
 * Applied to ALL routes under /admin/*
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // First check: Ensure user is authenticated
  const session = await auth();

  if (!session?.user?.id) {
    // No session - redirect to home
    redirect('/');
  }

  // Second check: Ensure user has admin permissions
  const hasAdminAccess = await requireAdmin();

  if (!hasAdminAccess) {
    // Not an admin - redirect to home
    redirect('/');
  }

  // User is authenticated AND has admin permissions - allow access
  return (
    <div className="admin-layout">
      <div className="admin-content">{children}</div>
    </div>
  );
}
