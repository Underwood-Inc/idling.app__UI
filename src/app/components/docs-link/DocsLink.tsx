import { DOCS_LINK_SELECTORS } from '@lib/test-selectors/components/docs-link.selectors';
import React from 'react';
import { LinkTooltip } from '../tooltip/LinkTooltip';

export const DocsLink: React.FC = () => {
  return (
    <LinkTooltip
      url="https://docs.idling.app"
      isInsideParagraph
    >
      <a
        data-testid={DOCS_LINK_SELECTORS.LINK}
        href="https://docs.idling.app"
        target="_blank"
      >
        Docs
      </a>
    </LinkTooltip>
  );
};
