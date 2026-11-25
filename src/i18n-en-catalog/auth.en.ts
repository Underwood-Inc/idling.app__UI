export interface AuthEnSignInCopy {
  loginWithProviderPrefix: string;
  signOut: string;
}

export interface AuthEnSignInPageCopy {
  headline: string;
  subtitle: string;
}

export interface AuthEnOAuthConflictCopy {
  title: string;
  whatWouldYouLike: string;
  option1Title: string;
  option1DescriptionSignin: string;
  option1ButtonSignin: string;
  option2Title: string;
  option2Description: string;
  option2Button: string;
  option3Title: string;
  option3Description: string;
  option3Button: string;
  goHome: string;
}

export interface AuthEnCallbackOAuthConflictCopy {
  option1Title: string;
  option1Description: string;
  option1Button: string;
}

export interface AuthEnCallbackCopy {
  accountAlreadyLinkedTitle: string;
  oauthConflict: AuthEnCallbackOAuthConflictCopy;
  signInDifferentAccount: string;
  authErrorTitle: string;
  completingSignIn: string;
  completingSignInWithProvider: string;
  waitMessage: string;
  redirectingShortly: string;
  tryAgain: string;
  goHome: string;
  errors: {
    oauthSignin: string;
    oauthCallback: string;
    oauthCreateAccount: string;
    emailCreateAccount: string;
    callback: string;
    emailSignin: string;
    credentialsSignin: string;
    sessionRequired: string;
    unexpected: string;
  };
}

export interface AuthEnUnlinkCopy {
  title: string;
  subtitle: string;
  aboutTitle: string;
  aboutBody: string;
  howItWorksTitle: string;
  howItWorksSteps: string[];
  importantNotesTitle: string;
  importantNotes: string[];
  cancel: string;
  needHelp: string;
}

export interface AuthEnCopy {
  signInNav: string;
  signInPage: AuthEnSignInPageCopy;
  signIn: AuthEnSignInCopy;
  oauthConflict: AuthEnOAuthConflictCopy;
  callback: AuthEnCallbackCopy;
  unlink: AuthEnUnlinkCopy;
}

export const AUTH_EN = {
  signInNav: 'Sign In',
  signInPage: {
    headline: 'Welcome to Idling App',
    subtitle: 'Choose your preferred sign-in method to continue',
  },
  signIn: {
    loginWithProviderPrefix: 'Login with',
    signOut: 'Sign Out',
  },
  oauthConflict: {
    title: 'Account Already Linked',
    whatWouldYouLike: 'What would you like to do?',
    option1Title: 'Option 1: Sign in with a different account',
    option1DescriptionSignin:
      "Sign out and sign in with a different account that doesn't have this provider account linked.",
    option1ButtonSignin: 'Sign out & sign in with different account',
    option2Title: 'Option 2: Unlink and relink this account',
    option2Description:
      'We can help you unlink this provider account from the other user and link it to your current account.',
    option2Button: 'Unlink and relink account',
    option3Title: 'Option 3: Contact support',
    option3Description:
      'If you need help resolving this issue, our support team can assist you.',
    option3Button: 'Contact Support',
    goHome: 'Go Home',
  },
  callback: {
    accountAlreadyLinkedTitle: 'Account Already Linked',
    oauthConflict: {
      option1Title: 'Option 1: Sign in with your existing account',
      option1Description: 'If you remember your other account, sign in with that instead.',
      option1Button: 'Sign in with different account',
    },
    signInDifferentAccount: 'Sign in with different account',
    authErrorTitle: 'Authentication Error',
    completingSignIn: 'Completing sign-in...',
    completingSignInWithProvider: 'Signing in with',
    waitMessage: 'Please wait while we finish setting up your account.',
    redirectingShortly: 'Redirecting you shortly...',
    tryAgain: 'Try Again',
    goHome: 'Go Home',
    errors: {
      oauthSignin: 'There was an error with the OAuth sign-in process.',
      oauthCallback: 'There was an error during the OAuth callback.',
      oauthCreateAccount: 'Could not create OAuth account.',
      emailCreateAccount: 'Could not create email account.',
      callback: 'There was an error in the callback handler.',
      emailSignin: 'Check your email for the sign-in link.',
      credentialsSignin: 'Invalid credentials provided.',
      sessionRequired: 'Please sign in to access this page.',
      unexpected: 'An unexpected authentication error occurred.',
    },
  },
  unlink: {
    title: 'Unlink OAuth Account',
    subtitle: 'Resolve account linking conflicts',
    aboutTitle: 'About Account Linking Conflicts',
    aboutBody:
      "When you try to sign in with an OAuth provider (like Google or Twitch) that's already linked to another account, we need to resolve this conflict.",
    howItWorksTitle: 'How this works:',
    howItWorksSteps: [
      "We'll find the account that currently has this provider account linked",
      "We'll unlink it from that account",
      'You can then link it to your current account',
      "This process is safe and won't delete any data",
    ],
    importantNotesTitle: 'Important Notes:',
    importantNotes: [
      'This will only unlink the OAuth provider, not delete any user accounts',
      'Your account data and subscription state will be preserved',
      "You'll need to sign in with the other account to complete the process",
      "If you don't have access to the other account, contact support",
    ],
    cancel: 'Cancel',
    needHelp: 'Need Help?',
  },
} satisfies AuthEnCopy;