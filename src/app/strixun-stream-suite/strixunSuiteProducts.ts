import { NAV_PATHS } from '@lib/routes';

export type StrixunSuiteProductStatus = 'live' | 'beta' | 'planned' | 'development';

export interface StrixunSuiteProductHighlight {
  label: string;
  value: string;
}

export interface StrixunSuiteProductStructure {
  id: string;
  icon?: string;
  image?: string;
  status: StrixunSuiteProductStatus;
  url: string;
  detailsPath?: string;
}

export interface StrixunSuiteProductCopy {
  name: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  highlights: StrixunSuiteProductHighlight[];
}

export const STRIXUN_SUITE_PRODUCTS: StrixunSuiteProductStructure[] = [
  {
    id: 'stream-suite',
    image: '/red_panda/animated/256x256/extra/Camera.gif',
    status: 'live',
    url: 'https://streamkit.idling.app',
    detailsPath: NAV_PATHS.STREAM_SUITE_DETAIL,
  },
  {
    id: 'mods-hub',
    image: '/red_panda/animated/256x256/extra/Pat pat.gif',
    status: 'beta',
    url: 'https://mods.idling.app',
    detailsPath: NAV_PATHS.MODS_HUB_DETAIL,
  },
  {
    id: 'auth-service',
    image: '/red_panda/animated/256x256/extra/Glasses.gif',
    status: 'live',
    url: 'https://auth.idling.app',
    detailsPath: NAV_PATHS.AUTH_SERVICE_DETAIL,
  },
  {
    id: 'url-shortener',
    image: '/red_panda/animated/256x256/extra/Phone.gif',
    status: 'live',
    url: 'https://s.idling.app',
    detailsPath: NAV_PATHS.URL_SHORTENER_DETAIL,
  },
  {
    id: 'access-hub',
    image: '/red_panda/animated/256x256/extra/Ban.gif',
    status: 'live',
    url: 'https://access.idling.app',
    detailsPath: NAV_PATHS.ACCESS_HUB_DETAIL,
  },
];

export const STRIXUN_SUITE_PRODUCT_COPY_EN: Record<string, StrixunSuiteProductCopy> = {
  'stream-suite': {
    name: 'Stream Suite',
    tagline: 'Professional OBS Studio Control Panel',
    description:
      'Transform your streaming workflow with animated source visibility, buttery-smooth source swapping, and instant layout presets. Control everything from a beautiful web interface with real-time WebSocket communication. Built as a Progressive Web App with Svelte 5 for native-like performance.',
    keyFeatures: [
      'Animated source transitions with 4 effect types (fade, slide, zoom, pop)',
      'Smart source swapping with 7 styles and position memory',
      'One-click layout presets for instant scene reconfiguration',
      'Text cycler with typewriter, glitch, and scramble effects',
      'Web-based control panel with real-time WebSocket communication',
    ],
    highlights: [
      { label: 'Performance', value: '60 FPS' },
      { label: 'Latency', value: '<50ms' },
      { label: 'Animations', value: '17+' },
    ],
  },
  'mods-hub': {
    name: 'Mods Hub',
    tagline: 'Modern Mod Hosting Platform',
    description:
      'The future of mod distribution with CurseForge-grade features but open-source. Full semantic versioning, advanced search with human-friendly syntax, and R2 cloud storage with optional encryption. Beautiful gold-themed UI that makes mod management a pleasure, not a chore.',
    keyFeatures: [
      'Full CRUD operations with drag-and-drop uploads',
      'Semantic versioning with automated changelogs',
      'Advanced search: "category:tools tag:optimization updated:>7d"',
      'Direct download links that work everywhere',
      'R2 cloud storage with optional client-side encryption',
    ],
    highlights: [
      { label: 'Upload Speed', value: 'Instant' },
      { label: 'Search', value: 'Real-time' },
      { label: 'Storage', value: 'Unlimited' },
    ],
  },
  'auth-service': {
    name: 'Auth Service',
    tagline: 'Multi-Tenant OTP Authentication',
    description:
      'Passwordless authentication done right. Email-based OTP with JWT tokens, multi-tenant API keys, and a developer dashboard that makes integration trivial. OpenAPI 3.1.0 spec with Swagger UI means you can start coding in minutes. Single sign-on across all *.idling.app domains - login once, authenticated everywhere.',
    keyFeatures: [
      'Passwordless OTP via email - no password storage risks',
      'JWT tokens with HttpOnly cookies for maximum security',
      'Multi-tenant API key system with granular permissions',
      'Real-time analytics dashboard built with Svelte 5',
      'Complete OpenAPI 3.1.0 spec with interactive Swagger UI',
    ],
    highlights: [
      { label: 'Security', value: 'Zero-trust' },
      { label: 'Setup Time', value: '<5 min' },
      { label: 'Uptime', value: '99.9%' },
    ],
  },
  'url-shortener': {
    name: 'URL Shortener',
    tagline: 'Short Links with Analytics',
    description:
      "Lightning-fast URL shortening powered by Cloudflare Workers. Create custom branded short links, track every click with geographic data and referrer info, and manage everything from a clean web interface. Automatic expiration keeps your links fresh, and the analytics tell you exactly what's working.",
    keyFeatures: [
      'Custom URL codes for memorable, brand-friendly links',
      'Real-time click analytics with geographic tracking',
      'Automatic expiration and cleanup for temporary links',
      'Standalone web interface with SSO integration',
      'Direct API access for automation and integrations',
    ],
    highlights: [
      { label: 'Speed', value: '<10ms' },
      { label: 'Analytics', value: 'Real-time' },
      { label: 'Uptime', value: '99.99%' },
    ],
  },
  'access-hub': {
    name: 'Access Hub',
    tagline: 'Access Control Dashboard',
    description:
      'Centralized access control for all your services. Role-based permissions with granular control, complete audit trails for compliance, and quota management to prevent abuse. Service-agnostic design means it works with everything in the suite - one system to rule them all.',
    keyFeatures: [
      'Role-based access control (RBAC) with custom roles',
      'Granular permissions down to individual endpoints',
      'Complete audit trail for compliance and security',
      'Quota management per user or role',
      'Auto-provisioning for seamless user onboarding',
    ],
    highlights: [
      { label: 'Roles', value: 'Unlimited' },
      { label: 'Audit', value: 'Complete' },
      { label: 'Setup', value: 'Instant' },
    ],
  },
};