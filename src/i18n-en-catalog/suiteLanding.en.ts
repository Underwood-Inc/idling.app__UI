export interface SuiteLandingEnHeroCopy {
  title: string;
  tagline: string;
  description: string;
  descriptionEmphasis: string;
  viewOnGitHub: string;
}

export interface SuiteLandingEnFooterCopy {
  title: string;
  description: string;
  starOnGitHub: string;
}

export interface SuiteLandingEnProductActionsCopy {
  launchApp: string;
  learnMore: string;
}

export interface SuiteLandingEnStatusCopy {
  live: string;
  beta: string;
  planned: string;
  development: string;
}

export interface SuiteLandingEnCopy {
  hero: SuiteLandingEnHeroCopy;
  footer: SuiteLandingEnFooterCopy;
  productActions: SuiteLandingEnProductActionsCopy;
  status: SuiteLandingEnStatusCopy;
}

export const SUITE_LANDING_EN = {
  hero: {
    title: 'Strixun Stream Suite',
    tagline: 'Professional Streaming Tools & Web Services',
    description:
      "A comprehensive ecosystem of open-source applications with single sign-on authentication. Login once on any *.idling.app domain and you're authenticated everywhere.",
    descriptionEmphasis: ' MIT Licensed. 100% Open Source. Privacy-Focused.',
    viewOnGitHub: 'View on GitHub',
  },
  footer: {
    title: 'Ready to Get Started?',
    description:
      'All applications are open-source and free to use. Star us on GitHub, join our community, and help shape the future of streaming tools.',
    starOnGitHub: 'Star on GitHub',
  },
  productActions: {
    launchApp: 'Launch App →',
    learnMore: 'Learn More',
  },
  status: {
    live: 'live',
    beta: 'beta',
    planned: 'planned',
    development: 'development',
  },
} satisfies SuiteLandingEnCopy;