'use client';

import { CONTEXT_IDS } from '@lib/context-ids';
import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { handleMentionFilter, handleTagFilter } from '@lib/utils/filter-utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Card } from '../../components/card/Card';
import FadeIn from '../../components/fade-in/FadeIn';
import Loader from '../../components/loader/Loader';
import { PageAside } from '../../components/page-aside/PageAside';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import PageHeader from '../../components/page-header/PageHeader';
import { Submission } from '../../components/submission-forms/schema';
import { getSubmissionThread } from '../../components/thread/actions';
import Thread from '../../components/thread/Thread';
import ThreadTags from '../../components/thread/ThreadTags';
import styles from './page.module.css';

interface ThreadData {
  parent: Submission | null;
  replies: Submission[];
}

interface ThreadPageClientProps {
  submissionId: number;
  initialThreadData: ThreadData | null;
}

export default function ThreadPageClient({
  submissionId,
  initialThreadData
}: ThreadPageClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [threadData, setThreadData] = useState<ThreadData | null>(
    initialThreadData
  );
  const [loading, setLoading] = useState(!initialThreadData);

  // Use URL-first filter state management
  const contextId = CONTEXT_IDS.THREAD.toString();
  const {
    filters,
    addFilter,
    removeFilter,
    clearFilters: clearAllFilters,
    updateUrl
  } = useSimpleUrlFilters();

  // Only load data if we don't have initial data
  useEffect(() => {
    if (!initialThreadData) {
      const loadThreadData = async () => {
        try {
          const data = await getSubmissionThread(submissionId);
          if (!data.parent) {
            router.push('/404');
            return;
          }
          setThreadData(data);
        } catch (error) {
          console.error('Error loading thread:', error);
          router.push('/404');
        } finally {
          setLoading(false);
        }
      };

      loadThreadData();
    }
  }, [submissionId, initialThreadData, router]);

  const handleHashtagClick = (hashtag: string) => {
    // Use the reusable tag filter utility with atomic updates
    handleTagFilter(hashtag, filters, addFilter, removeFilter, updateUrl);
  };

  const handleMentionClick = async (mentionValue: string) => {
    // Use the reusable mention filter utility with atomic updates
    handleMentionFilter(
      mentionValue,
      filters,
      addFilter,
      removeFilter,
      updateUrl
    );
  };

  const clearFilters = () => {
    clearAllFilters();
  };

  if (loading) {
    return <Loader />;
  }

  if (!threadData) {
    return <div>Thread not found</div>;
  }

  const userId = session?.user?.id?.toString() || '';

  // Extract active filters from URL-first state
  const activeHashtags = filters
    .filter((f) => f.name === 'tags')
    .map((f) => f.value)
    .filter(Boolean);

  const activeMentions = filters
    .filter((f) => f.name === 'author')
    .map((f) => f.value)
    .filter(Boolean);

  const hasActiveFilters =
    activeHashtags.length > 0 || activeMentions.length > 0;

  // Convert to format expected by Thread component
  const activeFilters = {
    hashtags: activeHashtags,
    mentions: activeMentions
  };

  return (
    <PageContainer>
      <PageHeader>
        <FadeIn>
          <div className={styles.thread__header}>
            <h2>Thread Discussion</h2>
            {hasActiveFilters && (
              <div className={styles.thread__filters}>
                <span className={styles.thread__filters_label}>
                  Active Filters:
                </span>
                {activeHashtags.map((hashtag) => (
                  <button
                    key={hashtag}
                    className={styles.thread__filter_pill}
                    onClick={() => handleHashtagClick(hashtag)}
                    title="Click to remove filter"
                  >
                    #{hashtag} ×
                  </button>
                ))}
                {activeMentions.map((mention) => (
                  <button
                    key={mention}
                    className={styles.thread__filter_pill}
                    onClick={() => handleMentionClick(mention)}
                    title="Click to remove filter"
                  >
                    @{mention} ×
                  </button>
                ))}
                <button
                  className={styles.thread__clear_filters}
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </PageHeader>
      <div className={styles.thread__layout}>
        <PageContent>
          <article className={styles.thread__container}>
            <FadeIn className={styles.thread__fade}>
              <Card width="full" className={styles.thread__item}>
                <Suspense fallback={<Loader />}>
                  <Thread
                    submissionId={submissionId}
                    userId={userId}
                    onHashtagClick={handleHashtagClick}
                    onMentionClick={handleMentionClick}
                    activeFilters={activeFilters}
                    contextId={contextId}
                  />
                </Suspense>
              </Card>
            </FadeIn>
          </article>
        </PageContent>

        <PageAside className={styles.thread_aside} bottomMargin={0}>
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
      </div>
    </PageContainer>
  );
}
