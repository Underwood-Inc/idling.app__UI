import { render, screen } from '@testing-library/react';
import { GitLabLink } from './GitLabLink';
import { GITLAB_LINK_TEST_IDS } from './gitlab-link-test-ids';

describe('GitLab Link', () => {
  it('renders the GitLab link', () => {
    render(<GitLabLink />);

    screen.findByRole('heading');

    expect(screen.getByTestId(GITLAB_LINK_TEST_IDS.LINK))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', 'https://gitlab.com/underwood_inc/idling-app')
      .toHaveAttribute('target', '_blank');
  });
});
