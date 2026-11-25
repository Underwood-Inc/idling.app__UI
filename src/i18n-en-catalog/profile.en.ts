export interface ProfileEnPrivateCopy {
  title: string;
  message: string;
}

export interface ProfileEnMetadataCopy {
  invalidUrlTitle: string;
  invalidUrlDescription: string;
  notFoundTitle: string;
  notFoundDescription: string;
  privateTitle: string;
  privateDescription: string;
  publicTitleSuffix: string;
  publicOpenGraphTitleSuffix: string;
  publicFallbackDescription: string;
  publicFallbackOpenGraphDescription: string;
  productNotFoundTitle: string;
}

export interface ProfileEnNotFoundCopy {
  iconAria: string;
  title: string;
  message: string;
  reasons: string[];
  goHome: string;
  searchTitle: string;
  searchDescription: string;
  searchPlaceholder: string;
  helpTitle: string;
  helpSearchLabel: string;
  helpSearchDescription: string;
  helpProductsLabel: string;
  helpProductsDescription: string;
}

export interface ProfileEnDecorationOptionCopy {
  value: string;
  label: string;
}

export interface ProfileEnPageUiCopy {
  adminDecorationTitle: string;
  adminDecorationDescription: string;
  adminDecorationNote: string;
  previewLabel: string;
  demoUserFallback: string;
  testDecorationsButton: string;
  testDecorationsTitle: string;
  subscriptionsTitle: string;
  freeTierMessage: string;
  decorationOptions: ProfileEnDecorationOptionCopy[];
}

export interface ProfileEnCopy {
  private: ProfileEnPrivateCopy;
  metadata: ProfileEnMetadataCopy;
  notFound: ProfileEnNotFoundCopy;
  pageUi: ProfileEnPageUiCopy;
}

export const PROFILE_EN = {
  private: {
    title: 'Private Profile',
    message:
      'This user has set their profile to private. Only they can view their profile information.',
  },
  metadata: {
    invalidUrlTitle: 'Invalid Profile URL | Idling.app',
    invalidUrlDescription: 'Profile URLs must use database IDs only.',
    notFoundTitle: 'User Not Found | Idling.app',
    notFoundDescription: 'The requested user profile could not be found.',
    privateTitle: 'Private Profile | Idling.app',
    privateDescription: 'This user has set their profile to private.',
    publicTitleSuffix: ' - User Profile | Idling.app',
    publicOpenGraphTitleSuffix: ' - Profile',
    publicFallbackDescription:
      "View {name}'s profile, activity stats, and contributions on Idling.app.",
    publicFallbackOpenGraphDescription:
      "View {name}'s profile and activity on Idling.app.",
    productNotFoundTitle: 'Product',
  },
  notFound: {
    iconAria: 'User not found',
    title: 'User Not Found',
    message: "Sorry, we couldn't find the user profile you're looking for. This could happen if:",
    reasons: [
      "The username doesn't exist",
      'The user has deleted their account',
      'The profile URL is incorrect',
      "The user's profile is set to private",
    ],
    goHome: 'Go Home',
    searchTitle: 'Search for Users',
    searchDescription: "Try searching for the user you're looking for:",
    searchPlaceholder: 'Search users by name or email...',
    helpTitle: 'Help',
    helpSearchLabel: 'Search',
    helpSearchDescription: 'Use the search above to find users by name or email',
    helpProductsLabel: 'Products',
    helpProductsDescription: 'Browse the home lineup for apps and mods',
  },
  pageUi: {
    adminDecorationTitle: 'Username Decoration Testing',
    adminDecorationDescription: 'Test different username decorations on your profile page',
    adminDecorationNote: 'This is a testing feature only visible to admins on their own profile',
    previewLabel: 'Preview:',
    demoUserFallback: 'Demo User',
    testDecorationsButton: 'Test Username Decorations',
    testDecorationsTitle: 'Username Decoration Testing (Admin Only)',
    subscriptionsTitle: 'Subscriptions',
    freeTierMessage: 'Free tier user',
    decorationOptions: [
      { value: '', label: 'None' },
      { value: 'enterprise-crown', label: 'Enterprise Crown' },
      { value: 'premium-galaxy', label: 'Premium Galaxy' },
      { value: 'pro-plasma', label: 'Pro Plasma' },
      { value: 'active-glow', label: 'Active Glow' },
      { value: 'trial-pulse', label: 'Trial Pulse' },
    ],
  },
} satisfies ProfileEnCopy;