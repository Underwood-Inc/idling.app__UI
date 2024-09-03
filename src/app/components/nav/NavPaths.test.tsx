import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import {
  HEADER_NAV_PATHS,
  NAV_PATH_LABELS,
  NAV_PATHS
} from '../../../lib/routes';
import { NavPaths } from './NavPaths';

jest.mock('next/config');

// Mocking next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn() }))
}));

// Mocking next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock the entire Navbar component
jest.mock('../navbar/Navbar', () => ({
  Navbar: {
    Item: ({ children, isDisabled }: any) => (
      <div data-disabled={isDisabled}>{children}</div>
    )
  }
}));

describe('NavPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation paths', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    render(<NavPaths />);

    Object.entries(HEADER_NAV_PATHS).forEach(([key, path]) => {
      const element = screen.getByRole('link', {
        name: NAV_PATH_LABELS[key as keyof typeof NAV_PATH_LABELS]
      });
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('href', path);
    });
  });

  it('marks the current path as active', () => {
    (usePathname as jest.Mock).mockReturnValue(NAV_PATHS.POSTS);
    render(<NavPaths />);

    const activeLink = screen.getByText(NAV_PATH_LABELS.POSTS);
    expect(activeLink).toHaveClass('active');
  });
});
