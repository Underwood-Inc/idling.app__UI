import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { SmartPillInput } from './SmartPillInput';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/posts'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })),
  useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Mock the search actions
jest.mock('../../../lib/actions/search.actions', () => ({
  searchHashtags: jest
    .fn()
    .mockResolvedValue([
      { id: '1', value: 'javascript', label: 'javascript', type: 'hashtag' }
    ]),
  searchUsers: jest.fn().mockResolvedValue([
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
    onChange: jest.fn(),
    contextId: 'test',
    placeholder: 'Type something...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders placeholder when empty', () => {
    render(<SmartPillInput {...defaultProps} />);
    expect(screen.getByText('Type something...')).toBeInTheDocument();
  });

  it('enters edit mode when clicked', () => {
    render(<SmartPillInput {...defaultProps} />);

    const container = screen.getByText('Type something...').closest('div');
    fireEvent.click(container!);

    // Should show the input field in edit mode
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders hashtag pills in display mode', () => {
    render(<SmartPillInput {...defaultProps} value="#javascript #react" />);

    // Should render the hashtags as pills
    expect(screen.getByText('#javascript')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
  });

  it('renders mention pills in display mode', () => {
    render(<SmartPillInput {...defaultProps} value="@[testuser|user123]" />);

    // Should render the mention as a styled pill
    const pillLink = screen.getByRole('link');
    expect(pillLink).toHaveClass('content-pill', 'content-pill--mention');
    expect(pillLink).toHaveTextContent('@testuser');
    // No title attribute in filter context (tooltips disabled)
    expect(pillLink).not.toHaveAttribute('title');
  });

  it('commits changes when commit button is clicked', async () => {
    const onChange = jest.fn();
    render(
      <SmartPillInput {...defaultProps} onChange={onChange} value="#existing" />
    );

    // Enter edit mode
    const container = screen.getByText('#existing').closest('div');
    fireEvent.click(container!);

    // Type in the input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#test' } });

    // Press Enter to commit
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call onChange with the combined value
    expect(onChange).toHaveBeenCalledWith('#existing #test');
  });

  it('cancels changes when Escape key is pressed', () => {
    const onChange = jest.fn();
    render(
      <SmartPillInput {...defaultProps} onChange={onChange} value="#original" />
    );

    // Enter edit mode
    const container = screen.getByText('#original').closest('div');
    fireEvent.click(container!);

    // Type in the input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#changed' } });

    // Press Escape to cancel
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should not call onChange
    expect(onChange).not.toHaveBeenCalled();

    // Should return to display mode with original value
    expect(screen.getByText('#original')).toBeInTheDocument();
  });

  it('shows existing pills in edit mode and allows removal', () => {
    const onChange = jest.fn();
    render(
      <SmartPillInput
        {...defaultProps}
        onChange={onChange}
        value="#existing #test"
      />
    );

    // Enter edit mode
    const container = screen.getByText('#existing').closest('div');
    fireEvent.click(container!);

    // Should still show existing pills in edit mode
    expect(screen.getByText('#existing')).toBeInTheDocument();
    expect(screen.getByText('#test')).toBeInTheDocument();

    // Click on a pill to remove it
    const existingPill = screen.getByText('#existing');
    fireEvent.click(existingPill);

    // Press Enter to commit the changes
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call onChange with the remaining pill
    expect(onChange).toHaveBeenCalledWith('#test');
  });

  it('removes pills immediately when clicked in display mode', () => {
    const onChange = jest.fn();
    render(
      <SmartPillInput
        {...defaultProps}
        onChange={onChange}
        value="#keep #remove"
      />
    );

    // Click on a pill to remove it
    const removePill = screen.getByText('#remove');
    fireEvent.click(removePill);

    // Should call onChange immediately with the remaining content
    expect(onChange).toHaveBeenCalledWith('#keep');
  });
});
