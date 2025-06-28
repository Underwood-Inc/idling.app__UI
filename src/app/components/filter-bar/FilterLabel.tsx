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
  onRemoveFilter?: (filterName: string, filterValue?: string) => void;
}) {
  const [displayLabel, setDisplayLabel] = useState(label);
  const [isLoading, setIsLoading] = useState(false);

  // Simplified display logic - resolve userId to username for display
  useEffect(() => {
    const resolveUserDisplay = async () => {
      // Check if this looks like a user ID that needs resolution (numeric or UUID-like)
      const isUserIdFormat = (value: string) => {
        return (
          /^\d+$/.test(value) || // Numeric ID
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value
          )
        ); // UUID
      };

      // Check if this looks like a valid username (alphanumeric, underscore, hyphen)
      const isUsernameFormat = (value: string) => {
        return /^[a-zA-Z0-9_-]+$/.test(value) && value.length >= 2;
      };

      // Check if this is the new combined format (username|userId)
      const isCombinedFormat = (value: string) => {
        return value.includes('|') && value.split('|').length === 2;
      };

      // Handle tags filter - ensure # prefix
      if (name === 'tags') {
        const tagValue = label.startsWith('#') ? label : `#${label}`;
        setDisplayLabel(tagValue);
        setIsLoading(false);
        return;
      }

      // Handle search filter - split unquoted words but keep quoted text atomic
      if (name === 'search') {
        setDisplayLabel(label); // Keep as-is, will be handled in rendering
        setIsLoading(false);
        return;
      }

      // Handle combined format for mentions (username|userId)
      if (
        (name === 'mentions' || name === 'author') &&
        isCombinedFormat(label)
      ) {
        const [username, userId] = label.split('|');
        // Display format: @[username|userID] (structured format for ContentWithPills)
        setDisplayLabel(`@[${username}|${userId}]`);
        setIsLoading(false);
        return;
      }

      // Check if we need async resolution for display purposes
      let needsAsyncResolution = false;

      if (
        name === 'author' &&
        label &&
        !label.startsWith('@') &&
        isUserIdFormat(label)
      ) {
        needsAsyncResolution = true;
      } else if (
        name === 'mentions' &&
        label &&
        !label.startsWith('@') &&
        isUsernameFormat(label) &&
        !isCombinedFormat(label)
      ) {
        // Only need async resolution for mentions if it's a plain username (not combined format)
        needsAsyncResolution = true;
      }

      if (needsAsyncResolution) {
        setIsLoading(true);
      }

      if (
        name === 'author' &&
        label &&
        !label.startsWith('@') &&
        isUserIdFormat(label)
      ) {
        // Author filter: label is a userId, resolve to username for display
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
        } finally {
          setIsLoading(false);
        }
      } else if (
        name === 'mentions' &&
        label &&
        !label.startsWith('@') &&
        isUsernameFormat(label) &&
        !isCombinedFormat(label)
      ) {
        // Mentions filter: label is a username, use as-is for display
        setDisplayLabel(`@${label}`);
        setIsLoading(false);
      } else {
        // Already formatted, plain text, or other types - no loading needed
        setDisplayLabel(label);
        setIsLoading(false);
      }
    };

    resolveUserDisplay();
  }, [name, label, displayLabel]);

  const handleTagClick = (tagValue: string) => {
    // FilterBar now preserves the correct format, so use the label directly
    onRemoveTag(label);
  };

  const handleMentionClick = (
    mentionValue: string,
    filterType?: 'author' | 'mentions'
  ) => {
    // Always use the original label for removal since that's what's actually stored
    // The label contains the exact value that was used to create the filter

    if (name === 'author' && onRemoveFilter) {
      // For author filters, label is the userId that was stored
      onRemoveFilter('author', label);
    } else if (name === 'mentions' && onRemoveFilter) {
      // For mentions filters, label is the username that was stored
      onRemoveFilter('mentions', label);
    } else {
      // Fallback to tag removal with original label
      onRemoveTag(label);
    }
  };

  // Handle filter type toggle for user mention pills
  const handleFilterTypeToggle = () => {
    if (!onRemoveFilter) return;

    // Parse the display label to get user info
    const mentionMatch = displayLabel.match(/^@\[([^|]+)\|([^\]]+)\]$/);
    if (!mentionMatch) return;

    const [, username, userId] = mentionMatch;

    // Determine new filter type
    const newFilterType = name === 'author' ? 'mentions' : 'author';

    // Remove current filter
    if (name === 'author') {
      onRemoveFilter('author', label);
    } else if (name === 'mentions') {
      onRemoveFilter('mentions', label);
    }

    // Add new filter with appropriate value format
    // We need to import the filter addition function
    setTimeout(() => {
      // This is a bit hacky, but we need to trigger the parent to add the new filter
      // Since we don't have direct access to onAddFilter here, we'll use a custom event
      const filterChangeEvent = new CustomEvent('filterTypeChange', {
        detail: {
          filterType: newFilterType,
          // For author filters, backend expects just userId
          // For mentions filters, we store combined format for display consistency
          value: newFilterType === 'author' ? userId : `${username}|${userId}`,
          oldFilterType: name,
          oldValue: label
        }
      });
      window.dispatchEvent(filterChangeEvent);
    }, 0);
  };

  // Handle search text removal
  const handleSearchTextClick = (searchText: string) => {
    if (onRemoveFilter) {
      // Parse the current search text to get all parts
      const searchParts = parseSearchText(displayLabel);

      // Remove the specific clicked part
      const remainingParts = searchParts.filter((part) => {
        // For quoted parts, the button shows "text" but part.text is just text
        // For unquoted parts, both should match exactly
        let partDisplay;

        if (part.isQuoted) {
          partDisplay = `"${part.text}"`;
        } else {
          partDisplay = part.text;
        }

        // The clicked text should match exactly what we display
        const clickedDisplay = searchText;

        return partDisplay !== clickedDisplay;
      });

      if (remainingParts.length > 0) {
        // Reconstruct the search text with remaining parts
        const newSearchText = remainingParts
          .map((part) => (part.isQuoted ? `"${part.text}"` : part.text))
          .join(' ');

        // Use special format to signal partial removal - this handles both removal and update
        onRemoveTag(`search:${searchText}:${newSearchText}`);
      } else {
        // No remaining parts, remove the entire search filter
        onRemoveFilter('search', label);
      }
    } else {
      onRemoveTag(label);
    }
  };

  // Parse search text to handle quoted vs unquoted content
  const parseSearchText = (text: string) => {
    const parts: Array<{ text: string; isQuoted: boolean }> = [];
    const regex = /"([^"]+)"|(\S+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const quotedText = match[1]; // Captured quoted content
      const unquotedText = match[2]; // Captured unquoted content

      if (quotedText) {
        // Quoted text - keep as atomic unit
        parts.push({ text: quotedText, isQuoted: true });
      } else if (unquotedText) {
        // Unquoted text - can be split
        parts.push({ text: unquotedText, isQuoted: false });
      }
    }

    return parts;
  };

  // Show loading state for user mention filters while resolving (only for those that need resolution)
  if (isLoading) {
    return (
      <div className="filter-bar__filter-value filter-bar__filter-value--loading">
        <span className="filter-bar__filter-loading-indicator">
          <span className="filter-bar__filter-loading-spinner"></span>
          {name === 'tags'
            ? '#'
            : name === 'author' || name === 'mentions'
              ? '@'
              : ''}
          {label}
        </span>
        <span
          className="filter-bar__filter-remove"
          aria-hidden="true"
          onClick={() => {
            if (name === 'author' && onRemoveFilter) {
              onRemoveFilter('author', label);
            } else if (name === 'mentions' && onRemoveFilter) {
              onRemoveFilter('mentions', label);
            } else {
              onRemoveTag(label);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          ×
        </span>
      </div>
    );
  }

  // Special handling for search filters
  if (name === 'search') {
    const searchParts = parseSearchText(displayLabel);

    return (
      <div className="filter-bar__search-terms">
        {searchParts.map((part, index) => {
          // Calculate the display format that matches what handleSearchTextClick expects
          const displayFormat = part.isQuoted ? `"${part.text}"` : part.text;

          return (
            <button
              key={`search-${index}-${part.text}`}
              className={`filter-bar__filter-value ${part.isQuoted ? 'filter-bar__filter-value--quoted' : 'filter-bar__filter-value--word'}`}
              onClick={() => handleSearchTextClick(displayFormat)}
              aria-label={`Remove search term: ${part.text}`}
              title={
                part.isQuoted
                  ? `Quoted search: "${part.text}"`
                  : `Search word: ${part.text}`
              }
            >
              {part.isQuoted ? `"${part.text}"` : part.text}
              <span className="filter-bar__filter-remove" aria-hidden="true">
                ×
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Special handling for user mention pills with filter type controls
  if (
    (name === 'author' || name === 'mentions') &&
    displayLabel.startsWith('@')
  ) {
    return (
      <div className="filter-bar__mention-pill-wrapper">
        <ContentWithPills
          content={displayLabel}
          contextId={filterId}
          isFilterBarContext={true}
          onHashtagClick={handleTagClick}
          onMentionClick={handleMentionClick}
          className="filter-bar__filter-pill"
        />
        <button
          type="button"
          className={`filter-bar__filter-type-toggle filter-bar__filter-type-toggle--${name}`}
          onClick={handleFilterTypeToggle}
          title={`Current: ${name === 'author' ? 'Author' : 'Mentions'} filter. Click to toggle.`}
        >
          {name === 'author' ? 'BY' : 'IN'}
        </button>
      </div>
    );
  }

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
          onRemoveFilter('author', label);
        } else if (name === 'mentions' && onRemoveFilter) {
          onRemoveFilter('mentions', label);
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
