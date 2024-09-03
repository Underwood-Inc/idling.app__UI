import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PageAside } from './PageAside';

describe('PageAside', () => {
  it('renders children correctly', () => {
    render(<PageAside>Test Content</PageAside>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PageAside className="custom-class">Test Content</PageAside>);
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('custom-class');
  });

  it('renders without bottom margin by default', () => {
    const { container } = render(<PageAside>Test Content</PageAside>);
    expect(container.querySelector('div[style]')).not.toBeInTheDocument();
  });

  it('renders with bottom margin when specified', () => {
    const { container } = render(
      <PageAside bottomMargin={5}>Test Content</PageAside>
    );
    const marginDiv = container.querySelector('div[style]');
    expect(marginDiv).toBeInTheDocument();
    expect(marginDiv).toHaveStyle('height: 5rem');
    expect(marginDiv).toHaveStyle('display: block');
  });
});
