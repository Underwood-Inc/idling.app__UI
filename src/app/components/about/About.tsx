import Link from 'next/link';
import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/test-selectors/pages/about.selectors';

export function About() {
  return (
    <div>
      <p>
        {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
        <Link
          data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
          href={NAV_PATHS.ROOT}
        >
          idling.app
        </Link>
        &nbsp;serves as the central hub for my professional portfolio and
        personal projects, showcasing my expertise in front-end web development
        and interactive 3D applications. The platform hosts a collection of
        innovative web applications, with&nbsp;
        <Link target="_blank" href={NAV_PATHS.GALAXY}>
          Galaxy
        </Link>
        &nbsp; standing as a flagship project that demonstrates advanced 3D
        space visualization capabilities.
      </p>
      <br />
      <p>
        <Link target="_blank" href={NAV_PATHS.GALAXY}>
          Galaxy
        </Link>
        &nbsp; represents a cutting-edge web application that leverages modern
        web technologies to create immersive space environments. The application
        features procedurally generated galaxies with dynamic star fields,
        realistic nebula effects, and interactive space environments. Built with
        Three.js and TypeScript, Galaxy showcases sophisticated particle
        systems, advanced rendering techniques, and responsive user interfaces.
      </p>
      <br />
      <p>
        All publicly available projects can be accessed through the
        website&apos;s navigation, while active development discussions and
        updates are hosted on the idling.app Discord server. For detailed
        technical documentation, release notes, and contribution guidelines,
        please refer to the project&apos;s GitLab repository.
      </p>
    </div>
  );
}
