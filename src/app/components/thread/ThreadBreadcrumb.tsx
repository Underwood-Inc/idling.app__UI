'use client';

import { useEffect, useState } from 'react';
import { buildThreadUrl } from '../../../lib/routes';
import {
  generateScrollKey,
  storeScrollPosition
} from '../../../lib/utils/scroll-position';
import { InstantLink } from '../ui/InstantLink';
import './ThreadBreadcrumb.css';

interface BreadcrumbItem {
  submission_id: number;
  submission_title: string;
  author: string;
}

interface ThreadBreadcrumbProps {
  currentSubmissionId: number;
  className?: string;
}

export function ThreadBreadcrumb({
  currentSubmissionId,
  className
}: ThreadBreadcrumbProps) {
  const [breadcrumbChain, setBreadcrumbChain] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildBreadcrumbChain = async () => {
      try {
        setLoading(true);
        const chain: BreadcrumbItem[] = [];
        let currentId = currentSubmissionId;

        // Build the chain by following thread_parent_id links
        while (currentId) {
          const response = await fetch(`/api/submissions/${currentId}`);
          if (!response.ok) break;

          const submission = await response.json();
          if (!submission.thread_parent_id) break;

          // Get parent submission
          const parentResponse = await fetch(
            `/api/submissions/${submission.thread_parent_id}`
          );
          if (!parentResponse.ok) break;

          const parent = await parentResponse.json();
          chain.unshift({
            submission_id: parent.submission_id,
            submission_title: parent.submission_title || parent.submission_name,
            author: parent.author || 'Unknown'
          });

          currentId = parent.submission_id;
        }

        setBreadcrumbChain(chain);
      } catch (error) {
        console.error('Error building breadcrumb chain:', error);
      } finally {
        setLoading(false);
      }
    };

    buildBreadcrumbChain();
  }, [currentSubmissionId]);

  const handleBreadcrumbClick = (targetSubmissionId: number) => {
    // Store current scroll position before navigating
    if (typeof window !== 'undefined') {
      const scrollKey = generateScrollKey(window.location.pathname, {
        searchParams: new URLSearchParams(window.location.search)
      });

      const threadContainer = document.querySelector(
        '.thread__container'
      ) as HTMLElement;
      const scrollY = threadContainer
        ? threadContainer.scrollTop
        : window.scrollY;

      storeScrollPosition(
        scrollKey,
        {
          targetSubmissionId: currentSubmissionId
        },
        scrollY
      );
    }
  };

  if (loading) {
    return (
      <div className={`thread-breadcrumb ${className || ''}`}>
        <span className="thread-breadcrumb__loading">
          Loading breadcrumb...
        </span>
      </div>
    );
  }

  if (breadcrumbChain.length === 0) {
    return null;
  }

  return (
    <div className={`thread-breadcrumb ${className || ''}`}>
      <span className="thread-breadcrumb__label">Thread chain:</span>
      <div className="thread-breadcrumb__items">
        {breadcrumbChain.map((item, index) => (
          <div key={item.submission_id} className="thread-breadcrumb__item">
            <InstantLink
              href={buildThreadUrl(item.submission_id)}
              className="thread-breadcrumb__link"
              title={`View thread by ${item.author}`}
              onClick={() => handleBreadcrumbClick(item.submission_id)}
            >
              <span className="thread-breadcrumb__title">
                {item.submission_title}
              </span>
              <span className="thread-breadcrumb__author">
                by {item.author}
              </span>
            </InstantLink>
            {index < breadcrumbChain.length - 1 && (
              <span className="thread-breadcrumb__separator">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
