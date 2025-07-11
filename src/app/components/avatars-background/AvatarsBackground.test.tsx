import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';

// Mock the makeid function BEFORE importing the component
jest.mock('../../../lib/utils/string/make-id', () => ({
  makeid: jest.fn().mockReturnValue('mocked-seed')
}));

// Mock the Avatar component
jest.mock('../avatar/Avatar', () => ({
  Avatar: function MockedAvatar({
    seed,
    size
  }: {
    seed: string;
    size: string;
  }) {
    return (
      <div
        data-testid="mocked-avatar"
        data-seed={seed}
        data-size={size}
        role="img"
        aria-label="Background Avatar"
      >
        Mock Avatar
      </div>
    );
  }
}));

// Import after mocking
import { makeid } from '../../../lib/utils/string/make-id';
import AvatarsBackground from './AvatarsBackground';

describe('AvatarsBackground', () => {
  let mockRequestAnimationFrame: jest.SpyInstance;
  let mockCancelAnimationFrame: jest.SpyInstance;
  let mockDateNow: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();

    // Mock timing functions
    currentTime = 1000000; // Start with a base time
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(currentTime);

    // Mock requestAnimationFrame to run immediately
    mockRequestAnimationFrame = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        // Execute callback immediately instead of waiting for next frame
        setTimeout(() => callback(currentTime), 0);
        return 1; // Return a mock frame ID
      });

    mockCancelAnimationFrame = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    });
  });

  afterEach(() => {
    cleanup();
    mockRequestAnimationFrame.mockRestore();
    mockCancelAnimationFrame.mockRestore();
    mockDateNow.mockRestore();
  });

  it('renders the avatars background container', () => {
    render(<AvatarsBackground />);

    const container = document.querySelector('.avatars-background');
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '-1',
      overflow: 'hidden'
    });
  });

  it('generates avatars after the time interval', async () => {
    render(<AvatarsBackground />);

    // Initially, no avatars should be present
    expect(screen.queryAllByTestId('mocked-avatar')).toHaveLength(0);

    // Fast forward time beyond the generation interval (4000ms)
    await act(async () => {
      currentTime += 5000; // Advance 5 seconds
      mockDateNow.mockReturnValue(currentTime);

      // Wait for the animation frame to process
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Now avatars should be generated
    const avatars = screen.queryAllByTestId('mocked-avatar');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('uses makeid to generate seeds for avatars', async () => {
    render(<AvatarsBackground />);

    // Fast forward time to trigger avatar generation
    await act(async () => {
      currentTime += 5000;
      mockDateNow.mockReturnValue(currentTime);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Check that makeid was called (it's called for both id and seed generation)
    expect(makeid).toHaveBeenCalled();

    // Check that avatars have the mocked seed
    const avatars = screen.queryAllByTestId('mocked-avatar');
    if (avatars.length > 0) {
      avatars.forEach((avatar) => {
        expect(avatar).toHaveAttribute('data-seed', 'mocked-seed');
      });
    }
  });

  it('passes the generated seed to each Avatar component', async () => {
    render(<AvatarsBackground />);

    // Fast forward time to trigger avatar generation
    await act(async () => {
      currentTime += 5000;
      mockDateNow.mockReturnValue(currentTime);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const avatars = screen.queryAllByTestId('mocked-avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute('data-seed');
      expect(avatar).toHaveAttribute('data-size');
    });
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<AvatarsBackground />);

    // Unmount the component
    unmount();

    // The component should have called cancelAnimationFrame
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });
});
