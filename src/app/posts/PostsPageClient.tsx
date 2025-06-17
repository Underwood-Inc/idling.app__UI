'use client';

import dynamic from 'next/dynamic';
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

interface PostsPageClientProps {
  contextId: string;
}

export default function PostsPageClient({ contextId }: PostsPageClientProps) {
  const handleNewPostClick = () => {
    // This will be handled by the floating button now
    // eslint-disable-next-line no-console
    console.log('New post button clicked from PostsManager');
  };

  return (
    <>
      <LazyPostsManager
        contextId={contextId}
        onNewPostClick={handleNewPostClick}
      />
      <FloatingAddPost />
      {DevSkeletonToggle && <DevSkeletonToggle />}
    </>
  );
}
