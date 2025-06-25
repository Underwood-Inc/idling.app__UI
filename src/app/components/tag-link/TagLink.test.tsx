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
    // Mock useSearchParams to return tags that include our test tag
    const mockSearchParams = new URLSearchParams('tags=test-tag,other-tag');
    const { useSearchParams } = require('next/navigation');
    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles multiple tags correctly', () => {
    // Mock useSearchParams to return multiple tags including our test tag
    const mockSearchParams = new URLSearchParams('tags=tag1,tag2,test-tag');
    const { useSearchParams } = require('next/navigation');
    useSearchParams.mockReturnValue(mockSearchParams);

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    const tagLink = screen.getByRole('link');
    expect(tagLink).toHaveClass('active');
  });

  it('handles contextId correctly', () => {
    const { getSubmissionsFiltersAtom } = require('../../../lib/state/atoms');

    render(
      <Provider>
        <TagLink {...defaultProps} />
      </Provider>
    );

    expect(getSubmissionsFiltersAtom).toHaveBeenCalledWith('test-context');
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
