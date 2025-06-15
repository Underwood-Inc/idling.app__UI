import React from 'react';
import { GITLAB_LINK_TEST_IDS } from './gitlab-link-test-ids';

export const GitLabLink: React.FC = () => {
  return (
    <a
      data-testid={GITLAB_LINK_TEST_IDS.LINK}
      href="https://gitlab.com/underwood_inc/idling-app"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#8B5A2B] hover:text-[#A67B5B] underline"
    >
      GitLab
    </a>
  );
};
