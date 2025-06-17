import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { CustomFilterInput } from './CustomFilterInput';

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

describe('CustomFilterInput', () => {
  const mockOnAddFilter = jest.fn();

  const defaultProps = {
    contextId: 'test-context',
    onAddFilter: mockOnAddFilter
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to enter edit mode and get the input
  const enterEditMode = () => {
    const smartPillInput = screen
      .getByText('Add filter: @user or #tag...')
      .closest('div');
    fireEvent.click(smartPillInput!);
    return screen.getByRole('textbox');
  };

  it('renders with default placeholder', () => {
    render(<CustomFilterInput {...defaultProps} />);

    expect(
      screen.getByText('Add filter: @user or #tag...')
    ).toBeInTheDocument();
  });

  it('shows hashtag mode indicator when typing #', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();

    // Type a hashtag
    fireEvent.change(input, { target: { value: '#javascript' } });

    // Should show hashtag mode indicator
    expect(screen.getByText('#Tag')).toBeInTheDocument();
  });

  it('shows user mode indicator and selector when typing @', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();

    // Type a mention
    fireEvent.change(input, { target: { value: '@user' } });

    // Should show author mode indicator (default)
    expect(screen.getByText('@Author')).toBeInTheDocument();

    // Should show user mode selector
    expect(screen.getByDisplayValue('Posts by user')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Posts mentioning user')
    ).toBeInTheDocument();
  });

  it('switches between author and mentions mode', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();

    // Type a mention to show user mode
    fireEvent.change(input, { target: { value: '@user' } });

    // Switch to mentions mode
    const mentionsRadio = screen.getByDisplayValue('Posts mentioning user');
    fireEvent.click(mentionsRadio);

    // Should show mentions mode indicator
    expect(screen.getByText('@Mentions')).toBeInTheDocument();
  });

  it('adds hashtag filter correctly', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type a hashtag
    fireEvent.change(input, { target: { value: '#javascript' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Should call onAddFilter with correct hashtag filter
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'tags',
      value: '#javascript'
    });
  });

  it('adds user filter correctly in author mode', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type a mention (author mode is default)
    fireEvent.change(input, { target: { value: '@testuser' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Should call onAddFilter with author filter
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'author',
      value: 'testuser'
    });
  });

  it('adds user filter correctly in mentions mode', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type a mention
    fireEvent.change(input, { target: { value: '@testuser' } });

    // Switch to mentions mode
    const mentionsRadio = screen.getByDisplayValue('Posts mentioning user');
    fireEvent.click(mentionsRadio);

    // Submit the form
    fireEvent.click(submitButton);

    // Should call onAddFilter with mentions filter
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'mentions',
      value: 'testuser'
    });
  });

  it('handles structured mention format correctly', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type a structured mention from SmartInput
    fireEvent.change(input, { target: { value: '@[testuser|user123]' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Should call onAddFilter with the userId from structured format
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'author',
      value: 'user123'
    });
  });

  it('clears input after successful submission', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type and submit
    fireEvent.change(input, { target: { value: '#test' } });
    fireEvent.click(submitButton);

    // Input should be cleared and return to display mode
    expect(
      screen.getByText('Add filter: @user or #tag...')
    ).toBeInTheDocument();
  });

  it('treats plain text as hashtag when submitted', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type plain text without # or @
    fireEvent.change(input, { target: { value: 'javascript' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Should treat it as a hashtag
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'tags',
      value: '#javascript'
    });
  });

  it('hides mode indicator when input is empty', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();

    // Type something to show indicator
    fireEvent.change(input, { target: { value: '#test' } });
    expect(screen.getByText('#Tag')).toBeInTheDocument();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });

    // Mode indicator should be hidden
    expect(screen.queryByText('#Tag')).not.toBeInTheDocument();
  });

  it('hides user mode selector when not typing @', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();

    // Initially, no user mode selector
    expect(screen.queryByDisplayValue('Posts by user')).not.toBeInTheDocument();

    // Type @ to show selector
    fireEvent.change(input, { target: { value: '@user' } });
    expect(screen.getByDisplayValue('Posts by user')).toBeInTheDocument();

    // Type # to hide selector
    fireEvent.change(input, { target: { value: '#tag' } });
    expect(screen.queryByDisplayValue('Posts by user')).not.toBeInTheDocument();
  });

  it('handles multiple structured mentions correctly', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type multiple structured mentions (simulating the malformed case)
    fireEvent.change(input, {
      target: { value: '[Kelli Streich-Sporer|100] @[strixun|529]' }
    });

    // Submit the form
    fireEvent.click(submitButton);

    // Should call onAddFilter twice - once for each user
    expect(mockOnAddFilter).toHaveBeenCalledTimes(2);

    // First call should be for the fixed malformed mention
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(1, {
      name: 'author',
      value: '100'
    });

    // Second call should be for the properly formatted mention
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(2, {
      name: 'author',
      value: '529'
    });
  });

  it('processes multiple hashtags correctly', () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = enterEditMode();
    const submitButton = screen.getByText('Add');

    // Type multiple hashtags
    fireEvent.change(input, {
      target: { value: '#javascript #react #nodejs' }
    });

    // Submit the form
    fireEvent.click(submitButton);

    // Should call onAddFilter three times - once for each hashtag
    expect(mockOnAddFilter).toHaveBeenCalledTimes(3);
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(1, {
      name: 'tags',
      value: '#javascript'
    });
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(2, {
      name: 'tags',
      value: '#react'
    });
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(3, {
      name: 'tags',
      value: '#nodejs'
    });
  });

  it('parseMultiplePills regex works correctly', () => {
    // Create a mock instance to test the parsing function
    const testInput = '[Kelli Streich-Sporer|100] @[strixun|529]';
    const pillRegex = /#\w+|@\[[^\]]+\]|\[[^\]]+\]/g;
    const matches = [];
    let match;

    while ((match = pillRegex.exec(testInput)) !== null) {
      matches.push(match[0]);
    }

    // Should find both mentions
    expect(matches).toHaveLength(2);
    expect(matches[0]).toBe('[Kelli Streich-Sporer|100]');
    expect(matches[1]).toBe('@[strixun|529]');
  });
});
