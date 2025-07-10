import { Metadata } from 'next';
import React, { Suspense } from 'react';
import { CONTEXT_IDS } from 'src/lib/context-ids';
import { CustomSession } from '../../auth.config';
import { auth } from '../../lib/auth';
import { Card } from '../components/card/Card';
import FadeIn from '../components/fade-in/FadeIn';
import FloatingAddPost from '../components/floating-add-post/FloatingAddPost';
import Loader from '../components/loader/Loader';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { RecentTags } from '../components/recent-tags/RecentTags';
import { RecentTagsLoader } from '../components/recent-tags/RecentTagsClient';
import PostsPageClient from './PostsPageClient';
import styles from './page.module.css';

// Development-only import that gets tree-shaken in production
let DevSkeletonToggle: React.ComponentType | null = null;

if (process.env.NODE_ENV === 'development') {
  const devModule = require('../components/dev-tools/DevSkeletonToggle');
  DevSkeletonToggle = devModule.DevSkeletonToggle;
}

export const metadata: Metadata = {
  title: 'Posts - Idling.app',
  description: 'Browse and discover posts from the community'
};

export default async function PostsPage() {
  const session = (await auth()) as CustomSession | null;

  return (
    <>
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Posts</h2>
          </FadeIn>
        </PageHeader>
        <PageContent>
          <article className={styles.posts__container}>
            <FadeIn className={styles.posts__container_fade}>
              <Card width="full" className={styles.posts__container_item}>
                <Suspense fallback={<Loader />}>
                  <PostsPageClient contextId={CONTEXT_IDS.POSTS.toString()} />
                </Suspense>
              </Card>
            </FadeIn>
          </article>
        </PageContent>

        <PageAside className={styles.tags_aside} bottomMargin={10}>
          <FadeIn>
            <Card width="full">
              <Suspense fallback={<RecentTagsLoader />}>
                <RecentTags contextId={CONTEXT_IDS.POSTS.toString()} />
              </Suspense>
            </Card>
          </FadeIn>
        </PageAside>
      </PageContainer>

      {/* Floating buttons positioned at viewport level */}
      {session?.user?.id && <FloatingAddPost />}
      {DevSkeletonToggle && <DevSkeletonToggle />}
    </>
  );
}
