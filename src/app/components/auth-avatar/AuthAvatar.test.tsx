import { render, screen } from '@testing-library/react';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { AVATAR_SELECTORS } from '../../../lib/test-selectors/components/avatar.selectors';
import { AuthAvatar } from './AuthAvatar';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));

// Mock jotai
jest.mock('jotai', () => ({
  useAtom: jest.fn(),
  atom: jest.fn()
}));

// Mock the atoms module to avoid import issues
jest.mock('../../../lib/state/atoms', () => ({
  avatarCacheAtom: {}
}));

// Mock the Avatar component
jest.mock('../avatar/Avatar', () => {
  return {
    __esModule: true,
    Avatar: jest.fn(({ seed, size }) => (
      <div data-testid={AVATAR_SELECTORS.CONTAINER}>
        Mock Avatar: {seed}, {size}
      </div>
    ))
  };
});

const mockUseSession = useSession as jest.Mock;
const mockUseAtom = useAtom as jest.Mock;

describe('AuthAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock avatar cache atom
    mockUseAtom.mockReturnValue([{}, jest.fn()]);
  });

  it('renders Avatar with user ID as seed when session exists', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="md" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock Avatar: user-123, md');
  });

  it('renders Avatar with guest seed when ID is not available', () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com'
        // No ID provided
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="sm" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    // When there's no user ID, it defaults to 'guest-user'
    expect(avatarElement).toHaveTextContent('Mock Avatar: guest-user, sm');
  });

  it('renders Avatar with guest seed when ID and name are not available', () => {
    const mockSession = {
      user: {
        email: 'test@example.com'
        // No ID or name provided
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="lg" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    // When there's no user ID, it defaults to 'guest-user'
    expect(avatarElement).toHaveTextContent('Mock Avatar: guest-user, lg');
  });

  it('renders Avatar with random guest seed when no session exists', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<AuthAvatar size="xs" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    // Should contain "guest-" prefix but the rest is random
    expect(avatarElement.textContent).toMatch(/Mock Avatar: guest-.+, xs/);
  });

  it('renders Avatar with guest seed when ID is empty string', () => {
    const mockSession = {
      user: {
        id: '', // Empty ID (falsy)
        name: 'Test User',
        email: 'test@example.com'
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="md" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    // When ID is empty string (falsy), it defaults to 'guest-user'
    expect(avatarElement).toHaveTextContent('Mock Avatar: guest-user, md');
  });

  it('passes through props correctly', () => {
    const mockSession = {
      user: {
        id: 'user-123'
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="xxs" enableTooltip={true} tooltipScale={3} />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock Avatar: user-123, xxs');
  });
});
