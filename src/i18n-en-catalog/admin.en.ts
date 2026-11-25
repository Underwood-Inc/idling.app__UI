import type { AdminPanelsEnCopy } from './adminPanels.en';
import { ADMIN_PANELS_EN } from './adminPanels.en';

export interface AdminEnTabCopy {
  id: string;
  label: string;
  description: string;
}

export interface AdminEnDashboardCopy {
  title: string;
  tabs: AdminEnTabCopy[];
}

export interface AdminEnSubscriptionCopy {
  panelTitle: string;
  panelDescription: string;
  loadingData: string;
  systemNotAvailableTitle: string;
  systemNotAvailableBody: string;
  retry: string;
  tabs: {
    overview: string;
    plans: string;
    subscriptions: string;
  };
  overview: {
    totalPlans: string;
    activePlansSuffix: string;
    totalSubscriptions: string;
    activeSuffix: string;
    trialUsers: string;
    currentlyTrialing: string;
    monthlyRevenue: string;
    recurringMonthly: string;
    planDistribution: string;
    subscribersSuffix: string;
    loadingStats: string;
  };
  plans: {
    title: string;
    createNewPlan: string;
    createComingSoon: string;
    edit: string;
    enable: string;
    disable: string;
    free: string;
    periodMonth: string;
    periodYear: string;
    periodLifetime: string;
  };
  subscriptions: {
    title: string;
    assignSubscription: string;
    searchPlaceholder: string;
    allStatuses: string;
    allPlans: string;
    tableHeaders: string[];
    edit: string;
    cancel: string;
    previous: string;
    next: string;
  };
  statusLabels: Record<
    'active' | 'trialing' | 'cancelled' | 'expired' | 'suspended' | 'pending',
    string
  >;
}

export interface AdminEnUserManagementCopy {
  panelTitle: string;
  panelDescription: string;
  filters: string;
  exportAll: string;
  searchPlaceholder: string;
  loadingUsers: string;
  loadingMoreUsers: string;
  retry: string;
  viewDetails: string;
  assignRole: string;
  manageSubscription: string;
  manageQuota: string;
  unknownUser: string;
}

export interface AdminEnCustomAlertsCopy {
  panelTitle: string;
  panelDescription: string;
  createNewAlert: string;
  createFirstAlert: string;
  emptyTitle: string;
  emptyBody: string;
  editAlert: string;
  createAlert: string;
  updateAlert: string;
  cancel: string;
  retry: string;
  signInAgain: string;
  signIn: string;
  goHome: string;
  errorLoadingTitle: string;
  authRequiredTitle: string;
  authRequiredBody: string;
  adminAccessTitle: string;
  adminAccessBody: string;
  targetAudiences: Record<string, string>;
  active: string;
  published: string;
}

export interface AdminEnCopy extends AdminPanelsEnCopy {
  dashboard: AdminEnDashboardCopy;
  subscription: AdminEnSubscriptionCopy;
  userManagement: AdminEnUserManagementCopy;
  customAlerts: AdminEnCustomAlertsCopy;
}

export const ADMIN_EN = {
  ...ADMIN_PANELS_EN,
  dashboard: {
    title: 'Admin Dashboard',
    tabs: [
      {
        id: 'analytics',
        label: 'Analytics',
        description: 'Global app analytics and user behavior tracking',
      },
      {
        id: 'users',
        label: 'User Management',
        description: 'Manage user accounts, roles, and permissions',
      },
      {
        id: 'emojis',
        label: 'Emoji Approval',
        description: 'Approve or reject custom emoji submissions',
      },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        description: 'Manage subscription plans and user subscriptions',
      },
      {
        id: 'permissions',
        label: 'Permissions',
        description: 'Configure system permissions and access control',
      },
      {
        id: 'alerts',
        label: 'Custom Alerts',
        description: 'Manage system alerts and notifications',
      },
      {
        id: 'quotas',
        label: 'Guest Quotas',
        description: 'Configure guest user quotas and limits',
      },
    ],
  },
  subscription: {
    panelTitle: 'Subscription Management',
    panelDescription:
      'Manage subscription plans, user subscriptions, and quota system integration',
    loadingData: 'Loading subscription data...',
    systemNotAvailableTitle: 'Subscription System Not Available',
    systemNotAvailableBody: 'The subscription system is not configured or available.',
    retry: 'Retry',
    tabs: {
      overview: 'Overview',
      plans: 'Plans',
      subscriptions: 'Subscriptions',
    },
    overview: {
      totalPlans: 'Total Plans',
      activePlansSuffix: 'active',
      totalSubscriptions: 'Total Subscriptions',
      activeSuffix: 'active',
      trialUsers: 'Trial Users',
      currentlyTrialing: 'Currently trialing',
      monthlyRevenue: 'Monthly Revenue',
      recurringMonthly: 'Recurring monthly',
      planDistribution: 'Plan Distribution',
      subscribersSuffix: 'subscribers',
      loadingStats: 'Loading stats...',
    },
    plans: {
      title: 'Subscription Plans',
      createNewPlan: 'Create New Plan',
      createComingSoon: 'Create Plan functionality coming soon!',
      edit: 'Edit',
      enable: 'Enable',
      disable: 'Disable',
      free: 'Free',
      periodMonth: '/month',
      periodYear: '/year',
      periodLifetime: 'lifetime',
    },
    subscriptions: {
      title: 'User Subscriptions',
      assignSubscription: 'Assign Subscription',
      searchPlaceholder: 'Search users or plans...',
      allStatuses: 'All Statuses',
      allPlans: 'All Plans',
      tableHeaders: [
        'User',
        'Plan',
        'Status',
        'Billing',
        'Expires',
        'Assigned By',
        'Actions',
      ],
      edit: 'Edit',
      cancel: 'Cancel',
      previous: '← Previous',
      next: 'Next →',
    },
    statusLabels: {
      active: 'Active',
      trialing: 'Trial',
      cancelled: 'Cancelled',
      expired: 'Expired',
      suspended: 'Suspended',
      pending: 'Pending',
    },
  },
  userManagement: {
    panelTitle: 'User Management',
    panelDescription: 'Manage user accounts, roles, subscriptions, and permissions',
    filters: 'Filters',
    exportAll: 'Export All',
    searchPlaceholder: 'Search users by name, email, or ID...',
    loadingUsers: 'Loading users...',
    loadingMoreUsers: 'Loading more users...',
    retry: 'Retry',
    viewDetails: 'View Details',
    assignRole: 'Assign Role',
    manageSubscription: 'Manage Subscription',
    manageQuota: 'Manage Quota',
    unknownUser: 'Unknown User',
  },
  customAlerts: {
    panelTitle: 'Custom Alerts Management',
    panelDescription: 'Create, edit, and manage custom alerts for different user groups',
    createNewAlert: 'Create New Alert',
    createFirstAlert: 'Create First Alert',
    emptyTitle: 'No Custom Alerts Yet',
    emptyBody: 'Create your first custom alert to start engaging with your users!',
    editAlert: 'Edit Alert',
    createAlert: 'Create Alert',
    updateAlert: 'Update Alert',
    cancel: 'Cancel',
    retry: 'Retry',
    signInAgain: 'Sign In Again',
    signIn: 'Sign In',
    goHome: 'Go Home',
    errorLoadingTitle: 'Error Loading Alerts',
    authRequiredTitle: 'Authentication Required',
    authRequiredBody: 'You need to log in to access the admin panel.',
    adminAccessTitle: 'Admin Access Required',
    adminAccessBody: "You don't have permission to access this admin feature.",
    targetAudiences: {
      all: 'All Users',
      authenticated: 'Authenticated Users',
      subscribers: 'Subscribers',
      admins: 'Administrators',
      role_based: 'Role-Based',
      specific_users: 'Specific Users',
    },
    active: 'Active',
    published: 'Published',
  },
} satisfies AdminEnCopy;