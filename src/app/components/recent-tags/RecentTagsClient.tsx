'use client';

import { useMemo, useState } from 'react';
import { CustomSession } from '../../../auth.config';
import { useSimpleUrlFilters } from '../../../lib/state/submissions/useSimpleUrlFilters';
import { RECENT_TAGS_SELECTORS } from '../../../lib/test-selectors/components/recent-tags.selectors';
import Empty from '../empty/Empty';
import Loader from '../loader/Loader';
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
  const { filters, addFilter, removeFilter } = useSimpleUrlFilters();

  // Extract current tags and logic from URL-first filters
  const tagFilters = filters.filter((f) => f.name === 'tags');
  const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');

  // Extract current tags from individual filter entries
  const currentTags = tagFilters.map((filter) => {
    const tag = filter.value;
    return tag.startsWith('#') ? tag : `#${tag}`;
  });

  const currentTagLogic = tagLogicFilter?.value || 'OR';

  // Memoize tag-related state to prevent unnecessary re-renders
  const tagState = useMemo(
    () => ({
      currentTags,
      currentTagLogic,
      tagFilters,
      tagLogicFilter
    }),
    [currentTags.join(','), currentTagLogic]
  );

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
    // Format tag consistently
    const formattedTag = tag.startsWith('#') ? tag.slice(1) : tag; // Remove # for URL consistency
    const displayTag = tag.startsWith('#') ? tag : `#${tag}`;
    const isSelected = tagState.currentTags.includes(displayTag);

    if (isSelected) {
      // Remove tag - remove the specific tag filter entry
      removeFilter('tags', formattedTag);

      // Check if we need to remove tagLogic
      const remainingTagFilters = tagFilters.filter(
        (f) => f.value !== formattedTag
      );
      if (remainingTagFilters.length <= 1) {
        removeFilter('tagLogic');
      }
    } else {
      // Add tag first
      addFilter({ name: 'tags', value: formattedTag });

      // Add tagLogic if we'll have multiple tags and don't already have it
      const existingTagFilters = tagFilters.length;
      const willHaveMultipleTags = existingTagFilters >= 1;

      if (willHaveMultipleTags && !tagLogicFilter) {
        addFilter({ name: 'tagLogic', value: 'OR' });
      }
    }
  };

  const handleLogicToggle = () => {
    const newLogic = tagState.currentTagLogic === 'OR' ? 'AND' : 'OR';

    // Update logic filter if we have multiple tags
    if (tagState.currentTags.length > 1) {
      // Remove existing tagLogic and add new one
      removeFilter('tagLogic');
      addFilter({ name: 'tagLogic', value: newLogic });
    }
  };

  // Sort tags by usage (most used first) with current tags prioritized
  const sortedTags = useMemo(() => {
    return [...recentTags.tags].sort((a, b) => {
      const aFormatted = a.startsWith('#') ? a : `#${a}`;
      const bFormatted = b.startsWith('#') ? b : `#${b}`;

      const aIsActive = tagState.currentTags.includes(aFormatted);
      const bIsActive = tagState.currentTags.includes(bFormatted);

      // Active tags first
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // Then alphabetical
      return a.localeCompare(b);
    });
  }, [recentTags.tags, tagState.currentTags]);

  return (
    <article className="recent-tags" data-testid={RECENT_TAGS_SELECTORS.TITLE}>
      <div className="recent-tags__header">
        <h2 className="recent-tags__title">Recent Tags</h2>
        {tagState.currentTags.length > 1 && (
          <div className="recent-tags__logic-control">
            <button
              className={`recent-tags__logic-button ${
                tagState.currentTagLogic === 'AND'
                  ? 'recent-tags__logic-button--and'
                  : 'recent-tags__logic-button--or'
              }`}
              onClick={handleLogicToggle}
              title={`Current: Show posts with ${tagState.currentTagLogic === 'AND' ? 'ALL' : 'ANY'} selected tags. Click to toggle.`}
            >
              {tagState.currentTagLogic}
            </button>
          </div>
        )}
        <button
          className="recent-tags__refresh"
          onClick={refreshTags}
          disabled={loading}
          title="Refresh recent tags"
        >
          🔄
        </button>
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
              const isActive = tagState.currentTags.includes(formattedTag);

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
