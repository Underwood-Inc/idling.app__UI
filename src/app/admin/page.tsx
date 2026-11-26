import { buildAdminPageMetadata } from '@molecules/i18n/idlingMeta';
import { requireAdmin } from '@lib/permissions/permissions';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loader from '../components/loader/Loader';
import AdminDashboard from './AdminDashboard';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = buildAdminPageMetadata();

export default async function AdminPage() {
  // Check admin permissions
  const hasAccess = await requireAdmin();

  if (!hasAccess) {
    redirect('/');
  }

  return (
    <div className="admin-page">
      <Suspense fallback={<Loader />}>
        <AdminDashboard />
      </Suspense>
    </div>
  );
}
