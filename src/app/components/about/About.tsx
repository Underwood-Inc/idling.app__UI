import Link from 'next/link';
import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/test-selectors/pages/about.selectors';
import { DiscordLink } from '../discord-link/DiscordLink';
import { GitLabLink } from '../gitlab-link/GitLabLink';

export function About() {
  return (
    <div className="about__container">
      <p>
        {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
        <Link
          data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
          href={NAV_PATHS.ROOT}
        >
          idling.app
        </Link>
        &nbsp;is a new game being developed in the&nbsp;
        <a href="https://godotengine.org/" target="_blank">
          Godot v4 game engine
        </a>
        .
      </p>
      <p>
        This game will have idle elements to take over tasks that become tedious
        as game progression advances.
      </p>

      <p>
        See the <GitLabLink /> page for releases and more information.
      </p>
      <p>
        Join our <DiscordLink /> to get the latest news and occasionally view
        development via screen share events.
      </p>
      <p>
        See a bug? Report it in <DiscordLink /> and refer to the current site
        version located in the bottom right of the website footer.
      </p>
    </div>
  );
}
