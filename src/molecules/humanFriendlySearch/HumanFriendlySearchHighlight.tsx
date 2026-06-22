'use client';

import { useMemo } from 'react';
import { buildHumanFriendlySearchHighlightSegments } from './buildHumanFriendlySearchHighlightSegments';
import type { HumanFriendlySearchQuery } from './humanFriendlySearch.types';
import styles from './humanFriendlySearch.module.css';

export interface HumanFriendlySearchHighlightProps {
  text: string;
  query: HumanFriendlySearchQuery;
  className?: string;
  highlightClassName?: string;
}

export function HumanFriendlySearchHighlight({
  text,
  query,
  className,
  highlightClassName,
}: HumanFriendlySearchHighlightProps) {
  const segments = useMemo(
    () => buildHumanFriendlySearchHighlightSegments(text, query),
    [query, text]
  );

  const markClassName = highlightClassName ?? styles.highlight;

  if (!query.terms.length) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.matched ? (
          <mark key={`${index}-${segment.text}`} className={markClassName}>
            {segment.text}
          </mark>
        ) : (
          <span key={`${index}-${segment.text}`}>{segment.text}</span>
        )
      )}
    </span>
  );
}
