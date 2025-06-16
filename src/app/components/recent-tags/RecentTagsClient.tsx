'use client';
import { useAtom } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import { CustomSession } from '../../../auth.config';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import { RECENT_TAGS_SELECTORS } from '../../../lib/test-selectors/components/recent-tags.selectors';
import { Card } from '../card/Card';
import Empty from '../empty/Empty';
import FancyBorder from '../fancy-border/FancyBorder';
import Loader from '../loader/Loader';
import { getRecentTags } from './actions';
import './RecentTags.css';

function getTagsFromSearchParams(tagsParam: string): string[] {
  if (!tagsParam) return [];
  return tagsParam
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

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
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

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

  // Debug effect to track state changes - only for tag-related changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('🏷️ [RECENT_TAGS] Tag state changed:', {
      contextId,
      currentTags: tagState.currentTags,
      currentTagLogic: tagState.currentTagLogic,
      tagFiltersCount: filters.filter(
        (f) => f.name === 'tags' || f.name === 'tagLogic'
      ).length
    });
  }, [contextId, tagState.currentTags, tagState.currentTagLogic]); // Only react to tag changes

  // eslint-disable-next-line no-console
  console.log('🏷️ [RECENT_TAGS] Current state:', {
    currentTags: tagState.currentTags,
    currentTagLogic: tagState.currentTagLogic,
    filtersCount: filters.length,
    usingSharedAtoms: true,
    filtersStateExists: !!filtersState
  });

  // Fetch recent tags
  useEffect(() => {
    async function fetchTags() {
      if (!session?.user?.providerAccountId && onlyMine) {
        return;
      }

      setLoading(true);
      const tags = await getRecentTags(
        'months',
        onlyMine && session?.user?.providerAccountId
          ? session.user.providerAccountId
          : undefined
      );
      setRecentTags(tags);
      setLoading(false);
    }

    // Initial fetch or when dependencies change
    fetchTags();
  }, [onlyMine, session]);

  const handleTagClick = (tag: string) => {
    // eslint-disable-next-line no-console
    console.log('🏷️ [RECENT_TAGS] Tag clicked:', {
      tag,
      currentTags: tagState.currentTags
    });

    const isSelected = tagState.currentTags.includes(tag);
    let newTags: string[];

    if (isSelected) {
      // Remove tag
      newTags = tagState.currentTags.filter((t) => t !== tag);
    } else {
      // Add tag
      newTags = [...tagState.currentTags, tag];
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
            newFilters[logicIndex] = {
              name: 'tagLogic',
              value: tagState.currentTagLogic
            };
          } else {
            newFilters.push({
              name: 'tagLogic',
              value: tagState.currentTagLogic
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

  const getSmartTitle = () => {
    const previewTag = hoveredTag;
    const activeTagsForPreview = previewTag
      ? tagState.currentTags.includes(previewTag)
        ? tagState.currentTags.filter((t) => t !== previewTag) // Removing
        : [...tagState.currentTags, previewTag] // Adding
      : tagState.currentTags;

    if (activeTagsForPreview.length === 0) {
      return 'Recent Tags';
    }

    if (activeTagsForPreview.length === 1) {
      return `Posts tagged with ${activeTagsForPreview[0]}`;
    }

    const logicText = tagState.currentTagLogic === 'OR' ? 'any of' : 'all of';
    const tagList = activeTagsForPreview.join(', ');
    return `Posts with ${logicText}: ${tagList}`;
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
              <h3 className="recent-tags__title" title={getSmartTitle()}>
                {getSmartTitle()}
              </h3>
              {tagState.currentTags.length > 1 && (
                <div className="recent-tags__logic-toggle">
                  <div
                    className={`toggle-slider ${tagState.currentTagLogic === 'AND' ? 'active' : ''}`}
                    onClick={handleLogicToggle}
                    role="button"
                    tabIndex={0}
                    aria-label={`Switch to ${tagState.currentTagLogic === 'OR' ? 'AND' : 'OR'} logic`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLogicToggle();
                      }
                    }}
                  >
                    <div className="toggle-track">
                      <span
                        className={`toggle-label left ${tagState.currentTagLogic === 'OR' ? 'active' : ''}`}
                      >
                        ANY
                      </span>
                      <span
                        className={`toggle-label right ${tagState.currentTagLogic === 'AND' ? 'active' : ''}`}
                      >
                        ALL
                      </span>
                      <div className="toggle-thumb"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="recent-tags__content">
              {recentTags.tags.length > 0 && (
                <ol className="recent-tags__list">
                  {recentTags.tags.map((tag) => {
                    const isActive = tagState.currentTags.includes(tag);
                    return (
                      <li key={tag} className="recent-tags__list-item">
                        <button
                          className={`recent-tags__tag-button ${isActive ? 'active' : ''}`}
                          onClick={() => handleTagClick(tag)}
                          onMouseEnter={() => setHoveredTag(tag)}
                          onMouseLeave={() => setHoveredTag(null)}
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
      prevProps.session?.user?.providerAccountId ===
        nextProps.session?.user?.providerAccountId &&
      prevProps.initialRecentTags.tags.length ===
        nextProps.initialRecentTags.tags.length
    );
  }
);

export function RecentTagsLoader() {
  return (
    <article className="recent-tags__container">
      <Card width="full">
        <FancyBorder className="recent-tags__fancy-border">
          <h3 title="3 months">Recent Tags</h3>
          <Loader label="" color="black" />
        </FancyBorder>
      </Card>
    </article>
  );
}
