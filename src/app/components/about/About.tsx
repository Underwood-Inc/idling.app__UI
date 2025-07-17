import { NAV_PATHS } from '@lib/routes';
import { ABOUT_PAGE_SELECTORS } from '@lib/test-selectors/pages/about.selectors';
import { DiscordLink } from '../discord-link/DiscordLink';
import { GalaxyLink } from '../galaxy-link/GalaxyLink';
import { LinkTooltip } from '../tooltip/LinkTooltip';
import { InstantLink } from '../ui/InstantLink';

export function About() {
  return (
    <div>
      <p>
        <LinkTooltip url={NAV_PATHS.ROOT} isInsideParagraph>
          {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
          <InstantLink
            data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
            href={NAV_PATHS.ROOT}
          >
            idling.app
          </InstantLink>
        </LinkTooltip>
        &nbsp;serves as the central hub for my professional portfolio and
        personal projects, showcasing my expertise in front-end web development
        and interactive 3D applications. The platform hosts a collection of
        innovative web applications, with&nbsp;
        <GalaxyLink />
        &nbsp;standing as a flagship project that demonstrates advanced 3D space
        visualization capabilities.
      </p>
      <br />
      <p>
        <GalaxyLink />
        &nbsp;represents a cutting-edge web application that leverages modern
        web technologies to create immersive space environments. The application
        features procedurally generated galaxies with dynamic star fields,
        realistic nebula effects, and interactive space environments. Built with
        Three.js and TypeScript, <GalaxyLink />
        &nbsp;showcases sophisticated particle systems, advanced rendering
        techniques, and responsive user interfaces.
      </p>
      <br />
      <p>
        All publicly available projects can be accessed through the
        website&apos;s navigation, while active development discussions and
        updates are hosted on the idling.app{' '}
        <DiscordLink isInsideParagraph={true} /> server. For detailed technical
        documentation, release notes, and contribution guidelines, please refer
        to the project&apos;s&nbsp;
        <a
          href="https://gitlab.com/idling.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitLab
        </a>
        &nbsp;repository.
      </p>
    </div>
  );
}
