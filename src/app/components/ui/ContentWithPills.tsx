'use client';

import { useAtom } from 'jotai';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV_PATHS } from '../../../lib/routes';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import './ContentWithPills.css';

interface ContentWithPillsProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string) => void;
  className?: string;
  contextId?: string; // Add contextId for global filter integration
}

interface ContentSegment {
  type: 'text' | 'hashtag' | 'mention';
  value: string;
}

export function ContentWithPills({
  content,
  onHashtagClick,
  onMentionClick,
  className = '',
  contextId
}: ContentWithPillsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use global filter state with provided contextId or default fallback
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId || 'default')
  );

  const parseContent = (text: string): ContentSegment[] => {
    const segments: ContentSegment[] = [];

    // Improved regex to match hashtags and mentions without requiring spaces
    // This handles cases like "#ademptio#testimonium" or "@user1@user2"
    const regex = /([@#])([a-zA-Z0-9_-]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, symbol, value] = match;
      const matchStart = match.index;
      const matchEnd = matchStart + fullMatch.length;

      // Add text before the match
      if (matchStart > lastIndex) {
        const beforeText = text.slice(lastIndex, matchStart);
        if (beforeText) {
          segments.push({ type: 'text', value: beforeText });
        }
      }

      // Add the hashtag or mention
      if (symbol === '#') {
        segments.push({ type: 'hashtag', value });
      } else if (symbol === '@') {
        segments.push({ type: 'mention', value });
      }

      lastIndex = matchEnd;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return segments;
  };

  const generatePillUrl = (
    type: 'hashtag' | 'mention',
    value: string
  ): string => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === 'hashtag') {
      // Always handle hashtag filters
      const hashtagValue = value.startsWith('#') ? value : `#${value}`;
      const currentTags =
        params
          .get('tags')
          ?.split(',')
          .map((tag) => tag.trim())
          .filter(Boolean) || [];

      if (currentTags.includes(hashtagValue)) {
        // Remove the tag if it's already active
        const newTags = currentTags.filter((tag) => tag !== hashtagValue);
        if (newTags.length > 0) {
          params.set('tags', newTags.join(','));
        } else {
          params.delete('tags');
        }
      } else {
        // Add the tag
        const newTags = [...currentTags, hashtagValue];
        params.set('tags', newTags.join(','));
      }

      // Reset to first page when filters change
      params.delete('page');

      // For hashtags, always navigate to /posts with filters
      const targetPath = pathname.startsWith('/t/')
        ? NAV_PATHS.POSTS
        : pathname;
      return `${targetPath}${params.toString() ? `?${params.toString()}` : ''}`;
    } else if (type === 'mention') {
      // Only allow author filters on /posts route
      if (pathname !== NAV_PATHS.POSTS) {
        // For non-posts routes, navigate to posts with author filter
        const newParams = new URLSearchParams();
        newParams.set('author', value);
        return `${NAV_PATHS.POSTS}?${newParams.toString()}`;
      }

      const currentAuthor = params.get('author');

      if (currentAuthor === value) {
        // Remove author filter if same mention clicked
        params.delete('author');
      } else {
        // Set author filter
        params.set('author', value);
      }

      // Reset to first page when filters change
      params.delete('page');

      return `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    }

    return '#';
  };

  const handlePillClick = (
    type: 'hashtag' | 'mention',
    value: string,
    event: React.MouseEvent
  ) => {
    // If parent provides callbacks, use them (for thread filtering) and prevent navigation
    if (type === 'hashtag' && onHashtagClick) {
      event.preventDefault();
      onHashtagClick(`#${value}`);
      return;
    }
    if (type === 'mention' && onMentionClick) {
      event.preventDefault();
      onMentionClick(value);
      return;
    }

    // Otherwise, let the Link component handle navigation
    // The URL is already generated correctly in generatePillUrl
  };

  const segments = parseContent(content);

  return (
    <span className={`content-with-pills ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.value}</span>;
        }

        const isClickable =
          (segment.type === 'hashtag' && (onHashtagClick || contextId)) ||
          (segment.type === 'mention' &&
            (onMentionClick || (contextId && pathname === NAV_PATHS.POSTS)));

        const pillUrl = generatePillUrl(
          segment.type as 'hashtag' | 'mention',
          segment.value
        );
        const isActiveFilter = (() => {
          if (segment.type === 'hashtag') {
            const hashtagValue = segment.value.startsWith('#')
              ? segment.value
              : `#${segment.value}`;
            const currentTags =
              searchParams
                .get('tags')
                ?.split(',')
                .map((tag) => tag.trim())
                .filter(Boolean) || [];
            return currentTags.includes(hashtagValue);
          } else if (segment.type === 'mention') {
            return searchParams.get('author') === segment.value;
          }
          return false;
        })();

        if (isClickable) {
          return (
            <Link
              key={index}
              href={pillUrl}
              className={`content-pill content-pill--${segment.type} content-pill--clickable ${
                isActiveFilter ? 'content-pill--active' : ''
              }`}
              onClick={(event) =>
                handlePillClick(
                  segment.type as 'hashtag' | 'mention',
                  segment.value,
                  event
                )
              }
              title={
                segment.type === 'hashtag'
                  ? `Filter by hashtag: ${segment.value}`
                  : segment.type === 'mention' && pathname === NAV_PATHS.POSTS
                    ? `Filter by user: ${segment.value}`
                    : segment.type === 'mention'
                      ? 'Author filters only available on Posts page'
                      : ''
              }
            >
              {segment.type === 'hashtag' ? '#' : '@'}
              {segment.value}
            </Link>
          );
        }

        return (
          <span
            key={index}
            className={`content-pill content-pill--${segment.type}`}
            title={
              segment.type === 'hashtag'
                ? `Hashtag: ${segment.value}`
                : `Mention: ${segment.value}`
            }
          >
            {segment.type === 'hashtag' ? '#' : '@'}
            {segment.value}
          </span>
        );
      })}
    </span>
  );
}
