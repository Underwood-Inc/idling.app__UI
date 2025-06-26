'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import FloatingAddPost from '../components/floating-add-post/FloatingAddPost';
import { IntelligentSkeletonWrapper } from '../components/skeleton/IntelligentSkeletonWrapper';
import { Submission } from '../components/submission-forms/schema';
import { SubmissionItem } from '../components/submissions-list/SubmissionItem';
import { SubmissionWithReplies } from '../components/submissions-list/actions';
import styles from './page.module.css';

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

interface MyPostsPageClientProps {
  contextId: string;
}

export default function MyPostsPageClient({
  contextId
}: MyPostsPageClientProps) {
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

  const renderMyPostItem = ({
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
  }) => {
    const isReplyPost = submission.thread_parent_id !== null;

    return (
      <div
        className={`submission__wrapper ${isReplyPost ? styles['submission__wrapper--is-reply'] : ''}`}
      >
        {/* Reply indicator for posts that are replies */}
        {isReplyPost && (
          <div className="submission__meta">
            <span
              className={styles['submission__reply-indicator']}
              title="This is a reply to another post"
            >
              💬 Reply to parent post
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
          currentPage={currentPage}
          currentFilters={currentFilters}
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
