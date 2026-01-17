import { NAV_PATHS } from '@lib/routes';
import Link from 'next/link';
import FadeIn from '../components/fade-in/FadeIn';
import styles from './page.module.css';

interface Product {
  id: string;
  icon?: string;
  image?: string;
  name: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  highlights: { label: string; value: string }[];
  status: 'live' | 'beta' | 'planned' | 'development';
  url: string;
  detailsPath?: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'stream-suite',
    image: '/red_panda/animated/256x256/extra/Camera.gif',
    name: 'Stream Suite',
    tagline: 'Professional OBS Studio Control Panel',
    description: 'Transform your streaming workflow with animated source visibility, buttery-smooth source swapping, and instant layout presets. Control everything from a beautiful web interface with real-time WebSocket communication. Built as a Progressive Web App with Svelte 5 for native-like performance.',
    keyFeatures: [
      'Animated source transitions with 4 effect types (fade, slide, zoom, pop)',
      'Smart source swapping with 7 styles and position memory',
      'One-click layout presets for instant scene reconfiguration',
      'Text cycler with typewriter, glitch, and scramble effects',
      'Web-based control panel with real-time WebSocket communication'
    ],
    highlights: [
      { label: 'Performance', value: '60 FPS' },
      { label: 'Latency', value: '<50ms' },
      { label: 'Animations', value: '17+' }
    ],
    status: 'live',
    url: 'https://streamkit.idling.app',
    detailsPath: NAV_PATHS.STREAM_SUITE_DETAIL
  },
  {
    id: 'mods-hub',
    image: '/red_panda/animated/256x256/extra/Pat pat.gif',
    name: 'Mods Hub',
    tagline: 'Modern Mod Hosting Platform',
    description: 'The future of mod distribution with CurseForge-grade features but open-source. Full semantic versioning, advanced search with human-friendly syntax, and R2 cloud storage with optional encryption. Beautiful gold-themed UI that makes mod management a pleasure, not a chore.',
    keyFeatures: [
      'Full CRUD operations with drag-and-drop uploads',
      'Semantic versioning with automated changelogs',
      'Advanced search: "category:tools tag:optimization updated:>7d"',
      'Direct download links that work everywhere',
      'R2 cloud storage with optional client-side encryption'
    ],
    highlights: [
      { label: 'Upload Speed', value: 'Instant' },
      { label: 'Search', value: 'Real-time' },
      { label: 'Storage', value: 'Unlimited' }
    ],
    status: 'live',
    url: 'https://mods.idling.app',
    detailsPath: NAV_PATHS.MODS_HUB_DETAIL
  },
  {
    id: 'auth-service',
    image: '/red_panda/animated/256x256/extra/Glasses.gif',
    name: 'Auth Service',
    tagline: 'Multi-Tenant OTP Authentication',
    description: 'Passwordless authentication done right. Email-based OTP with JWT tokens, multi-tenant API keys, and a developer dashboard that makes integration trivial. OpenAPI 3.1.0 spec with Swagger UI means you can start coding in minutes. Single sign-on across all *.idling.app domains - login once, authenticated everywhere.',
    keyFeatures: [
      'Passwordless OTP via email - no password storage risks',
      'JWT tokens with HttpOnly cookies for maximum security',
      'Multi-tenant API key system with granular permissions',
      'Real-time analytics dashboard built with Svelte 5',
      'Complete OpenAPI 3.1.0 spec with interactive Swagger UI'
    ],
    highlights: [
      { label: 'Security', value: 'Zero-trust' },
      { label: 'Setup Time', value: '<5 min' },
      { label: 'Uptime', value: '99.9%' }
    ],
    status: 'live',
    url: 'https://auth.idling.app',
    detailsPath: NAV_PATHS.AUTH_SERVICE_DETAIL
  },
  {
    id: 'url-shortener',
    image: '/red_panda/animated/256x256/extra/Phone.gif',
    name: 'URL Shortener',
    tagline: 'Short Links with Analytics',
    description: 'Lightning-fast URL shortening powered by Cloudflare Workers. Create custom branded short links, track every click with geographic data and referrer info, and manage everything from a clean web interface. Automatic expiration keeps your links fresh, and the analytics tell you exactly what\'s working.',
    keyFeatures: [
      'Custom URL codes for memorable, brand-friendly links',
      'Real-time click analytics with geographic tracking',
      'Automatic expiration and cleanup for temporary links',
      'Standalone web interface with SSO integration',
      'Direct API access for automation and integrations'
    ],
    highlights: [
      { label: 'Speed', value: '<10ms' },
      { label: 'Analytics', value: 'Real-time' },
      { label: 'Uptime', value: '99.99%' }
    ],
    status: 'live',
    url: 'https://s.idling.app',
    detailsPath: NAV_PATHS.URL_SHORTENER_DETAIL
  },
  {
    id: 'chat-hub',
    image: '/red_panda/animated/256x256/extra/Bubble tea.gif',
    name: 'Chat Hub',
    tagline: 'P2P Encrypted Chat',
    description: 'Privacy-first real-time chat using WebRTC for direct peer-to-peer connections. Your messages never touch our servers - they go straight from you to your recipient. No message storage, automatic cleanup, and end-to-end security built in. Perfect for sensitive conversations where privacy actually matters.',
    keyFeatures: [
      'True peer-to-peer via WebRTC - no server storage',
      'Room management with automatic discovery',
      'Typing indicators and presence for better UX',
      'Automatic cleanup ensures total privacy',
      'Heartbeat system with graceful reconnection'
    ],
    highlights: [
      { label: 'Privacy', value: 'P2P Only' },
      { label: 'Storage', value: 'Zero' },
      { label: 'Status', value: 'In Dev' }
    ],
    status: 'development',
    url: 'https://chat.idling.app',
    detailsPath: NAV_PATHS.CHAT_HUB_DETAIL
  },
  {
    id: 'access-hub',
    image: '/red_panda/animated/256x256/extra/Ban.gif',
    name: 'Access Hub',
    tagline: 'Access Control Dashboard',
    description: 'Centralized access control for all your services. Role-based permissions with granular control, complete audit trails for compliance, and quota management to prevent abuse. Service-agnostic design means it works with everything in the suite - one system to rule them all.',
    keyFeatures: [
      'Role-based access control (RBAC) with custom roles',
      'Granular permissions down to individual endpoints',
      'Complete audit trail for compliance and security',
      'Quota management per user or role',
      'Auto-provisioning for seamless user onboarding'
    ],
    highlights: [
      { label: 'Roles', value: 'Unlimited' },
      { label: 'Audit', value: 'Complete' },
      { label: 'Setup', value: 'Instant' }
    ],
    status: 'live',
    url: 'https://access.idling.app',
    detailsPath: NAV_PATHS.ACCESS_HUB_DETAIL
  }
];

export default function StrixunSuitePage() {
  return (
    <div className={styles.showcase}>
      <FadeIn>
        {/* Main Hero */}
        <section className={styles.hero}>
          <div className={styles.hero__content}>
            <img src="/red_panda/animated/256x256/extra/HI.gif" alt="Red Panda Mascot" className={styles.hero__mascot} />
            <h1 className={styles.hero__title}>Strixun Stream Suite</h1>
            <p className={styles.hero__tagline}>
              Professional Streaming Tools & Web Services
            </p>
            <p className={styles.hero__description}>
              A comprehensive ecosystem of open-source applications with single sign-on authentication.
              Login once on any *.idling.app domain and you're authenticated everywhere.
              <strong> MIT Licensed. 100% Open Source. Privacy-Focused.</strong>
            </p>
            <div className={styles.hero__actions}>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite"
                className={styles.cta__primary}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.cta__icon}>📦</span>
                View on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Products */}
        {PRODUCTS.map((product, index) => (
          <section
            key={product.id}
            className={`${styles.product} ${index % 2 === 0 ? styles.product__left : styles.product__right}`}
          >
            <div className={styles.product__visual}>
              {product.image ? (
                <img src={product.image} alt={product.name} className={styles.product__image} />
              ) : (
                <span className={styles.product__icon}>{product.icon}</span>
              )}
              <div className={styles.product__stats}>
                {product.highlights.map((highlight, i) => (
                  <div key={i} className={styles.stat}>
                    <span className={styles.stat__value}>{highlight.value}</span>
                    <span className={styles.stat__label}>{highlight.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.product__content}>
              <div className={styles.product__header}>
                <div>
                  <h2 className={styles.product__name}>{product.name}</h2>
                  <p className={styles.product__tagline}>{product.tagline}</p>
                </div>
                <span className={`${styles.badge} ${styles[`badge__${product.status}`]}`}>
                  {product.status}
                </span>
              </div>
              
              <p className={styles.product__description}>{product.description}</p>
              
              <ul className={styles.product__features}>
                {product.keyFeatures.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              
              <div className={styles.product__actions}>
                <a
                  href={product.url}
                  className={styles.cta__secondary}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Launch App →
                </a>
                {product.detailsPath && (
                  <Link
                    href={product.detailsPath}
                    className={styles.cta__tertiary}
                  >
                    Learn More
                  </Link>
                )}
              </div>
            </div>
          </section>
        ))}

        {/* Footer CTA */}
        <section className={styles.footer}>
          <div className={styles.footer__content}>
            <h2 className={styles.footer__title}>Ready to Get Started?</h2>
            <p className={styles.footer__description}>
              All applications are open-source and free to use. Star us on GitHub, join our community,
              and help shape the future of streaming tools.
            </p>
            <a
              href="https://github.com/Underwood-Inc/strixun-stream-suite"
              className={styles.cta__primary}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.cta__icon}>⭐</span>
              Star on GitHub
            </a>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
