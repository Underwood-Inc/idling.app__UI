export interface ErrorsEnNotFoundCopy {
  code: string;
  title: string;
  message: string;
  returnHome: string;
}

export interface ErrorsEnRouteErrorCopy {
  title: string;
  fallbackMessage: string;
  errorIdLabel: string;
  tryAgain: string;
}

export interface ErrorsEnGlobalErrorCopy {
  title: string;
  criticalMessage: string;
  unknownError: string;
  errorIdLabel: string;
  tryAgain: string;
  goHome: string;
}

export interface ErrorsEnProfileNotFoundCopy {
  userNotFoundAria: string;
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

export interface ErrorsEnCopy {
  notFound: ErrorsEnNotFoundCopy;
  routeError: ErrorsEnRouteErrorCopy;
  globalError: ErrorsEnGlobalErrorCopy;
  profileNotFound: ErrorsEnProfileNotFoundCopy;
}

export const ERRORS_EN = {
  notFound: {
    code: '404',
    title: 'Page Not Found',
    message:
      "The page you're looking for doesn't exist or has been moved. Perhaps the wizard teleported it elsewhere?",
    returnHome: 'Return Home',
  },
  routeError: {
    title: 'Oops! Something went wrong',
    fallbackMessage: 'An unexpected error occurred while loading this page.',
    errorIdLabel: 'Error ID:',
    tryAgain: 'Try Again',
  },
  globalError: {
    title: 'Critical Error',
    criticalMessage: 'A critical error occurred while loading the application.',
    unknownError: 'Unknown error',
    errorIdLabel: 'Error ID:',
    tryAgain: 'Try Again',
    goHome: 'Go Home',
  },
  profileNotFound: {
    userNotFoundAria: 'User not found',
    title: 'User Not Found',
    message:
      "Sorry, we couldn't find the user profile you're looking for. This could happen if:",
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
} satisfies ErrorsEnCopy;