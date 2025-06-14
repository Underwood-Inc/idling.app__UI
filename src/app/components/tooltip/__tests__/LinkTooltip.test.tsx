import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LinkTooltip } from '../LinkTooltip';

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
