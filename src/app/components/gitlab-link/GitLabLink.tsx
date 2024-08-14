import React from 'react';
import { GITLAB_LINK_TEST_IDS } from './gitlab-link-test-ids';

export const GitLabLink: React.FC = () => {
  return (
    <a
      data-testid={GITLAB_LINK_TEST_IDS.LINK}
      href="https://gitlab.com/underwood_inc/idling-app"
      target="_blank"
    >
      GitLab
    </a>
  );
};
