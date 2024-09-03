import { act, render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  HEADER_NAV_PATHS,
  NAV_PATH_LABELS,
  NAV_PATHS
} from '../../../lib/routes';
import { NavPaths } from './NavPaths';

jest.mock('next/config');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn() }))
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

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

  it('appends tags to supported routes', async () => {
    (usePathname as jest.Mock).mockReturnValue(NAV_PATHS.POSTS);
    const mockGet = jest.fn().mockReturnValue('tag1,tag2');
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });

    await act(async () => {
      render(<NavPaths />);
    });

    const postsLink = screen.getByRole('link', { name: NAV_PATH_LABELS.POSTS });
    const myPostsLink = screen.getByRole('link', {
      name: NAV_PATH_LABELS.MY_POSTS
    });

    expect(postsLink).toHaveAttribute(
      'href',
      `${NAV_PATHS.POSTS}?tags=tag1,tag2`
    );
    expect(myPostsLink).toHaveAttribute(
      'href',
      `${NAV_PATHS.MY_POSTS}?tags=tag1,tag2`
    );

    expect(mockGet).toHaveBeenCalledWith('tags');
  });

  it('updates path when pathname changes, with and without tags', async () => {
    let mockGet = jest.fn().mockReturnValue('tag1,tag2');
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });

    // Initial render with POSTS path and tags
    (usePathname as jest.Mock).mockReturnValue(NAV_PATHS.POSTS);
    const { rerender } = render(<NavPaths />);

    let postsLink = screen.getByRole('link', { name: NAV_PATH_LABELS.POSTS });
    let myPostsLink = screen.getByRole('link', {
      name: NAV_PATH_LABELS.MY_POSTS
    });

    expect(postsLink).toHaveAttribute(
      'href',
      `${NAV_PATHS.POSTS}?tags=tag1,tag2`
    );
    expect(myPostsLink).toHaveAttribute(
      'href',
      `${NAV_PATHS.MY_POSTS}?tags=tag1,tag2`
    );

    // Simulate pathname change to MY_POSTS, still with tags
    (usePathname as jest.Mock).mockReturnValue(NAV_PATHS.MY_POSTS);
    await act(async () => {
      rerender(<NavPaths />);
    });

    postsLink = screen.getByRole('link', { name: NAV_PATH_LABELS.POSTS });
    myPostsLink = screen.getByRole('link', { name: NAV_PATH_LABELS.MY_POSTS });

    expect(postsLink).toHaveAttribute('href', NAV_PATHS.POSTS);
    expect(myPostsLink).toHaveAttribute(
      'href',
      `${NAV_PATHS.MY_POSTS}?tags=tag1,tag2`
    );

    // Now simulate no tags
    mockGet = jest.fn().mockReturnValue(null);
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });

    // Change pathname back to POSTS with no tags
    (usePathname as jest.Mock).mockReturnValue(NAV_PATHS.POSTS);
    await act(async () => {
      rerender(<NavPaths />);
    });

    postsLink = screen.getByRole('link', { name: NAV_PATH_LABELS.POSTS });
    myPostsLink = screen.getByRole('link', { name: NAV_PATH_LABELS.MY_POSTS });

    expect(postsLink).toHaveAttribute('href', NAV_PATHS.POSTS);
    expect(myPostsLink).toHaveAttribute('href', NAV_PATHS.MY_POSTS);

    expect(mockGet).toHaveBeenCalledWith('tags');
  });
});
