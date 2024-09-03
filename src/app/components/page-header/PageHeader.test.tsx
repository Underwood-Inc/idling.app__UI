import { render } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders children correctly', async () => {
    const { getByText } = render(
      await PageHeader({ children: <div>Test Content</div> })
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('has the correct CSS class', async () => {
    const { container } = render(
      await PageHeader({ children: <div>Test Content</div> })
    );
    expect(container.firstChild).toHaveClass('page-header__section');
  });
});
