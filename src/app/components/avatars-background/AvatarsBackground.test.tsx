import { cleanup, render, screen } from '@testing-library/react';

// Mock the makeid function BEFORE importing the component
jest.mock('../../../lib/utils/string/make-id', () => ({
  makeid: jest.fn().mockReturnValue('mocked-seed')
}));

// Mock the Avatar component
jest.mock('../avatar/Avatar', () => ({
  Avatar: function MockedAvatar({ seed }: { seed: string }) {
    return <div data-testid="mocked-avatar" data-seed={seed}></div>;
  }
}));

// Import after mocking
import { makeid } from '../../../lib/utils/string/make-id';
import { AvatarsBackground } from './AvatarsBackground';

describe('AvatarsBackground', () => {
  beforeEach(() => {
    // Clear mock calls before the test, but note that makeid is called at module import time
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
    // Reset the mock to ensure we can track new calls
    (makeid as jest.Mock).mockClear();

    // Since makeid is called at module load time, we need to trigger a re-import
    // or check that the calls were made previously. For this test, we'll verify
    // that the component renders correctly with the mocked seeds.
    render(<AvatarsBackground />);

    // The component should render with the mocked seeds
    const avatars = screen.getAllByTestId('mocked-avatar');
    expect(avatars).toHaveLength(10);

    // Each avatar should have the mocked seed in its data-seed attribute
    avatars.forEach((avatar, index) => {
      expect(avatar).toHaveAttribute('data-seed');
      const seed = avatar.getAttribute('data-seed');
      expect(seed).toMatch(/^background-\d+-mocked-seed$/);
    });

    // Since makeid was called at module import time, we can't easily test
    // the exact number of calls, but we can verify the component works correctly
    // with the mocked return value
  });

  it('passes the generated seed to each Avatar component', () => {
    render(<AvatarsBackground />);
    const avatars = screen.getAllByTestId('mocked-avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute('data-seed');
      // The seed should contain "background-" prefix and the mocked-seed
      expect(avatar.getAttribute('data-seed')).toMatch(
        /^background-\d+-mocked-seed$/
      );
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
