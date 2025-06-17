import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CONTEXT_IDS } from 'src/lib/context-ids';
import { CustomSession } from '../../auth.config';
import { auth } from '../../lib/auth';
import { SpacingThemeProvider } from '../../lib/context/SpacingThemeContext';
import { Card } from '../components/card/Card';
import FadeIn from '../components/fade-in/FadeIn';
import Loader from '../components/loader/Loader';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { RecentTags } from '../components/recent-tags/RecentTags';
import { RecentTagsLoader } from '../components/recent-tags/RecentTagsClient';
import MyPostsPageClient from './MyPostsPageClient';
import styles from './page.module.css';

const LazyPostsManager = dynamic(
  () => import('../components/submissions-list/PostsManager'),
  {
    ssr: false,
    loading: () => <Loader />
  }
);

export default async function MyPosts() {
  const session = (await auth()) as CustomSession | null;

  return (
    <SpacingThemeProvider>
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>My Posts</h2>
          </FadeIn>
        </PageHeader>
        <PageContent>
          <article className={styles.posts__container}>
            <FadeIn className={styles.posts__container_fade}>
              <Card width="full" className={styles.posts__container_item}>
                <Suspense fallback={<Loader />}>
                  {session?.user?.providerAccountId && (
                    <MyPostsPageClient
                      contextId={CONTEXT_IDS.MY_POSTS.toString()}
                    />
                  )}
                </Suspense>
              </Card>
            </FadeIn>
          </article>
        </PageContent>

        <PageAside className={styles.tags_aside} bottomMargin={10}>
          <FadeIn>
            <Card width="full">
              <Suspense fallback={<RecentTagsLoader />}>
                <RecentTags
                  contextId={CONTEXT_IDS.MY_POSTS.toString()}
                  onlyMine
                />
              </Suspense>
            </Card>
          </FadeIn>
        </PageAside>
      </PageContainer>
    </SpacingThemeProvider>
  );
}
