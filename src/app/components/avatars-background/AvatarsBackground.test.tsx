import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

// Mock the makeid function BEFORE importing the component
jest.mock('../../../lib/utils/string/make-id', () => ({
  makeid: jest.fn()
}));

// Mock the @dicebear/core createAvatar function
jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({
    toDataUri: jest.fn(() => 'data:image/svg+xml;base64,mock-avatar-data')
  }))
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

// Mock requestAnimationFrame and cancelAnimationFrame with better control
let frameCallbacks: Array<(time: number) => void> = [];
let frameId = 0;

const mockRequestAnimationFrame = jest.fn(
  (callback: (time: number) => void) => {
    frameId++;
    frameCallbacks.push(callback);
    return frameId;
  }
);

const mockCancelAnimationFrame = jest.fn((id: number) => {
  // Find and remove the callback with the matching ID
  const index = frameCallbacks.findIndex((_, i) => i + 1 === id);
  if (index !== -1) {
    frameCallbacks.splice(index, 1);
  }
});

// Helper function to trigger animation frames
const triggerAnimationFrame = (time: number = performance.now()) => {
  const callbacks = [...frameCallbacks];
  frameCallbacks = [];
  callbacks.forEach((callback) => callback(time));
};

// Helper function to trigger multiple animation frames
const triggerMultipleAnimationFrames = (
  count: number = 1,
  interval: number = 16.67
) => {
  let currentTime = performance.now();
  for (let i = 0; i < count; i++) {
    triggerAnimationFrame(currentTime);
    currentTime += interval;
  }
};

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock Date.now to return predictable values
let mockTime = 1000000;
const mockDateNow = jest.fn(() => mockTime);
global.Date.now = mockDateNow;

// Mock performance.now
const mockPerformanceNow = jest.fn(() => mockTime);
global.performance = {
  ...global.performance,
  now: mockPerformanceNow
};

// Helper function to advance time
const advanceTime = (ms: number) => {
  mockTime += ms;
  mockDateNow.mockReturnValue(mockTime);
  mockPerformanceNow.mockReturnValue(mockTime);
};

// Import after mocking
import { makeid } from '../../../lib/utils/string/make-id';
import AvatarsBackground from './AvatarsBackground';

describe('AvatarsBackground', () => {
  beforeEach(() => {
    // Reset time
    mockTime = 1000000;
    mockDateNow.mockReturnValue(mockTime);
    mockPerformanceNow.mockReturnValue(mockTime);

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

    // Reset frame callbacks and mocks
    frameCallbacks = [];
    frameId = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    frameCallbacks = [];
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

  it('initializes with avatars after animation runs', async () => {
    render(<AvatarsBackground />);

    // The component should start the animation loop
    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    // No avatars initially
    expect(screen.queryAllByAltText('Background Avatar')).toHaveLength(0);

    // Advance time to trigger avatar spawning (past the 2-second generation interval)
    act(() => {
      advanceTime(2100); // 2.1 seconds
      triggerMultipleAnimationFrames(3);
    });

    // Wait for component to update
    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('uses makeid to generate seeds for avatars', async () => {
    render(<AvatarsBackground />);

    // Trigger avatar spawning
    act(() => {
      advanceTime(2100); // 2.1 seconds
      triggerMultipleAnimationFrames(3);
    });

    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    const avatars = screen.getAllByAltText('Background Avatar');

    // Each avatar should have the mocked image source
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute(
        'src',
        'data:image/svg+xml;base64,mock-avatar-data'
      );
      expect(avatar).toHaveAttribute('alt', 'Background Avatar');
    });

    // Verify makeid was called to generate seeds
    expect(makeid).toHaveBeenCalledWith(6); // for avatar IDs
    expect(makeid).toHaveBeenCalledWith(8); // for seeds
  });

  it('renders avatars with correct mocked data', async () => {
    render(<AvatarsBackground />);

    // Trigger avatar spawning
    act(() => {
      advanceTime(2100); // 2.1 seconds
      triggerMultipleAnimationFrames(3);
    });

    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    const avatars = screen.getAllByAltText('Background Avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute(
        'src',
        'data:image/svg+xml;base64,mock-avatar-data'
      );
      expect(avatar).toHaveAttribute('alt', 'Background Avatar');
    });
  });

  it('renders avatars with correct size attributes', async () => {
    render(<AvatarsBackground />);

    // Trigger avatar spawning
    act(() => {
      advanceTime(2100); // 2.1 seconds
      triggerMultipleAnimationFrames(3);
    });

    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    const avatars = screen.getAllByAltText('Background Avatar');
    avatars.forEach((avatar) => {
      expect(avatar).toHaveStyle({
        width: '100%',
        height: '100%',
        borderRadius: '50%'
      });
    });
  });

  it('starts requestAnimationFrame on mount', () => {
    render(<AvatarsBackground />);

    // Should have called requestAnimationFrame for the animation loop
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<AvatarsBackground />);

    // Clear the mock to isolate the unmount behavior
    mockCancelAnimationFrame.mockClear();

    unmount();

    // Should have called cancelAnimationFrame
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('spawns multiple avatars over time', async () => {
    render(<AvatarsBackground />);

    // Trigger first avatar spawn
    act(() => {
      advanceTime(2100); // 2.1 seconds
      triggerMultipleAnimationFrames(3);
    });

    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });

    const initialAvatarCount =
      screen.getAllByAltText('Background Avatar').length;

    // Advance time for another spawn cycle
    act(() => {
      advanceTime(2100); // Another 2.1 seconds
      triggerMultipleAnimationFrames(3);
    });

    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThan(initialAvatarCount);
    });
  });

  it('respects the maximum avatar limit', async () => {
    render(<AvatarsBackground />);

    // Trigger many spawn cycles to test the limit
    act(() => {
      // Advance time by 20 seconds (should trigger 10 spawn cycles)
      advanceTime(20000);
      triggerMultipleAnimationFrames(20);
    });

    await waitFor(() => {
      const avatars = screen.queryAllByAltText('Background Avatar');
      expect(avatars.length).toBeGreaterThan(0);
      // Should not exceed MAX_AVATARS (8)
      expect(avatars.length).toBeLessThanOrEqual(8);
    });
  });

  it('handles visibility change events', () => {
    render(<AvatarsBackground />);

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true
    });

    // Trigger visibility change
    act(() => {
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });

    // Component should still be functional (no errors thrown)
    const container = document.querySelector('.avatars-background');
    expect(container).toBeInTheDocument();
  });
});
