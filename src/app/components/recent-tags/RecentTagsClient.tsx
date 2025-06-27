'use client';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { CustomSession } from '../../../auth.config';
import {
  getSubmissionsFiltersAtom,
  getSubmissionsStateAtom
} from '../../../lib/state/atoms';
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

  // We also need access to the submissions state to set loading immediately
  const [, setSubmissionsState] = useAtom(getSubmissionsStateAtom(contextId));

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
    // Simple approach: just update the filters and let useSubmissionsManager handle the rest
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    const isSelected = tagState.currentTags.includes(formattedTag);

    // Set loading state immediately when filter changes - this is the key fix!
    setSubmissionsState((prev) => ({
      ...prev,
      loading: true
    }));

    if (isSelected) {
      // Remove tag - simple filter update
      setFiltersState((prevState) => {
        const newFilters = prevState.filters
          .filter((filter) => {
            if (filter.name === 'tags') {
              const currentTags = filter.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              const updatedTags = currentTags.filter((t) => t !== formattedTag);
              return updatedTags.length > 0;
            }
            return true;
          })
          .map((filter) => {
            if (filter.name === 'tags') {
              const currentTags = filter.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              const updatedTags = currentTags.filter((t) => t !== formattedTag);
              return { ...filter, value: updatedTags.join(',') };
            }
            return filter;
          });

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
    } else {
      // Add tag - with automatic tagLogic for multiple tags
      setFiltersState((prevState) => {
        // Check if there are already tag filters
        const existingTagFilters = prevState.filters.filter(
          (f) => f.name === 'tags'
        );
        const willHaveMultipleTags = existingTagFilters.length >= 1; // Will have multiple after adding this one

        const filtersToAdd = [{ name: 'tags', value: formattedTag }];

        // Add tagLogic if we'll have multiple tags
        if (willHaveMultipleTags) {
          filtersToAdd.push({ name: 'tagLogic', value: 'OR' });
        }

        return {
          ...prevState,
          filters: [...prevState.filters, ...filtersToAdd],
          page: 1
        };
      });
    }
  };

  const handleLogicToggle = () => {
    const newLogic = tagState.currentTagLogic === 'OR' ? 'AND' : 'OR';

    // Update logic filter directly if we have multiple tags
    if (tagState.currentTags.length > 1) {
      // Set loading state immediately when filter changes
      setSubmissionsState((prev) => ({
        ...prev,
        loading: true
      }));

      setFiltersState((prevState) => ({
        ...prevState,
        filters: [...prevState.filters, { name: 'tagLogic', value: newLogic }],
        page: 1
      }));
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
export const RecentTagsClient = RecentTagsClientComponent;
// Temporarily disabled memo for debugging
// export const RecentTagsClient = React.memo(
//   RecentTagsClientComponent,
//   (prevProps, nextProps) => {
//     // Only re-render if contextId, onlyMine, or session changes
//     // Don't re-render for pagination or other state changes
//     return (
//       prevProps.contextId === nextProps.contextId &&
//       prevProps.onlyMine === nextProps.onlyMine &&
//       prevProps.session?.user?.id === nextProps.session?.user?.id &&
//       prevProps.initialRecentTags.tags.length ===
//         nextProps.initialRecentTags.tags.length
//     );
//   }
// );

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
