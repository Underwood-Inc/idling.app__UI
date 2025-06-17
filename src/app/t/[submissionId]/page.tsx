import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CustomSession } from '../../../auth.config';
import { auth } from '../../../lib/auth';
import { CONTEXT_IDS } from '../../../lib/context-ids';
import { SpacingThemeProvider } from '../../../lib/context/SpacingThemeContext';
import { Card } from '../../components/card/Card';
import FadeIn from '../../components/fade-in/FadeIn';
import Loader from '../../components/loader/Loader';
import { PageAside } from '../../components/page-aside/PageAside';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import PageHeader from '../../components/page-header/PageHeader';
import { getSubmissionThread } from '../../components/thread/actions';
import Thread from '../../components/thread/Thread';
import ThreadTags from '../../components/thread/ThreadTags';
import styles from './page.module.css';

interface ThreadPageProps {
  params: {
    submissionId: string;
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const submissionId = parseInt(params.submissionId);

  if (isNaN(submissionId)) {
    notFound();
  }

  const session = (await auth()) as CustomSession;
  const providerAccountId = session?.user?.providerAccountId || '';

  // Fetch the thread data on the server to check if it exists
  const threadData = await getSubmissionThread(submissionId);

  if (!threadData.parent) {
    notFound();
  }

  return (
    <SpacingThemeProvider>
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Thread Discussion</h2>
          </FadeIn>
        </PageHeader>
        <PageContent>
          <article className={styles.thread__container}>
            <FadeIn className={styles.thread__fade}>
              <Card width="full" className={styles.thread__item}>
                <Suspense fallback={<Loader />}>
                  <Thread
                    submissionId={submissionId}
                    providerAccountId={providerAccountId}
                  />
                </Suspense>
              </Card>
            </FadeIn>
          </article>
        </PageContent>

        <PageAside className={styles.thread_aside} bottomMargin={10}>
          <FadeIn>
            <Card width="full">
              <Suspense fallback={<Loader />}>
                <ThreadTags
                  submissionId={submissionId}
                  contextId={CONTEXT_IDS.THREAD.toString()}
                />
              </Suspense>
            </Card>
          </FadeIn>
        </PageAside>
      </PageContainer>
    </SpacingThemeProvider>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: ThreadPageProps) {
  const submissionId = parseInt(params.submissionId);

  if (isNaN(submissionId)) {
    return {
      title: 'Thread Not Found'
    };
  }

  try {
    const threadData = await getSubmissionThread(submissionId);

    if (!threadData.parent) {
      return {
        title: 'Thread Not Found'
      };
    }

    return {
      title: `${threadData.parent.submission_title || threadData.parent.submission_name} - Thread`,
      description:
        threadData.parent.submission_name.length > 160
          ? threadData.parent.submission_name.substring(0, 160) + '...'
          : threadData.parent.submission_name
    };
  } catch {
    return {
      title: 'Thread Not Found'
    };
  }
}
