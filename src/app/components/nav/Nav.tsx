/* eslint-disable custom-rules/enforce-link-target-blank */
import { NAV_PATHS } from '@lib/routes';
import { unstable_noStore as noStore } from 'next/cache';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { Navbar } from '../navbar/Navbar';
import { InstantLink } from '../ui/InstantLink';
import { UserSearch } from '../user-search/UserSearch';
import { MobileNav } from './MobileNav';
import './Nav.css';
import { NavAuth } from './NavAuth';
import { NavPaths } from './NavPaths';

export default async function Nav() {
  // Prevent caching to ensure fresh permission checks
  noStore();

  return (
    <Navbar>
      <Navbar.Body className="nav__content">
        {/* Mobile Navigation - Only visible on mobile */}
        <MobileNav />

        {/* Desktop Navigation - Hidden on mobile */}
        <Navbar.Content
          justify="flex-start"
          className="nav__links nav__links--as-flex-end nav__desktop-only"
        >
          <NavPaths />
        </Navbar.Content>

        <Navbar.Content justify="center" className="nav__brand">
          <Navbar.Brand />

          <InstantLink
            href={NAV_PATHS.ROOT}
            data-testid={NAV_SELECTORS.HOME_LINK}
          >
            <h1 className="nav__header">Idling.app</h1>
          </InstantLink>
        </Navbar.Content>

        {/* Desktop Auth and Search - Hidden on mobile */}
        <Navbar.Content
          justify="flex-end"
          className="nav--as-flex-end nav__desktop-only"
        >
          <Navbar.Item className="nav__search">
            <UserSearch placeholder="Find users..." />
          </Navbar.Item>
          <Navbar.Item className="nav__auth">
            <NavAuth />
          </Navbar.Item>
        </Navbar.Content>
      </Navbar.Body>
    </Navbar>
  );
}
