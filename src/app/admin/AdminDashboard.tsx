'use client';

import { useClientAdminGuard } from '@lib/security/useClientAdminGuard';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import AdminPostsList from './components/AdminPostsList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CustomAlertsPanel from './components/CustomAlertsPanel';
import EmojiApprovalPanel from './components/EmojiApprovalPanel';
import GlobalGuestQuotaPanel from './components/GlobalGuestQuotaPanel';
import PermissionManagementPanel from './components/PermissionManagementPanel';
import SubscriptionManagementPanel from './components/SubscriptionManagementPanel';
import { UserManagementPanel } from './components/UserManagementPanel';

// ================================
// ADMIN TABS CONFIGURATION
// ================================

interface AdminTabConfig {
  id: string;
  label: string;
  icon?: string;
  component: React.ComponentType;
  sortOrder: number;
  description?: string;
}

const ADMIN_TABS: AdminTabConfig[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📊',
    component: AnalyticsDashboard,
    sortOrder: 1,
    description: 'Global app analytics and user behavior tracking'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: '👥',
    component: UserManagementPanel,
    sortOrder: 2,
    description: 'Manage user accounts, roles, and permissions'
  },
  {
    id: 'posts',
    label: 'Posts Moderation',
    icon: '📝',
    component: AdminPostsList,
    sortOrder: 3,
    description: 'Review and moderate user posts'
  },
  {
    id: 'emojis',
    label: 'Emoji Approval',
    icon: '😀',
    component: EmojiApprovalPanel,
    sortOrder: 4,
    description: 'Approve or reject custom emoji submissions'
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: '💳',
    component: SubscriptionManagementPanel,
    sortOrder: 5,
    description: 'Manage subscription plans and user subscriptions'
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: '🔐',
    component: PermissionManagementPanel,
    sortOrder: 6,
    description: 'Configure system permissions and access control'
  },
  {
    id: 'alerts',
    label: 'Custom Alerts',
    icon: '🔔',
    component: CustomAlertsPanel,
    sortOrder: 7,
    description: 'Manage system alerts and notifications'
  },
  {
    id: 'quotas',
    label: 'Guest Quotas',
    icon: '📊',
    component: GlobalGuestQuotaPanel,
    sortOrder: 8,
    description: 'Configure guest user quotas and limits'
  }
].sort((a, b) => a.sortOrder - b.sortOrder);

// Generate types and validation from config
type AdminTab = (typeof ADMIN_TABS)[number]['id'];
const VALID_TABS = ADMIN_TABS.map((tab) => tab.id);
const DEFAULT_TAB = ADMIN_TABS[0].id;

// ================================
// MAIN COMPONENT
// ================================

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>(DEFAULT_TAB);

  // 🔐 SECURITY CRITICAL: Real-time admin permission validation
  const { isLoading, isAuthorized, error } = useClientAdminGuard();

  // Sync with URL parameters on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as AdminTab;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
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

  // Get the current tab component
  const getCurrentTabComponent = () => {
    const currentTab = ADMIN_TABS.find((tab) => tab.id === activeTab);
    if (!currentTab) return null;

    const Component = currentTab.component;
    return <Component />;
  };

  // If security check is loading, show loading state
  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-security-loading">
          <div className="loading-spinner"></div>
          <h2>🔐 Validating Admin Permissions</h2>
          <p>Please wait while we verify your access...</p>
        </div>
      </div>
    );
  }

  // If not authorized, show error (should redirect automatically)
  if (!isAuthorized || error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-security-error">
          <h2>🚫 Access Denied</h2>
          <p>{error || 'You do not have admin permissions'}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="btn btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__tabs">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin-dashboard__tab ${activeTab === tab.id ? 'admin-dashboard__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              title={tab.description}
            >
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-dashboard__content">{getCurrentTabComponent()}</div>
    </div>
  );
}
