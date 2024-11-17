import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { PAGE_ASIDE_SELECTORS } from '../../../lib/test-selectors/components/page-aside.selectors';
import { PageAside } from './PageAside';

describe('PageAside', () => {
  it('renders the layout correctly', () => {
    render(<PageAside>Test Content</PageAside>);
    expect(
      screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)
    ).toBeInTheDocument();
    expect(screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)).toHaveProperty(
      'tagName',
      'DIV'
    );

    expect(
      within(screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)).getByTestId(
        PAGE_ASIDE_SELECTORS.ASIDE
      )
    ).toBeVisible();
    expect(
      within(screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)).getByTestId(
        PAGE_ASIDE_SELECTORS.ASIDE
      )
    ).toHaveProperty('tagName', 'ASIDE');
    expect(
      within(screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)).getByTestId(
        PAGE_ASIDE_SELECTORS.ASIDE
      )
    ).toHaveTextContent('Test Content');
  });

  it('applies custom className', () => {
    render(<PageAside className="custom-class">Test Content</PageAside>);
    expect(screen.getByTestId(PAGE_ASIDE_SELECTORS.ASIDE)).toHaveClass(
      'custom-class'
    );
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
