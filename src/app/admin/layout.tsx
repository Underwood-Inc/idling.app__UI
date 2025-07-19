import { useServerSecurityGuard } from '@lib/security/universal-security-guard';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

// Force dynamic rendering for all admin routes
export const dynamic = 'force-dynamic';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin Layout - Protects ALL admin routes with comprehensive security
 *
 * This layout ensures that:
 * 1. User is authenticated (has valid session)
 * 2. User exists in database and account is active
 * 3. User has admin permissions
 * 4. Full security validation including real-time checks
 * 5. Redirects unauthorized users to home page
 *
 * Applied to ALL routes under /admin/*
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    // SECURITY CRITICAL: Use comprehensive security validation
    const securityContext = await useServerSecurityGuard({
      requireAuth: true,
      requireActiveAccount: true,
      requiredPermissions: ['admin.access'],
      securityLevel: 'maximum' // Highest security for admin area
    });

    // If we get here, all security checks passed
    // User is authenticated, exists in DB, account is active, and has admin permissions

    return (
      <div className="admin-layout">
        <div className="admin-content">{children}</div>
      </div>
    );
  } catch (error) {
    // If any security check fails, redirect to home
    console.error('❌ SECURITY: Admin layout security check failed:', error);
    redirect('/');
  }
}
