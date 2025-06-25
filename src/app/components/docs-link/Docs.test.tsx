import { render, screen } from '@testing-library/react';
import { DOCS_LINK_SELECTORS } from '../../../lib/test-selectors/components/docs-link.selectors';
import { DocsLink } from './DocsLink';

describe('Docs Link', () => {
  it('renders the Docs link', () => {
    render(<DocsLink />);

    screen.findByRole('heading');

    expect(screen.getByTestId(DOCS_LINK_SELECTORS.LINK))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute(
        'href',
        'https://underwood-inc.github.io/idling.app__UI/'
      )
      .toHaveAttribute('target', '_blank');
  });
});
