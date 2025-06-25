import { render, screen } from '@testing-library/react';
import { DOCS_LINK_SELECTORS } from '../../../lib/test-selectors/components/docs-link.selectors';
import { DocsLink } from './DocsLink';

describe('Docs Link', () => {
  it('renders the Docs link', () => {
    render(<DocsLink />);

    const linkElement = screen.getByTestId(DOCS_LINK_SELECTORS.LINK);

    expect(linkElement).toBeVisible();
    expect(linkElement).toBeEnabled();
    expect(linkElement).toHaveAttribute(
      'href',
      'https://underwood-inc.github.io/idling.app__UI/'
    );
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('has the correct text content', () => {
    render(<DocsLink />);

    const linkElement = screen.getByTestId(DOCS_LINK_SELECTORS.LINK);

    expect(linkElement).toHaveTextContent('Docs');
  });
});
