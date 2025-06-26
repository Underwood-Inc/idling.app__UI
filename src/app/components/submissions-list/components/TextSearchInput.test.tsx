import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TextSearchInput } from './TextSearchInput';

// Mock the SmartPillInput
jest.mock('../../ui/SmartPillInput', () => ({
  SmartPillInput: ({
    value,
    onChange,
    onMentionClick,
    placeholder,
    className
  }: any) => (
    <div>
      <input
        data-testid="smart-pill-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {/* Mock mention click handler */}
      <button
        data-testid="mock-mention-click-author"
        onClick={() => onMentionClick?.('@[testuser|123]', 'author')}
      >
        Mock Author Click
      </button>
      <button
        data-testid="mock-mention-click-mentions"
        onClick={() => onMentionClick?.('@[testuser|123]', 'mentions')}
      >
        Mock Mentions Click
      </button>
    </div>
  )
}));

// Mock the logger
jest.mock('@/lib/logging', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn()
  })
}));

describe('TextSearchInput', () => {
  const mockOnSearch = jest.fn();
  const mockOnAddFilter = jest.fn();
  const mockOnAddFilters = jest.fn();
  const mockOnRemoveFilter = jest.fn();
  const mockOnFilterSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic text search input', () => {
    render(
      <TextSearchInput onSearch={mockOnSearch} placeholder="Search posts..." />
    );

    expect(screen.getByPlaceholderText('Search posts...')).toBeInTheDocument();
  });

  it('handles regular text search', async () => {
    render(<TextSearchInput onSearch={mockOnSearch} debounceMs={100} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test search' } });

    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith('test search');
      },
      { timeout: 200 }
    );
  });

  it('switches to smart input when @ or # is detected', () => {
    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        contextId="test-context"
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '@user' } });

    // Should switch to smart input mode
    expect(screen.getByTestId('smart-pill-input')).toBeInTheDocument();
  });

  it('processes hashtag filters correctly', async () => {
    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        onFilterSuccess={mockOnFilterSuccess}
        contextId="test-context"
        debounceMs={100}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#javascript test' } });

    await waitFor(
      () => {
        expect(mockOnAddFilter).toHaveBeenCalledWith({
          name: 'tags',
          value: '#javascript'
        });
        expect(mockOnSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 200 }
    );
  });

  it('processes user mention filters correctly', async () => {
    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        onFilterSuccess={mockOnFilterSuccess}
        contextId="test-context"
        debounceMs={100}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '@username search term' } });

    await waitFor(
      () => {
        expect(mockOnAddFilter).toHaveBeenCalledWith({
          name: 'author',
          value: 'username'
        });
        expect(mockOnSearch).toHaveBeenCalledWith('search term');
      },
      { timeout: 200 }
    );
  });

  it('processes multiple filters correctly', async () => {
    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilters={mockOnAddFilters}
        onFilterSuccess={mockOnFilterSuccess}
        contextId="test-context"
        debounceMs={100}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#tag1 @user #tag2 search' } });

    await waitFor(
      () => {
        expect(mockOnAddFilters).toHaveBeenCalledWith([
          { name: 'tags', value: '#tag1' },
          { name: 'author', value: 'user' },
          { name: 'tags', value: '#tag2' }
        ]);
        expect(mockOnSearch).toHaveBeenCalledWith('search');
      },
      { timeout: 200 }
    );
  });

  it('handles structured mention format', async () => {
    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        contextId="test-context"
        debounceMs={100}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, {
      target: { value: '@[username|123|mentions] test' }
    });

    await waitFor(
      () => {
        expect(mockOnAddFilter).toHaveBeenCalledWith({
          name: 'mentions',
          value: 'username'
        });
        expect(mockOnSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 200 }
    );
  });

  it('removes existing filter when switching filter types', async () => {
    const currentFilters = [{ name: 'author', value: '123' }];

    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        onRemoveFilter={mockOnRemoveFilter}
        contextId="test-context"
        currentFilters={currentFilters}
        debounceMs={100}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, {
      target: { value: '@[testuser|123|mentions] test' }
    });

    await waitFor(
      () => {
        expect(mockOnRemoveFilter).toHaveBeenCalledWith('author', '123');
        expect(mockOnAddFilter).toHaveBeenCalledWith({
          name: 'mentions',
          value: 'testuser'
        });
      },
      { timeout: 200 }
    );
  });

  it('handles mention click to change filter type from author to mentions', () => {
    const currentFilters = [{ name: 'author', value: '123' }];

    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        onRemoveFilter={mockOnRemoveFilter}
        onFilterSuccess={mockOnFilterSuccess}
        contextId="test-context"
        currentFilters={currentFilters}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '@user' } });

    // Click the mentions button to change filter type
    const mentionsButton = screen.getByTestId('mock-mention-click-mentions');
    fireEvent.click(mentionsButton);

    expect(mockOnRemoveFilter).toHaveBeenCalledWith('author', '123');
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'mentions',
      value: 'testuser'
    });
    expect(mockOnFilterSuccess).toHaveBeenCalled();
  });

  it('handles mention click to change filter type from mentions to author', () => {
    const currentFilters = [{ name: 'mentions', value: 'testuser' }];

    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        onRemoveFilter={mockOnRemoveFilter}
        onFilterSuccess={mockOnFilterSuccess}
        contextId="test-context"
        currentFilters={currentFilters}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '@user' } });

    // Click the author button to change filter type
    const authorButton = screen.getByTestId('mock-mention-click-author');
    fireEvent.click(authorButton);

    expect(mockOnRemoveFilter).toHaveBeenCalledWith('mentions', 'testuser');
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'author',
      value: '123'
    });
    expect(mockOnFilterSuccess).toHaveBeenCalled();
  });

  it('clears search when input is empty', async () => {
    render(<TextSearchInput onSearch={mockOnSearch} debounceMs={100} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('handles Enter key for immediate search with filter updates', async () => {
    const currentFilters = [{ name: 'author', value: '123' }];

    render(
      <TextSearchInput
        onSearch={mockOnSearch}
        onAddFilter={mockOnAddFilter}
        onRemoveFilter={mockOnRemoveFilter}
        contextId="test-context"
        currentFilters={currentFilters}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, {
      target: { value: '@[testuser|123|mentions] search' }
    });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnRemoveFilter).toHaveBeenCalledWith('author', '123');
    expect(mockOnAddFilter).toHaveBeenCalledWith({
      name: 'mentions',
      value: 'testuser'
    });
    expect(mockOnSearch).toHaveBeenCalledWith('search');
  });

  it('handles Escape key to clear input', () => {
    render(<TextSearchInput onSearch={mockOnSearch} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('shows search terms status', async () => {
    render(<TextSearchInput onSearch={mockOnSearch} debounceMs={100} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test search terms' } });

    await waitFor(
      () => {
        expect(screen.getByText(/Searching for 3 terms/)).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });
});
