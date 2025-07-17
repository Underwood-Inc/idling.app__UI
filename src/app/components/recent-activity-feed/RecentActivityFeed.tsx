'use client';

import { useSimpleSubmissions } from '@lib/state/submissions/useSimpleSubmissions';
import { formatLastUpdated } from '@lib/utils/time-utils';
import Link from 'next/link';
import React from 'react';
import { Author } from '../author/Author';
import './RecentActivityFeed.css';

export interface RecentActivityFeedProps {
  maxItems?: number;
  className?: string;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  maxItems = 5,
  className = ''
}) => {
  const { submissions, isLoading, error } = useSimpleSubmissions({
    filters: [],
    onlyMine: false,
    userId: '',
    includeThreadReplies: false,
    enabled: true
  });

  const recentSubmissions = submissions?.slice(0, maxItems) || [];

  return (
    <div className={`recent-activity-feed ${className}`}>
      <div className="recent-activity-feed__header">
        <h3 className="recent-activity-feed__title">Recent Activity</h3>
        <Link href="/posts" className="recent-activity-feed__view-all">
          View All →
        </Link>
      </div>

      <div className="recent-activity-feed__content">
        {isLoading && (
          <div className="recent-activity-feed__loading">Loading...</div>
        )}

        {error && (
          <div className="recent-activity-feed__error">
            Failed to load recent activity
          </div>
        )}

        {!isLoading && !error && recentSubmissions.length === 0 && (
          <div className="recent-activity-feed__empty">No recent activity</div>
        )}

        {!isLoading &&
          !error &&
          recentSubmissions.length > 0 &&
          recentSubmissions.map((submission) => (
            <Link
              key={submission.submission_id}
              href={`/t/${submission.submission_id}`}
              className="recent-activity-feed__item"
            >
              <h4 className="recent-activity-feed__item-title">
                {submission.submission_title || submission.submission_name}
              </h4>

              <div className="recent-activity-feed__item-meta">
                <Author
                  authorId={submission.user_id?.toString() || ''}
                  authorName={submission.author}
                  bio={submission.author_bio}
                  size="xs"
                  showFullName={true}
                  enableTooltip={true}
                  asSpan={true}
                />
                <span className="recent-activity-feed__separator">•</span>
                <span className="recent-activity-feed__time">
                  {submission.submission_datetime
                    ? formatLastUpdated(
                        submission.submission_datetime.getTime()
                      )
                    : 'Recently'}
                </span>
                {(submission.replies?.length || 0) > 0 && (
                  <>
                    <span className="recent-activity-feed__separator">•</span>
                    <span className="recent-activity-feed__replies">
                      {submission.replies?.length}
                      {submission.replies?.length === 1 ? ' reply' : ' replies'}
                    </span>
                  </>
                )}
              </div>

              {submission.tags && submission.tags.length > 0 && (
                <div className="recent-activity-feed__hashtags">
                  {submission.tags
                    .slice(0, 3)
                    .map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="recent-activity-feed__hashtag"
                      >
                        #{tag}
                      </span>
                    ))}
                  {submission.tags.length > 3 && (
                    <span className="recent-activity-feed__hashtag">
                      +{submission.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
      </div>
    </div>
  );
};
