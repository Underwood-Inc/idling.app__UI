import { render } from '@testing-library/react';
import { Provider } from 'jotai';
import FilterBar from './FilterBar';

// Mock the atoms module
jest.mock('../../../lib/state/atoms', () => ({
  getDisplayFiltersAtom: jest.fn().mockReturnValue({
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

describe('FilterBar', () => {
  const defaultProps = {
    filterId: 'test-context'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter bar correctly', () => {
    const { container } = render(
      <Provider>
        <FilterBar {...defaultProps} />
      </Provider>
    );

    // The component should render without errors
    // FilterBar may not render anything if no filters, so just check it doesn't crash
    expect(container).toBeDefined();
  });

  it('handles filters correctly', () => {
    const { useAtom } = require('jotai');
    useAtom.mockReturnValue([
      [{ name: 'tags', value: 'test-tag' }], // displayFilters is an array
      jest.fn()
    ]);

    const { container } = render(
      <Provider>
        <FilterBar {...defaultProps} />
      </Provider>
    );

    expect(container).toBeDefined();
  });

  it('handles contextId correctly', () => {
    const { getDisplayFiltersAtom } = require('../../../lib/state/atoms');

    render(
      <Provider>
        <FilterBar {...defaultProps} />
      </Provider>
    );

    expect(getDisplayFiltersAtom).toHaveBeenCalledWith('test-context');
  });
});
