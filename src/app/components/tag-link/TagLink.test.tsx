import { Provider } from 'jotai';
import { fireEvent, render, screen } from '../../../test-utils';
import { TagLink } from './TagLink';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: () => '/test'
}));

// Mock the useSimpleUrlFilters hook
jest.mock('../../../lib/state/submissions/useSimpleUrlFilters', () => ({
  useSimpleUrlFilters: jest.fn(() => ({
    filters: [],
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    updateUrl: jest.fn(),
    tagLogic: 'AND',
    setTagLogic: jest.fn(),
    searchParams: new URLSearchParams()
  }))
}));

// Mock the filter utilities
jest.mock('../../../lib/utils/filter-utils', () => ({
  handleTagFilter: jest.fn(),
  isTagActive: jest.fn((tag, filters) => {
    return filters.some((f: any) => f.name === 'tags' && f.value === tag);
  })
}));

// Mock Jotai hooks and atoms
const mockSetFiltersState = jest.fn();
const mockFiltersState = { filters: [], page: 1, pageSize: 10 };

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn(() => [mockFiltersState, mockSetFiltersState]),
  Provider: jest.requireActual('jotai').Provider
}));

jest.mock('../../../lib/state/atoms', () => ({
  getSubmissionsFiltersAtom: jest.fn(() => ({}))
}));

describe('TagLink', () => {
  const defaultProps = {
    value: 'test-tag',
    contextId: 'test-context'
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: 'test-tag' },
        { name: 'tags', value: 'other-tag' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
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
    const {
      useSimpleUrlFilters
    } = require('../../../lib/state/submissions/useSimpleUrlFilters');
    (useSimpleUrlFilters as jest.Mock).mockReturnValue({
      filters: [
        { name: 'tags', value: 'tag1' },
        { name: 'tags', value: 'tag2' },
        { name: 'tags', value: 'test-tag' }
      ],
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      updateUrl: jest.fn(),
      tagLogic: 'OR',
      setTagLogic: jest.fn(),
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
    const mockOnTagClick = jest.fn();

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
