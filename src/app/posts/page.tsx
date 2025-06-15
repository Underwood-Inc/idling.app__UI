import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CONTEXT_IDS } from 'src/lib/context-ids';
import { auth } from '../../lib/auth';
import { Card } from '../components/card/Card';
import FadeIn from '../components/fade-in/FadeIn';
import FilterBar from '../components/filter-bar/FilterBar';
import Loader from '../components/loader/Loader';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { RecentTags } from '../components/recent-tags/RecentTags';
import { RecentTagsLoader } from '../components/recent-tags/RecentTagsClient';
import { AddSubmissionForm } from '../components/submission-forms/add-submission-form/AddSubmissionForm';
import styles from './page.module.css';

const LazyPostsList = dynamic(
  () => import('../components/submissions-list/SubmissionsList'),
  {
    ssr: false,
    loading: () => <Loader />
  }
);

export type PostFilters = 'tags' | 'page';

export default async function Posts() {
  const session = await auth();

  return (
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
              <AddSubmissionForm
                isAuthorized={!!session?.user?.providerAccountId}
              />
              <FilterBar filterId={CONTEXT_IDS.POSTS.toString()} />
              <Suspense fallback={<Loader />}>
                <LazyPostsList contextId={CONTEXT_IDS.POSTS.toString()} />
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
  );
}
