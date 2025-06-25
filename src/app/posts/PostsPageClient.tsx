'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import FloatingAddPost from '../components/floating-add-post/FloatingAddPost';
import { IntelligentSkeletonWrapper } from '../components/skeleton/IntelligentSkeletonWrapper';
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
    ssr: false,
    loading: () => (
      <IntelligentSkeletonWrapper
        isLoading={true}
        className="posts-page-loading"
        preserveExactHeight={true}
        expectedItemCount={10}
        hasPagination={true}
        hasInfiniteScroll={false}
        fallbackMinHeight="400px"
      >
        <div style={{ minHeight: '400px' }} />
      </IntelligentSkeletonWrapper>
    )
  }
);

interface PostsPageClientProps {
  contextId: string;
}

export default function PostsPageClient({ contextId }: PostsPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [triggerModal, setTriggerModal] = useState(false);

  const handleNewPostClick = () => {
    setTriggerModal(true);
  };

  const handleTriggerHandled = () => {
    setTriggerModal(false);
  };

  const handleModalClose = () => {
    setTriggerModal(false);
    // Refresh posts list when a new post is created
    setRefreshKey((prev) => prev + 1);
  };

  const renderPostItem = ({
    submission,
    onTagClick,
    onHashtagClick,
    onMentionClick,
    onSubmissionUpdate,
    contextId,
    optimisticUpdateSubmission,
    optimisticRemoveSubmission,
    currentPage,
    currentFilters
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
    currentPage?: number;
    currentFilters?: Record<string, any>;
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
      currentPage={currentPage}
      currentFilters={currentFilters}
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
