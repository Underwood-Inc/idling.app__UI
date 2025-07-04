'use client';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { CustomSession } from '../../../auth.config';
import {
  getSubmissionsFiltersAtom,
  getSubmissionsStateAtom
} from '../../../lib/state/atoms';
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

  // Use shared Jotai atoms directly for state synchronization
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

  // We also need access to the submissions state to set loading immediately
  const [, setSubmissionsState] = useAtom(getSubmissionsStateAtom(contextId));

  // Extract current tags and logic from shared filters with null checks
  const filters = filtersState?.filters || [];

  // Get all tag filters (each tag is now a separate filter entry)
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
      // Remove tag - remove the specific tag filter entry
      setFiltersState((prevState) => {
        const newFilters = prevState.filters.filter((filter) => {
          if (filter.name === 'tags') {
            const filterTag = filter.value.startsWith('#')
              ? filter.value
              : `#${filter.value}`;
            return filterTag !== formattedTag;
          }
          return true;
        });

        // If no tag filters remain, also remove tagLogic
        const remainingTagFilters = newFilters.filter((f) => f.name === 'tags');
        const finalFilters =
          remainingTagFilters.length > 0
            ? newFilters
            : newFilters.filter((f) => f.name !== 'tagLogic');

        return {
          ...prevState,
          filters: finalFilters,
          page: 1
        };
      });
    } else {
      // Add tag - add a new tag filter entry
      setFiltersState((prevState) => {
        // Check if there are already tag filters
        const existingTagFilters = prevState.filters.filter(
          (f) => f.name === 'tags'
        );
        const willHaveMultipleTags = existingTagFilters.length >= 1; // Will have multiple after adding this one

        const filtersToAdd = [{ name: 'tags', value: formattedTag }];

        // Add tagLogic if we'll have multiple tags and no tagLogic exists
        if (
          willHaveMultipleTags &&
          !prevState.filters.find((f) => f.name === 'tagLogic')
        ) {
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

      setFiltersState((prevState) => {
        // Remove existing tagLogic filter and add new one
        const newFilters = prevState.filters.filter(
          (f) => f.name !== 'tagLogic'
        );
        return {
          ...prevState,
          filters: [...newFilters, { name: 'tagLogic', value: newLogic }],
          page: 1
        };
      });
    }
  };

  // Sort tags so selected ones appear at the top
  const sortedTags = useMemo(() => {
    const selectedTags: string[] = [];
    const unselectedTags: string[] = [];

    recentTags.tags.forEach((tag) => {
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      const isActive = tagState.currentTags.includes(formattedTag);

      if (isActive) {
        selectedTags.push(tag);
      } else {
        unselectedTags.push(tag);
      }
    });

    return [...selectedTags, ...unselectedTags];
  }, [recentTags.tags, tagState.currentTags]);

  if (loading) {
    return <RecentTagsLoader />;
  }

  return (
    <article className="recent-tags" data-testid={RECENT_TAGS_SELECTORS.TITLE}>
      <div className="recent-tags__container">
        <div className="recent-tags__header">
          <h3 className="recent-tags__title" title={stableTitle}>
            {stableTitle}
          </h3>
          {tagState.currentTags.length > 1 && (
            <button
              className={`recent-tags__logic-toggle recent-tags__logic-toggle--${tagState.currentTagLogic.toLowerCase()}`}
              onClick={handleLogicToggle}
              title={
                `Currently showing posts with ${tagState.currentTagLogic === 'OR' ? 'any' : 'all'} of the selected tags. ` +
                `Click to switch to ${tagState.currentTagLogic === 'OR' ? 'all' : 'any'}.`
              }
            >
              {tagState.currentTagLogic}
            </button>
          )}
        </div>

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
    </article>
  );
}
