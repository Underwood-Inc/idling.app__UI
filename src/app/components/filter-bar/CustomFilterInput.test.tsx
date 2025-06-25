import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '../../../test-utils';
import { CustomFilterInput } from './CustomFilterInput';

// Mock the search actions with better structure
jest.mock('../../../lib/actions/search.actions', () => ({
  searchHashtags: jest.fn().mockImplementation(() =>
    Promise.resolve({
      items: [
        { id: '1', value: 'javascript', label: 'javascript', type: 'hashtag' }
      ],
      hasMore: false,
      total: 1
    })
  ),
  searchUsers: jest.fn().mockImplementation(() =>
    Promise.resolve({
      items: [
        {
          id: '1',
          value: 'user123',
          label: 'testuser',
          displayName: 'Test User',
          type: 'user'
        }
      ],
      hasMore: false,
      total: 1
    })
  )
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

  // Helper function to get the input element
  const getInput = async () => {
    // Click on the placeholder to enter edit mode and get the actual input
    const placeholder = screen.getByText('Add filter: @user or #tag...');
    await act(async () => {
      fireEvent.click(placeholder);
    });
    return screen.getByRole('textbox');
  };

  it('renders with default placeholder', () => {
    render(<CustomFilterInput {...defaultProps} />);

    expect(
      screen.getByText('Add filter: @user or #tag...')
    ).toBeInTheDocument();
  });

  it('shows hashtag help text when typing #', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();

    // Type a hashtag
    await act(async () => {
      fireEvent.change(input, { target: { value: '#javascript' } });
    });

    // Should show hashtag help text
    expect(
      screen.getByText(
        'Filtering by hashtag - select from suggestions, add space to complete, or click Add'
      )
    ).toBeInTheDocument();
  });

  it('shows user help text when typing @', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();

    // Type a mention
    await act(async () => {
      fireEvent.change(input, { target: { value: '@user' } });
    });

    // Should show user help text
    expect(
      screen.getByText(
        'Filtering by user - select from suggestions or use inline controls on pills'
      )
    ).toBeInTheDocument();
  });

  it('adds hashtag filter correctly', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type a hashtag
    await act(async () => {
      fireEvent.change(input, { target: { value: '#javascript' } });
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(form);
    });

    // Should call onAddFilter with correct hashtag filter
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'tags',
      value: '#javascript'
    });
  });

  it('adds user filter correctly in author mode', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type a properly formatted mention (@[username|userId] format expected by parseMultiplePills)
    await act(async () => {
      fireEvent.change(input, { target: { value: '@[testuser|123]' } });
    });

    // Submit the form and wait for async processing
    await act(async () => {
      fireEvent.submit(form);
    });

    // Wait for any async operations to complete
    await waitFor(
      () => {
        expect(mockOnAddFilter).toHaveBeenCalledWith({
          name: 'author',
          value: '123' // Should use userId for author filter
        });
      },
      { timeout: 3000 }
    );
  });

  it('handles structured mention format correctly', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type a structured mention from SmartInput
    await act(async () => {
      fireEvent.change(input, { target: { value: '@[testuser|user123]' } });
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(form);
    });

    // Should call onAddFilter with the userId from structured format
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'author',
      value: 'user123'
    });
  });

  it('retains input after successful submission', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type and submit
    await act(async () => {
      fireEvent.change(input, { target: { value: '#test' } });
      fireEvent.submit(form);
    });

    // Input should retain the value after submission (current behavior)
    await waitFor(() => {
      expect(input).toHaveValue('#test');
    });

    // Verify the filter was still added
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'tags',
      value: '#test'
    });
  });

  it('treats formatted hashtags correctly when submitted', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type properly formatted hashtag (with # prefix expected by parseMultiplePills)
    await act(async () => {
      fireEvent.change(input, { target: { value: '#javascript' } });
    });

    // Submit the form and wait for async processing
    await act(async () => {
      fireEvent.submit(form);
    });

    // Wait for the callback to be called
    await waitFor(
      () => {
        expect(mockOnAddFilter).toHaveBeenCalledWith({
          name: 'tags',
          value: '#javascript'
        });
      },
      { timeout: 3000 }
    );
  });

  it('shows default help text when input is empty', () => {
    render(<CustomFilterInput {...defaultProps} />);

    expect(
      screen.getByText('Type # for hashtags or @ for users...')
    ).toBeInTheDocument();
  });

  it('processes multiple hashtags correctly', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type multiple hashtags
    await act(async () => {
      fireEvent.change(input, {
        target: { value: '#javascript #react #typescript' }
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(form);
    });

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
      value: '#typescript'
    });
  });

  it('handles multiple structured mentions correctly', async () => {
    render(<CustomFilterInput {...defaultProps} />);

    const input = await getInput();
    const form = input.closest('form')!;

    // Type multiple structured mentions including malformed ones
    await act(async () => {
      fireEvent.change(input, {
        target: { value: '@[user1|id1] [user2|id2]' }
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(form);
    });

    // Should call onAddFilter twice - once for each user
    expect(mockOnAddFilter).toHaveBeenCalledTimes(2);

    // First call should be for the first valid mention
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(1, {
      name: 'author',
      value: 'id1'
    });

    // Second call should be for the fixed malformed mention
    expect(mockOnAddFilter).toHaveBeenNthCalledWith(2, {
      name: 'author',
      value: 'id2'
    });
  });
});
