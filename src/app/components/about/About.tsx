import Link from 'next/link';
import React from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/utils/test-selectors/pages/about.selectors';
import { DiscordLink } from '../discord-link/DiscordLink';
import { GitLabLink } from '../gitlab-link/GitLabLink';

export const About: React.FC = () => {
  return (
    <div className="about__container">
      <p>
        <Link
          data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
          href={NAV_PATHS.ROOT}
        >
          idling.app
        </Link>
        &nbsp;is a a new game being developed in the&nbsp;
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
        development via screen share events
      </p>
    </div>
  );
};
