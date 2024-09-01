import { cleanup, render, screen } from '@testing-library/react';
import { makeid } from 'src/lib/utils/string/make-id';
import { AvatarsBackground } from './AvatarsBackground';

// Mock the makeid function
jest.mock('../../../lib/utils/string/make-id', () => ({
  makeid: jest.fn(() => 'mocked-seed')
}));

// Mock the Avatar component
jest.mock('../avatar/Avatar', () => {
  return function MockedAvatar({ seed }: { seed: string }) {
    return <div data-testid="mocked-avatar" data-seed={seed}></div>;
  };
});

describe('AvatarsBackground', () => {
  beforeEach(() => {
    // Clear mock calls before the test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each render
    cleanup();
  });
  it('renders the correct number of avatars', () => {
    render(<AvatarsBackground />);
    const avatars = screen.getAllByTestId('mocked-avatar');
    expect(avatars).toHaveLength(10);
  });

  it('uses makeid to generate seeds for avatars', () => {
    render(<AvatarsBackground />);

    // Check if makeid was called
    expect(makeid).toHaveBeenCalled();

    // Check the number of calls
    const callCount = (makeid as jest.Mock).mock.calls.length;
    expect(callCount).toBe(10);

    // Check if all calls were made with the correct argument
    (makeid as jest.Mock).mock.calls.forEach((call) => {
      expect(call[0]).toBe(15);
    });
  });

  it('passes the generated seed to each Avatar component', () => {
    render(<AvatarsBackground />);
    const avatars = screen.getAllByTestId('mocked-avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute('data-seed', 'mocked-seed');
    });
  });

  it('renders avatars with correct class names', () => {
    const { container } = render(<AvatarsBackground />);
    const avatarContainers = container.querySelectorAll(
      '.avatar__background_avatar'
    );
    expect(avatarContainers).toHaveLength(10);
  });

  it('renders the correct structure', () => {
    const { container } = render(<AvatarsBackground />);
    expect(
      container.querySelector('.avatar__background-container')
    ).toBeInTheDocument();
    expect(container.querySelector('.avatar__background')).toBeInTheDocument();
  });
});
