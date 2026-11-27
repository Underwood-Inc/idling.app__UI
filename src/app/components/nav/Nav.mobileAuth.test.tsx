import { render, screen } from '@testing-library/react';
import React from 'react';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { render as renderWithLocale } from 'src/test-utils';
import { auth } from '@lib/auth';
import Nav from './Nav';
import { MobileNavAuth } from './MobileNavAuth';

vi.mock('next/cache', () => ({
  unstable_noStore: vi.fn()
}));

vi.mock('@lib/auth', () => ({
  auth: vi.fn(async () => null)
}));

vi.mock('../ui/InstantLink', () => ({
  InstantLink: ({
    children,
    href,
    'data-testid': testId,
    onClick
  }: {
    children: React.ReactNode;
    href: string;
    'data-testid'?: string;
    onClick?: () => void;
  }) => (
    <a href={href} data-testid={testId} onClick={onClick}>
      {children}
    </a>
  )
}));

vi.mock('./NavPaths', () => ({
  NavPaths: () => <div data-testid="nav-paths">NavPaths</div>
}));

vi.mock('./NavBrandTitle', () => ({
  NavBrandTitle: () => <span>Idling.app</span>
}));

vi.mock('./MobileNav', () => ({
  MobileNav: () => (
    <button type="button" aria-label="Toggle mobile navigation menu">
      Menu
    </button>
  )
}));

vi.mock('./LocalizedUserSearch', () => ({
  LocalizedUserSearch: () => <div>Search</div>
}));

vi.mock('./NavAuth', () => ({
  NavAuth: () => (
    <a href="/auth/signin" data-testid={NAV_SELECTORS.SIGN_IN_LINK}>
      Sign In
    </a>
  )
}));

describe('Nav mobile auth', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(null);
  });

  test('keeps the sign-in control out of the desktop-only hide class', async () => {
    render(await Nav());

    const signIn = screen.getByTestId(NAV_SELECTORS.SIGN_IN_LINK);
    expect(signIn).toBeInTheDocument();
    expect(signIn.closest('.nav__desktop-only')).toBeNull();
    expect(signIn.closest('.nav--as-flex-end')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Toggle mobile navigation menu' })
    ).toBeInTheDocument();
  });
});

describe('MobileNavAuth', () => {
  test('offers sign-in in the mobile drawer when signed out', () => {
    renderWithLocale(<MobileNavAuth />);

    const signIn = screen.getByTestId(NAV_SELECTORS.SIGN_IN_LINK);
    expect(signIn).toBeInTheDocument();
    expect(signIn).toHaveAttribute('href', '/auth/signin');
  });
});
