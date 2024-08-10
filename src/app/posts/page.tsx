import { Suspense } from 'react';
import { auth } from '../../lib/auth';
import { Card } from '../components/card/Card';
import FilterBar, { Filter, Filters } from '../components/filter-bar/FilterBar';
import Loader from '../components/loader/Loader';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import {
  RecentTags,
  RecentTagsLoader
} from '../components/recent-tags/RecentTags';
import { AddSubmissionForm } from '../components/submission-forms/add-submission-form/AddSubmissionForm';
import SubmissionsList from '../components/submissions-list/SubmissionsList';
import styles from './page.module.css';

export type PostFilters = 'tags';
export type PostSearchParams = Filters<Record<PostFilters, string>>;

export default async function Posts({
  searchParams
}: {
  searchParams: PostSearchParams;
}) {
  const session = await auth();
  const filters: Filter<'tags'>[] = searchParams?.tags
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
                <Suspense fallback={<Loader />}>
                  <SubmissionsList filters={filters} />
                </Suspense>
              </Card>
            </article>
          </section>

          <section className={styles.posts__mine}>
            <article>
              <h5 className={styles.posts__header}>mine</h5>

              <Card className={styles.card} width="full">
                <Suspense fallback={<Loader />}>
                  <SubmissionsList onlyMine={true} />
                </Suspense>
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
