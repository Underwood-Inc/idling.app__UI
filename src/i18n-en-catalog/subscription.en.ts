export interface SubscriptionEnPageCopy {
  title: string;
  subtitle: string;
  subtitleQuota: string;
  loading: string;
  loadingData: string;
  errorHeading: string;
  noDataHeading: string;
  noDataBody: string;
  returnHome: string;
  quotaBannerTitle: string;
  quotaBannerBody: string;
  whatYouGet: string;
  dailyLimitLabel: string;
  currentLimitsTitle: string;
  dailyGenerations: string;
  advancedOptions: string;
  yes: string;
  no: string;
  subscribeNow: string;
  backToGenerator: string;
  fetchFailed: string;
}

export interface SubscriptionEnMetadataCopy {
  title: string;
  description: string;
}

export interface SubscriptionEnCopy {
  page: SubscriptionEnPageCopy;
  metadata: SubscriptionEnMetadataCopy;
}

export const SUBSCRIPTION_EN = {
  page: {
    title: 'Subscription',
    subtitle: 'Choose your plan',
    subtitleQuota: 'Upgrade to continue generating emojis',
    loading: 'Loading subscription options...',
    loadingData: 'Loading subscription data...',
    errorHeading: 'Error',
    noDataHeading: 'No Data Available',
    noDataBody: 'Subscription data could not be loaded.',
    returnHome: 'Return to Home',
    quotaBannerTitle: 'Daily Limit Reached',
    quotaBannerBody:
      "You've reached your daily generation limit. Upgrade to Pro to continue generating emojis with unlimited daily generations.",
    whatYouGet: 'What you get:',
    dailyLimitLabel: 'Daily Limit:',
    currentLimitsTitle: 'Your Current Limits (Free Plan):',
    dailyGenerations: 'Daily Generations:',
    advancedOptions: 'Advanced Options:',
    yes: 'Yes',
    no: 'No',
    subscribeNow: 'Subscribe Now',
    backToGenerator: '← Back to Emoji Generator',
    fetchFailed: 'Failed to load subscription data',
  },
  metadata: {
    title: 'Subscription | Idling.app',
    description: 'Choose a plan and upgrade your idling.app subscription.',
  },
} satisfies SubscriptionEnCopy;