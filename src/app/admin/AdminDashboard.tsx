'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { AdminCopyProvider, useAdminCopy } from './AdminCopyContext';
import './AdminDashboard.css';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CustomAlertsPanel from './components/CustomAlertsPanel';
import EmojiApprovalPanel from './components/EmojiApprovalPanel';
import GlobalGuestQuotaPanel from './components/GlobalGuestQuotaPanel';
import PermissionManagementPanel from './components/PermissionManagementPanel';
import SubscriptionManagementPanel from './components/SubscriptionManagementPanel';
import { UserManagementPanel } from './components/UserManagementPanel';

interface AdminTabShell {
  id: string;
  iconId: SiteIconId;
  component: React.ComponentType;
  sortOrder: number;
}

const ADMIN_TAB_SHELL = [
  { id: 'analytics', iconId: 'barChart', component: AnalyticsDashboard, sortOrder: 1 },
  { id: 'users', iconId: 'users', component: UserManagementPanel, sortOrder: 2 },
  { id: 'emojis', iconId: 'smile', component: EmojiApprovalPanel, sortOrder: 3 },
  { id: 'subscriptions', iconId: 'creditCard', component: SubscriptionManagementPanel, sortOrder: 4 },
  { id: 'permissions', iconId: 'key', component: PermissionManagementPanel, sortOrder: 5 },
  { id: 'alerts', iconId: 'bell', component: CustomAlertsPanel, sortOrder: 6 },
  { id: 'quotas', iconId: 'barChart', component: GlobalGuestQuotaPanel, sortOrder: 7 },
] satisfies AdminTabShell[];

type AdminTab = (typeof ADMIN_TAB_SHELL)[number]['id'];
const VALID_TABS = ADMIN_TAB_SHELL.map((tab) => tab.id);
const DEFAULT_TAB = ADMIN_TAB_SHELL[0].id;

function AdminDashboardInner() {
  const admin = useAdminCopy();
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
    const currentTab = ADMIN_TAB_SHELL.find((tab) => tab.id === activeTab);
    if (!currentTab) return null;

    const Component = currentTab.component;
    return <Component />;
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">{admin.dashboard.title}</h1>
        <div className="admin-dashboard__tabs">
          {ADMIN_TAB_SHELL.map((tab) => {
            const copy = admin.dashboard.tabs[tab.id];
            return (
            <button
              key={tab.id}
              className={`admin-dashboard__tab ${activeTab === tab.id ? 'admin-dashboard__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id as AdminTab)}
              title={copy?.description}
            >
              <SiteIcon id={tab.iconId} className="tab-icon" sizeRem={1} />
              {copy?.label ?? tab.id}
            </button>
          );
          })}
        </div>
      </div>

      <div className="admin-dashboard__content">{getCurrentTabComponent()}</div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminCopyProvider>
      <AdminDashboardInner />
    </AdminCopyProvider>
  );
}
