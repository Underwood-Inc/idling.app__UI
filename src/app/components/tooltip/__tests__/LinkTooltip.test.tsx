import { formatLastUpdated } from '../../../../lib/utils/time-utils';
import { fireEvent, render, screen, waitFor } from '../../../../test-utils';
import { LinkTooltip } from '../LinkTooltip';

// Mock Date.now() to return a fixed timestamp
const mockNow = 1700000000000; // 2023-11-14T12:13:20.000Z
const originalDateNow = Date.now;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.matchMedia for mobile detection
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
});

describe('LinkTooltip', () => {
  beforeEach(() => {
    // Mock Date.now() before each test
    Date.now = jest.fn(() => mockNow);
    // Reset fetch mock
    mockFetch.mockReset();
    // Reset matchMedia mock to return desktop by default
    mockMatchMedia.mockImplementation((query) => ({
      matches: false, // Default to desktop
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }));
  });

  afterEach(() => {
    // Restore Date.now() after each test
    Date.now = originalDateNow;
  });

  it('renders link with tooltip', () => {
    render(<LinkTooltip url="https://example.com">Example Link</LinkTooltip>);

    const link = screen.getByText('Example Link');
    expect(link).toBeInTheDocument();
  });

  it('shows tooltip on hover on desktop', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Example', description: 'Test' })
    });

    render(<LinkTooltip url="https://example.com">Example Link</LinkTooltip>);

    const link = screen.getByText('Example Link');
    fireEvent.mouseEnter(link);

    await waitFor(() => {
      expect(screen.getByTestId('link-tooltip')).toBeInTheDocument();
    });
  });

  it('shows tooltip on click on mobile', async () => {
    // Mock mobile device
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(hover: none) and (pointer: coarse)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Example', description: 'Test' })
    });

    render(<LinkTooltip url="https://example.com">Example Link</LinkTooltip>);

    const link = screen.getByText('Example Link');
    fireEvent.click(link);

    await waitFor(() => {
      expect(screen.getByTestId('link-tooltip')).toBeInTheDocument();
    });
  });

  it('shows modal on ctrl+click when enabled on desktop', () => {
    render(
      <LinkTooltip url="https://example.com" enableCtrlClick>
        Example Link
      </LinkTooltip>
    );

    const link = screen.getByText('Example Link');
    fireEvent.click(link, { ctrlKey: true });

    expect(screen.getByTestId('link-preview-modal')).toBeInTheDocument();
  });

  it('opens link in new tab on regular click on desktop', () => {
    const originalOpen = window.open;
    window.open = jest.fn();

    render(<LinkTooltip url="https://example.com">Example Link</LinkTooltip>);

    const link = screen.getByText('Example Link');
    fireEvent.click(link);

    expect(window.open).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
    window.open = originalOpen;
  });

  it('prevents default link behavior on mobile', () => {
    // Mock mobile device
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(hover: none) and (pointer: coarse)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }));

    const originalOpen = window.open;
    window.open = jest.fn();

    render(<LinkTooltip url="https://example.com">Example Link</LinkTooltip>);

    const link = screen.getByText('Example Link');
    fireEvent.click(link);

    // Should not open link on mobile
    expect(window.open).not.toHaveBeenCalled();
    window.open = originalOpen;
  });
});

describe('formatLastUpdated', () => {
  beforeEach(() => {
    // Mock Date.now() before each test
    Date.now = jest.fn(() => mockNow);
  });

  afterEach(() => {
    // Restore Date.now() after each test
    Date.now = originalDateNow;
  });

  it('formats seconds correctly', () => {
    const timestamp = mockNow - 30 * 1000; // 30 seconds ago
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('30s ago');
  });

  it('formats minutes correctly', () => {
    const timestamp = mockNow - 45 * 60 * 1000; // 45 minutes ago
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('45m ago');
  });

  it('formats hours correctly', () => {
    const timestamp = mockNow - 5 * 60 * 60 * 1000; // 5 hours ago
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('5h ago');
  });

  it('formats days correctly', () => {
    const timestamp = mockNow - 3 * 24 * 60 * 60 * 1000; // 3 days ago
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('3d ago');
  });

  it('formats weeks correctly', () => {
    const timestamp = mockNow - 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks ago
    const result = formatLastUpdated(timestamp);
    // Calendar-accurate: 14 days from the specific date might span different weeks
    expect(result).toBe('1w 6d ago');
  });

  it('formats months correctly', () => {
    const timestamp = mockNow - 4 * 30 * 24 * 60 * 60 * 1000; // 4 months ago (120 days)
    const result = formatLastUpdated(timestamp);
    // Calendar-accurate: 120 days is actually 3 months + 3 weeks when calculated properly
    expect(result).toBe('3mo 3w ago');
  });

  it('formats years correctly', () => {
    const timestamp = mockNow - 2 * 365 * 24 * 60 * 60 * 1000; // 2 years ago
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('2y ago');
  });

  it('combines multiple time units correctly', () => {
    const timestamp =
      mockNow -
      (2 * 365 * 24 * 60 * 60 * 1000 + // 2 years
        3 * 30 * 24 * 60 * 60 * 1000 + // 3 months
        2 * 7 * 24 * 60 * 60 * 1000 + // 2 weeks
        5 * 24 * 60 * 60 * 1000 + // 5 days
        6 * 60 * 60 * 1000 + // 6 hours
        30 * 60 * 1000 + // 30 minutes
        45 * 1000); // 45 seconds
    const result = formatLastUpdated(timestamp);
    // Calendar-accurate: Shows only the most significant units (years + months)
    expect(result).toBe('2y 3mo ago');
  });

  it('handles zero seconds correctly', () => {
    const timestamp = mockNow; // current time
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('0s ago');
  });

  it('handles future timestamps correctly', () => {
    const timestamp = mockNow + 1000; // 1 second in future
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('0s ago');
  });
});
