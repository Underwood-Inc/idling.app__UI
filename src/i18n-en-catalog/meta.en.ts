export interface MetaEnSiteCopy {
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  authorName: string;
  creator: string;
  publisher: string;
  openGraphTitle: string;
  openGraphDescription: string;
  siteName: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterCreator: string;
}

export interface MetaEnPagesCopy {
  portfolioTitle: string;
  portfolioDescription: string;
  adminTitle: string;
  adminDescription: string;
  signInHeadline: string;
  signInSubtitle: string;
  subscriptionTitle: string;
  subscriptionDescription: string;
}

export interface MetaEnCopy {
  site: MetaEnSiteCopy;
  pages: MetaEnPagesCopy;
}

export const META_EN = {
  site: {
    defaultTitle: 'Idling.app',
    titleTemplate: '%s | Idling.app',
    description: 'Your digital playground for creativity and expression',
    keywords: ['creativity', 'expression', 'digital', 'playground'],
    authorName: 'Idling.app Team',
    creator: 'Idling.app',
    publisher: 'Idling.app',
    openGraphTitle: 'Idling.app',
    openGraphDescription: 'Your digital playground for creativity and expression',
    siteName: 'Idling.app',
    twitterTitle: 'Idling.app',
    twitterDescription: 'Your digital playground for creativity and expression',
    twitterCreator: '@idlingapp',
  },
  pages: {
    portfolioTitle: 'Catalog & ecosystem',
    portfolioDescription:
      'Full idling.app catalog: about Strixun, ecosystem diagrams, filterable projects, activity, and live stats.',
    adminTitle: 'Admin Dashboard - Idling.app',
    adminDescription: 'Administrative dashboard for managing users, content, and emojis',
    signInHeadline: 'Welcome to Idling App',
    signInSubtitle: 'Choose your preferred sign-in method to continue',
    subscriptionTitle: 'Subscription | Idling.app',
    subscriptionDescription: 'Choose a plan and upgrade your idling.app subscription.',
  },
} satisfies MetaEnCopy;