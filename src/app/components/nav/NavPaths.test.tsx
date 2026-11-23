import {
  HEADER_NAV_PATHS,
  isExternalLink,
  NAV_PATH_LABELS,
  NAV_PATHS,
} from '../../../lib/routes';
import { render, screen } from '../../../test-utils';
import { NavPaths } from './NavPaths';

vi.mock('next/config');

vi.mock('next/link', () => {
  const MockLink = ({ children, ...props }: any) => (
    <a {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return { default: MockLink };
});

vi.mock('../navbar/Navbar', () => ({
  Navbar: {
    Item: ({ children, isDisabled }: any) => (
      <div data-disabled={isDisabled}>{children}</div>
    ),
  },
}));

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

describe('NavPaths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockClear();
  });

  it('renders all navigation paths', () => {
    mockUsePathname.mockReturnValue('/');
    render(<NavPaths />);

    Object.entries(HEADER_NAV_PATHS).forEach(([key, path]) => {
      const routeKey = key as keyof typeof HEADER_NAV_PATHS;
      const expectedName = isExternalLink(path)
        ? `${NAV_PATH_LABELS[routeKey]} External link`
        : NAV_PATH_LABELS[routeKey];

      const element = screen.getByRole('link', {
        name: expectedName,
      });
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('href', path);
    });
  });

  it('marks the current path as active', () => {
    mockUsePathname.mockReturnValue(NAV_PATHS.CARD_GENERATOR);
    render(<NavPaths />);

    const activeLink = screen.getByRole('link', {
      name: NAV_PATH_LABELS.CARD_GENERATOR,
    });
    expect(activeLink).toHaveClass('active');
  });
});