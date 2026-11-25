export interface AdminEnAnalyticsCopy {
  title: string;
  loading: string;
  errorTitle: string;
  retry: string;
  refresh: string;
  dateRangeLabel: string;
  dateRanges: Record<'7d' | '30d' | '90d' | '1y', string>;
  tabs: Record<
    'overview' | 'geography' | 'devices' | 'heatmap' | 'subscriptions',
    string
  >;
  metrics: {
    totalSessions: string;
    uniqueUsers: string;
    pageViews: string;
    totalClicks: string;
    avgSessionDuration: string;
    bounceRate: string;
    vpnUsage: string;
    conversionRate: string;
    metricChangeSample: string;
  };
  sections: {
    trafficTrends: string;
    topCountries: string;
    topCities: string;
    vpnProxyUsage: string;
    vpnSessions: string;
    proxySessions: string;
    torSessions: string;
    vpnPercentage: string;
    topVpnProviders: string;
    deviceTypes: string;
    browsers: string;
    operatingSystems: string;
    topPagesByClicks: string;
    clickPatterns: string;
    planPerformance: string;
    conversionFunnel: string;
    revenueImpact: string;
    totalAttributedRevenue: string;
    averageRevenuePerUser: string;
  };
  chart: {
    sessionsLabel: string;
    pageviewsLabel: string;
    clicksLabel: string;
  };
  subscriptionMetrics: {
    views: string;
    conversions: string;
    conversionRate: string;
  };
}

export interface AdminEnEmojisCopy {
  title: string;
  statusLabel: string;
  statusOptions: Record<'all' | 'pending' | 'approved' | 'rejected', string>;
  searchPlaceholder: string;
  search: string;
  selectedCount: string;
  bulkApprove: string;
  loading: string;
  selectAll: string;
  empty: string;
  noImage: string;
  byPrefix: string;
  categoryPrefix: string;
  createdPrefix: string;
  descriptionPrefix: string;
  approve: string;
  reject: string;
  delete: string;
  previous: string;
  next: string;
  pageOf: string;
  rejectModalTitle: string;
  rejectReasonLabel: string;
  rejectReasonPlaceholder: string;
  cancel: string;
  rejectEmoji: string;
  deleteConfirm: string;
}

export interface AdminEnPermissionsCopy {
  title: string;
  subtitle: string;
  createPermission: string;
  createRole: string;
  tabs: Record<'permissions' | 'roles' | 'audit', string>;
  loading: string;
  auditTitle: string;
  auditComingSoon: string;
  noResultsTitle: string;
  noResultsFiltered: string;
  noResultsEmptyPermission: string;
  noResultsEmptyRole: string;
  searchPlaceholder: string;
}

export interface AdminEnGuestQuotasCopy {
  title: string;
  loading: string;
  addNewQuota: string;
  createTitle: string;
  currentQuotasTitle: string;
  emptyList: string;
  howItWorksTitle: string;
  howItWorksBullets: string[];
  unlimitedPlaceholder: string;
  descriptionPlaceholder: string;
  unlimitedPlaceholderShort: string;
  descriptionPlaceholderShort: string;
}

export interface AdminPanelsEnCopy {
  analytics: AdminEnAnalyticsCopy;
  emojis: AdminEnEmojisCopy;
  permissions: AdminEnPermissionsCopy;
  guestQuotas: AdminEnGuestQuotasCopy;
}

export const ADMIN_PANELS_EN = {
  analytics: {
    title: 'Analytics Dashboard',
    loading: 'Loading analytics data...',
    errorTitle: 'Analytics Error',
    retry: 'Retry',
    refresh: 'Refresh',
    dateRangeLabel: 'Date Range:',
    dateRanges: {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year',
    },
    tabs: {
      overview: 'Overview',
      geography: 'Geography',
      devices: 'Devices',
      heatmap: 'Heatmap',
      subscriptions: 'Subscriptions',
    },
    metrics: {
      totalSessions: 'Total Sessions',
      uniqueUsers: 'Unique Users',
      pageViews: 'Page Views',
      totalClicks: 'Total Clicks',
      avgSessionDuration: 'Avg Session Duration',
      bounceRate: 'Bounce Rate',
      vpnUsage: 'VPN Usage',
      conversionRate: 'Conversion Rate',
      metricChangeSample: '+12.5% from last period',
    },
    sections: {
      trafficTrends: 'Traffic Trends',
      topCountries: 'Top Countries',
      topCities: 'Top Cities',
      vpnProxyUsage: 'VPN & Proxy Usage',
      vpnSessions: 'VPN Sessions',
      proxySessions: 'Proxy Sessions',
      torSessions: 'Tor Sessions',
      vpnPercentage: 'VPN Percentage',
      topVpnProviders: 'Top VPN Providers',
      deviceTypes: 'Device Types',
      browsers: 'Browsers',
      operatingSystems: 'Operating Systems',
      topPagesByClicks: 'Top Pages by Clicks',
      clickPatterns: 'Click Patterns',
      planPerformance: 'Plan Performance',
      conversionFunnel: 'Conversion Funnel',
      revenueImpact: 'Revenue Impact',
      totalAttributedRevenue: 'Total Attributed Revenue',
      averageRevenuePerUser: 'Average Revenue Per User',
    },
    chart: {
      sessionsLabel: 'Sessions:',
      pageviewsLabel: 'Pageviews:',
      clicksLabel: 'Clicks:',
    },
    subscriptionMetrics: {
      views: 'Views:',
      conversions: 'Conversions:',
      conversionRate: 'Conversion Rate:',
    },
  },
  emojis: {
    title: 'Emoji Management',
    statusLabel: 'Status:',
    statusOptions: {
      all: 'All Statuses',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    searchPlaceholder: 'Search emojis, users, or categories...',
    search: 'Search',
    selectedCount: 'selected',
    bulkApprove: 'Bulk Approve',
    loading: 'Loading emojis...',
    selectAll: 'Select All',
    empty: 'No emojis found for the current filter.',
    noImage: 'No Image',
    byPrefix: 'By:',
    categoryPrefix: 'Category:',
    createdPrefix: 'Created:',
    descriptionPrefix: 'Description:',
    approve: 'Approve',
    reject: 'Reject',
    delete: 'Delete',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page',
    rejectModalTitle: 'Reject Emoji',
    rejectReasonLabel: 'Reason for rejection:',
    rejectReasonPlaceholder: 'Please provide a reason for rejecting this emoji...',
    cancel: 'Cancel',
    rejectEmoji: 'Reject Emoji',
    deleteConfirm: 'Are you sure you want to permanently delete this emoji?',
  },
  permissions: {
    title: 'Permission Management System',
    subtitle:
      'Comprehensive permissions and roles management with enterprise-grade security',
    createPermission: 'Create New Permission',
    createRole: 'Create New Role',
    tabs: {
      permissions: 'Permissions',
      roles: 'Roles',
      audit: 'Audit Trail',
    },
    loading: 'Loading',
    auditTitle: 'Audit Trail',
    auditComingSoon: 'Comprehensive audit logging coming soon...',
    noResultsTitle: 'No',
    noResultsFiltered: 'Try adjusting your search criteria or filters.',
    noResultsEmptyPermission: 'Create your first permission to get started.',
    noResultsEmptyRole: 'Create your first role to get started.',
    searchPlaceholder: 'Search',
  },
  guestQuotas: {
    title: 'Global Guest Quota Management',
    loading: 'Loading global guest quotas...',
    addNewQuota: 'Add New Quota',
    createTitle: 'Create Global Guest Quota',
    currentQuotasTitle: 'Current Global Guest Quotas',
    emptyList:
      'No global guest quotas configured. Guest users will use system defaults.',
    howItWorksTitle: 'How Global Guest Quotas Work:',
    howItWorksBullets: [
      'Priority: Global quotas apply to anonymous users when no user-specific overrides exist',
      'Feature-Level: Set different quotas for different services/features to avoid unintended impacts',
      'IP-Based: Quotas are tracked by IP address and optional machine fingerprinting',
      'Reset Periods: Choose hourly, daily, weekly, or monthly reset cycles',
      'Unlimited: Check "Unlimited" to remove quota restrictions entirely',
    ],
    unlimitedPlaceholder: 'Enter 0 for unlimited',
    descriptionPlaceholder: 'Optional description for this quota',
    unlimitedPlaceholderShort: 'Enter 0 for unlimited',
    descriptionPlaceholderShort: 'Optional description',
  },
} satisfies AdminPanelsEnCopy;