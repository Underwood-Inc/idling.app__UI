'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import FloatingAddPost from '../components/floating-add-post/FloatingAddPost';
import { Submission } from '../components/submission-forms/schema';
import { SubmissionItem } from '../components/submissions-list/SubmissionItem';
import { SubmissionWithReplies } from '../components/submissions-list/actions';

// Development-only import that gets tree-shaken in production
let DevSkeletonToggle: React.ComponentType | null = null;

if (process.env.NODE_ENV === 'development') {
  const devModule = require('../components/dev-tools/DevSkeletonToggle');
  DevSkeletonToggle = devModule.DevSkeletonToggle;
}

const LazyPostsManager = dynamic(
  () => import('../components/submissions-list/PostsManager'),
  {
    ssr: false
    // Remove the Loader fallback so PostsManager/SubmissionsList can handle loading with smart skeleton
  }
);

interface MyPostsPageClientProps {
  contextId: string;
}

export default function MyPostsPageClient({
  contextId
}: MyPostsPageClientProps) {
  const [triggerModal, setTriggerModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewPostClick = () => {
    // Trigger the floating add post modal
    setTriggerModal(true);
  };

  const handleTriggerHandled = () => {
    setTriggerModal(false);
  };

  const handleModalClose = () => {
    // Modal closed, force refresh the posts list
    setRefreshKey((prev) => prev + 1);
  };

  // Custom renderer for my-posts page - shows reply indicators
  const renderMyPostItem = ({
    submission,
    onTagClick,
    onHashtagClick,
    onMentionClick,
    onSubmissionUpdate,
    contextId,
    optimisticUpdateSubmission,
    optimisticRemoveSubmission
  }: {
    submission: SubmissionWithReplies;
    onTagClick: (_tag: string) => void;
    onHashtagClick?: (_hashtag: string) => void;
    onMentionClick?: (
      _mention: string,
      _filterType: 'author' | 'mentions'
    ) => void;
    onSubmissionUpdate?: () => void;
    contextId: string;
    optimisticUpdateSubmission?: (
      _submissionId: number,
      _updatedSubmission: Submission
    ) => void;
    optimisticRemoveSubmission?: (_submissionId: number) => void;
  }) => {
    const isReplyPost = submission.thread_parent_id !== null;

    return (
      <div
        className={`submission__wrapper ${isReplyPost ? 'submission__wrapper--is-reply' : ''}`}
      >
        {/* Reply indicator for posts that are replies */}
        {isReplyPost && (
          <div className="submission__meta">
            <span
              className="submission__reply-indicator"
              title="This is a reply to another post"
            >
              💬 Reply
            </span>
          </div>
        )}

        <SubmissionItem
          submission={submission}
          onTagClick={onTagClick}
          onHashtagClick={onHashtagClick}
          onMentionClick={onMentionClick}
          onSubmissionUpdate={onSubmissionUpdate}
          contextId={contextId}
          optimisticUpdateSubmission={optimisticUpdateSubmission}
          optimisticRemoveSubmission={optimisticRemoveSubmission}
        />
      </div>
    );
  };

  return (
    <>
      <LazyPostsManager
        key={refreshKey}
        contextId={contextId}
        onlyMine={true}
        onNewPostClick={handleNewPostClick}
        renderSubmissionItem={renderMyPostItem}
      />
      <FloatingAddPost
        externalTrigger={triggerModal}
        onTriggerHandled={handleTriggerHandled}
        onPostCreated={handleModalClose}
      />
      {DevSkeletonToggle && <DevSkeletonToggle />}
    </>
  );
}
