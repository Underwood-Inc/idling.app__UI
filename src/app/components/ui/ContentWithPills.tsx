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
  enableInlineFilterControl?: boolean;
}

type SegmentType = 'text' | 'hashtag' | 'mention';

interface ContentSegment {
  type: SegmentType;
  value: string;
  userId?: string; // For mentions, store the resolved user ID
  displayName?: string; // For mentions, store the display username
  filterType?: 'author' | 'mentions'; // For enhanced mentions, store filter type
  rawFormat?: string; // Store the original format for enhanced mentions
}

export function ContentWithPills({
  content,
  onHashtagClick,
  onMentionClick,
  className = '',
  contextId,
  isFilterBarContext = false,
  enableInlineFilterControl = false
}: ContentWithPillsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tooltip state for mention actions
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    username: string;
    userId?: string;
    position: { x: number; y: number };
    isHoveringTooltip: boolean;
    timeoutId?: ReturnType<typeof setTimeout>;
  }>({
    visible: false,
    username: '',
    position: { x: 0, y: 0 },
    isHoveringTooltip: false
  });

  /**
   * Parse content for ONLY structured pills from InlineSuggestionInput:
   * - Hashtags: #tagname
   * - Embedded mentions: @[username|userId] (created by autocomplete only)
   *
   * Legacy data and adhoc usernames are ignored to prevent false positives
   */
  const parseContent = (text: string): ContentSegment[] => {
    const segments: ContentSegment[] = [];

    // Parse both structured formats AND simple @username mentions
    // Structured: #hashtag or @[username|userId] or @[username|userId|filterType]
    // Simple: @username (for posts with simple mentions)
    const combinedRegex =
      /(#[a-zA-Z0-9_-]+)|(@\[([^|]+)\|([^\]]+)(?:\|([^\]]+))?\])|(@[a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)*)/g;

    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index);
        if (textContent) {
          segments.push({ type: 'text', value: textContent });
        }
      }

      const fullMatch = match[0];

      if (fullMatch.startsWith('#')) {
        // Hashtag: #tagname
        const hashtag = fullMatch.slice(1);
        segments.push({ type: 'hashtag', value: hashtag });
      } else if (fullMatch.includes('|')) {
        // Enhanced mention: @[username|userId] or @[username|userId|filterType]
        const enhancedMatch = fullMatch.match(
          /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
        );
        if (enhancedMatch) {
          const [, username, userId, filterType] = enhancedMatch;
          segments.push({
            type: 'mention',
            value: username,
            userId: userId,
            displayName: username,
            filterType: (filterType as 'author' | 'mentions') || 'author',
            rawFormat: fullMatch
          });
        } else {
          // Legacy format fallback
          const legacyMatch = fullMatch.match(/^@\[([^|]+)\|([^\]]+)\]$/);
          if (legacyMatch) {
            const [, username, userId] = legacyMatch;
            segments.push({
              type: 'mention',
              value: username,
              userId: userId,
              displayName: username,
              filterType: 'author', // Default for legacy format
              rawFormat: fullMatch
            });
          }
        }
      } else if (fullMatch.startsWith('@')) {
        // Simple mention: @username (show tooltip but limited functionality)
        const username = fullMatch.slice(1);
        segments.push({
          type: 'mention',
          value: username,
          displayName: username
          // No userId - this will show tooltip but with limited functionality
        });
      }

      lastIndex = combinedRegex.lastIndex;
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

  // Simplified URL generation
  const generatePillUrl = (
    type: 'hashtag' | 'mention',
    value: string,
    segment?: ContentSegment
  ): string => {
    const params = new URLSearchParams(searchParams);

    if (isFilterBarContext) {
      // Remove filters in filter bar context
      if (type === 'hashtag') {
        const currentTags = params.get('tags');
        if (currentTags) {
          const hashtagValue = value; // URL stores tags without # prefix now
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
        params.delete('mentions');
      }
    } else {
      // Add filters in normal context
      if (type === 'hashtag') {
        const currentTags = params.get('tags');
        const hashtagValue = value; // Use value without # for URL (cleaner URLs)
        if (currentTags && !currentTags.split(',').includes(hashtagValue)) {
          params.set('tags', `${currentTags},${hashtagValue}`);
        } else if (!currentTags) {
          params.set('tags', hashtagValue);
        }
      } else if (type === 'mention' && pathname === NAV_PATHS.POSTS) {
        // Always use userId for author filtering (required)
        if (segment?.userId) {
          params.set('author', segment.userId);
        }
        // If no userId available, skip filtering (embedded data should always have userId)
      }
    }

    params.set('page', '1');

    if (type === 'hashtag' && pathname.startsWith('/t/')) {
      return `${NAV_PATHS.POSTS}?${params.toString()}`;
    }

    return `${pathname}?${params.toString()}`;
  };

  // Simplified pill click handler
  const handlePillClick = async (
    type: 'hashtag' | 'mention',
    value: string,
    event: React.MouseEvent,
    segment?: ContentSegment
  ) => {
    event.preventDefault();

    if (isFilterBarContext) {
      // Filter bar context - trigger removal
      if (type === 'hashtag' && onHashtagClick) {
        onHashtagClick(`#${value}`);
      } else if (type === 'mention' && onMentionClick && segment?.userId) {
        // Always use userId for filter removal
        onMentionClick(segment.userId, 'author');
      }
      return;
    }

    // Normal context - trigger add
    if (type === 'hashtag' && onHashtagClick) {
      onHashtagClick(`#${value}`);
    } else if (type === 'mention' && onMentionClick && segment?.userId) {
      // Always use userId for author filtering
      onMentionClick(segment.userId, 'author');
    } else if (
      type === 'mention' &&
      pathname === NAV_PATHS.POSTS &&
      segment?.userId
    ) {
      // Direct navigation - only with userId
      const params = new URLSearchParams(searchParams);
      params.set('author', segment.userId);
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  // Check if a filter is currently active
  const isActiveFilter = (
    type: 'hashtag' | 'mention',
    value: string,
    segment?: ContentSegment
  ): boolean => {
    if (type === 'hashtag') {
      const currentTags = searchParams.get('tags');
      const hashtagValue = value; // URL stores tags without # prefix now
      return currentTags
        ? currentTags.split(',').includes(hashtagValue)
        : false;
    } else if (type === 'mention' && segment?.userId) {
      const currentAuthor = searchParams.get('author');
      const currentMentions = searchParams.get('mentions');

      if (!currentAuthor && !currentMentions) return false;

      // Ensure values are strings and trim whitespace
      const normalizedSegmentUserId = String(segment.userId).trim();
      const normalizedSegmentUsername = String(segment.value).trim();

      // Check if this mention matches the active author filter (filtering by who wrote posts)
      if (currentAuthor) {
        const normalizedCurrentAuthor = String(currentAuthor).trim();
        if (normalizedCurrentAuthor === normalizedSegmentUserId) {
          return true;
        }
      }

      // Check if this mention matches the active mentions filter (filtering by who is mentioned in content)
      if (currentMentions) {
        const normalizedCurrentMentions = String(currentMentions).trim();
        if (normalizedCurrentMentions === normalizedSegmentUsername) {
          return true;
        }
      }

      return false;
    }
    return false;
  };

  // Enhanced mention hover handlers for both structured and adhoc usernames
  const handleMentionHover = async (
    segment: ContentSegment,
    event: React.MouseEvent
  ) => {
    // Always show tooltips for mentions in posts and threads (not in filter bar)
    if (tooltip.timeoutId) {
      clearTimeout(tooltip.timeoutId);
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setTooltip({
      visible: true,
      username: segment.displayName || segment.value,
      userId: segment.userId,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      },
      isHoveringTooltip: false
    });
  };

  const handleMentionLeave = () => {
    if (tooltip.timeoutId) {
      clearTimeout(tooltip.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      setTooltip((prev) => {
        if (prev.isHoveringTooltip) {
          return { ...prev, timeoutId: undefined };
        }
        return { ...prev, visible: false, timeoutId: undefined };
      });
    }, 300);

    setTooltip((prev) => ({ ...prev, timeoutId }));
  };

  // Tooltip interaction handlers
  const handleTooltipHover = () => {
    if (tooltip.timeoutId) {
      clearTimeout(tooltip.timeoutId);
    }
    setTooltip((prev) => ({
      ...prev,
      timeoutId: undefined,
      isHoveringTooltip: true
    }));
  };

  const handleTooltipLeave = () => {
    setTooltip((prev) => ({
      ...prev,
      visible: false,
      isHoveringTooltip: false,
      timeoutId: undefined
    }));
  };

  // Tooltip action handlers
  const handleFilterByAuthor = async () => {
    const userId = tooltip.userId;

    setTooltip((prev) => ({
      ...prev,
      visible: false,
      isHoveringTooltip: false,
      timeoutId: undefined
    }));

    if (onMentionClick && userId) {
      // Always use userId for author filtering - no fallbacks needed with embedded data
      onMentionClick(userId, 'author');
    }
  };

  const handleFilterByContent = async () => {
    const username = tooltip.username;
    setTooltip((prev) => ({
      ...prev,
      visible: false,
      isHoveringTooltip: false,
      timeoutId: undefined
    }));

    if (onMentionClick) {
      onMentionClick(username, 'mentions');
    }
  };

  // Handle inline filter type toggle for mention pills
  const handleInlineFilterToggle = (segment: ContentSegment) => {
    if (segment.type !== 'mention' || !segment.filterType || !segment.rawFormat)
      return;

    const newFilterType =
      segment.filterType === 'author' ? 'mentions' : 'author';

    // Create updated mention format with new filter type
    const updatedMention = segment.rawFormat.replace(
      /(@\[[^|]+\|[^|]+)\|?([^\]]*)\]/,
      `$1|${newFilterType}]`
    );

    // Call the onMentionClick with the updated mention
    if (onMentionClick) {
      onMentionClick(updatedMention, newFilterType);
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

          const isActiveFilter_ = isActiveFilter(
            segment.type as 'hashtag' | 'mention',
            segment.value,
            segment
          );

          const pillUrl = generatePillUrl(
            segment.type as 'hashtag' | 'mention',
            segment.value,
            segment
          );

          // All pills are clickable now - simplified logic
          const isClickable = true;

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
                    event,
                    segment
                  )
                }
                onMouseEnter={
                  segment.type === 'mention' && !isFilterBarContext
                    ? (event) => handleMentionHover(segment, event)
                    : undefined
                }
                onMouseLeave={
                  segment.type === 'mention' && !isFilterBarContext
                    ? handleMentionLeave
                    : undefined
                }
                title={
                  isFilterBarContext
                    ? undefined // No tooltip in filter input context
                    : segment.type === 'hashtag'
                      ? `Filter by hashtag: ${segment.value}`
                      : `Filter by user: ${segment.value}`
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
                isFilterBarContext
                  ? undefined // No tooltip in filter input context
                  : segment.type === 'hashtag'
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

      {/* Tooltip for mention actions */}
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

/**
 * Utility functions for creating robust mention content
 */
export const createRobustMention = (
  username: string,
  userId: string
): string => {
  const cleanUsername = username.trim().replace(/[[\]|]/g, '');
  const cleanUserId = userId.trim().replace(/[[\]|]/g, '');
  return `@[${cleanUsername}|${cleanUserId}]`;
};

export const parseRobustMention = (
  mentionString: string
): { username: string; userId: string } | null => {
  const match = mentionString.match(/^@\[([^|]+)\|([^\]]+)\]$/);
  if (match) {
    return {
      username: match[1].trim(),
      userId: match[2].trim()
    };
  }
  return null;
};

export const convertLegacyMention = async (
  legacyMention: string,
  getUserId: (username: string) => Promise<string | undefined>
): Promise<string> => {
  const match = legacyMention.match(
    /^@([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)*)$/
  );
  if (match) {
    const username = match[1];
    try {
      const userId = await getUserId(username);
      if (userId) {
        return createRobustMention(username, userId);
      }
    } catch (error) {
      console.error('Error converting legacy mention:', error);
    }
  }
  return legacyMention;
};
