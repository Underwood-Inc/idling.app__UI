'use client';
import { useEffect, useState } from 'react';
import { ContentWithPills } from '../ui/ContentWithPills';
import './FilterBar.css';

export function FilterLabel({
  name,
  label,
  filterId,
  onRemoveTag,
  onRemoveFilter
}: {
  name: string;
  label: string;
  filterId: string;
  onRemoveTag: (tagToRemove: string) => void;
  onRemoveFilter?: (filterName: string) => void;
}) {
  const [displayLabel, setDisplayLabel] = useState(label);

  // Simplified display logic - resolve userId to username for display
  useEffect(() => {
    const resolveUserDisplay = async () => {
      if (name === 'author' && label && !label.startsWith('@')) {
        // Author filter: label is always a userId, resolve to username for display
        try {
          const { resolveUserIdToUsername } = await import(
            '../../../lib/actions/search.actions'
          );
          const username = await resolveUserIdToUsername(label);
          if (username) {
            // Display format: @[username|userID] (structured format for ContentWithPills)
            setDisplayLabel(`@[${username}|${label}]`);
          } else {
            // Fallback: show userId with @ prefix
            setDisplayLabel(`@${label}`);
          }
        } catch (error) {
          console.error('Error resolving user ID to username:', error);
          setDisplayLabel(`@${label}`);
        }
      } else if (name === 'mentions' && label && !label.startsWith('@')) {
        // Mentions filter: label is username, need to get userId for display consistency
        try {
          const { getUserInfo } = await import(
            '../../../lib/actions/search.actions'
          );
          const userInfo = await getUserInfo(label);
          if (userInfo && userInfo.userId) {
            // Display format: @[username|userID] (structured format for ContentWithPills)
            setDisplayLabel(`@[${userInfo.username}|${userInfo.userId}]`);
          } else {
            // Fallback: show username with @ prefix
            setDisplayLabel(`@${label}`);
          }
        } catch (error) {
          console.error(
            'Error resolving username to user ID for display:',
            error
          );
          setDisplayLabel(`@${label}`);
        }
      } else {
        // Already formatted or other types
        setDisplayLabel(label);
      }
    };

    resolveUserDisplay();
  }, [name, label]);

  const handleTagClick = (tagValue: string) => {
    // For hashtag filters in tag lists, remove the specific tag
    onRemoveTag(tagValue);
  };

  const handleMentionClick = (
    mentionValue: string,
    filterType?: 'author' | 'mentions'
  ) => {
    // For author and mentions filters, remove the entire filter (not individual tags)
    if (name === 'author' && onRemoveFilter) {
      onRemoveFilter('author');
    } else if (name === 'mentions' && onRemoveFilter) {
      onRemoveFilter('mentions');
    } else {
      // Fallback to removeTag if no removeFilter provided
      onRemoveTag(label);
    }
  };

  // If the display label starts with # or @, use ContentWithPills for proper styling
  if (displayLabel.startsWith('#') || displayLabel.startsWith('@')) {
    return (
      <ContentWithPills
        content={displayLabel}
        contextId={filterId}
        isFilterBarContext={true}
        onHashtagClick={handleTagClick}
        onMentionClick={handleMentionClick}
        className="filter-bar__filter-pill"
      />
    );
  }

  // Fallback for plain text labels
  return (
    <button
      className="filter-bar__filter-value"
      onClick={() => {
        if (name === 'author' && onRemoveFilter) {
          onRemoveFilter('author');
        } else if (name === 'mentions' && onRemoveFilter) {
          onRemoveFilter('mentions');
        } else {
          onRemoveTag(label);
        }
      }}
      aria-label={`Remove ${displayLabel} filter`}
    >
      {displayLabel}
      <span className="filter-bar__filter-remove" aria-hidden="true">
        ×
      </span>
    </button>
  );
}
