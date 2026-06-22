import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { NavigationLoadingProvider } from '../../../lib/context/NavigationLoadingContext';
import { SmartPillInput } from './SmartPillInput';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/posts'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })),
  useSearchParams: vi.fn(() => new URLSearchParams())
}));

// Mock the search actions
vi.mock('../../../lib/actions/search.actions', () => ({
  searchHashtags: jest
    .fn()
    .mockResolvedValue([
      { id: '1', value: 'javascript', label: 'javascript', type: 'hashtag' }
    ]),
  searchUsers: vi.fn().mockResolvedValue([
    {
      id: '1',
      value: 'user123',
      label: 'testuser',
      displayName: 'Test User',
      type: 'user'
    }
  ])
}));

describe('SmartPillInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    contextId: 'test',
    placeholder: 'Type something...'
  };

  // Helper function to render with required providers
  const renderWithProviders = (props = defaultProps) => {
    return render(
      <NavigationLoadingProvider>
        <SmartPillInput {...props} />
      </NavigationLoadingProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders placeholder when empty', () => {
    renderWithProviders();
    expect(
      screen.getByPlaceholderText('Type something...')
    ).toBeInTheDocument();
  });

  it('enters edit mode when clicked', () => {
    renderWithProviders();

    const input = screen.getByPlaceholderText('Type something...');
    fireEvent.click(input);

    // Should show the input field in edit mode
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders hashtag pills in display mode', () => {
    renderWithProviders({ ...defaultProps, value: '#javascript #react' });

    // Should render the hashtags as pills
    expect(screen.getByText('#javascript')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
  });

  it('renders mention pills in display mode', () => {
    renderWithProviders({ ...defaultProps, value: '@[testuser|user123]' });

    // Should render the mention as a styled pill
    const pillLink = screen.getByRole('link');
    expect(pillLink).toHaveClass('content-pill', 'content-pill--mention');
    expect(pillLink).toHaveTextContent('@testuser');
    // No title attribute in filter context (tooltips disabled)
    expect(pillLink).not.toHaveAttribute('title');
  });

  it('commits changes when commit button is clicked', async () => {
    const onChange = vi.fn();
    renderWithProviders({
      ...defaultProps,
      onChange,
      value: '#existing'
    });

    // Enter edit mode
    const container = screen.getByText('#existing').closest('div');
    fireEvent.click(container!);

    // Type in the input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#test' } });

    // Click outside to commit (since we removed keyboard shortcuts)
    fireEvent.click(document.body);

    // Should call onChange with the combined value
    expect(onChange).toHaveBeenCalledWith('#existing #test');
  });

  it('cancels changes when clicking outside without typing', () => {
    const onChange = vi.fn();
    renderWithProviders({
      ...defaultProps,
      onChange,
      value: '#original'
    });

    // Enter edit mode
    const container = screen.getByText('#original').closest('div');
    fireEvent.click(container!);

    // Click outside without typing anything
    fireEvent.click(document.body);

    // Should call onChange with just the original value (no new content added)
    expect(onChange).toHaveBeenCalledWith('#original');

    // Should return to display mode with original value
    expect(screen.getByText('#original')).toBeInTheDocument();
  });

  it('shows existing pills in edit mode and allows removal', () => {
    const onChange = vi.fn();
    renderWithProviders({
      ...defaultProps,
      onChange,
      value: '#existing #test'
    });

    // Enter edit mode
    const container = screen.getByText('#existing').closest('div');
    fireEvent.click(container!);

    // Should still show existing pills in edit mode
    expect(screen.getByText('#existing')).toBeInTheDocument();
    expect(screen.getByText('#test')).toBeInTheDocument();

    // Click on a pill to remove it
    const existingPill = screen.getByText('#existing');
    fireEvent.click(existingPill);

    // Click outside to commit the changes
    fireEvent.click(document.body);

    // Should call onChange with the remaining pill
    expect(onChange).toHaveBeenCalledWith('#test');
  });

  it('removes pills immediately when clicked in display mode', () => {
    const onChange = vi.fn();
    renderWithProviders({
      ...defaultProps,
      onChange,
      value: '#keep #remove'
    });

    // Click on a pill to remove it
    const removePill = screen.getByText('#remove');
    fireEvent.click(removePill);

    // Should call onChange immediately with the remaining content
    expect(onChange).toHaveBeenCalledWith('#keep');
  });

  it('prevents duplicate hashtags from being added', () => {
    const onChange = vi.fn();
    renderWithProviders({
      ...defaultProps,
      onChange,
      value: '#existing'
    });

    // Enter edit mode
    const container = screen.getByText('#existing').closest('div');
    fireEvent.click(container!);

    // Try to add the same hashtag again (must end with space to be detected as complete pill)
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#existing ' } }); // Note the space at the end

    // Click outside to commit
    fireEvent.click(document.body);

    // Should not add duplicate - value should remain the same
    expect(onChange).toHaveBeenCalledWith('#existing');
  });

  it('prevents duplicate mentions from being added', () => {
    const onChange = vi.fn();
    renderWithProviders({
      ...defaultProps,
      onChange,
      value: '@[testuser|user123]'
    });

    // Enter edit mode
    const container = screen.getByText('@testuser').closest('div');
    fireEvent.click(container!);

    // Try to add the same mention again (must end with space to be detected as complete pill)
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '@[testuser|user123] ' } }); // Note the space at the end

    // Click outside to commit
    fireEvent.click(document.body);

    // Should not add duplicate - value should remain the same
    expect(onChange).toHaveBeenCalledWith('@[testuser|user123]');
  });
});
