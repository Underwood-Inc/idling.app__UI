import type { MockedFunction } from 'vitest';
import { render } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PageContainer } from './PageContainer';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('PageContainer', () => {
  const mockUsePathname = usePathname as MockedFunction<typeof usePathname>;
  const mockUseSearchParams = useSearchParams as MockedFunction<
    typeof useSearchParams
  >;

  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUseSearchParams.mockReset();
  });

  it('renders children correctly', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as any);

    const { getByText } = render(
      <PageContainer>
        <div>Test Child</div>
      </PageContainer>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('applies the page container layout class', () => {
    mockUsePathname.mockReturnValue('/admin');
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as any);

    const { container } = render(
      <PageContainer>
        <div>Admin Page</div>
      </PageContainer>
    );

    expect(container.firstChild).toHaveAttribute('class', 'page__container');
  });
});