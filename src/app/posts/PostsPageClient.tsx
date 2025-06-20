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

interface PostsPageClientProps {
  contextId: string;
}

export default function PostsPageClient({ contextId }: PostsPageClientProps) {
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

  // Default renderer for regular posts page - no reply indicators
  const renderPostItem = ({
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
    // eslint-disable-next-line no-unused-vars
    onTagClick: (tag: string) => void;
    // eslint-disable-next-line no-unused-vars
    onHashtagClick?: (hashtag: string) => void;
    onMentionClick?: (
      // eslint-disable-next-line no-unused-vars
      mention: string,
      // eslint-disable-next-line no-unused-vars
      filterType: 'author' | 'mentions'
    ) => void;
    // eslint-disable-next-line no-unused-vars
    onSubmissionUpdate?: () => void;
    contextId: string;
    optimisticUpdateSubmission?: (
      // eslint-disable-next-line no-unused-vars
      submissionId: number,
      // eslint-disable-next-line no-unused-vars
      updatedSubmission: Submission
    ) => void;
    // eslint-disable-next-line no-unused-vars
    optimisticRemoveSubmission?: (submissionId: number) => void;
  }) => (
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
  );

  return (
    <>
      <LazyPostsManager
        key={refreshKey}
        contextId={contextId}
        onNewPostClick={handleNewPostClick}
        renderSubmissionItem={renderPostItem}
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
