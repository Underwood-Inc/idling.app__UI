export interface SuiteDetailEnFeatureCopy {
  title: string;
  description: string;
}

export interface SuiteDetailEnSectionCopy {
  title: string;
  description?: string;
  features: SuiteDetailEnFeatureCopy[];
}

export interface SuiteDetailEnHeroCopy {
  title: string;
  tagline: string;
  mascotAlt: string;
  statusBeta?: string;
  ctaLaunch: string;
  ctaViewSource: string;
}

export interface SuiteDetailEnCopy {
  hero: SuiteDetailEnHeroCopy;
  overview: {
    title: string;
    description: string;
  };
  keyFeatures: SuiteDetailEnSectionCopy;
  extraSections?: SuiteDetailEnSectionCopy[];
  builtWith: {
    title: string;
  };
  a11y: {
    scrollForMore: string;
  };
}

export type SuiteDetailProductId =
  | 'stream_suite'
  | 'mods_hub'
  | 'auth_service'
  | 'access_hub'
  | 'url_shortener';

export interface SuiteDetailsEnCatalog {
  stream_suite: SuiteDetailEnCopy;
  mods_hub: SuiteDetailEnCopy;
  auth_service: SuiteDetailEnCopy;
  access_hub: SuiteDetailEnCopy;
  url_shortener: SuiteDetailEnCopy;
}

export const SUITE_DETAILS_EN = {
  stream_suite: {
    hero: {
      title: 'Stream Suite',
      tagline: 'Professional OBS Studio Control Panel',
      mascotAlt: 'Red Panda Developer',
      ctaLaunch: 'Launch Stream Suite →',
      ctaViewSource: 'View Source',
    },
    overview: {
      title: 'What is Stream Suite?',
      description:
        'Stream Suite is a comprehensive OBS Studio control panel that brings professional-grade animations and automation to your streaming workflow. Built with Svelte 5 and designed as a Progressive Web App, it provides seamless control over your OBS scenes with beautiful, customizable animations.',
    },
    keyFeatures: {
      title: 'Key Features',
      features: [
        {
          title: 'Source Animations',
          description:
            'Animate source visibility with fade, slide, zoom, and pop effects. 60 FPS performance with sub-50ms latency via WebSocket. No OBS lag - all animations are buttery smooth.',
        },
        {
          title: 'Source Swaps',
          description:
            'Animated position and size transitions between sources. 7 different animation styles with position memory for perfect swaps every time.',
        },
        {
          title: 'Layout Presets',
          description:
            'Save and apply entire scene layouts with multi-source animation support. Switch between streaming, recording, and custom setups instantly.',
        },
        {
          title: 'Text Cycler',
          description:
            'Dynamic text effects with transitions including fade, slide, typewriter, glitch, wave, and scramble. Perfect for alerts and overlays.',
        },
        {
          title: 'Progressive Web App',
          description:
            'Install as a PWA for offline access and native app experience. Multi-layer storage system (IndexedDB + localStorage + Recovery).',
        },
        {
          title: 'Unified Control Panel',
          description:
            'One web-based dock to control everything. Real-time WebSocket communication with OBS Studio for instant updates.',
        },
      ],
    },
    builtWith: {
      title: 'Built With',
    },
    a11y: {
      scrollForMore: 'Scroll for more content',
    },
  },
  mods_hub: {
    hero: {
      title: 'Mods Hub',
      tagline: 'Modern Mod Hosting Platform',
      mascotAlt: 'Red Panda with Gift',
      statusBeta: 'Beta — still in active development',
      ctaLaunch: 'Launch Mods Hub →',
      ctaViewSource: 'View Source',
    },
    overview: {
      title: 'What is Mods Hub?',
      description:
        'A modern mod hosting platform similar to Modrinth/CurseForge, built with React 19 and Cloudflare Workers. Beautiful gold-themed UI with full semantic versioning, advanced search with human-friendly query parser, and R2 cloud storage with client-side encryption.',
    },
    keyFeatures: {
      title: 'Key Features',
      features: [
        {
          title: 'Mod Upload & Management',
          description:
            'Upload, update, and manage your mods with drag-and-drop interface. Full CRUD operations with intuitive UI.',
        },
        {
          title: 'Semantic Versioning',
          description:
            'Full version control with semantic versioning support. Track changes, publish updates, and maintain changelogs.',
        },
        {
          title: 'Advanced Search',
          description:
            'Powerful search with @strixun/search-query-parser supporting categories, tags, quoted phrases, AND/OR logic, and wildcard prefix matching.',
        },
        {
          title: 'Direct Download Links',
          description:
            'Share direct download links in any application. No redirects, no waiting - instant downloads for users.',
        },
        {
          title: 'Beautiful Gold UI',
          description:
            'Stunning gold-themed responsive interface built with styled-components. Modern, accessible, and a pleasure to use.',
        },
        {
          title: 'R2 Cloud Storage with Encryption',
          description:
            'Cloudflare R2 storage with optional client-side encryption, default compression, and direct download links.',
        },
      ],
    },
    extraSections: [
      {
        title: 'Three-Layer State Architecture',
        description:
          'Mods Hub uses a sophisticated three-layer state model for optimal performance and developer experience:',
        features: [
          {
            title: 'Signals Layer',
            description:
              '@preact/signals-react for UI state - form fields, toggles, and filters with automatic reactivity.',
          },
          {
            title: 'Zustand Layer',
            description:
              'Global client state management for auth, UI state, and notifications with zero boilerplate.',
          },
          {
            title: 'TanStack Query Layer',
            description:
              'Server state management with automatic caching, background refetching, and optimistic updates.',
          },
        ],
      },
    ],
    builtWith: {
      title: 'Built With',
    },
    a11y: {
      scrollForMore: 'Scroll for more content',
    },
  },
  auth_service: {
    hero: {
      title: 'Auth Service',
      tagline: 'Multi-Tenant OTP Authentication',
      mascotAlt: 'Red Panda Thumbs Up',
      ctaLaunch: 'Launch Auth Service →',
      ctaViewSource: 'View Source',
    },
    overview: {
      title: 'What is Auth Service?',
      description:
        'A multi-tenant OTP authentication service built on Cloudflare Workers with email-based passwordless authentication via Resend API. Features include developer dashboard built with Svelte 5, multi-tenant API key management, OpenAPI 3.1.0 specification with Swagger UI, and audit logging. Single sign-on across all *.idling.app domains with HttpOnly cookies.',
    },
    keyFeatures: {
      title: 'Key Features',
      features: [
        {
          title: 'Passwordless OTP',
          description:
            'Email-based one-time password authentication with no password storage. Secure, user-friendly, and reduces attack surface.',
        },
        {
          title: 'JWT Token Management',
          description:
            'Industry-standard JWT tokens with HttpOnly cookies for maximum security. Automatic refresh and expiration handling.',
        },
        {
          title: 'API Key Management',
          description:
            'Multi-tenant API key system with granular permissions. Create, rotate, and revoke API keys from the developer dashboard.',
        },
        {
          title: 'Analytics Dashboard',
          description:
            'Built with Svelte 5, track authentication events, monitor usage, and analyze patterns with real-time analytics.',
        },
        {
          title: 'OpenAPI 3.1.0 Spec',
          description:
            'Complete OpenAPI specification with Swagger UI integration. Interactive API documentation for easy integration.',
        },
        {
          title: 'Single Sign-On',
          description:
            'SSO across all *.idling.app domains with HttpOnly cookies. Login once on any service, authenticated everywhere.',
        },
      ],
    },
    extraSections: [
      {
        title: 'Developer-First Design',
        description:
          'Auth Service provides everything developers need to integrate secure authentication into their applications:',
        features: [
          {
            title: 'Embeddable UI Components',
            description:
              'Drop-in authentication components for React, Svelte, and vanilla JavaScript. No UI work required.',
          },
          {
            title: 'Comprehensive Docs',
            description:
              '300+ pages of documentation in PANDA_CORE covering integration guides, API reference, and security best practices.',
          },
          {
            title: 'Full Test Coverage',
            description:
              'E2E integration tests with Playwright, unit tests with Vitest, and CI/CD workflows for confidence.',
          },
        ],
      },
    ],
    builtWith: {
      title: 'Built With',
    },
    a11y: {
      scrollForMore: 'Scroll for more content',
    },
  },
  access_hub: {
    hero: {
      title: 'Access Hub',
      tagline: 'Access Control Dashboard',
      mascotAlt: 'Red Panda Confident',
      ctaLaunch: 'Launch Access Hub →',
      ctaViewSource: 'View Source',
    },
    overview: {
      title: 'What is Access Hub?',
      description:
        'A minimal frontend UI for the Strixun Access Control System deployed on Cloudflare Pages. View all available roles and permissions with a clean, simple interface. Backend API handles RBAC (role-based access control), permission management, quota enforcement, and auto-provisioning - all service-agnostic and deployed on Cloudflare Workers.',
    },
    keyFeatures: {
      title: 'Key Features',
      features: [
        {
          title: 'Role-Based Access Control',
          description:
            'Define and manage roles with granular permissions. Assign users to roles for scalable access management across services.',
        },
        {
          title: 'Permission Management',
          description:
            'View all available permissions and their assignments. Fine-grained control over what users can and cannot do.',
        },
        {
          title: 'User Access Auditing',
          description:
            'Track who has access to what and when. Complete audit trail for compliance and security monitoring.',
        },
        {
          title: 'Service-Agnostic Design',
          description:
            'Works with any service in the SSS ecosystem. Unified access control across all applications and APIs.',
        },
        {
          title: 'Quota Management',
          description:
            'Monitor and manage usage quotas per user or role. Prevent abuse and ensure fair resource allocation.',
        },
        {
          title: 'Simple, Clean UI',
          description:
            'Intuitive interface that gets out of your way. Direct API integration with Access Service backend.',
        },
      ],
    },
    extraSections: [
      {
        title: 'Architecture Pattern',
        description: 'Access Hub follows the same proven pattern as Mods Hub:',
        features: [
          {
            title: 'Frontend @ access.idling.app',
            description:
              'React 18 frontend deployed on Cloudflare Pages with automatic builds via GitHub Actions.',
          },
          {
            title: 'Backend @ access-api.idling.app',
            description:
              'Cloudflare Worker API handling all access control logic, storage, and permissions enforcement.',
          },
        ],
      },
    ],
    builtWith: {
      title: 'Built With',
    },
    a11y: {
      scrollForMore: 'Scroll for more content',
    },
  },
  url_shortener: {
    hero: {
      title: 'URL Shortener',
      tagline: 'Short Links with Analytics',
      mascotAlt: 'Red Panda with Sunglasses',
      ctaLaunch: 'Launch URL Shortener →',
      ctaViewSource: 'View Source',
    },
    overview: {
      title: 'What is URL Shortener?',
      description:
        'A Cloudflare Worker-based URL shortening service with OTP authentication via shared Strixun OTP component, click analytics tracking (IP, user agent, referrer, geographic data), and standalone React web interface. Uses Cloudflare KV for sub-millisecond URL lookups and automatic TTL-based expiration with encrypted API responses.',
    },
    keyFeatures: {
      title: 'Key Features',
      features: [
        {
          title: 'Create & Manage Short URLs',
          description:
            'Generate short links with custom codes or auto-generated slugs. Full CRUD operations for managing your URL collection.',
        },
        {
          title: 'Click Analytics',
          description:
            'Track clicks, referrers, and geographic data. Real-time analytics stored in Cloudflare KV for instant insights.',
        },
        {
          title: 'Custom URL Codes',
          description:
            'Choose your own short codes for memorable, brand-friendly links. Automatic validation prevents collisions.',
        },
        {
          title: 'Automatic Expiration',
          description:
            'Set expiration dates for temporary links. Automatic cleanup keeps your URL collection fresh and relevant.',
        },
        {
          title: 'Standalone Web Interface',
          description:
            'Beautiful React-based web interface with SSS branding. Manage all your short links from one place.',
        },
        {
          title: 'OTP Authentication',
          description:
            'Integrated with Auth Service for secure, passwordless authentication. SSO with all SSS applications.',
        },
      ],
    },
    builtWith: {
      title: 'Built With',
    },
    a11y: {
      scrollForMore: 'Scroll for more content',
    },
  },
} satisfies SuiteDetailsEnCatalog;