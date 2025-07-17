/* eslint-disable custom-rules/enforce-link-target-blank */
'use client';

import { createLogger } from '@lib/logging';
import { NAV_PATHS } from '@lib/routes';
import { ContentParser, ContentSegment } from '@lib/utils/content-parsers';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useMemo } from 'react';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import './ContentWithPills.css';
import { InstantLink } from './InstantLink';
import { URLPill } from './URLPill';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'ContentWithPills',
    module: 'components/ui'
  }
});

interface ContentWithPillsProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  onURLClick?: (url: string, behavior: string) => void;
  onURLBehaviorChange?: (oldContent: string, newContent: string) => void;
  onURLRemove?: () => void;
  className?: string;
  contextId: string;
  isFilterBarContext?: boolean;
  enableInlineFilterControl?: boolean;
  isEditMode?: boolean;
}

/**
 * Internal ContentWithPills component that uses useSearchParams
 */
function ContentWithPillsInternal({
  content,
  onHashtagClick,
  onMentionClick,
  onURLClick,
  onURLBehaviorChange,
  onURLRemove,
  className = '',
  contextId,
  isFilterBarContext = false,
  enableInlineFilterControl = false,
  isEditMode = false
}: ContentWithPillsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Parse content using modular parsers with strict precedence:
   * 1. Structured URL Pills (highest priority)
   * 2. Hashtags
   * 3. Mentions
   * 4. Fallback URLs (only in remaining text)
   */
  const parseContent = (text: string): ContentSegment[] => {
    return ContentParser.parse(text);
  };

  // Memoize the parsing result
  const segments = useMemo(() => parseContent(content), [content]);

  // Memoize URL generation to prevent recreation on every render
  const generatePillUrl = useCallback(
    (
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
    },
    [searchParams, isFilterBarContext, pathname]
  );

  // Memoize pill click handler
  const handlePillClick = useCallback(
    async (
      type: 'hashtag' | 'mention',
      value: string,
      event: React.MouseEvent,
      segment?: ContentSegment
    ) => {
      event.preventDefault();

      // In edit mode (submission forms), user mention pills should not have click behavior
      // They should only be deletable via external remove buttons
      if (isEditMode && type === 'mention') {
        return; // No click behavior for mention pills in edit mode
      }

      if (isFilterBarContext) {
        // Filter bar context - trigger removal
        // The FilterLabel component will handle using the correct stored values
        if (type === 'hashtag' && onHashtagClick) {
          onHashtagClick(`#${value}`);
        } else if (type === 'mention' && onMentionClick) {
          // Just trigger the callback - FilterLabel will use the stored values
          onMentionClick(value, segment?.filterType || 'author');
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
        type === 'hashtag' &&
        pathname.startsWith('/t/') &&
        !onHashtagClick
      ) {
        // For thread pages without callback, navigate to posts with filter
        const params = new URLSearchParams();
        params.set('tags', value);
        params.set('page', '1');
        router.push(`${NAV_PATHS.POSTS}?${params.toString()}`);
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
    },
    [
      isEditMode, // Add isEditMode to dependencies
      isFilterBarContext,
      onHashtagClick,
      onMentionClick,
      pathname,
      searchParams,
      router
    ]
  );

  // Memoize active filter check
  const isActiveFilter = useCallback(
    (
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
    },
    [searchParams]
  );

  // Memoize filter handlers
  const createFilterHandler = useCallback(
    (segment: ContentSegment, filterType: 'author' | 'mentions') => {
      return () => {
        if (onMentionClick) {
          // For author filters: use userId (who wrote the posts)
          // For mentions filters: use username (who is mentioned in content)
          if (filterType === 'author') {
            // Author filter needs userId
            const authorValue = segment.userId || segment.value;
            onMentionClick(authorValue, filterType);
          } else {
            // Mentions filter needs username
            const mentionValue = segment.displayName || segment.value;
            onMentionClick(mentionValue, filterType);
          }
        }
      };
    },
    [onMentionClick]
  );

  // Memoize tooltip content
  const createMentionTooltipContent = useCallback(
    (segment: ContentSegment) => {
      const username = segment.displayName || segment.value;

      // Create a component that accepts closeTooltip prop
      const MentionTooltipContent = ({
        closeTooltip
      }: {
        closeTooltip?: () => void;
      }) => (
        <div className="mention-tooltip-content">
          <div className="mention-tooltip__header">Filter by @{username}</div>
          <div className="mention-tooltip__options">
            <button
              className="mention-tooltip__option mention-tooltip__option--primary"
              onClick={() => {
                createFilterHandler(segment, 'author')();
                closeTooltip?.();
              }}
              title="Show posts authored by this user"
            >
              <span className="mention-tooltip__icon">👤</span>
              <div>
                Filter by Author
                <span className="mention-tooltip__description">
                  Posts by this user
                </span>
              </div>
            </button>
            <button
              className="mention-tooltip__option"
              onClick={() => {
                createFilterHandler(segment, 'mentions')();
                closeTooltip?.();
              }}
              title="Show posts that mention this user"
            >
              <span className="mention-tooltip__icon">💬</span>
              <div>
                Filter by Mentions
                <span className="mention-tooltip__description">
                  Posts mentioning this user
                </span>
              </div>
            </button>
          </div>
        </div>
      );

      return <MentionTooltipContent />;
    },
    [createFilterHandler]
  );

  // Check if there are any URL embeds to determine container styling
  const hasEmbeds = segments.some(
    (segment) => segment.type === 'url' && segment.behavior === 'embed'
  );

  return (
    <>
      <span
        className={`content-with-pills ${hasEmbeds ? 'content-with-pills--has-embeds' : ''} ${className}`}
        data-context-id={contextId}
      >
        {renderSegmentsWithLineBreaks(segments)}
      </span>
    </>
  );

  /**
   * Enhanced rendering function that handles line breaks properly
   * Uses the same approach as the rich text editor's DefaultRenderer
   */
  function renderSegmentsWithLineBreaks(
    segments: ContentSegment[]
  ): React.ReactNode {
    if (segments.length === 0) {
      return null;
    }

    // Check if content has newlines - if not, use simple rendering
    const hasNewlines = segments.some(
      (segment) => segment.type === 'text' && segment.value.includes('\n')
    );

    if (!hasNewlines) {
      // Simple rendering for single-line content
      return segments.map((segment, index) => renderSegment(segment, index));
    }

    // Line-based rendering for multi-line content
    const lines: ContentSegment[][] = [];
    let currentLine: ContentSegment[] = [];

    for (const segment of segments) {
      if (segment.type === 'text' && segment.value.includes('\n')) {
        // Split text segments containing newlines
        const textParts = segment.value.split('\n');

        for (let i = 0; i < textParts.length; i++) {
          const part = textParts[i];

          // Add text part to current line if not empty
          if (part.length > 0) {
            currentLine.push({
              ...segment,
              value: part,
              type: 'text'
            });
          }

          // End current line (except for the last part)
          if (i < textParts.length - 1) {
            lines.push([...currentLine]);
            currentLine = [];
          }
        }
      } else {
        // Add non-text segments or text without newlines to current line
        currentLine.push(segment);
      }
    }

    // Add the last line if it has content
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Render lines with proper structure
    return lines.map((lineSegments, lineIndex) => (
      <div
        key={`line-${lineIndex}`}
        className="content-with-pills__line"
        data-line-index={lineIndex}
        data-line-segment-count={lineSegments.length}
      >
        {lineSegments.length === 0 ? (
          // Empty line - render invisible character for proper spacing
          <span className="content-with-pills__empty-line">&nbsp;</span>
        ) : (
          lineSegments.map((segment, segmentIndex) =>
            renderSegment(segment, `${lineIndex}-${segmentIndex}`)
          )
        )}
      </div>
    ));
  }

  /**
   * Render individual segment (pill or text)
   */
  function renderSegment(
    segment: ContentSegment,
    key: string | number
  ): React.ReactNode {
    if (segment.type === 'text') {
      // Simple text rendering - no newlines should be present at this point
      return <span key={key}>{segment.value}</span>;
    }

    // Handle URL pills separately from other pill types
    if (segment.type === 'url') {
      // Extract URL and behavior from the segment
      const url = segment.value;
      const behavior = segment.behavior as 'embed' | 'link' | undefined;

      // Extract width from rawFormat if it exists (format: ![behavior|width](url))
      let width: 'small' | 'medium' | 'large' | 'full' = 'medium'; // Default width
      if (segment.rawFormat) {
        const pillData = segment.rawFormat.match(
          /!\[([^|]+)(?:\|([^|]+))?\]\([^)]+\)/
        );
        if (pillData && pillData[2]) {
          const extractedWidth = pillData[2].toLowerCase();
          if (
            ['s', 'm', 'l', 'f', 'small', 'medium', 'large', 'full'].includes(
              extractedWidth
            )
          ) {
            // Map legacy short names to full names
            switch (extractedWidth) {
              case 's':
                width = 'small';
                break;
              case 'm':
                width = 'medium';
                break;
              case 'l':
                width = 'large';
                break;
              case 'f':
                width = 'full';
                break;
              case 'small':
              case 'medium':
              case 'large':
              case 'full':
                width = extractedWidth as 'small' | 'medium' | 'large' | 'full';
                break;
            }
          }
        }
      }

      // Create change handlers for width and mode
      const handleWidthChange = (
        newWidth: 'small' | 'medium' | 'large' | 'full'
      ) => {
        if (onURLBehaviorChange && segment.rawFormat) {
          const currentFormat = segment.rawFormat;
          // Width change debug info
          // logger.debug('Width change', { newWidth, currentFormat, url, behavior, width });

          // Check if it's already in pill format
          const pillMatch = currentFormat.match(
            /!\[([^|]+)(?:\|([^|]+))?\]\(([^)]+)\)/
          );

          if (pillMatch) {
            // It's already a pill, update the width
            const [, currentBehavior, , currentUrl] = pillMatch;
            const newFormat = `![${currentBehavior}|${newWidth}](${currentUrl})`;
            // logger.debug('Updating pill format', { currentFormat, newFormat });
            onURLBehaviorChange(currentFormat, newFormat);
          } else {
            // It's a raw URL, convert to pill with width
            const newFormat = `![${behavior || 'embed'}|${newWidth}](${currentFormat})`;
            // logger.debug('Converting to pill format', { currentFormat, newFormat });
            onURLBehaviorChange(currentFormat, newFormat);
          }
        } else {
          // logger.debug('Width change failed', { onURLBehaviorChange: !!onURLBehaviorChange, rawFormat: segment.rawFormat });
        }
      };

      const handleModeChange = (newMode: 'embed' | 'link' | 'modal') => {
        if (onURLBehaviorChange && segment.rawFormat) {
          const currentFormat = segment.rawFormat;

          // Check if it's already in pill format
          const pillMatch = currentFormat.match(
            /!\[([^|]+)(?:\|([^|]+))?\]\(([^)]+)\)/
          );

          if (pillMatch) {
            // It's already a pill, update the behavior
            const [, , currentWidth, currentUrl] = pillMatch;
            const newFormat = currentWidth
              ? `![${newMode}|${currentWidth}](${currentUrl})`
              : `![${newMode}](${currentUrl})`;
            onURLBehaviorChange(currentFormat, newFormat);
          } else {
            // It's a raw URL, convert to pill with behavior
            const newFormat =
              width && width !== 'medium'
                ? `![${newMode}|${width}](${currentFormat})`
                : `![${newMode}](${currentFormat})`;
            onURLBehaviorChange(currentFormat, newFormat);
          }
        }
      };

      return (
        <URLPill
          key={key}
          url={url}
          behavior={behavior}
          width={width}
          className="content-pill--url"
          isEditMode={isEditMode}
          onBehaviorChange={onURLBehaviorChange}
          onWidthChange={handleWidthChange}
          onModeChange={handleModeChange}
          onRemove={onURLRemove}
        />
      );
    }

    // Existing logic for hashtag and mention pills (unchanged)
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
      const shouldShowTooltip =
        segment.type === 'mention' && !isFilterBarContext && !isEditMode; // Don't show tooltip in edit mode

      const pillElement = (
        <InstantLink
          key={key}
          href={pillUrl}
          className={`content-pill content-pill--${segment.type} content-pill--clickable ${
            isActiveFilter_ ? 'content-pill--active' : ''
          } ${isFilterBarContext ? 'content-pill--filter-context' : ''} ${
            isEditMode ? 'content-pill--edit-mode' : ''
          }`}
          onClick={(event) => {
            // In edit mode for mention pills, prevent all click behavior
            if (isEditMode && segment.type === 'mention') {
              event.preventDefault();
              return;
            }

            handlePillClick(
              segment.type as 'hashtag' | 'mention',
              segment.value,
              event,
              segment
            );
          }}
          title={
            isFilterBarContext || shouldShowTooltip
              ? undefined // No title tooltip when InfoTooltip is used or in filter context
              : isEditMode && segment.type === 'mention'
                ? 'Use remove button to delete' // Helpful hint in edit mode
                : segment.type === 'hashtag'
                  ? `Filter by hashtag: ${segment.value}`
                  : `Filter by user: ${segment.value}`
          }
        >
          {segment.type === 'hashtag' ? '#' : '@'}
          {segment.value}
        </InstantLink>
      );

      // Show tooltip for mentions in non-filter contexts (not edit mode)
      if (shouldShowTooltip) {
        return (
          <InteractiveTooltip
            key={key}
            content={createMentionTooltipContent(segment)}
            isInsideParagraph={true}
            delay={500}
            className="content-pill-tooltip"
          >
            {pillElement}
          </InteractiveTooltip>
        );
      }

      return pillElement;
    }

    // Non-clickable pills (fallback)
    return (
      <span
        key={key}
        className={`content-pill content-pill--${segment.type} ${
          isActiveFilter_ ? 'content-pill--active' : ''
        }`}
      >
        {segment.type === 'hashtag' ? '#' : '@'}
        {segment.value}
      </span>
    );
  }
}

/**
 * Main ContentWithPills component with Suspense wrapper
 */
export function ContentWithPills(props: ContentWithPillsProps) {
  return (
    <Suspense fallback={<div className={props.className}>{props.content}</div>}>
      <ContentWithPillsInternal {...props} />
    </Suspense>
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
      logger.error('Error converting legacy mention', error as Error, {
        legacyMention
      });
    }
  }
  return legacyMention;
};
