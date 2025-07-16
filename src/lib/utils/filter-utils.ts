// Import the actual Filter interface used by useSimpleUrlFilters
interface Filter {
  name: string;
  value: string;
}

/**
 * Reusable tag filter logic used across multiple components
 * This ensures consistent behavior for tag add/remove operations
 */
export function handleTagFilter(
  tag: string,
  currentFilters: Filter[],
  addFilter: (filter: Filter) => void,
  removeFilter: (name: string, value?: string) => void,
  updateUrl?: (filters: Filter[]) => void
) {
  // Normalize tag (remove # prefix for storage consistency)
  const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;

  // Get current tag filters
  const currentTagFilters = currentFilters.filter((f) => f.name === 'tags');
  const tagLogicFilter = currentFilters.find((f) => f.name === 'tagLogic');

  // Check if tag is currently active
  const isTagActive = currentTagFilters.some((f) => {
    const filterValue = f.value.startsWith('#') ? f.value.slice(1) : f.value;
    return filterValue === normalizedTag;
  });

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('🔍 handleTagFilter DEBUG:', {
      originalTag: tag,
      normalizedTag,
      isTagActive,
      currentTagFilters: currentTagFilters.map((f) => ({
        name: f.name,
        value: f.value
      })),
      tagLogicFilter: tagLogicFilter
        ? { name: tagLogicFilter.name, value: tagLogicFilter.value }
        : null,
      allFilters: currentFilters.map((f) => ({ name: f.name, value: f.value }))
    });
  }

  if (isTagActive) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🗑️ ATOMIC REMOVAL of tag:', normalizedTag);
    }

    // ATOMIC APPROACH: Build final state and update once
    if (updateUrl) {
      // Calculate remaining tag filters after removal
      const remainingTagFilters = currentTagFilters.filter((f) => {
        const filterValue = f.value.startsWith('#')
          ? f.value.slice(1)
          : f.value;
        return filterValue !== normalizedTag;
      });

      // Build new complete filter array
      let newFilters = currentFilters.filter((f) => {
        // Remove the specific tag
        if (f.name === 'tags') {
          const filterValue = f.value.startsWith('#')
            ? f.value.slice(1)
            : f.value;
          return filterValue !== normalizedTag;
        }
        // Remove tagLogic if we'll have <= 1 tags
        if (f.name === 'tagLogic' && remainingTagFilters.length <= 1) {
          return false;
        }
        // Keep all other filters
        return true;
      });

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          '🗑️ ATOMIC UPDATE - new filters:',
          newFilters.map((f) => ({ name: f.name, value: f.value }))
        );
      }

      // Single atomic update
      updateUrl(newFilters);
    } else {
      // Fallback to old method (but this has race conditions)
      removeFilter('tags', normalizedTag);

      const remainingTagFilters = currentTagFilters.filter((f) => {
        const filterValue = f.value.startsWith('#')
          ? f.value.slice(1)
          : f.value;
        return filterValue !== normalizedTag;
      });

      if (remainingTagFilters.length <= 1 && tagLogicFilter) {
        setTimeout(() => removeFilter('tagLogic'), 0);
      }
    }
  } else {
    // Add the tag
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('➕ ADDING tag:', normalizedTag);
    }
    addFilter({ name: 'tags', value: normalizedTag });

    // Add tagLogic if we'll have multiple tags and don't already have it
    if (currentTagFilters.length >= 1 && !tagLogicFilter) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('➕ ADDING tagLogic: OR');
      }
      addFilter({ name: 'tagLogic', value: 'OR' });
    }
  }
}

/**
 * Reusable mention filter logic used across multiple components
 * This ensures consistent behavior for mention add/remove operations
 */
export function handleMentionFilter(
  mentionValue: string,
  currentFilters: Filter[],
  addFilter: (filter: Filter) => void,
  removeFilter: (name: string, value?: string) => void,
  updateUrl?: (filters: Filter[]) => void
) {
  // Get current author filters
  const currentAuthorFilters = currentFilters.filter(
    (f) => f.name === 'author'
  );

  // Check if mention is currently active
  const isMentionActive = currentAuthorFilters.some(
    (f) => f.value === mentionValue
  );

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('🔍 handleMentionFilter DEBUG:', {
      mentionValue,
      isMentionActive,
      currentAuthorFilters: currentAuthorFilters.map((f) => ({
        name: f.name,
        value: f.value
      })),
      allFilters: currentFilters.map((f) => ({ name: f.name, value: f.value }))
    });
  }

  if (isMentionActive) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🗑️ REMOVING mention:', mentionValue);
    }

    // ATOMIC APPROACH: Build final state and update once
    if (updateUrl) {
      // Build new complete filter array
      const newFilters = currentFilters.filter((f) => {
        // Remove the specific author
        if (f.name === 'author' && f.value === mentionValue) {
          return false;
        }
        // Keep all other filters
        return true;
      });

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          '🗑️ ATOMIC UPDATE - new filters:',
          newFilters.map((f) => ({ name: f.name, value: f.value }))
        );
      }

      // Single atomic update
      updateUrl(newFilters);
    } else {
      // Fallback to old method
      removeFilter('author', mentionValue);
    }
  } else {
    // Add the mention
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('➕ ADDING mention:', mentionValue);
    }
    addFilter({ name: 'author', value: mentionValue });
  }
}

/**
 * Check if a tag is currently active in the filter set
 * NOTE: No debugging here to avoid render loops
 */
export function isTagActive(tag: string, currentFilters: Filter[]): boolean {
  const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;
  const currentTagFilters = currentFilters.filter((f) => f.name === 'tags');

  return currentTagFilters.some((f) => {
    const filterValue = f.value.startsWith('#') ? f.value.slice(1) : f.value;
    return filterValue === normalizedTag;
  });
}

/**
 * Check if a mention is currently active in the filter set
 * NOTE: No debugging here to avoid render loops
 */
export function isMentionActive(
  mentionValue: string,
  currentFilters: Filter[]
): boolean {
  const currentAuthorFilters = currentFilters.filter(
    (f) => f.name === 'author'
  );
  return currentAuthorFilters.some((f) => f.value === mentionValue);
}
