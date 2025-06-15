import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { formatLastUpdated, LinkTooltip } from '../LinkTooltip';

// Mock Date.now() to return a fixed timestamp
const mockNow = 1700000000000; // 2023-11-14T12:13:20.000Z
const originalDateNow = Date.now;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LinkTooltip', () => {
  beforeEach(() => {
    // Mock Date.now() before each test
    Date.now = jest.fn(() => mockNow);
    // Reset fetch mock
    mockFetch.mockReset();
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

  it('shows tooltip on hover', async () => {
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

  it('shows modal on ctrl+click when enabled', () => {
    render(
      <LinkTooltip url="https://example.com" enableCtrlClick>
        Example Link
      </LinkTooltip>
    );

    const link = screen.getByText('Example Link');
    fireEvent.click(link, { ctrlKey: true });

    expect(screen.getByTestId('link-preview-modal')).toBeInTheDocument();
  });

  it('opens link in new tab on regular click', () => {
    const originalOpen = window.open;
    window.open = jest.fn();

    render(<LinkTooltip url="https://example.com">Example Link</LinkTooltip>);

    const link = screen.getByText('Example Link');
    fireEvent.click(link);

    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
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
    expect(result).toBe('2w ago');
  });

  it('formats months correctly', () => {
    const timestamp = mockNow - 4 * 30 * 24 * 60 * 60 * 1000; // 4 months ago
    const result = formatLastUpdated(timestamp);
    expect(result).toBe('4mo ago');
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
    expect(result).toBe('2y 3mo 2w 5d 6h 30m 45s ago');
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
