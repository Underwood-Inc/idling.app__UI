import { Suspense } from 'react';
import { CustomSession } from '../../auth.config';
import { auth } from '../../lib/auth';
import { Card } from '../components/card/Card';
import FilterBar, { Filter, Filters } from '../components/filter-bar/FilterBar';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import {
  RecentTags,
  RecentTagsLoader
} from '../components/recent-tags/RecentTags';
import { AddSubmissionForm } from '../components/submission-forms/add-submission-form/AddSubmissionForm';
import dynamic from 'next/dynamic';
import Loader from '../components/loader/Loader';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
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
          <h2 className={styles.posts__header}>posts</h2>

          <AddSubmissionForm isAuthorized={!!session} />
          <br />
          <FilterBar />
        </PageHeader>

        <PageContent>
          <section>
            <section className={styles.posts__all}>
              <article>
                <h3 className={styles.posts__header}>all</h3>

                <Card className={styles.card} width="full">
                  <Suspense fallback={<Loader />}>
                    {session?.user?.providerAccountId && (
                      <LazyPostsList
                        listId="main"
                        filters={filters}
                        providerAccountId={session.user.providerAccountId}
                      />
                    )}
                  </Suspense>
                </Card>
              </article>
            </section>

            {/* <section className={styles.posts__mine}>
            <article>
              <h3 className={styles.posts__header}>mine</h3>

              <Card className={styles.card} width="full">
                <Suspense fallback={<Loader />}>
                  <LazyPostsList
                    listId="only-mine"
                    onlyMine={true}
                    providerAccountId={session?.user?.providerAccountId || ''}
                  />
                </Suspense>
              </Card>
            </article>
          </section> */}
          </section>
        </PageContent>
      </PageContainer>

      <PageAside className={styles.aside__recentTags}>
        <Suspense fallback={<RecentTagsLoader />}>
          <RecentTags />
        </Suspense>
      </PageAside>
    </>
  );
}
