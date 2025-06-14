import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CONTEXT_IDS } from 'src/lib/context-ids';
import { CustomSession } from '../../auth.config';
import { auth } from '../../lib/auth';
import { Card } from '../components/card/Card';
import FadeIn from '../components/fade-in/FadeIn';
import FilterBar, { Filter, Filters } from '../components/filter-bar/FilterBar';
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

export type PostFilters = 'tags';
export type PostSearchParams = Filters<Record<PostFilters, string>>;

export default async function MyPosts({
  searchParams
}: {
  searchParams: PostSearchParams;
}) {
  const session = (await auth()) as CustomSession | null;
  const filters: Filter<PostFilters>[] = searchParams?.tags
    ? [{ name: 'tags', value: searchParams.tags }]
    : [];

  return (
    <>
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>posts</h2>

            <AddSubmissionForm isAuthorized={!!session} />
            <br />
            <FilterBar filterId={CONTEXT_IDS.MY_POSTS.toString()} />
          </FadeIn>
        </PageHeader>

        <PageContent>
          <section className={styles.posts__mine}>
            <article>
              <FadeIn>
                <h3>mine</h3>

                <Card className={styles.card} width="full">
                  <Suspense fallback={<Loader />}>
                    {session?.user?.providerAccountId && (
                      <LazyPostsList
                        contextId={CONTEXT_IDS.MY_POSTS.toString()}
                        onlyMine={true}
                        filters={filters}
                        providerAccountId={
                          session?.user?.providerAccountId || ''
                        }
                      />
                    )}
                  </Suspense>
                </Card>
              </FadeIn>
            </article>
          </section>
        </PageContent>

        <PageAside className={styles.aside__recentTags}>
          <Suspense fallback={<RecentTagsLoader />}>
            <FadeIn>
              <RecentTags
                contextId={CONTEXT_IDS.MY_POSTS.toString()}
                onlyMine
              />
            </FadeIn>
          </Suspense>
        </PageAside>
      </PageContainer>
    </>
  );
}
