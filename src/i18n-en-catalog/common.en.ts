export interface CommonEnBackButtonCopy {
  defaultLabel: string;
  titleWithPage: string;
  titleGoBack: string;
}

export interface CommonEnActionsCopy {
  save: string;
  saving: string;
  cancel: string;
  loading: string;
  tryAgain: string;
  goHome: string;
  returnHome: string;
  close: string;
  dismiss: string;
  retry: string;
  back: string;
  signIn: string;
  signOut: string;
  expand: string;
  collapse: string;
  next: string;
  previous: string;
  load: string;
  backHome: string;
}

export interface CommonEnCopy {
  actions: CommonEnActionsCopy;
  backButton: CommonEnBackButtonCopy;
}

export const COMMON_EN = {
  actions: {
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    loading: 'Loading...',
    tryAgain: 'Try Again',
    goHome: 'Go Home',
    returnHome: 'Return Home',
    close: 'Close',
    dismiss: 'Dismiss',
    retry: 'Retry',
    back: 'Back',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    expand: 'Expand',
    collapse: 'Collapse',
    next: 'Next →',
    previous: '← Previous',
    load: 'Load',
    backHome: '← Back home',
  },
  backButton: {
    defaultLabel: '← Back',
    titleWithPage: 'Back to previous page (page {page})',
    titleGoBack: 'Go back',
  },
} satisfies CommonEnCopy;