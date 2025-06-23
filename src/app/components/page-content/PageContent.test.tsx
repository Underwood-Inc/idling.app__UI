import { render } from '@testing-library/react';
import PageContent from './PageContent';

describe('PageContent', () => {
  it('renders children correctly', () => {
    const TestChild = () => <div>Test Child</div>;
    const { getByText } = render(
      <PageContent>
        <TestChild />
      </PageContent>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('has the correct CSS class', () => {
    const { container } = render(
      <PageContent>
        <div>Test</div>
      </PageContent>
    );

    expect(container.firstChild).toHaveClass('page-content__section');
  });
});
