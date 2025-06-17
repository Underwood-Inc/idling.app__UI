'use client';
import { useEffect, useState } from 'react';
import { ContentWithPills } from '../ui/ContentWithPills';
import './FilterBar.css';

export function FilterLabel({
  name,
  label,
  filterId,
  onRemoveTag
}: {
  name: string;
  label: string;
  filterId: string;
  onRemoveTag: (tagToRemove: string) => void;
}) {
  const [displayLabel, setDisplayLabel] = useState(label);

  // For author filters, try to resolve user ID to username for better display
  useEffect(() => {
    const resolveAuthorDisplay = async () => {
      if (name === 'author' && label && !label.startsWith('@')) {
        // If the label doesn't start with @ and looks like it might be a user ID,
        // try to resolve it to a username for better display
        try {
          const { resolveUserIdToUsername } = await import(
            '../../../lib/actions/search.actions'
          );
          const username = await resolveUserIdToUsername(label);
          if (username) {
            setDisplayLabel(`@${username}`);
          } else {
            // If resolution fails, assume it's already a username and add @
            setDisplayLabel(label.startsWith('@') ? label : `@${label}`);
          }
        } catch (error) {
          console.error('Error resolving user ID to username:', error);
          // Fall back to original label with @ prefix if needed
          setDisplayLabel(label.startsWith('@') ? label : `@${label}`);
        }
      } else if (name === 'author' && !label.startsWith('@')) {
        // For author filters, ensure @ prefix
        setDisplayLabel(`@${label}`);
      }
    };

    resolveAuthorDisplay();
  }, [name, label]);

  const handleTagClick = (tagValue: string) => {
    // eslint-disable-next-line no-console
    console.log('🏷️ [FILTER_LABEL] Filter label clicked:', {
      name,
      label,
      tagValue,
      filterId
    });

    // Remove the specific tag
    onRemoveTag(tagValue);
  };

  const handleMentionClick = (mentionValue: string) => {
    // eslint-disable-next-line no-console
    console.log('👤 [FILTER_LABEL] Filter mention clicked:', {
      name,
      label,
      mentionValue,
      filterId
    });

    // For author filters, use the original label (user ID) for removal
    onRemoveTag(label); // Use original label, not display label
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
      onClick={() => onRemoveTag(label)}
      aria-label={`Remove ${displayLabel} filter`}
    >
      {displayLabel}
      <span className="filter-bar__filter-remove" aria-hidden="true">
        ×
      </span>
    </button>
  );
}
