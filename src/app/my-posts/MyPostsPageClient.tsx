'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import FloatingAddPost from '../components/floating-add-post/FloatingAddPost';

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

  const handleNewPostClick = () => {
    // Trigger the floating add post modal
    setTriggerModal(true);
  };

  const handleTriggerHandled = () => {
    setTriggerModal(false);
  };

  const handleModalClose = () => {
    // Modal closed, refresh the posts if needed
    // The PostsManager will handle refreshing automatically
  };

  return (
    <>
      <LazyPostsManager
        contextId={contextId}
        onlyMine={true}
        onNewPostClick={handleNewPostClick}
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
