'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
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

interface AdminTabConfig {
  id: string;
  label: string;
  iconId: SiteIconId;
  component: React.ComponentType;
  sortOrder: number;
  description?: string;
}

const ADMIN_TABS: AdminTabConfig[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    iconId: 'barChart',
    component: AnalyticsDashboard,
    sortOrder: 1,
    description: 'Global app analytics and user behavior tracking',
  },
  {
    id: 'users',
    label: 'User Management',
    iconId: 'users',
    component: UserManagementPanel,
    sortOrder: 2,
    description: 'Manage user accounts, roles, and permissions',
  },
  {
    id: 'posts',
    label: 'Posts Moderation',
    iconId: 'fileText',
    component: AdminPostsList,
    sortOrder: 3,
    description: 'Review and moderate user posts',
  },
  {
    id: 'emojis',
    label: 'Emoji Approval',
    iconId: 'smile',
    component: EmojiApprovalPanel,
    sortOrder: 4,
    description: 'Approve or reject custom emoji submissions',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    iconId: 'creditCard',
    component: SubscriptionManagementPanel,
    sortOrder: 5,
    description: 'Manage subscription plans and user subscriptions',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    iconId: 'key',
    component: PermissionManagementPanel,
    sortOrder: 6,
    description: 'Configure system permissions and access control',
  },
  {
    id: 'alerts',
    label: 'Custom Alerts',
    iconId: 'bell',
    component: CustomAlertsPanel,
    sortOrder: 7,
    description: 'Manage system alerts and notifications',
  },
  {
    id: 'quotas',
    label: 'Guest Quotas',
    iconId: 'barChart',
    component: GlobalGuestQuotaPanel,
    sortOrder: 8,
    description: 'Configure guest user quotas and limits',
  },
].sort((a, b) => a.sortOrder - b.sortOrder);

type AdminTab = (typeof ADMIN_TABS)[number]['id'];
const VALID_TABS = ADMIN_TABS.map((tab) => tab.id);
const DEFAULT_TAB = ADMIN_TABS[0].id;

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>(DEFAULT_TAB);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as AdminTab;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    router.push(newUrl.pathname + newUrl.search, { scroll: false });
  };

  const getCurrentTabComponent = () => {
    const currentTab = ADMIN_TABS.find((tab) => tab.id === activeTab);
    if (!currentTab) return null;

    const Component = currentTab.component;
    return <Component />;
  };

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
              <SiteIcon id={tab.iconId} className="tab-icon" sizeRem={1} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-dashboard__content">{getCurrentTabComponent()}</div>
    </div>
  );
}
