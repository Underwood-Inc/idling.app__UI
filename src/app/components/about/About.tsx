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
          Software developer, livestreamer, and game development enthusiast.{' '}
          <LinkTooltip url={NAV_PATHS.ROOT} isInsideParagraph>
            {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
            <InstantLink
              data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
              href={NAV_PATHS.ROOT}
            >
              idling.app
            </InstantLink>
          </LinkTooltip>
          &nbsp;is my digital hub for showcasing work, sharing projects, and
          connecting with the community.
        </p>
      </div>

      <div className="about__sections">
        <div className="about__section">
          <h3 className="about__section-title">🎮 Game Development</h3>
          <p className="about__section-content">
            Custom Minecraft projects with thousands of downloads:
            <strong> Rituals</strong> datapack and <strong>Strixun Pack A</strong> modpack.
            Open source on Modrinth and GitHub.
          </p>
        </div>

        <div className="about__section">
          <h3 className="about__section-title">💻 Web Development</h3>
          <p className="about__section-content">
            Full-stack developer with <GalaxyLink /> showcasing Three.js work.
            This site: Next.js, React, PostgreSQL, NextAuth. Building tools for
            streamers and creators.
          </p>
        </div>

        <div className="about__section">
          <h3 className="about__section-title">📺 Content Creation</h3>
          <p className="about__section-content">
            Livestream dev sessions on{' '}
            <a
              href="https://www.twitch.tv/strixun"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitch
            </a>{' '}
            and{' '}
            <a
              href="https://www.youtube.com/@strixun"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>
            . Coding, gaming, and exploring new tech.
          </p>
        </div>

        <div className="about__section">
          <h3 className="about__section-title">🤝 Community</h3>
          <p className="about__section-content">
            Join <DiscordLink isInsideParagraph={true} /> for updates. Contribute
            on{' '}
            <a
              href="https://gitlab.com/idling.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitLab
            </a>{' '}
            &amp;{' '}
            <a
              href="https://github.com/Underwood-Inc"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
