'use client';
import { useSearchParams } from 'next/navigation';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
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

  // Get submissions manager for direct state management
  const { addFilter } = useSubmissionsManager({
    contextId
  });

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

    // Use direct state management instead of router navigation
    addFilter({ name: 'tags', value: sanitizedTag });
  };

  // Check if this tag is currently active
  const currentTags = searchParams.get('tags') || '';
  const isActive = currentTags.split(',').includes(value);

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
