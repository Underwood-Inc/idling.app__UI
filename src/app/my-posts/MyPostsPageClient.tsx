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
  const [showFloatingModal, setShowFloatingModal] = useState(false);

  const handleNewPostClick = () => {
    // Trigger the floating add post modal
    setShowFloatingModal(true);
  };

  const handleModalClose = () => {
    setShowFloatingModal(false);
  };

  return (
    <>
      <LazyPostsManager
        contextId={contextId}
        onlyMine={true}
        onNewPostClick={handleNewPostClick}
      />
      {showFloatingModal && (
        <FloatingAddPost onPostCreated={handleModalClose} />
      )}
      {!showFloatingModal && <FloatingAddPost />}
      {DevSkeletonToggle && <DevSkeletonToggle />}
    </>
  );
}
