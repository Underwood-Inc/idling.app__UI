import { DOCS_LINK_SELECTORS } from '@lib/test-selectors/components/docs-link.selectors';
import React from 'react';
import { LinkTooltip } from '../tooltip/LinkTooltip';

export const DocsLink: React.FC = () => {
  return (
    <LinkTooltip
      url="https://underwood-inc.github.io/idling.app__UI/"
      isInsideParagraph
    >
      <a
        data-testid={DOCS_LINK_SELECTORS.LINK}
        href="https://underwood-inc.github.io/idling.app__UI/"
        target="_blank"
      >
        Docs
      </a>
    </LinkTooltip>
  );
};
