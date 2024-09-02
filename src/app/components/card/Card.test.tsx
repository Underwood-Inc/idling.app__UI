import { render } from '@testing-library/react';
import { CARD_SELECTORS } from 'src/lib/test-selectors/components/card.selectors';
import { Card } from './Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    const { getByText, getByTestId } = render(<Card>Test Content</Card>);
    expect(getByText('Test Content')).toBeInTheDocument();
    expect(getByTestId(CARD_SELECTORS.CONTAINER)).toBeInTheDocument();
  });

  it('applies default width class', () => {
    const { getByTestId } = render(<Card>Test Content</Card>);
    expect(getByTestId(CARD_SELECTORS.CONTAINER)).toHaveClass('card md');
  });

  it('applies custom width class', () => {
    const { getByTestId } = render(<Card width="lg">Test Content</Card>);
    expect(getByTestId(CARD_SELECTORS.CONTAINER)).toHaveClass('card lg');
  });

  it('applies custom className', () => {
    const { getByTestId } = render(
      <Card className="custom-class">Test Content</Card>
    );
    expect(getByTestId(CARD_SELECTORS.CONTAINER)).toHaveClass(
      'card md custom-class'
    );
  });

  it('applies height style when height is provided', () => {
    const { getByTestId } = render(<Card height={10}>Test Content</Card>);
    expect(getByTestId(CARD_SELECTORS.CONTAINER)).toHaveStyle('height: 10rem');
  });

  it('does not apply height style when height is not provided', () => {
    const { getByTestId } = render(<Card>Test Content</Card>);
    expect(getByTestId(CARD_SELECTORS.CONTAINER)).not.toHaveStyle(
      'height: 10rem'
    );
  });
});
