import { render } from '@testing-library/react';
import FancyBorder from './FancyBorder';

describe('FancyBorder', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <FancyBorder>
        <span>Test Child</span>
      </FancyBorder>
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('applies additional class names', () => {
    const { container } = render(
      <FancyBorder className="additional-class">
        <span>Test Child</span>
      </FancyBorder>
    );
    expect(container.firstChild).toHaveClass('fancy-border additional-class');
  });

  it('applies only the fancy-border class when no additional class is provided', () => {
    const { container } = render(
      <FancyBorder>
        <span>Test Child</span>
      </FancyBorder>
    );
    expect(container.firstChild).toHaveClass('fancy-border');
  });
});
