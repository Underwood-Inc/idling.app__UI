import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the makeid function BEFORE importing the component
jest.mock('../../../lib/utils/string/make-id', () => ({
  makeid: jest.fn()
}));

// Mock the Avatar component
jest.mock('../avatar/Avatar', () => ({
  Avatar: function MockedAvatar({
    seed,
    size
  }: {
    seed: string;
    size: 'sm' | 'md';
  }) {
    return (
      <div data-testid="mocked-avatar" data-seed={seed} data-size={size}></div>
    );
  }
}));

// Mock window.innerWidth and window.innerHeight
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

// Mock requestAnimationFrame and cancelAnimationFrame properly
let frameId = 0;
const mockRequestAnimationFrame = jest.fn(
  (callback: (time: number) => void) => {
    frameId++;
    // Don't call the callback immediately to avoid infinite loops
    // Tests can manually trigger frames if needed
    return frameId;
  }
);

const mockCancelAnimationFrame = jest.fn();

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock Date.now to return predictable values
const mockDateNow = jest.fn(() => 1000000);
global.Date.now = mockDateNow;

// Import after mocking
import { makeid } from '../../../lib/utils/string/make-id';
import AvatarsBackground from './AvatarsBackground';

describe('AvatarsBackground', () => {
  beforeEach(() => {
    // Setup makeid to return predictable values
    let callCount = 0;
    (makeid as jest.Mock).mockImplementation((length: number) => {
      callCount++;
      if (length === 6) {
        return `id-${callCount}`;
      } else if (length === 8) {
        return `seed-${callCount}`;
      }
      return `default-${callCount}`;
    });

    // Reset mocks
    jest.clearAllMocks();
    frameId = 0;
    mockDateNow.mockReturnValue(1000000);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the background container', () => {
    render(<AvatarsBackground />);

    // Check for the main container
    const container = document.querySelector('.avatars-background');
    expect(container).toBeInTheDocument();

    // Check that the container has the correct styles
    expect(container).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      'pointer-events': 'none',
      'z-index': '-1',
      overflow: 'hidden'
    });
  });

  it('initializes with avatars', async () => {
    render(<AvatarsBackground />);

    // Wait for component to initialize
    await waitFor(() => {
      const avatars = screen.queryAllByTestId('mocked-avatar');
      expect(avatars.length).toBeGreaterThanOrEqual(3);
      expect(avatars.length).toBeLessThanOrEqual(5);
    });
  });

  it('uses makeid to generate seeds for avatars', async () => {
    render(<AvatarsBackground />);

    await waitFor(() => {
      const avatars = screen.queryAllByTestId('mocked-avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    const avatars = screen.getAllByTestId('mocked-avatar');

    // Each avatar should have the mocked seed in its data-seed attribute
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute('data-seed');
      const seed = avatar.getAttribute('data-seed');
      expect(seed).toMatch(/^seed-\d+$/);
    });

    // Verify makeid was called to generate seeds
    expect(makeid).toHaveBeenCalledWith(6); // for avatar IDs
    expect(makeid).toHaveBeenCalledWith(8); // for seeds
  });

  it('passes the generated seed to each Avatar component', async () => {
    render(<AvatarsBackground />);

    await waitFor(() => {
      const avatars = screen.queryAllByTestId('mocked-avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    const avatars = screen.getAllByTestId('mocked-avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute('data-seed');
      // The seed should match the mocked pattern
      expect(avatar.getAttribute('data-seed')).toMatch(/^seed-\d+$/);
    });
  });

  it('renders avatars with correct size attributes', async () => {
    render(<AvatarsBackground />);

    await waitFor(() => {
      const avatars = screen.queryAllByTestId('mocked-avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    const avatars = screen.getAllByTestId('mocked-avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute('data-size');
      const size = avatar.getAttribute('data-size');
      expect(['sm', 'md']).toContain(size);
    });
  });

  it('starts requestAnimationFrame on mount', () => {
    render(<AvatarsBackground />);

    // Should have called requestAnimationFrame for the animation loop
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<AvatarsBackground />);

    unmount();

    // Should have called cancelAnimationFrame
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });
});
