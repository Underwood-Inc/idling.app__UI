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
// import SubmissionsList from '../components/submissions-list/SubmissionsList';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

const LazyPostsList = dynamic(
  () => import('../components/submissions-list/SubmissionsList')
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
      <PageHeader>
        <h4 className={styles.posts__header}>posts</h4>

        <AddSubmissionForm isAuthorized={!!session} />
        <br />
        <FilterBar filters={filters} />
      </PageHeader>

      <PageContent>
        <section>
          <section className={styles.posts__all}>
            <article>
              <h5 className={styles.posts__header}>all</h5>

              <Card className={styles.card} width="full">
                <LazyPostsList
                  listId="main"
                  filters={filters}
                  providerAccountId={session?.user?.providerAccountId || ''}
                />
              </Card>
            </article>
          </section>

          <section className={styles.posts__mine}>
            <article>
              <h5 className={styles.posts__header}>mine</h5>

              <Card className={styles.card} width="full">
                <LazyPostsList
                  listId="only-mine"
                  onlyMine={true}
                  providerAccountId={session?.user?.providerAccountId || ''}
                />
              </Card>
            </article>
          </section>
        </section>
      </PageContent>

      <aside>
        <Suspense fallback={<RecentTagsLoader />}>
          <RecentTags />
        </Suspense>
      </aside>
    </>
  );
}
