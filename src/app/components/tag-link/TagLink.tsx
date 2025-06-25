'use client';
import { useAtom } from 'jotai';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import { InstantLink } from '../ui/InstantLink';
import './TagLink.css';

interface TagLinkProps {
  value: string;
  contextId: string;
  appendSearchParam?: boolean;
  onTagClick?: (tag: string) => void;
}

/**
 * Internal TagLink component that uses useSearchParams
 */
function TagLinkInternal({
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

  // Check if we're on a thread page
  const isThreadPage = pathname.startsWith('/t/');

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

    // For thread pages, navigate to posts with filters only if no onTagClick callback
    // If onTagClick is provided (thread filtering), we'll use that instead
    const targetPath = isThreadPage && !onTagClick ? NAV_PATHS.POSTS : pathname;
    return `${targetPath}${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const sanitizedTag = value.trim();
    if (!sanitizedTag || sanitizedTag.length > 50) {
      console.warn('Invalid tag:', value);
      return;
    }

    // If parent provides onTagClick callback, use it and prevent navigation
    if (onTagClick) {
      event.preventDefault();
      onTagClick(sanitizedTag);
      return;
    }

    // For thread pages without onTagClick callback, allow navigation to posts
    // For other pages, let the Link component handle navigation normally
  };

  // Check if this tag is currently active based on context
  let isActive = false;

  if (isThreadPage && onTagClick) {
    // For thread pages with filtering, check the filter state
    const activeHashtags =
      filtersState.filters
        .find((f) => f.name === 'tags')
        ?.value?.split(',')
        ?.map((tag) => tag.trim())
        ?.filter(Boolean) || [];

    const tagValue = value.startsWith('#') ? value : `#${value}`;
    isActive = activeHashtags.includes(tagValue);
  } else {
    // For posts pages or thread pages without filtering, check URL params
    const currentTags =
      searchParams
        .get('tags')
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) || [];
    isActive = currentTags.includes(value);
  }

  const tagUrl = generateTagUrl();

  return (
    <InstantLink
      href={tagUrl}
      className={`tag-link ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      title={`Filter by tag: ${value}`}
    >
      {value}
    </InstantLink>
  );
}

/**
 * A component that returns a Next.js Link component that navigates with a filter applied
 * @example <TagLink value="bacon" /> => a link that navigates to current route with tags=bacon filter
 */
export function TagLink(props: TagLinkProps) {
  return (
    <Suspense fallback={<span className="tag-link">{props.value}</span>}>
      <TagLinkInternal {...props} />
    </Suspense>
  );
}
