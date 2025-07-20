import {
  HEADER_NAV_PATHS,
  NAV_PATH_LABELS,
  NAV_PATHS
} from '../../../lib/routes';
import { act, render, screen } from '../../../test-utils';
import { NavPaths } from './NavPaths';

jest.mock('next/config');

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

// Get the mocked functions
const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();

// Mock next/navigation locally
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams()
}));

describe('NavPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockClear();
    mockUseSearchParams.mockClear();
  });

  it('renders all navigation paths', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    });
    render(<NavPaths />);

    Object.entries(HEADER_NAV_PATHS).forEach(([key, path]) => {
      // Handle external links that have aria-label from icon
      const routeKey = key as keyof typeof HEADER_NAV_PATHS;
      const expectedName =
        routeKey === 'GALAXY'
          ? `${NAV_PATH_LABELS[routeKey]} External link`
          : NAV_PATH_LABELS[routeKey];

      const element = screen.getByRole('link', {
        name: expectedName
      });
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('href', path);
    });
  });

  it('marks the current path as active', () => {
    mockUsePathname.mockReturnValue(NAV_PATHS.POSTS);
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    });
    render(<NavPaths />);

    const activeLink = screen.getByRole('link', {
      name: NAV_PATH_LABELS.POSTS
    });
    expect(activeLink).toHaveClass('active');
  });

  it('appends tags to supported routes', async () => {
    mockUsePathname.mockReturnValue(NAV_PATHS.POSTS);
    const mockGet = jest.fn().mockReturnValue('tag1,tag2');
    mockUseSearchParams.mockReturnValue({ get: mockGet });

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
    mockUseSearchParams.mockReturnValue({ get: mockGet });

    // Initial render with POSTS path and tags
    mockUsePathname.mockReturnValue(NAV_PATHS.POSTS);
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
    mockUsePathname.mockReturnValue(NAV_PATHS.MY_POSTS);
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
    mockUseSearchParams.mockReturnValue({ get: mockGet });

    // Change pathname back to POSTS with no tags
    mockUsePathname.mockReturnValue(NAV_PATHS.POSTS);
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
