/* eslint-disable custom-rules/enforce-link-target-blank */
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { auth } from '../../../lib/auth';
import { requireAdmin } from '../../../lib/permissions/permissions';
import { NAV_PATHS } from '../../../lib/routes';
import { Navbar } from '../navbar/Navbar';
import './Nav.css';
import { NavAuth } from './NavAuth';
import { NavPaths } from './NavPaths';

export default async function Nav() {
  // Prevent caching to ensure fresh permission checks
  noStore();

  const session = await auth();
  const hasAdminAccess = await requireAdmin();

  return (
    <Navbar>
      <Navbar.Body className="nav__content">
        <Navbar.Content
          justify="center"
          className="nav__links nav__links--as-flex-end"
        >
          <NavPaths />
        </Navbar.Content>

        <Navbar.Content justify="center" className="nav__brand">
          <Navbar.Brand />

          <Link href={NAV_PATHS.ROOT} data-testid={NAV_SELECTORS.HOME_LINK}>
            <h1 className="nav__header">Idling.app</h1>
          </Link>
        </Navbar.Content>

        <Navbar.Content justify="end" className="nav--as-flex-end">
          <Navbar.Item className="nav__auth">
            <NavAuth hasAdminAccess={hasAdminAccess} />
          </Navbar.Item>
        </Navbar.Content>
      </Navbar.Body>
    </Navbar>
  );
}
