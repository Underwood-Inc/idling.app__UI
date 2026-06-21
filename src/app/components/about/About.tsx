import { NAV_PATHS } from '@lib/routes';
import { ABOUT_PAGE_SELECTORS } from '@lib/test-selectors/pages/about.selectors';
import { LinkTooltip } from '../tooltip/LinkTooltip';
import { InstantLink } from '../ui/InstantLink';
import './About.css';

const PORTFOLIO_HIGHLIGHTS = [
  { value: '41+', label: 'Open-source projects' },
  { value: '7', label: 'Web applications' },
  { value: '1', label: 'Desktop map app' },
  { value: '7', label: 'Serverless APIs' },
  { value: '26', label: 'NPM packages' },
  { value: '3', label: 'Minecraft mods' },
];

const ABOUT_SECTIONS = [
  {
    id: 'minecraft',
    icon: '🎮',
    title: 'Minecraft Projects',
    highlights: [
      'Compressy — infinite block compression',
      'Rituals — mystical magic datapack',
      'Trials of the Wild — hardcore survival modpack',
      'Thousands of downloads on Mods Hub and Modrinth',
    ],
    links: [{ href: 'https://mods.idling.app', label: 'Mods Hub' }],
  },
  {
    id: 'web-tools',
    icon: '🛠️',
    title: 'Web Applications & Tools',
    highlights: [
      'Card Generator — React 19 frontend',
      'SVG Converter — React 19 frontend',
      'URL Shortener — React + Cloudflare Worker',
      'Social Platform — Next.js 15 + PostgreSQL',
      'TypeScript, SSR, and real-time features throughout',
    ],
  },
  {
    id: 'mappy',
    icon: '🗺️',
    title: 'Mappy — Interactive Maps',
    highlights: [
      'Offline-first map platform for open-world games and homebrew campaigns',
      'MapLibre canvas, markers, progress tracking, unified search, measure tools',
      'Marker Maker, Tile Studio, and Official Map Packs',
      'Tauri 2 desktop — no login, no cloud sync, no telemetry',
    ],
    links: [
      { href: NAV_PATHS.MAPPY, label: 'Download (short.army/mappy)' },
      { href: 'https://underwood-inc.github.io/mappy/wiki/', label: 'Player wiki' },
    ],
  },
  {
    id: 'streaming',
    icon: '📺',
    title: 'Streaming Ecosystem',
    highlights: [
      'OBS Animation Suite — Svelte 5, 60 FPS, 17+ effects, PWA',
      'Streamkit API — scene tracking, config sync, KV storage',
      'WebSocket control, layout presets, zero dependencies',
    ],
    links: [{ href: 'https://streamkit.idling.app', label: 'streamkit.idling.app' }],
  },
  {
    id: 'infrastructure',
    icon: '☁️',
    title: 'Infrastructure & APIs',
    highlights: [
      '7 Cloudflare Workers APIs — Auth, Access, Mods, Chat, Customer, Game, Streamkit',
      '26 NPM packages — shared components, API framework, auth store, search parser, P2P storage, and more',
      'Monorepo with 41+ projects on GitHub',
    ],
    links: [
      {
        href: 'https://github.com/Underwood-Inc/strixun-stream-suite',
        label: 'Strixun Stream Suite',
      },
    ],
  },
];

export function About() {
  return (
    <div className="about">
      <div className="about__hero">
        <p className="about__eyebrow">Portfolio &amp; ecosystem</p>
        <h2 className="about__title">Hi! I&apos;m Strixun 👋</h2>
        <p className="about__tagline">
          Full-stack developer building production web applications, Minecraft mods, streaming
          tools, and cloud services.
        </p>
        <p className="about__intro">
          <LinkTooltip url={NAV_PATHS.ROOT} isInsideParagraph>
            {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
            <InstantLink
              data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
              href={NAV_PATHS.ROOT}
            >
              idling.app
            </InstantLink>
          </LinkTooltip>{' '}
          is the home base for everything below — open source, documented, and built to ship.
        </p>

        <ul className="about__stats" aria-label="Portfolio highlights">
          {PORTFOLIO_HIGHLIGHTS.map((item) => (
            <li key={item.label} className="about__stat">
              <span className="about__stat-value">{item.value}</span>
              <span className="about__stat-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="about__sections">
        {ABOUT_SECTIONS.map((section) => (
          <section key={section.id} className="about__section">
            <h3 className="about__section-title">
              <span className="about__section-icon" aria-hidden="true">
                {section.icon}
              </span>
              {section.title}
            </h3>
            <ul className="about__highlights">
              {section.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            {section.links && section.links.length > 0 && (
              <div className="about__section-links">
                {section.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
