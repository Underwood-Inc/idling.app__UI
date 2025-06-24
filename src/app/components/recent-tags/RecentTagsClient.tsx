'use client';
import { useAtom } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import { CustomSession } from '../../../auth.config';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import { RECENT_TAGS_SELECTORS } from '../../../lib/test-selectors/components/recent-tags.selectors';
import { Card } from '../card/Card';
import Empty from '../empty/Empty';
import FancyBorder from '../fancy-border/FancyBorder';
import { getTagsFromSearchParams } from '../filter-bar/utils/get-tags';
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

  // Use shared Jotai atoms directly for state synchronization
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

  // Extract current tags and logic from shared filters with null checks
  const filters = filtersState?.filters || [];
  const tagsFilter = filters.find((f) => f.name === 'tags');
  const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
  const currentTags = tagsFilter
    ? getTagsFromSearchParams(tagsFilter.value)
    : [];
  const currentTagLogic = tagLogicFilter?.value || 'OR';

  // Memoize tag-related state to prevent unnecessary re-renders
  const tagState = useMemo(
    () => ({
      currentTags,
      currentTagLogic,
      tagsFilter,
      tagLogicFilter
    }),
    [currentTags.join(','), currentTagLogic]
  ); // Only depend on actual tag values

  // Stable title that doesn't change on hover - no more flickering
  const stableTitle = useMemo(() => {
    if (tagState.currentTags.length === 0) {
      return 'Recent Tags';
    }

    if (tagState.currentTags.length === 1) {
      return `Posts tagged: ${tagState.currentTags[0]}`;
    }

    const logicText = tagState.currentTagLogic === 'OR' ? 'any of' : 'all of';
    const tagList = tagState.currentTags.join(', ');
    return `Posts with ${logicText}: ${tagList}`;
  }, [tagState.currentTags, tagState.currentTagLogic]);

  // Ensure tagLogic filter exists when multiple tags are present
  // But avoid race conditions by only adding default logic if there are multiple tags
  // and no logic filter has been explicitly set recently
  // DISABLED: This is causing race conditions with FilterBar updates
  // useEffect(() => {
  //   if (
  //     tagState.currentTags.length > 1 &&
  //     !tagState.tagLogicFilter &&
  //     filtersState.initialized
  //   ) {
  //     // Only add default tagLogic if we're sure no other component is managing it
  //     // Check if there's a very recent change to avoid race conditions
  //     const timeoutId = setTimeout(() => {
  //       setFiltersState((current) => {
  //         // Double-check that we still need to add the logic filter
  //         const currentTagLogicFilter = current.filters.find((f) => f.name === 'tagLogic');
  //         const currentTagsFilter = current.filters.find((f) => f.name === 'tags');
  //
  //         if (currentTagsFilter && !currentTagLogicFilter) {
  //           const currentTagsArray = getTagsFromSearchParams(currentTagsFilter.value);
  //           if (currentTagsArray.length > 1) {
  //             const newFilters = [...current.filters];
  //             newFilters.push({
  //               name: 'tagLogic',
  //               value: 'OR' // Default to OR logic
  //             });
  //             return {
  //               ...current,
  //               filters: newFilters
  //             };
  //           }
  //         }
  //         return current;
  //       });
  //     }, 100); // Small delay to avoid race conditions with FilterBar updates

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [
  //   tagState.currentTags.length,
  //   tagState.tagLogicFilter,
  //   filtersState.initialized,
  //   setFiltersState
  // ]);

  // Fetch recent tags
  useEffect(() => {
    async function fetchTags() {
      if (!session?.user?.id && onlyMine) {
        return;
      }

      setLoading(true);
      const tags = await getRecentTags(
        'months',
        onlyMine && session?.user?.id ? session.user.id : undefined
      );
      setRecentTags(tags);
      setLoading(false);
    }

    // Initial fetch or when dependencies change
    fetchTags();
  }, [onlyMine, session]);

  const handleTagClick = (tag: string) => {
    // Ensure consistent formatting with # prefix
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    const isSelected = tagState.currentTags.includes(formattedTag);
    let newTags: string[];

    if (isSelected) {
      // Remove tag
      newTags = tagState.currentTags.filter((t) => t !== formattedTag);
    } else {
      // Add tag
      newTags = [...tagState.currentTags, formattedTag];
    }

    // Update shared atom state directly
    setFiltersState((prev) => {
      let newFilters = [...prev.filters];

      if (newTags.length > 0) {
        const tagsValue = newTags.join(',');

        // Update or add tags filter
        const tagsIndex = newFilters.findIndex((f) => f.name === 'tags');
        if (tagsIndex >= 0) {
          newFilters[tagsIndex] = { name: 'tags', value: tagsValue };
        } else {
          newFilters.push({ name: 'tags', value: tagsValue });
        }

        // Handle tagLogic filter
        if (newTags.length > 1) {
          const logicIndex = newFilters.findIndex((f) => f.name === 'tagLogic');
          if (logicIndex >= 0) {
            // Don't override existing tagLogic - just preserve whatever is there
            // This prevents race conditions with FilterBar updates
            // The existing value is already correct
          } else {
            // Only add new tagLogic if none exists, and use current state
            const currentLogic =
              prev.filters.find((f) => f.name === 'tagLogic')?.value || 'OR';
            newFilters.push({
              name: 'tagLogic',
              value: currentLogic
            });
          }
        } else {
          // Remove tagLogic for single tag
          newFilters = newFilters.filter((f) => f.name !== 'tagLogic');
        }
      } else {
        // Remove both tags and tagLogic filters
        newFilters = newFilters.filter(
          (f) => f.name !== 'tags' && f.name !== 'tagLogic'
        );
      }

      return {
        ...prev,
        filters: newFilters,
        page: 1 // Reset to first page
      };
    });
  };

  const handleLogicToggle = () => {
    const newLogic = tagState.currentTagLogic === 'OR' ? 'AND' : 'OR';

    // Update logic filter directly if we have multiple tags
    if (tagState.currentTags.length > 1) {
      setFiltersState((prev) => {
        const newFilters = [...prev.filters];
        const logicIndex = newFilters.findIndex((f) => f.name === 'tagLogic');

        if (logicIndex >= 0) {
          newFilters[logicIndex] = { name: 'tagLogic', value: newLogic };
        } else {
          newFilters.push({ name: 'tagLogic', value: newLogic });
        }

        return {
          ...prev,
          filters: newFilters
        };
      });
    }
  };

  if (loading) {
    return <RecentTagsLoader />;
  }

  return (
    <article className="recent-tags__article">
      <Card width="full" className="recent-tags__card">
        <FancyBorder className="recent-tags__fancy-border">
          <div className="recent-tags__container">
            <div
              data-testid={RECENT_TAGS_SELECTORS.TITLE}
              className="recent-tags__header"
            >
              <h3 className="recent-tags__title" title={stableTitle}>
                {stableTitle}
              </h3>
              {tagState.currentTags.length > 1 && (
                <div className="recent-tags__logic-toggle">
                  <span className="recent-tags__logic-label">Tags:</span>
                  <div className="recent-tags__logic-button-group">
                    <button
                      className={`recent-tags__logic-button ${
                        tagState.currentTagLogic === 'AND'
                          ? 'recent-tags__logic-button--active'
                          : ''
                      }`}
                      onClick={() => {
                        if (
                          tagState.currentTags.length > 1 &&
                          tagState.currentTagLogic !== 'AND'
                        ) {
                          handleLogicToggle();
                        }
                      }}
                      title="Show posts with ALL of the selected tags"
                    >
                      ALL
                    </button>
                    <button
                      className={`recent-tags__logic-button ${
                        tagState.currentTagLogic === 'OR'
                          ? 'recent-tags__logic-button--active'
                          : ''
                      }`}
                      onClick={() => {
                        if (
                          tagState.currentTags.length > 1 &&
                          tagState.currentTagLogic !== 'OR'
                        ) {
                          handleLogicToggle();
                        }
                      }}
                      title="Show posts with ANY of the selected tags"
                    >
                      ANY
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="recent-tags__content">
              {recentTags.tags.length > 0 && (
                <ol className="recent-tags__list">
                  {recentTags.tags.map((tag) => {
                    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                    const isActive =
                      tagState.currentTags.includes(formattedTag);
                    return (
                      <li key={tag} className="recent-tags__list-item">
                        <button
                          className={`recent-tags__tag-button ${isActive ? 'active' : ''}`}
                          onClick={() => handleTagClick(tag)}
                          title={
                            isActive
                              ? `Remove ${tag} filter`
                              : `Add ${tag} filter`
                          }
                        >
                          {tag}
                          {isActive && <span className="checkmark">✓</span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}

              {!recentTags.tags.length && <Empty label="No recent tags" />}
            </div>
          </div>
        </FancyBorder>
      </Card>
    </article>
  );
};

// Memoize the component to prevent unnecessary re-renders when parent components change due to pagination
export const RecentTagsClient = React.memo(
  RecentTagsClientComponent,
  (prevProps, nextProps) => {
    // Only re-render if contextId, onlyMine, or session changes
    // Don't re-render for pagination or other state changes
    return (
      prevProps.contextId === nextProps.contextId &&
      prevProps.onlyMine === nextProps.onlyMine &&
      prevProps.session?.user?.id === nextProps.session?.user?.id &&
      prevProps.initialRecentTags.tags.length ===
        nextProps.initialRecentTags.tags.length
    );
  }
);

export function RecentTagsLoader() {
  return (
    <article className="recent-tags__article">
      <Card width="full" className="recent-tags__card">
        <FancyBorder className="recent-tags__fancy-border">
          <div className="recent-tags__container">
            <div className="recent-tags__header">
              <h3 className="recent-tags__title" title="3 months">
                Recent Tags
              </h3>
            </div>
            <div className="recent-tags__content">
              <div className="recent-tags__loading">
                <Loader label="Loading recent tags..." color="black" />
              </div>
            </div>
          </div>
        </FancyBorder>
      </Card>
    </article>
  );
}
