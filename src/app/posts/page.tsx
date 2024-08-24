import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { FILTER_IDS } from 'src/lib/filter-ids';
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
import {
  RecentTags,
  RecentTagsLoader
} from '../components/recent-tags/RecentTags';
import { AddSubmissionForm } from '../components/submission-forms/add-submission-form/AddSubmissionForm';
import styles from './page.module.css';

const LazyPostsList = dynamic(
  () => import('../components/submissions-list/SubmissionsList'),
  { ssr: false }
);

export type PostFilters = 'tags';
export type PostSearchParams = Filters<Record<PostFilters, string>>;

export default async function Posts({
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
            <h2 className={styles.posts__header}>posts</h2>

            <AddSubmissionForm isAuthorized={!!session} />
            <br />
            <FilterBar filterId={FILTER_IDS.POSTS.toString()} />
          </FadeIn>
        </PageHeader>

        <PageContent>
          <section className={styles.posts__all}>
            <article>
              <FadeIn>
                <h3 className={styles.posts__header}>all</h3>

                <Card className={styles.card} width="full">
                  <Suspense fallback={<Loader />}>
                    {session?.user?.providerAccountId && (
                      <LazyPostsList
                        filterId={FILTER_IDS.POSTS.toString()}
                        filters={filters}
                        providerAccountId={session.user.providerAccountId}
                      />
                    )}
                  </Suspense>
                </Card>
              </FadeIn>
            </article>
          </section>
        </PageContent>

        <FadeIn>
          <PageAside className={styles.aside__recentTags}>
            <Suspense fallback={<RecentTagsLoader />}>
              <FadeIn>
                <RecentTags filterId={FILTER_IDS.POSTS.toString()} />
              </FadeIn>
            </Suspense>
          </PageAside>
        </FadeIn>
      </PageContainer>
    </>
  );
}
