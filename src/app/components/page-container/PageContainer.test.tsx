import { render } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV_PATHS } from 'src/lib/routes';
import { PageContainer } from './PageContainer';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn()
}));

describe('PageContainer', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<
    typeof usePathname
  >;
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<
    typeof useSearchParams
  >;

  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUseSearchParams.mockReset();
  });

  it('renders children correctly', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    } as any);

    const { getByText } = render(
      <PageContainer>
        <div>Test Child</div>
      </PageContainer>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('sets correct context for posts page', () => {
    mockUsePathname.mockReturnValue(NAV_PATHS.POSTS);
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    } as any);

    const { container } = render(
      <PageContainer>
        <div>Posts Page</div>
      </PageContainer>
    );

    expect(container.firstChild).toHaveAttribute('class', 'page__container');
  });

  it('sets correct context for my posts page', () => {
    mockUsePathname.mockReturnValue(NAV_PATHS.MY_POSTS);
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    } as any);

    const { container } = render(
      <PageContainer>
        <div>My Posts Page</div>
      </PageContainer>
    );

    expect(container.firstChild).toHaveAttribute('class', 'page__container');
  });

  it('handles tag search params correctly', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue({
      get: jest
        .fn()
        .mockImplementation((param) => (param === 'tags' ? 'tag1,tag2' : null))
    } as any);

    const { container } = render(
      <PageContainer>
        <div>With Tags</div>
      </PageContainer>
    );

    expect(container.firstChild).toHaveAttribute('class', 'page__container');
  });

  it('handles page search param correctly', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue({
      get: jest
        .fn()
        .mockImplementation((param) => (param === 'page' ? '2' : null))
    } as any);

    const { container } = render(
      <PageContainer>
        <div>Page 2</div>
      </PageContainer>
    );

    expect(container.firstChild).toHaveAttribute('class', 'page__container');
  });
});
