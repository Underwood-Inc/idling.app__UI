'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import { MentionTooltip } from '../tooltip/LinkTooltip';
import './ContentWithPills.css';

interface ContentWithPillsProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  className?: string;
  contextId: string;
  isFilterBarContext?: boolean;
}

type SegmentType = 'text' | 'hashtag' | 'mention';

interface ContentSegment {
  type: SegmentType;
  value: string;
}

export function ContentWithPills({
  content,
  onHashtagClick,
  onMentionClick,
  className = '',
  contextId,
  isFilterBarContext = false
}: ContentWithPillsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tooltip state for mention pills with debouncing
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    username: string;
    position: { x: number; y: number };
    timeoutId?: ReturnType<typeof setTimeout>;
    isHoveringTooltip: boolean;
  }>({
    visible: false,
    username: '',
    position: { x: 0, y: 0 },
    isHoveringTooltip: false
  });

  // Parse content into segments with hashtags and mentions
  const parseContent = (text: string): ContentSegment[] => {
    const segments: ContentSegment[] = [];
    // Regex to handle hashtags and mentions:
    // - Hashtags: #[alphanumeric, underscore, hyphen]
    // - Mentions: @[any characters except @ # and newlines, but stop at punctuation followed by space]
    const regex = /(#[a-zA-Z0-9_-]+)|(@[^@#\n]+?)(?=\s*[.!?,:;]\s|$|@|#)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index);
        if (textContent) {
          segments.push({ type: 'text', value: textContent });
        }
      }

      // Add the hashtag or mention
      const fullMatch = match[0];
      let value = fullMatch.slice(1); // Remove # or @

      if (fullMatch.startsWith('#')) {
        segments.push({ type: 'hashtag', value });
      } else if (fullMatch.startsWith('@')) {
        // Clean up the mention value
        value = value.trim();
        // Remove trailing punctuation that might have been captured
        value = value.replace(/[.!?,:;]+$/, '');
        if (value) {
          segments.push({ type: 'mention', value });
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        segments.push({ type: 'text', value: remainingText });
      }
    }

    return segments;
  };

  // Generate URL for pill clicks (synchronous version for Link href)
  const generatePillUrl = (
    type: 'hashtag' | 'mention',
    value: string
  ): string => {
    const params = new URLSearchParams(searchParams);

    if (isFilterBarContext) {
      // In filter bar context, we remove filters instead of adding them
      if (type === 'hashtag') {
        const currentTags = params.get('tags');
        if (currentTags) {
          const hashtagValue = `#${value}`;
          const tags = currentTags
            .split(',')
            .filter((tag) => tag !== hashtagValue);
          if (tags.length > 0) {
            params.set('tags', tags.join(','));
          } else {
            params.delete('tags');
          }
        }
      } else if (type === 'mention') {
        params.delete('author');
      }
    } else {
      // Normal behavior: add filters
      if (type === 'hashtag') {
        const currentTags = params.get('tags');
        const hashtagValue = `#${value}`;
        if (currentTags && !currentTags.split(',').includes(hashtagValue)) {
          params.set('tags', `${currentTags},${hashtagValue}`);
        } else if (!currentTags) {
          params.set('tags', hashtagValue);
        }
      } else if (type === 'mention' && pathname === NAV_PATHS.POSTS) {
        // For mentions, we'll handle user ID resolution in the click handler
        // For now, use the username to generate a placeholder URL
        params.set('author', value);
      }
    }

    // Reset to first page when filters change
    params.set('page', '1');

    // For hashtags on thread pages, navigate to posts
    if (type === 'hashtag' && pathname.startsWith('/t/')) {
      return `${NAV_PATHS.POSTS}?${params.toString()}`;
    }

    return `${pathname}?${params.toString()}`;
  };

  // Handle pill clicks
  const handlePillClick = async (
    type: 'hashtag' | 'mention',
    value: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault();

    if (isFilterBarContext) {
      // In filter bar context, trigger removal callbacks
      if (type === 'hashtag' && onHashtagClick) {
        onHashtagClick(`#${value}`);
      } else if (type === 'mention' && onMentionClick) {
        onMentionClick(value, 'author');
      }
      return;
    }

    // Normal behavior: trigger add callbacks or handle navigation
    if (type === 'hashtag' && onHashtagClick) {
      onHashtagClick(`#${value}`);
    } else if (type === 'mention' && onMentionClick) {
      // For mentions, ALWAYS resolve username to user ID before calling callback
      // This ensures we never filter by username, only by user ID
      try {
        const { getUserInfo } = await import(
          '../../../lib/actions/search.actions'
        );
        const userInfo = await getUserInfo(value);

        if (userInfo && userInfo.userId) {
          // SUCCESS: We found the user, use their user ID for filtering
          onMentionClick(userInfo.userId, 'author');
        } else {
          // FAILURE: User not found, don't apply any filter
          console.warn(`User not found for mention: ${value}`);
          // Don't call the callback - this prevents invalid filters
          return;
        }
      } catch (error) {
        console.error('Error resolving mention for callback:', error);
        // Don't call the callback on error - this prevents invalid filters
        return;
      }
    } else if (type === 'mention' && pathname === NAV_PATHS.POSTS) {
      // For direct navigation on posts page, also resolve to user ID
      try {
        const { getUserInfo } = await import(
          '../../../lib/actions/search.actions'
        );
        const userInfo = await getUserInfo(value);

        if (userInfo && userInfo.userId) {
          // SUCCESS: Navigate with user ID
          const params = new URLSearchParams(searchParams);
          params.set('author', userInfo.userId);
          params.set('page', '1');
          router.push(`${pathname}?${params.toString()}`);
        } else {
          // FAILURE: User not found, don't navigate/filter
          console.warn(`User not found for mention: ${value}`);
          return;
        }
      } catch (error) {
        console.error('Error getting user info for navigation:', error);
        return;
      }
    }
  };

  // Check if a filter is currently active
  const isActiveFilter = (
    type: 'hashtag' | 'mention',
    value: string
  ): boolean => {
    if (type === 'hashtag') {
      const currentTags = searchParams.get('tags');
      const hashtagValue = `#${value}`;
      return currentTags
        ? currentTags.split(',').includes(hashtagValue)
        : false;
    } else if (type === 'mention') {
      const currentAuthor = searchParams.get('author');
      if (!currentAuthor) return false;

      // The current author filter could be either a user ID or username
      // Check if it matches the displayed username directly
      if (currentAuthor === value) return true;

      // TODO: We could also check if the current author ID resolves to this username
      // For now, we'll rely on the direct match since the display logic will handle showing usernames
      return false;
    }
    return false;
  };

  // Handle showing tooltip on mention hover with debouncing
  const handleMentionHover = (username: string, event: React.MouseEvent) => {
    // Don't show tooltip in filter bar context or if it's not a posts page
    if (isFilterBarContext || pathname !== NAV_PATHS.POSTS) {
      return;
    }

    // Clear any existing timeout
    if (tooltip.timeoutId) {
      clearTimeout(tooltip.timeoutId);
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      username,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 8 // Position above the pill instead of below
      },
      isHoveringTooltip: false
    });
  };

  // Handle hiding tooltip with debouncing
  const handleMentionLeave = () => {
    // Clear any existing timeout
    if (tooltip.timeoutId) {
      clearTimeout(tooltip.timeoutId);
    }

    // Set a timeout to hide the tooltip after 300ms, but only if not hovering tooltip
    const timeoutId = setTimeout(() => {
      setTooltip((prev) => {
        // Don't hide if actively hovering over the tooltip
        if (prev.isHoveringTooltip) {
          return { ...prev, timeoutId: undefined };
        }
        return { ...prev, visible: false, timeoutId: undefined };
      });
    }, 300);

    setTooltip((prev) => ({ ...prev, timeoutId }));
  };

  // Handle tooltip hover to keep it visible
  const handleTooltipHover = () => {
    // Clear any existing timeout to keep tooltip visible
    if (tooltip.timeoutId) {
      clearTimeout(tooltip.timeoutId);
    }

    // Mark that we're hovering over the tooltip
    setTooltip((prev) => ({
      ...prev,
      timeoutId: undefined,
      isHoveringTooltip: true
    }));
  };

  // Handle tooltip leave to allow hiding
  const handleTooltipLeave = () => {
    // Mark that we're no longer hovering over the tooltip
    setTooltip((prev) => ({
      ...prev,
      isHoveringTooltip: false
    }));

    // Immediately hide the tooltip when leaving it
    setTooltip((prev) => ({
      ...prev,
      visible: false,
      timeoutId: undefined
    }));
  };

  // Handle filter by author action
  const handleFilterByAuthor = async () => {
    const username = tooltip.username;
    setTooltip((prev) => ({
      ...prev,
      visible: false,
      isHoveringTooltip: false,
      timeoutId: undefined
    }));

    if (onMentionClick) {
      // Resolve username to user ID for accurate filtering
      try {
        const { getUserInfo } = await import(
          '../../../lib/actions/search.actions'
        );
        const userInfo = await getUserInfo(username);
        if (userInfo && userInfo.userId) {
          onMentionClick(userInfo.userId, 'author');
        }
      } catch (error) {
        console.error('Error resolving username for author filter:', error);
      }
    }
  };

  // Handle filter by content action
  const handleFilterByContent = async () => {
    const username = tooltip.username;
    setTooltip((prev) => ({
      ...prev,
      visible: false,
      isHoveringTooltip: false,
      timeoutId: undefined
    }));

    if (onMentionClick) {
      // For content filtering, we use the username directly
      onMentionClick(username, 'mentions');
    }
  };

  const segments = parseContent(content);

  return (
    <>
      <span
        className={`content-with-pills ${className}`}
        data-context-id={contextId}
      >
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            return <span key={index}>{segment.value}</span>;
          }

          // For hashtags and mentions, create interactive pills
          const isActiveFilter_ = isActiveFilter(
            segment.type as 'hashtag' | 'mention',
            segment.value
          );

          // Determine if the pill should be clickable
          let isClickable = false;

          if (segment.type === 'hashtag') {
            isClickable = true;
          } else if (segment.type === 'mention') {
            // For mentions, only make clickable if we have proper callback or are in posts page
            if (isFilterBarContext || onMentionClick) {
              // Filter bar context or explicit callback - always clickable
              isClickable = true;
            } else if (pathname === NAV_PATHS.POSTS) {
              // On posts page - make clickable but will need to resolve
              isClickable = true;
            }
          }

          // Generate the URL for this pill
          const pillUrl = generatePillUrl(
            segment.type as 'hashtag' | 'mention',
            segment.value
          );

          if (isClickable) {
            return (
              <Link
                key={index}
                href={pillUrl}
                className={`content-pill content-pill--${segment.type} content-pill--clickable ${
                  isActiveFilter_ ? 'content-pill--active' : ''
                } ${isFilterBarContext ? 'content-pill--filter-context' : ''}`}
                onClick={(event) =>
                  handlePillClick(
                    segment.type as 'hashtag' | 'mention',
                    segment.value,
                    event
                  )
                }
                onMouseEnter={
                  segment.type === 'mention' &&
                  !isFilterBarContext &&
                  pathname === NAV_PATHS.POSTS
                    ? (event) => handleMentionHover(segment.value, event)
                    : undefined
                }
                onMouseLeave={
                  segment.type === 'mention' &&
                  !isFilterBarContext &&
                  pathname === NAV_PATHS.POSTS
                    ? handleMentionLeave
                    : undefined
                }
                title={
                  isFilterBarContext
                    ? `Remove ${segment.type === 'hashtag' ? 'hashtag' : 'author'} filter: ${segment.value}`
                    : segment.type === 'hashtag'
                      ? `Filter by hashtag: ${segment.value}`
                      : segment.type === 'mention' &&
                          (pathname === NAV_PATHS.POSTS || onMentionClick)
                        ? `Filter by user: ${segment.value} (hover for options)`
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

      {/* Render mention tooltip */}
      {tooltip.visible && (
        <MentionTooltip
          username={tooltip.username}
          onFilterByAuthor={handleFilterByAuthor}
          onFilterByContent={handleFilterByContent}
          onClose={() =>
            setTooltip((prev) => ({
              ...prev,
              visible: false,
              isHoveringTooltip: false,
              timeoutId: undefined
            }))
          }
          onHover={handleTooltipHover}
          onLeave={handleTooltipLeave}
          position={tooltip.position}
        />
      )}
    </>
  );
}
