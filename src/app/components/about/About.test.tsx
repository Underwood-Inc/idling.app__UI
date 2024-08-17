import { render, screen } from '@testing-library/react';
import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/test-selectors/pages/about.selectors';
import { About } from './About';

describe('Page', () => {
  it('renders the about page', () => {
    render(<About />);

    screen.findByRole('heading');

    expect(screen.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', NAV_PATHS.ROOT)
      .not.toHaveAttribute('target', '_blank');

    expect(screen.getByText('GitLab'))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', 'https://gitlab.com/underwood_inc/idling-app')
      .toHaveAttribute('target', '_blank');

    expect(screen.getByText('Discord'))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', 'https://discord.gg/mpThbx67J7')
      .toHaveAttribute('target', '_blank');
  });
});
