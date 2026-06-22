import { Provider } from 'jotai';
import { fireEvent, render, screen } from '../../../test-utils';
import { useSimpleUrlFilters } from '../../../lib/state/submissions/useSimpleUrlFilters';
import { TagLink } from './TagLink';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn()
  }),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: () => '/test'
}));

// Mock the useSimpleUrlFilters hook
vi.mock('../../../lib/state/submissions/useSimpleUrlFilters', () => ({
  useSimpleUrlFilters: vi.fn(() => ({
    filters: [],
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    updateUrl: vi.fn(),
    tagLogic: 'AND',
    setTagLogic: vi.fn(),
    searchParams: new URLSearchParams()
  }))
}));

// Mock the filter utilities
vi.mock('../../../lib/utils/filter-utils', () => ({
  handleTagFilter: vi.fn(),
  isTagActive: vi.fn((tag, filters) => {
    return filters.some((f: any) => f.name === 'tags' && f.value === tag);
  })
}));

// Mock Jotai hooks and atoms
const mockSetFiltersState = vi.fn();
const mockFiltersState = { filters: [], page: 1, pageSize: 10 };

vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    ...actual,
    useAtom: vi.fn(() => [mockFiltersState, mockSetFiltersState]),
    Provider: actual.Provider
  };
});

vi.mock('../../../lib/state/atoms', () => ({
  getSubmissionsFiltersAtom: vi.fn(() => ({}))
}));

describe('TagLink', () => {
  const defaultProps = {
    value: 'test-tag',
    contextId: 'test-context'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tag link correctly', () => {
    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('handles click correctly', () => {
    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveAttribute('href');
    expect(tagLink.getAttribute('href')).toContain('tags=test-tag');
  });

  it('shows active state when tag is selected', () => {
    // Mock useSimpleUrlFilters to return filters that include our test tag
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: 'test-tag' },
        { name: 'tags', value: 'other-tag' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
      searchParams: new URLSearchParams('tags=test-tag,other-tag')
    });

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles multiple tags correctly', () => {
    // Mock useSimpleUrlFilters to return multiple tags including our test tag
    vi.mocked(useSimpleUrlFilters).mockReturnValue({
      filters: [
        { name: 'tags', value: 'tag1' },
        { name: 'tags', value: 'tag2' },
        { name: 'tags', value: 'test-tag' }
      ],
      addFilter: vi.fn(),
      removeFilter: vi.fn(),
      updateUrl: vi.fn(),
      tagLogic: 'OR',
      setTagLogic: vi.fn(),
      searchParams: new URLSearchParams('tags=tag1,tag2,test-tag')
    });

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('renders with correct contextId prop', () => {
    // Since TagLink now uses URL-first approach, contextId is passed as prop
    // but doesn't directly interact with atom functions anymore
    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toBeInTheDocument();
    // The component should render successfully with the contextId prop
    expect(tagLink).toHaveAttribute('href');
  });

  it('handles onTagClick callback correctly', () => {
    const mockOnTagClick = vi.fn();

    render(
      <Provider>
        <TagLink {...defaultProps} onTagClick={mockOnTagClick} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    fireEvent.click(tagLink);

    expect(mockOnTagClick).toHaveBeenCalledWith('test-tag');
  });
});
