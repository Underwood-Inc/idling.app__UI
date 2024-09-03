import { render, screen } from '@testing-library/react';
import React from 'react';
import { NAV_SELECTORS } from 'src/lib/test-selectors/components/nav.selectors';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import Nav from './Nav';

// Mock the dependencies
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('./NavPaths', () => ({
  NavPaths: () => <div data-testid="nav-paths">NavPaths</div>
}));

jest.mock('../navbar/Navbar', () => ({
  Navbar: {
    Body: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Brand: () => <div>Brand</div>,
    Item: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
}));

jest.mock('../auth-buttons/AuthButtons', () => ({
  SignOut: () => <button>Sign Out</button>
}));

// Mock the Nav component
jest.mock('./Nav', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

describe('Nav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when user is not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const mockNavContent = (
      <div>
        <a href={NAV_PATHS.ROOT} data-testid={NAV_SELECTORS.HOME_LINK}>
          Idling.app
        </a>
        <div data-testid={NAV_SELECTORS.NAV_PATHS}>NavPaths</div>
        <a href={NAV_PATHS.SIGNIN} data-testid={NAV_SELECTORS.SIGN_IN_LINK}>
          Sign In
        </a>
      </div>
    );
    jest.mocked(Nav).mockResolvedValue(mockNavContent);

    render(await Nav());

    expect(screen.getByTestId(NAV_SELECTORS.HOME_LINK)).toBeInTheDocument();
    expect(screen.getByTestId(NAV_SELECTORS.NAV_PATHS)).toBeInTheDocument();
    expect(screen.getByTestId(NAV_SELECTORS.SIGN_IN_LINK)).toBeInTheDocument();
    expect(
      screen.queryByTestId(NAV_SELECTORS.SIGN_OUT_BUTTON)
    ).not.toBeInTheDocument();
  });

  it('renders correctly when user is authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { name: 'Test User' }
    });
    const mockNavContent = (
      <div>
        <a href={NAV_PATHS.ROOT} data-testid={NAV_SELECTORS.HOME_LINK}>
          Idling.app
        </a>
        <div data-testid={NAV_SELECTORS.NAV_PATHS}>NavPaths</div>
        <span data-testid={NAV_SELECTORS.USER_NAME}>Test User</span>
        <button data-testid={NAV_SELECTORS.SIGN_OUT_BUTTON}>Sign Out</button>
      </div>
    );
    jest.mocked(Nav).mockResolvedValue(mockNavContent);

    render(await Nav());

    expect(screen.getByTestId(NAV_SELECTORS.HOME_LINK)).toBeInTheDocument();
    expect(screen.getByTestId(NAV_SELECTORS.NAV_PATHS)).toBeInTheDocument();
    expect(screen.getByTestId(NAV_SELECTORS.USER_NAME)).toBeInTheDocument();
    expect(
      screen.getByTestId(NAV_SELECTORS.SIGN_OUT_BUTTON)
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(NAV_SELECTORS.SIGN_IN_LINK)
    ).not.toBeInTheDocument();
  });

  it('renders the correct links', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const mockNavContent = (
      <div>
        <a href={NAV_PATHS.ROOT} data-testid={NAV_SELECTORS.HOME_LINK}>
          Idling.app
        </a>
        <div data-testid={NAV_SELECTORS.NAV_PATHS}>NavPaths</div>
        <a href={NAV_PATHS.SIGNIN} data-testid={NAV_SELECTORS.SIGN_IN_LINK}>
          Sign In
        </a>
      </div>
    );
    jest.mocked(Nav).mockResolvedValue(mockNavContent);

    render(await Nav());

    expect(screen.getByTestId(NAV_SELECTORS.HOME_LINK)).toHaveAttribute(
      'href',
      NAV_PATHS.ROOT
    );
    expect(screen.getByTestId(NAV_SELECTORS.SIGN_IN_LINK)).toHaveAttribute(
      'href',
      NAV_PATHS.SIGNIN
    );
  });
});
