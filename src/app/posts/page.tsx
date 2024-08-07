import { Suspense } from 'react';
import { auth } from '../../lib/auth';
import { Card } from '../components/card/Card';
import FilterBar, { Filter, Filters } from '../components/filter-bar/FilterBar';
import Loader from '../components/loader/Loader';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { AddSubmissionForm } from '../components/submission-forms/add-submission-form/AddSubmissionForm';
import SubmissionsList from '../components/submissions-list/SubmissionsList';
import styles from './page.module.css';

export type PostsFilters = Filters<{
  tags?: string; // .../posts?tags=some-tag,another-tag
}>;

export default async function Posts({
  searchParams
}: {
  searchParams: PostsFilters;
}) {
  const session = await auth();
  const filters: Filter[] = searchParams.tags
    ? [{ name: 'tags', value: searchParams.tags }]
    : [];

  return (
    <>
      <PageHeader>
        <h4 className={styles.posts__header}>posts</h4>

        <AddSubmissionForm isAuthorized={!!session} />
      </PageHeader>

      <PageContent>
        <section>
          <FilterBar filters={filters} />

          <section className={styles.posts__all}>
            <article>
              <h5 className={styles.posts__header}>all</h5>

              <Card className={styles.card} width="md">
                <Suspense fallback={<Loader />}>
                  <SubmissionsList filters={filters} />
                </Suspense>
              </Card>
            </article>
          </section>

          <section className={styles.posts__mine}>
            <article>
              <h5 className={styles.posts__header}>mine</h5>

              <Card className={styles.card} width="md">
                <Suspense fallback={<Loader />}>
                  <SubmissionsList onlyMine={true} filters={[]} />
                </Suspense>
              </Card>
            </article>
          </section>
        </section>
      </PageContent>
    </>
  );
}
