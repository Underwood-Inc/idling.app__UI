import Link from 'next/link';
import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/test-selectors/pages/about.selectors';
import { GitLabLink } from '../gitlab-link/GitLabLink';

export function About() {
  const externalResourceTitle = `
    Most commonly due to technological limitations of web applications.
    i.e. The Godot project involves multiple external resources.
  `;

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
        &nbsp;is my landing page to personal project that I do when I
        am..ahem...idle.
      </p>

      <p>
        The primary focus of my Information Technology (IT) career has been on
        the front end of web applications and so, this web domain will house my
        pet projects or provide web links&nbsp;
        <span title={externalResourceTitle}>
          to other domains with more of the same
        </span>
        . Anything that is publicly available can be found in this websites
        navigation links and development activity can be found on the idling.app
        Discord server or on respective development platform repositories.
      </p>

      <p>
        Additionally, new game being developed in the&nbsp;
        <a href="https://godotengine.org/" target="_blank">
          Godot v4 game engine
        </a>
        &nbsp; is being worked on (at a lower priority to that of this web
        application).
      </p>

      <p>
        This game will have idle elements to take over tasks that become tedious
        as game progression advances.
      </p>

      <p>
        See the <GitLabLink /> page for releases and more information.
      </p>
    </div>
  );
}
