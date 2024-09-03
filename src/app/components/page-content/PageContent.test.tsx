import { render } from '@testing-library/react';
import PageContent from './PageContent';

describe('PageContent', () => {
  it('renders children correctly', async () => {
    const TestChild = () => <div>Test Child</div>;
    const { getByText } = render(
      await PageContent({ children: <TestChild /> })
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('has the correct CSS class', async () => {
    const { container } = render(
      await PageContent({ children: <div>Test</div> })
    );

    expect(container.firstChild).toHaveClass('page-content__section');
  });
});
