'use client';
import { useAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import './TagLink.css';

interface TagLinkProps {
  value: string;
  contextId: string;
  appendSearchParam?: boolean;
  onTagClick?: (tag: string) => void;
}

/**
 * A component that will return a nextjs link component instance that navigates to the /posts page with a filter applied that
 * matches the TagLink
 * @example <TagLink value="bacon" /> => a link that navigates to '/posts?tags=bacon'
 */
export function TagLink({
  value,
  contextId,
  appendSearchParam = false,
  onTagClick
}: TagLinkProps) {
  const searchParams = useSearchParams();

  // Use shared Jotai atoms directly for state synchronization
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    // Sanitize tag input but preserve the hash symbol
    const sanitizedTag = value.trim();
    if (!sanitizedTag || sanitizedTag.length > 50) {
      console.warn('Invalid tag:', value);
      return;
    }

    // If parent provides onTagClick callback, use it (highest priority)
    if (onTagClick) {
      onTagClick(sanitizedTag);
      return;
    }

    // Use direct state management via shared atoms
    setFiltersState((prev) => {
      const newFilters = [...prev.filters];

      // Check if tags filter already exists
      const tagsIndex = newFilters.findIndex((f) => f.name === 'tags');

      if (tagsIndex >= 0) {
        // Update existing tags filter by appending the new tag
        const currentTags = newFilters[tagsIndex].value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        // Only add if not already present
        if (!currentTags.includes(sanitizedTag)) {
          const updatedTags = [...currentTags, sanitizedTag];
          newFilters[tagsIndex] = {
            name: 'tags',
            value: updatedTags.join(',')
          };

          // Add tagLogic if we now have multiple tags
          if (updatedTags.length > 1) {
            const logicIndex = newFilters.findIndex(
              (f) => f.name === 'tagLogic'
            );
            if (logicIndex === -1) {
              newFilters.push({ name: 'tagLogic', value: 'OR' });
            }
          }
        }
      } else {
        // Add new tags filter
        newFilters.push({ name: 'tags', value: sanitizedTag });
      }

      return {
        ...prev,
        filters: newFilters,
        page: 1 // Reset to first page when adding filters
      };
    });
  };

  // Check if this tag is currently active using shared state
  const tagsFilter = filtersState?.filters?.find((f) => f.name === 'tags');
  const currentTags = tagsFilter
    ? tagsFilter.value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  const isActive = currentTags.includes(value);

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`tag-link ${isActive ? 'active' : ''}`}
      title={`Filter by tag: ${value}`}
    >
      {value}
    </a>
  );
}
