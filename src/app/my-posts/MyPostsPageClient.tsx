'use client';

import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { CONTEXT_IDS } from '../../lib/context-ids';
import { useOverlay } from '../../lib/context/OverlayContext';
import { shouldUpdateAtom } from '../../lib/state/atoms';
import { IntelligentSkeletonWrapper } from '../components/skeleton/IntelligentSkeletonWrapper';
import { Submission } from '../components/submission-forms/schema';
import { SharedSubmissionForm } from '../components/submission-forms/shared-submission-form/SharedSubmissionForm';
import { SubmissionItem } from '../components/submissions-list/SubmissionItem';
import { SubmissionWithReplies } from '../components/submissions-list/types';
import styles from './page.module.css';

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

const AddPostModalContent: React.FC<{ onClose?: () => void }> = ({
  onClose
}) => {
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);

  const handleSuccess = (result?: {
    status: number;
    message?: string;
    error?: string;
    submission?: any;
  }) => {
    // Trigger global refresh
    setShouldUpdate(true);
    onClose?.();
  };

  return (
    <div className="floating-add-post__modal-content">
      <div className="floating-add-post__header">
        <h2 className="floating-add-post__title">✨ Share Something New</h2>
      </div>
      <SharedSubmissionForm
        mode="create"
        onSuccess={handleSuccess}
        contextId={CONTEXT_IDS.MY_POSTS.toString()}
      />
    </div>
  );
};

interface MyPostsPageClientProps {
  contextId: string;
}

export default function MyPostsPageClient({
  contextId
}: MyPostsPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: session } = useSession();
  const { openOverlay, closeOverlay } = useOverlay();
  const isAuthorized = !!session?.user;

  const modalId = 'my-posts-page-add-post-modal';

  const handleNewPostClick = () => {
    if (isAuthorized) {
      openOverlay({
        id: modalId,
        type: 'modal',
        component: AddPostModalContent,
        props: {
          onClose: () => {
            closeOverlay(modalId);
            // Refresh posts list when a new post is created
            setRefreshKey((prev) => prev + 1);
          }
        }
      });
    }
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
    <LazyPostsManager
      key={refreshKey}
      contextId={contextId}
      onlyMine={true}
      onNewPostClick={handleNewPostClick}
      renderSubmissionItem={renderMyPostItem}
    />
  );
}
