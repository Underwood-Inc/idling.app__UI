import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/test-selectors/pages/about.selectors';
import { render, screen } from '../../../test-utils';
import { About } from './About';

describe('Page', () => {
  it('renders the about page', () => {
    render(<About />);

    expect(screen.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', NAV_PATHS.ROOT)
      .not.toHaveAttribute('target', '_blank');

    const gitlabLink = screen.getByText(/gitlab/i, { selector: 'a' });
    expect(gitlabLink)
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', 'https://gitlab.com/idling.app')
      .toHaveAttribute('target', '_blank');
  });
});
