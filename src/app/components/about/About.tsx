import { NAV_PATHS } from '@lib/routes';
import { ABOUT_PAGE_SELECTORS } from '@lib/test-selectors/pages/about.selectors';
import { DiscordLink } from '../discord-link/DiscordLink';
import { GalaxyLink } from '../galaxy-link/GalaxyLink';
import { LinkTooltip } from '../tooltip/LinkTooltip';
import { InstantLink } from '../ui/InstantLink';
import './About.css';

export function About() {
  return (
    <div className="about">
      <div className="about__hero">
        <h2 className="about__title">Hi! I&apos;m Strixun 👋</h2>
        <p className="about__intro">
          Full-stack developer building production web applications, Minecraft mods, streaming tools, and cloud services.{' '}
          <LinkTooltip url={NAV_PATHS.ROOT} isInsideParagraph>
            {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
            <InstantLink
              data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
              href={NAV_PATHS.ROOT}
            >
              idling.app
            </InstantLink>
          </LinkTooltip>
          &nbsp;showcases 40+ open-source projects: 6 web applications, 7 serverless APIs, 26 reusable packages, 3 Minecraft mods, and shared infrastructure.
        </p>
      </div>

      <div className="about__sections">
        <div className="about__section">
          <h3 className="about__section-title">🎮 Minecraft Projects</h3>
          <p className="about__section-content">
            <strong>Compressy</strong> mod (infinite block compression), <strong>Rituals</strong> datapack (mystical magic system), and <strong>Trials of the Wild</strong> modpack.
            Thousands of downloads on{' '}
            <a href="https://mods.idling.app" target="_blank" rel="noopener noreferrer">
              Mods Hub
            </a>
            {' '}and Modrinth.
          </p>
        </div>

        <div className="about__section">
          <h3 className="about__section-title">🛠️ Web Applications & Tools</h3>
          <p className="about__section-content">
            <strong>Card Generator</strong> (React 19 frontend), <strong>SVG Converter</strong> (React 19 frontend), <strong>URL Shortener</strong> (full-stack: React + Cloudflare Worker), and <strong>Social Platform</strong> (full-stack: React 19/Next.js 15 + PostgreSQL).
            Modern web apps with TypeScript, server-side rendering, and real-time features.
          </p>
        </div>

        <div className="about__section">
          <h3 className="about__section-title">📺 Streaming Ecosystem</h3>
          <p className="about__section-content">
            <strong>OBS Animation Suite</strong> (Svelte 5 frontend: 60 FPS, 17+ effects, PWA) powered by <strong>Streamkit API</strong> (Cloudflare Worker backend: scene tracking, config sync, KV storage).
            Professional streaming toolkit with WebSocket control, layout presets, and zero dependencies.
            Live at{' '}
            <a href="https://streamkit.idling.app" target="_blank" rel="noopener noreferrer">
              streamkit.idling.app
            </a>.
          </p>
        </div>

        <div className="about__section">
          <h3 className="about__section-title">☁️ Infrastructure & APIs</h3>
          <p className="about__section-content">
            <strong>7 Backend APIs</strong> (Cloudflare Workers): Auth, Access Control, Mods, Chat Signaling, Customer, Game, and Streamkit.
            <strong> 26 NPM packages</strong> (frontend, backend, and universal): Shared component library (React/Svelte), API framework, auth store, search parser, virtualized table, P2P storage, and more.
            Monorepo with{' '}
            <a href="https://github.com/Underwood-Inc/strixun-stream-suite" target="_blank" rel="noopener noreferrer">
              40+ projects
            </a>
            {' '}on GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
