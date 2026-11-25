'use client';

import { DOCS_LINK_SELECTORS } from '@lib/test-selectors/components/docs-link.selectors';
import React from 'react';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { LinkTooltip } from '../tooltip/LinkTooltip';

export const DocsLink: React.FC = () => {
  const { ll } = useIdlingLocale();

  return (
    <LinkTooltip url="https://docs.idling.app" isInsideParagraph>
      <a
        data-testid={DOCS_LINK_SELECTORS.LINK}
        href="https://docs.idling.app"
        target="_blank"
      >
        {ll.footer.docs()}
      </a>
    </LinkTooltip>
  );
};