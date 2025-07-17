'use client';

import { buildThreadUrl } from '@lib/routes';
import {
  generateScrollKey,
  storeScrollPosition
} from '@lib/utils/scroll-position';
import { InstantLink } from '../ui/InstantLink';
import './ParentPostLink.css';

interface ParentPostLinkProps {
  threadParentId: number;
  currentSubmissionId: number;
  className?: string;
}

export function ParentPostLink({
  threadParentId,
  currentSubmissionId,
  className
}: ParentPostLinkProps) {
  const handleParentNavigation = () => {
    // Store current scroll position before navigating to parent thread
    if (typeof window !== 'undefined') {
      const scrollKey = generateScrollKey(window.location.pathname, {
        searchParams: new URLSearchParams(window.location.search)
      });

      // Get scroll position from the thread container
      const threadContainer = document.querySelector(
        '.thread__container'
      ) as HTMLElement;
      const scrollY = threadContainer
        ? threadContainer.scrollTop
        : window.scrollY;

      // Store the current submission ID as the target to scroll to when returning
      storeScrollPosition(
        scrollKey,
        {
          targetSubmissionId: currentSubmissionId
        },
        scrollY
      );
    }
  };

  return (
    <div className={`parent-post-link ${className || ''}`}>
      <span className="parent-post-link__label">↩</span>
      <InstantLink
        href={buildThreadUrl(threadParentId)}
        className="parent-post-link__link"
        title="View parent post"
        onClick={handleParentNavigation}
      >
        <span className="parent-post-link__text">See parent post</span>
      </InstantLink>
    </div>
  );
}
