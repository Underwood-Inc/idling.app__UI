'use client';

import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CONTEXT_IDS } from '../../../lib/context-ids';
import { SpacingThemeProvider } from '../../../lib/context/SpacingThemeContext';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
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

  // Use global filter state management
  const contextId = CONTEXT_IDS.THREAD.toString();
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

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
    // Ensure hashtag value includes # prefix for proper filtering
    const hashtagValue = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

    setFiltersState((prev) => {
      const newFilters = [...prev.filters];
      const tagsIndex = newFilters.findIndex((f) => f.name === 'tags');

      if (tagsIndex >= 0) {
        // Update existing tags filter
        const currentTags = newFilters[tagsIndex].value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        const isTagActive = currentTags.includes(hashtagValue);
        const updatedTags = isTagActive
          ? currentTags.filter((tag) => tag !== hashtagValue)
          : [...currentTags, hashtagValue];

        if (updatedTags.length > 0) {
          newFilters[tagsIndex] = {
            name: 'tags',
            value: updatedTags.join(',')
          };
        } else {
          // Remove tags filter if no tags left
          return {
            ...prev,
            filters: newFilters.filter(
              (f) => f.name !== 'tags' && f.name !== 'tagLogic'
            )
          };
        }
      } else {
        // Add new tags filter
        newFilters.push({ name: 'tags', value: hashtagValue });
      }

      return {
        ...prev,
        filters: newFilters,
        page: 1
      };
    });
  };

  const handleMentionClick = async (mentionValue: string) => {
    // ContentWithPills now ONLY passes user IDs, never usernames
    // We can directly use the mentionValue as the author ID for filtering
    setFiltersState((prev) => {
      const newFilters = [...prev.filters];
      const authorIndex = newFilters.findIndex((f) => f.name === 'author');

      if (authorIndex >= 0) {
        // Toggle author filter
        const currentAuthor = newFilters[authorIndex].value;
        if (currentAuthor === mentionValue) {
          // Remove author filter if same mention clicked
          return {
            ...prev,
            filters: newFilters.filter((f) => f.name !== 'author')
          };
        } else {
          // Update author filter
          newFilters[authorIndex] = { name: 'author', value: mentionValue };
        }
      } else {
        // Add new author filter
        newFilters.push({ name: 'author', value: mentionValue });
      }

      return {
        ...prev,
        filters: newFilters,
        page: 1
      };
    });
  };

  const clearFilters = () => {
    setFiltersState((prev) => ({
      ...prev,
      filters: [],
      page: 1
    }));
  };

  if (loading) {
    return <Loader />;
  }

  if (!threadData) {
    return <div>Thread not found</div>;
  }

  const providerAccountId = session?.user?.id || '';

  // Extract active filters from global state
  const activeHashtags =
    filtersState.filters
      .find((f) => f.name === 'tags')
      ?.value?.split(',')
      ?.map((tag) => tag.trim())
      ?.filter(Boolean) || [];

  const authorFilter = filtersState.filters.find((f) => f.name === 'author');
  const activeMentions = authorFilter?.value ? [authorFilter.value] : [];

  const hasActiveFilters =
    activeHashtags.length > 0 || activeMentions.length > 0;

  // Convert to format expected by Thread component
  const activeFilters = {
    hashtags: activeHashtags,
    mentions: activeMentions
  };

  return (
    <SpacingThemeProvider>
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
        <PageContent>
          <article className={styles.thread__container}>
            <FadeIn className={styles.thread__fade}>
              <Card width="full" className={styles.thread__item}>
                <Suspense fallback={<Loader />}>
                  <Thread
                    submissionId={submissionId}
                    providerAccountId={providerAccountId}
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
