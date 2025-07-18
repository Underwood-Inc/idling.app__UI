'use client';

import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { RECENT_TAGS_SELECTORS } from '@lib/test-selectors/components/recent-tags.selectors';
import { handleTagFilter, isTagActive } from '@lib/utils/filter-utils';
import { useMemo, useState } from 'react';
import { CustomSession } from '../../../auth.config';
import Empty from '../empty/Empty';
import Loader from '../loader/Loader';
import { TagLogicToggle } from '../shared/TagLogicToggle';
import { getRecentTags } from './actions';
import './RecentTags.css';

const RecentTagsClientComponent = ({
  contextId,
  onlyMine,
  initialRecentTags,
  session
}: {
  contextId: string;
  onlyMine: boolean;
  initialRecentTags: { tags: string[] };
  session: CustomSession | null;
}) => {
  const [recentTags, setRecentTags] = useState(initialRecentTags);
  const [loading, setLoading] = useState(false);

  // Use the new URL-first filter system to match PostsManager
  const { filters, addFilter, removeFilter, updateUrl } = useSimpleUrlFilters();

  // Extract current tags and logic from URL-first filters
  const tagFilters = filters.filter((f) => f.name === 'tags');

  // Extract current tags from individual filter entries
  const currentTags = tagFilters.map((filter) => {
    const tag = filter.value;
    return tag.startsWith('#') ? tag : `#${tag}`;
  });

  // Auto-refresh tags when onlyMine changes
  const refreshTags = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const freshTags = await getRecentTags(
        'months',
        onlyMine && session?.user?.id ? session.user.id : undefined
      );
      setRecentTags(freshTags);
    } catch (error) {
      console.error('Failed to refresh recent tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        '🏷️ RecentTags click:',
        tag,
        '(active:',
        isTagActive(tag, filters),
        ')'
      );
    }

    // Use the reusable tag filter utility with atomic updates
    handleTagFilter(tag, filters, addFilter, removeFilter, updateUrl);
  };

  // Sort tags by usage (most used first) with current tags prioritized
  const sortedTags = useMemo(() => {
    return [...recentTags.tags].sort((a, b) => {
      const aIsActive = isTagActive(a, filters);
      const bIsActive = isTagActive(b, filters);

      // Active tags first
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // Then alphabetical
      return a.localeCompare(b);
    });
  }, [recentTags.tags, filters]);

  return (
    <article className="recent-tags" data-testid={RECENT_TAGS_SELECTORS.TITLE}>
      <div className="recent-tags__header">
        <h2 className="recent-tags__title">Recent Tags</h2>
        <div className="recent-tags__header-controls">
          <TagLogicToggle
            allTitle="Show posts with ALL selected tags"
            anyTitle="Show posts with ANY selected tags"
          />
          <button
            className="recent-tags__refresh"
            onClick={refreshTags}
            disabled={loading}
            title="Refresh recent tags"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="recent-tags__content">
        {loading ? (
          <div className="recent-tags__loading">
            <Loader />
          </div>
        ) : recentTags.tags.length > 0 ? (
          <div className="recent-tags__tags">
            {sortedTags.map((tag) => {
              const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
              const isActive = isTagActive(tag, filters);

              return (
                <button
                  key={tag}
                  className={`recent-tags__tag ${isActive ? 'recent-tags__tag--active' : ''}`}
                  onClick={() => handleTagClick(tag)}
                  title={
                    isActive
                      ? `Remove ${formattedTag} filter`
                      : `Filter by ${formattedTag}`
                  }
                >
                  {formattedTag}
                  {isActive && (
                    <span
                      className="recent-tags__tag-remove"
                      aria-hidden="true"
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <Empty label="No recent tags found" />
        )}
      </div>
    </article>
  );
};

export default RecentTagsClientComponent;

// Named exports for compatibility with existing imports
export const RecentTagsClient = RecentTagsClientComponent;

// Simple loader component for Suspense fallback
export const RecentTagsLoader = () => (
  <div className="recent-tags__loading">
    <div className="recent-tags__loading-spinner">Loading tags...</div>
  </div>
);
