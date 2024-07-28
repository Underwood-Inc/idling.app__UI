import { Suspense } from 'react';
import { auth } from '../../../auth';
import { Card } from '../components/card/Card';
import Loader from '../components/loader/Loader';
import { AddSubmissionForm } from '../components/submission-forms/add-submission-form/AddSubmissionForm';
import SubmissionsList from '../components/submissions-list/SubmissionsList';
import rootStyles from '../page.module.css';
import styles from './page.module.css';

export default async function Posts() {
  const session = await auth();

  return (
    <article className={rootStyles.main}>
      <h4 className={styles.posts__header}>posts</h4>

      <Card className={styles.card} width="md">
        <Suspense fallback={<Loader />}>
          <SubmissionsList />
        </Suspense>
      </Card>

      <AddSubmissionForm isAuthorized={!!session} />
    </article>
  );
}
