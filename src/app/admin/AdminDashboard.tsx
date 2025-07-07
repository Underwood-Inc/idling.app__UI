'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import './AdminDashboard.css';
import AdminPostsList from './components/AdminPostsList';
import CustomAlertsPanel from './components/CustomAlertsPanel';
import EmojiApprovalPanel from './components/EmojiApprovalPanel';
import GlobalGuestQuotaPanel from './components/GlobalGuestQuotaPanel';
import PermissionManagementPanel from './components/PermissionManagementPanel';
import SubscriptionManagementPanel from './components/SubscriptionManagementPanel';
import { UserManagementPanel } from './components/UserManagementPanel';

type AdminTab =
  | 'emojis'
  | 'posts'
  | 'users'
  | 'subscriptions'
  | 'alerts'
  | 'quotas'
  | 'permissions';

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>('emojis');

  // Sync with URL parameters on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as AdminTab;
    if (
      tabFromUrl &&
      [
        'emojis',
        'posts',
        'users',
        'subscriptions',
        'alerts',
        'quotas',
        'permissions'
      ].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Function to handle tab changes with URL sync
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    router.push(newUrl.pathname + newUrl.search, { scroll: false });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__tabs">
          <button
            className={`admin-dashboard__tab ${activeTab === 'emojis' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('emojis')}
          >
            Emoji Approval
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'posts' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            Posts Moderation
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'users' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            User Management
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'subscriptions' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('subscriptions')}
          >
            Subscriptions
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'alerts' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('alerts')}
          >
            Custom Alerts
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'quotas' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('quotas')}
          >
            Guest Quotas
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'permissions' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => handleTabChange('permissions')}
          >
            Permissions
          </button>
        </div>
      </div>

      <div className="admin-dashboard__content">
        {activeTab === 'emojis' && <EmojiApprovalPanel />}
        {activeTab === 'posts' && <AdminPostsList />}
        {activeTab === 'users' && <UserManagementPanel />}
        {activeTab === 'subscriptions' && <SubscriptionManagementPanel />}
        {activeTab === 'alerts' && <CustomAlertsPanel />}
        {activeTab === 'quotas' && <GlobalGuestQuotaPanel />}
        {activeTab === 'permissions' && <PermissionManagementPanel />}
      </div>
    </div>
  );
}
