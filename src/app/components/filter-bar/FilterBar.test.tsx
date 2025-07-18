import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import FilterBar from './FilterBar';

// Mock the atoms module
jest.mock('../../../lib/state/atoms', () => ({
  getDisplayFiltersAtom: jest.fn().mockReturnValue({
    read: jest.fn(),
    write: jest.fn()
  }),
  getSubmissionsFiltersAtom: jest.fn().mockReturnValue({
    read: jest.fn(),
    write: jest.fn()
  })
}));

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([[], jest.fn()]) // displayFilters is an array
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test'
}));

// Mock the FilterLabel component
jest.mock('./FilterLabel', () => {
  return {
    FilterLabel: ({ name, label, onRemoveFilter, onRemoveTag }: any) => (
      <div data-testid={`filter-label-${name}-${label}`}>
        <span>
          {name}: {label}
        </span>
        <button
          onClick={() => onRemoveFilter?.(name, label)}
          data-testid={`remove-filter-${name}-${label}`}
        >
          Remove
        </button>
        <button
          onClick={() => onRemoveTag?.(label)}
          data-testid={`remove-tag-${label}`}
        >
          Remove Tag
        </button>
      </div>
    )
  };
});

// Create a mock for onUpdateFilter that can be accessed by TagLogicToggle
let globalMockOnUpdateFilter: jest.Mock;
let currentTestFilters: Filter<PostFilters>[] = [];

// Mock the TagLogicToggle component
jest.mock('../shared/TagLogicToggle', () => {
  return {
    TagLogicToggle: ({ disabled, allTitle, anyTitle }: any) => {
      // Get the current logic from the test filters
      const tagLogicFilter = currentTestFilters.find(
        (f) => f.name === 'tagLogic'
      );
      const currentLogic = tagLogicFilter?.value || 'OR';

      return (
        <div className="logic-toggle">
          <div className="logic-toggle__button-group">
            <button
              className={`logic-toggle__button ${currentLogic === 'AND' ? 'logic-toggle__button--active' : ''}`}
              title={allTitle}
              disabled={disabled}
              onClick={() => {
                if (globalMockOnUpdateFilter) {
                  globalMockOnUpdateFilter('tagLogic', 'AND');
                }
              }}
            >
              ALL
            </button>
            <button
              className={`logic-toggle__button ${currentLogic === 'OR' ? 'logic-toggle__button--active' : ''}`}
              title={anyTitle}
              disabled={disabled}
              onClick={() => {
                if (globalMockOnUpdateFilter) {
                  globalMockOnUpdateFilter('tagLogic', 'OR');
                }
              }}
            >
              ANY
            </button>
          </div>
        </div>
      );
    }
  };
});

// Mock the LogicToggle component
jest.mock('../shared/LogicToggle', () => {
  return {
    LogicToggle: ({
      currentLogic,
      onToggle,
      disabled,
      allTitle,
      anyTitle
    }: any) => (
      <div className="logic-toggle">
        <div className="logic-toggle__button-group">
          <button
            className={`logic-toggle__button ${currentLogic === 'AND' ? 'logic-toggle__button--active' : ''}`}
            onClick={() => onToggle && onToggle('AND')}
            title={allTitle || 'ALL'}
            disabled={disabled}
          >
            ALL
          </button>
          <button
            className={`logic-toggle__button ${currentLogic === 'OR' ? 'logic-toggle__button--active' : ''}`}
            onClick={() => onToggle && onToggle('OR')}
            title={anyTitle || 'ANY'}
            disabled={disabled}
          >
            ANY
          </button>
        </div>
      </div>
    )
  };
});

// Mock the utils
jest.mock('./utils/get-tags', () => ({
  getTagsFromSearchParams: (value: string) => {
    return value
      .split(',')
      .map((tag) => tag.trim().replace('#', ''))
      .filter(Boolean);
  }
}));

describe('FilterBar Component', () => {
  let store: ReturnType<typeof createStore>;
  let mockOnRemoveFilter: jest.Mock;
  let mockOnRemoveTag: jest.Mock;
  let mockOnClearFilters: jest.Mock;
  let mockOnUpdateFilter: jest.Mock;

  beforeEach(() => {
    store = createStore();
    mockOnRemoveFilter = jest.fn();
    mockOnRemoveTag = jest.fn();
    mockOnClearFilters = jest.fn();
    mockOnUpdateFilter = jest.fn();
    globalMockOnUpdateFilter = mockOnUpdateFilter;
  });

  const renderFilterBar = (filters: Filter<PostFilters>[] = []) => {
    currentTestFilters = filters; // Store filters for mocks to access
    return render(
      <Provider store={store}>
        <FilterBar
          filterId="test"
          filters={filters}
          onRemoveFilter={mockOnRemoveFilter}
          onRemoveTag={mockOnRemoveTag}
          onClearFilters={mockOnClearFilters}
          onUpdateFilter={mockOnUpdateFilter}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('should not render when filters array is empty', () => {
      const { container } = renderFilterBar([]);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when filters is null or undefined', () => {
      const { container } = render(
        <Provider store={store}>
          <FilterBar
            filterId="test"
            filters={null as any}
            onRemoveFilter={mockOnRemoveFilter}
            onRemoveTag={mockOnRemoveTag}
            onClearFilters={mockOnClearFilters}
            onUpdateFilter={mockOnUpdateFilter}
          />
        </Provider>
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render basic filters', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'author', value: '123' }
      ];

      renderFilterBar(filters);

      expect(screen.getByText('tags:')).toBeInTheDocument();
      expect(screen.getByText('author:')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Clear all filters' })
      ).toBeInTheDocument();
    });

    it('should render consolidated filters', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' },
        { name: 'tags', value: '#typescript' },
        { name: 'author', value: '123' },
        { name: 'author', value: '456' }
      ];

      renderFilterBar(filters);

      // Should consolidate multiple filters of the same type
      expect(
        screen.getByTestId('filter-label-tags-#react')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#typescript')
      ).toBeInTheDocument();
      expect(screen.getByTestId('filter-label-author-123')).toBeInTheDocument();
      expect(screen.getByTestId('filter-label-author-456')).toBeInTheDocument();
    });
  });

  describe('Logic Controls', () => {
    it('should show global logic controls when multiple filter types exist', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' },
        { name: 'author', value: '123' },
        { name: 'globalLogic', value: 'AND' }
      ];

      renderFilterBar(filters);

      expect(screen.getByText('Groups:')).toBeInTheDocument();
      expect(
        screen.getByTitle('All filter groups must match')
      ).toBeInTheDocument();
      expect(
        screen.getByTitle('Any filter group can match')
      ).toBeInTheDocument();
    });

    it('should not show global logic controls with single filter type', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' }
      ];

      renderFilterBar(filters);

      expect(screen.queryByText('Groups:')).not.toBeInTheDocument();
    });

    it('should highlight active global logic button', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' },
        { name: 'author', value: '123' },
        { name: 'globalLogic', value: 'OR' }
      ];

      renderFilterBar(filters);

      const allButton = screen.getByTitle('All filter groups must match');
      const anyButton = screen.getByTitle('Any filter group can match');

      expect(allButton).not.toHaveClass('logic-toggle__button--active');
      expect(anyButton).toHaveClass('logic-toggle__button--active');
    });

    it('should show filter-specific logic controls for multi-value filters', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'tagLogic', value: 'AND' }
      ];

      renderFilterBar(filters);

      expect(
        screen.getByTitle('Must have ALL selected tags')
      ).toBeInTheDocument();
      expect(
        screen.getByTitle('Must have ANY selected tags')
      ).toBeInTheDocument();
    });

    it('should not show filter-specific logic controls for single-value filters', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' }
      ];

      renderFilterBar(filters);

      expect(
        screen.queryByRole('button', { name: 'Must have ALL selected tags' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Must have ANY selected tags' })
      ).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClearFilters when clear button is clicked', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' }
      ];

      renderFilterBar(filters);

      const clearButton = screen.getByRole('button', {
        name: 'Clear all filters'
      });
      fireEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalledTimes(1);
    });

    it('should call onUpdateFilter when global logic buttons are clicked', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' },
        { name: 'author', value: '123' },
        { name: 'globalLogic', value: 'AND' }
      ];

      renderFilterBar(filters);

      const orButton = screen.getByTitle('Any filter group can match');
      fireEvent.click(orButton);

      expect(mockOnUpdateFilter).toHaveBeenCalledWith('globalLogic', 'OR');
    });

    it('should call onUpdateFilter when filter-specific logic buttons are clicked', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'tagLogic', value: 'OR' }
      ];

      renderFilterBar(filters);

      const allButton = screen.getByTitle('Must have ALL selected tags');
      fireEvent.click(allButton);

      expect(mockOnUpdateFilter).toHaveBeenCalledWith('tagLogic', 'AND');
    });

    it('should handle author logic buttons correctly', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'author', value: '123,456' },
        { name: 'authorLogic', value: 'OR' }
      ];

      renderFilterBar(filters);

      const allButton = screen.getByTitle('Must have ALL selected author');
      fireEvent.click(allButton);

      expect(mockOnUpdateFilter).toHaveBeenCalledWith('authorLogic', 'AND');
    });

    it('should handle mentions logic buttons correctly', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'mentions', value: '@user1,@user2' },
        { name: 'mentionsLogic', value: 'OR' }
      ];

      renderFilterBar(filters);

      const allButton = screen.getByTitle('Must have ALL selected mentions');
      fireEvent.click(allButton);

      expect(mockOnUpdateFilter).toHaveBeenCalledWith('mentionsLogic', 'AND');
    });

    it('should not call onUpdateFilter when onUpdateFilter prop is not provided', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' },
        { name: 'author', value: '123' }
      ];

      render(
        <Provider store={store}>
          <FilterBar
            filterId="test"
            filters={filters}
            onRemoveFilter={mockOnRemoveFilter}
            onRemoveTag={mockOnRemoveTag}
            onClearFilters={mockOnClearFilters}
            // onUpdateFilter not provided
          />
        </Provider>
      );

      // Global logic controls should not be shown
      expect(screen.queryByText('Groups:')).not.toBeInTheDocument();
    });
  });

  describe('Filter Value Processing', () => {
    it('should handle comma-separated tag values', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript,#javascript' }
      ];

      renderFilterBar(filters);

      expect(
        screen.getByTestId('filter-label-tags-#react')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#typescript')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#javascript')
      ).toBeInTheDocument();
    });

    it('should handle comma-separated author values', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'author', value: '123,456,789' }
      ];

      renderFilterBar(filters);

      expect(screen.getByTestId('filter-label-author-123')).toBeInTheDocument();
      expect(screen.getByTestId('filter-label-author-456')).toBeInTheDocument();
      expect(screen.getByTestId('filter-label-author-789')).toBeInTheDocument();
    });

    it('should handle comma-separated mentions values', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'mentions', value: '@user1,@user2,@user3' }
      ];

      renderFilterBar(filters);

      expect(
        screen.getByTestId('filter-label-mentions-@user1')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-mentions-@user2')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-mentions-@user3')
      ).toBeInTheDocument();
    });

    it('should deduplicate values', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#react,#typescript,#react' }
      ];

      renderFilterBar(filters);

      // Should only show unique values
      const reactElements = screen.getAllByTestId('filter-label-tags-#react');
      expect(reactElements).toHaveLength(1);
      expect(
        screen.getByTestId('filter-label-tags-#typescript')
      ).toBeInTheDocument();
    });

    it('should filter out empty values', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,,#typescript, ,#javascript' }
      ];

      renderFilterBar(filters);

      expect(
        screen.getByTestId('filter-label-tags-#react')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#typescript')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#javascript')
      ).toBeInTheDocument();

      // Should not render empty values
      expect(
        screen.queryByTestId('filter-label-tags-')
      ).not.toBeInTheDocument();
    });

    it('should not render filters with empty values', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '' },
        { name: 'author', value: '123' }
      ];

      renderFilterBar(filters);

      expect(screen.queryByText('tags:')).not.toBeInTheDocument();
      expect(screen.getByText('author:')).toBeInTheDocument();
    });
  });

  describe('Logic Value Extraction', () => {
    it('should extract correct logic values with defaults', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' }, // Multiple tags to show logic buttons
        { name: 'tagLogic', value: 'AND' },
        { name: 'author', value: '123' }
        // No authorLogic, mentionsLogic, or globalLogic
      ];

      renderFilterBar(filters);

      // This tests the internal logic extraction - we can verify through button states
      // When tagLogic is AND, the ALL button should be active
      const tagAllButtons = screen.getAllByTitle(
        'Controlled by Groups setting - set Groups to ANY to change'
      );
      expect(tagAllButtons[0]).toHaveClass('logic-toggle__button--active');
    });

    it('should handle missing logic filters gracefully', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' }
        // No tagLogic specified
      ];

      renderFilterBar(filters);

      // When no tagLogic is specified, it defaults to OR and buttons are enabled
      const anyButton = screen.getByTitle('Must have ANY selected tags');
      expect(anyButton).toHaveClass('logic-toggle__button--active');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle all filter types with all logic types', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'tagLogic', value: 'AND' },
        { name: 'author', value: '123,456' },
        { name: 'authorLogic', value: 'OR' },
        { name: 'mentions', value: '@user1,@user2' },
        { name: 'mentionsLogic', value: 'AND' },
        { name: 'globalLogic', value: 'OR' }
      ];

      renderFilterBar(filters);

      // Should show all filter types
      expect(screen.getByText('tags:')).toBeInTheDocument();
      expect(screen.getByText('author:')).toBeInTheDocument();
      expect(screen.getByText('mentions:')).toBeInTheDocument();

      // Should show global logic controls
      expect(screen.getByText('Groups:')).toBeInTheDocument();

      // Should show correct active states for logic buttons
      // With globalLogic OR, individual filter logic buttons should be enabled
      expect(screen.getByTitle('Any filter group can match')).toHaveClass(
        'logic-toggle__button--active'
      );
    });

    it('should handle rapid filter updates', async () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'author', value: '123' },
        { name: 'globalLogic', value: 'AND' }
      ];

      renderFilterBar(filters);

      // Rapidly click different logic buttons
      const globalOrButton = screen.getByTitle('Any filter group can match');
      const tagAndButtons = screen.getAllByTitle(
        'Controlled by Groups setting - set Groups to ANY to change'
      );
      const tagAndButton = tagAndButtons[0]; // Get the first one (ALL button)

      fireEvent.click(globalOrButton);
      fireEvent.click(tagAndButton);
      fireEvent.click(globalOrButton);

      await waitFor(() => {
        expect(mockOnUpdateFilter).toHaveBeenCalledTimes(2);
      });

      expect(mockOnUpdateFilter).toHaveBeenNthCalledWith(
        1,
        'globalLogic',
        'OR'
      );
      expect(mockOnUpdateFilter).toHaveBeenNthCalledWith(
        2,
        'globalLogic',
        'OR'
      );
    });

    it('should handle filters with special characters', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react-hooks,#@typescript,#javascript.es6' },
        { name: 'mentions', value: '@user-name,user@domain.com' }
      ];

      renderFilterBar(filters);

      expect(
        screen.getByTestId('filter-label-tags-#react-hooks')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#@typescript')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-tags-#javascript.es6')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-mentions-@user-name')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('filter-label-mentions-user@domain.com')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react' }
      ];

      renderFilterBar(filters);

      const clearButton = screen.getByRole('button', {
        name: 'Clear all filters'
      });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear all filters');
    });

    it('should have proper button titles for logic controls', () => {
      const filters: Filter<PostFilters>[] = [
        { name: 'tags', value: '#react,#typescript' },
        { name: 'author', value: '123' }
      ];

      renderFilterBar(filters);

      expect(screen.getByTitle('All filter groups must match')).toHaveAttribute(
        'title',
        'All filter groups must match'
      );
      expect(screen.getByTitle('Any filter group can match')).toHaveAttribute(
        'title',
        'Any filter group can match'
      );
      const disabledButtons = screen.getAllByTitle(
        'Controlled by Groups setting - set Groups to ANY to change'
      );
      expect(disabledButtons[0]).toHaveAttribute(
        'title',
        'Controlled by Groups setting - set Groups to ANY to change'
      );
    });
  });
});
