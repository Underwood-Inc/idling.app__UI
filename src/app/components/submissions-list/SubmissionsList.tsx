'use client';

import { SubmissionWithReplies } from './actions';
import { SubmissionItem } from './SubmissionItem';
import './SubmissionItem.css';
import './SubmissionsList.css';

interface SubmissionsListProps {
  posts: SubmissionWithReplies[];
  onTagClick: (tag: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string) => void;
  showSkeletons?: boolean;
  onRefresh?: () => void;
  contextId?: string;
}

export default function SubmissionsList({
  posts,
  onTagClick,
  onHashtagClick,
  onMentionClick,
  showSkeletons,
  onRefresh,
  contextId
}: SubmissionsListProps) {
  // TODO: this is wrong, this skeleton must be fully automatic generation via DOM
  // traversal at run-time or via advanced snapshots and must be a standalone agnostic
  // component that can be wrapped around any component to add-on an automatically updating
  // skeleton. the key is to replicate the real DOM structure and behavior as closely as
  // possible so as to avoid sudden height changes.
  if (showSkeletons) {
    return (
      <div className="submissions-list">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="submissions-list__skeleton">
            <div className="submission__wrapper">
              <div className="submission__meta">
                <div className="skeleton-line skeleton-line--short"></div>
                <div className="skeleton-line skeleton-line--xs"></div>
              </div>
              <div className="submission__content">
                <div className="skeleton-line skeleton-line--title"></div>
                <div className="skeleton-line skeleton-line--description"></div>
              </div>
              <div className="submission__tags">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="submissions-list">
      {posts.map((post) => (
        <SubmissionItem
          key={post.submission_id}
          submission={post}
          onTagClick={onTagClick}
          onHashtagClick={onHashtagClick}
          onMentionClick={onMentionClick}
          onSubmissionUpdate={onRefresh}
          contextId={contextId}
        />
      ))}
    </div>
  );
}
