import { render } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <PageHeader>
        <div>Test Content</div>
      </PageHeader>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(
      <PageHeader>
        <div>Test Content</div>
      </PageHeader>
    );
    expect(container.firstChild).toHaveClass('page-header__section');
  });
});
