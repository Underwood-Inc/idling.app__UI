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
  useAtom: jest.fn()
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

  it('renders Avatar with name fallback when ID is not available', () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com'
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="sm" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock Avatar: Test User, sm');
  });

  it('renders Avatar with email fallback when ID and name are not available', () => {
    const mockSession = {
      user: {
        email: 'test@example.com'
      }
    };
    mockUseSession.mockReturnValue({ data: mockSession });

    render(<AuthAvatar size="lg" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent(
      'Mock Avatar: test@example.com, lg'
    );
  });

  it('renders Avatar with random guest seed when no session exists', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<AuthAvatar size="xs" />);

    const avatarElement = screen.getByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    // Should contain "guest-" prefix but the rest is random
    expect(avatarElement.textContent).toMatch(/Mock Avatar: guest-.+, xs/);
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
