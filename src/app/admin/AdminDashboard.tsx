'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import './AdminDashboard.css';
import AdminPostsList from './components/AdminPostsList';
import CustomAlertsPanel from './components/CustomAlertsPanel';
import EmojiApprovalPanel from './components/EmojiApprovalPanel';
import SubscriptionManagementPanel from './components/SubscriptionManagementPanel';
import { UserManagementPanel } from './components/UserManagementPanel';

// Placeholder components - will be created
const PermissionManagementPanel = () => (
  <div className="admin-dashboard__placeholder">
    <h2>Permission Management</h2>
    <p>Permission management features coming soon...</p>
  </div>
);

type AdminTab =
  | 'emojis'
  | 'posts'
  | 'users'
  | 'subscriptions'
  | 'alerts'
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
        {activeTab === 'permissions' && <PermissionManagementPanel />}
      </div>
    </div>
  );
}
