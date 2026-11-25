import { requireAdmin } from '@lib/permissions/permissions';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loader from '../components/loader/Loader';
import AdminDashboard from './AdminDashboard';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const { buildAdminPageMetadata } = await import('@molecules/i18n/idlingMeta');
  return buildAdminPageMetadata();
}

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
