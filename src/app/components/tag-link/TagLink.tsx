'use client';
import { NAV_PATHS } from '@lib/routes';
import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
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

  // Use the new URL-first filter system
  const { filters, addFilter, removeFilter } = useSimpleUrlFilters();

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

    // Normalize tag for comparison (remove # prefix if present)
    const normalizedTag = sanitizedTag.startsWith('#')
      ? sanitizedTag.slice(1)
      : sanitizedTag;
    const displayTag = `#${normalizedTag}`;

    // Check if tag is already in URL
    const isTagActive = currentTags.some((tag) => {
      const normalizedCurrentTag = tag.startsWith('#') ? tag.slice(1) : tag;
      return normalizedCurrentTag === normalizedTag;
    });

    if (isTagActive) {
      // Remove the tag
      const updatedTags = currentTags.filter((tag) => {
        const normalizedCurrentTag = tag.startsWith('#') ? tag.slice(1) : tag;
        return normalizedCurrentTag !== normalizedTag;
      });

      if (updatedTags.length > 0) {
        params.set('tags', updatedTags.join(','));
      } else {
        params.delete('tags');
        params.delete('tagLogic'); // Remove tagLogic when no tags remain
      }
    } else {
      // Add the tag
      const updatedTags = [...currentTags, normalizedTag];
      params.set('tags', updatedTags.join(','));

      // Add tagLogic if we have multiple tags
      if (updatedTags.length > 1) {
        params.set('tagLogic', 'OR');
      }
    }

    // Reset to first page when filters change
    params.set('page', '1');

    if (isThreadPage) {
      // Thread pages: go to posts page with filters
      return `${NAV_PATHS.POSTS}?${params.toString()}`;
    } else {
      // Posts pages: stay on current page with updated filters
      return `${pathname}?${params.toString()}`;
    }
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onTagClick) {
      onTagClick(value);
      return;
    }

    // Use URL-first system for state management
    const normalizedTag = value.startsWith('#') ? value.slice(1) : value;

    // Get current tag filters
    const currentTagFilters = filters.filter((f) => f.name === 'tags');
    const isTagActive = currentTagFilters.some((f) => {
      const filterValue = f.value.startsWith('#') ? f.value.slice(1) : f.value;
      return filterValue === normalizedTag;
    });

    if (isTagActive) {
      // Remove the tag
      removeFilter('tags', normalizedTag);

      // If no more tag filters remain, remove tagLogic as well
      const remainingTagFilters = currentTagFilters.filter((f) => {
        const filterValue = f.value.startsWith('#')
          ? f.value.slice(1)
          : f.value;
        return filterValue !== normalizedTag;
      });

      if (remainingTagFilters.length <= 1) {
        removeFilter('tagLogic');
      }
    } else {
      // Add the tag
      addFilter({ name: 'tags', value: normalizedTag });

      // Add tagLogic if we'll have multiple tags
      if (currentTagFilters.length >= 1) {
        addFilter({ name: 'tagLogic', value: 'OR' });
      }
    }
  };

  // Check if the tag is currently active based on URL-first filters
  const isActive = filters.some((f) => {
    if (f.name !== 'tags') return false;
    const filterValue = f.value.startsWith('#') ? f.value.slice(1) : f.value;
    const tagValue = value.startsWith('#') ? value.slice(1) : value;
    return filterValue === tagValue;
  });

  const tagUrl = generateTagUrl();

  return (
    <InstantLink
      href={tagUrl}
      className={`tag-link ${isActive ? 'active' : ''}`}
      onClick={handleTagClick}
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
