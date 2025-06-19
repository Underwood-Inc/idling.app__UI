'use client';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV_PATHS } from '../../../lib/routes';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import './TagLink.css';

interface TagLinkProps {
  value: string;
  contextId: string;
  appendSearchParam?: boolean;
  onTagClick?: (tag: string) => void;
}

/**
 * A component that returns a Next.js Link component that navigates with a filter applied
 * @example <TagLink value="bacon" /> => a link that navigates to current route with tags=bacon filter
 */
export function TagLink({
  value,
  contextId,
  appendSearchParam = false,
  onTagClick
}: TagLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use shared Jotai atoms directly for state synchronization
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

  const generateTagUrl = (): string => {
    const params = new URLSearchParams(searchParams.toString());
    const sanitizedTag = value.trim();

    if (!sanitizedTag || sanitizedTag.length > 50) {
      return '#';
    }

    const currentTags =
      params
        .get('tags')
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) || [];

    if (appendSearchParam) {
      // Add tag if not already present
      if (!currentTags.includes(sanitizedTag)) {
        const newTags = [...currentTags, sanitizedTag];
        params.set('tags', newTags.join(','));
      }
    } else {
      // Toggle tag
      if (currentTags.includes(sanitizedTag)) {
        const newTags = currentTags.filter((tag) => tag !== sanitizedTag);
        if (newTags.length > 0) {
          params.set('tags', newTags.join(','));
        } else {
          params.delete('tags');
        }
      } else {
        const newTags = [...currentTags, sanitizedTag];
        params.set('tags', newTags.join(','));
      }
    }

    // Reset to first page when filters change
    params.delete('page');

    // For thread pages, navigate to posts with filters
    const targetPath = pathname.startsWith('/t/') ? NAV_PATHS.POSTS : pathname;
    return `${targetPath}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // If parent provides onTagClick callback, use it and prevent navigation
    if (onTagClick) {
      event.preventDefault();
      const sanitizedTag = value.trim();
      if (!sanitizedTag || sanitizedTag.length > 50) {
        console.warn('Invalid tag:', value);
        return;
      }
      onTagClick(sanitizedTag);
      return;
    }

    // Otherwise, let the Link component handle navigation
  };

  // Check if this tag is currently active
  const currentTags =
    searchParams
      .get('tags')
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) || [];
  const isActive = currentTags.includes(value);

  const tagUrl = generateTagUrl();

  return (
    <Link
      href={tagUrl}
      onClick={handleClick}
      className={`tag-link ${isActive ? 'active' : ''}`}
      title={`Filter by tag: ${value}`}
    >
      {value}
    </Link>
  );
}
