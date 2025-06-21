/* eslint-disable custom-rules/enforce-link-target-blank */
'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { NAV_PATHS } from '../../../lib/routes';
import {
  ContentParser,
  ContentSegment
} from '../../../lib/utils/content-parsers';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import './ContentWithPills.css';
import { URLPill } from './URLPill';

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

export function ContentWithPills({
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
        if (type === 'hashtag' && onHashtagClick) {
          onHashtagClick(`#${value}`);
        } else if (type === 'mention' && onMentionClick) {
          // Pass the full pill text for removal instead of just userId
          const fullPillText = segment?.rawFormat || `@${value}`;
          onMentionClick(fullPillText, segment?.filterType || 'author');
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

      return (
        <div className="mention-tooltip-content">
          <div className="mention-tooltip__header">Filter by @{username}</div>
          <div className="mention-tooltip__options">
            <button
              className="mention-tooltip__option mention-tooltip__option--primary"
              onClick={createFilterHandler(segment, 'author')}
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
              onClick={createFilterHandler(segment, 'mentions')}
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
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            return <span key={index}>{segment.value}</span>;
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
                  [
                    's',
                    'm',
                    'l',
                    'f',
                    'small',
                    'medium',
                    'large',
                    'full'
                  ].includes(extractedWidth)
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
                      width = extractedWidth as
                        | 'small'
                        | 'medium'
                        | 'large'
                        | 'full';
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
                // Update the width in the pill format: ![behavior|width](url)
                const currentFormat = segment.rawFormat;
                const pillMatch = currentFormat.match(
                  /!\[([^|]+)(?:\|([^|]+))?\]\(([^)]+)\)/
                );
                if (pillMatch) {
                  const [, currentBehavior, , currentUrl] = pillMatch;
                  const newFormat = `![${currentBehavior}|${newWidth}](${currentUrl})`;
                  onURLBehaviorChange(currentFormat, newFormat);
                }
              }
            };

            const handleModeChange = (newMode: 'embed' | 'link') => {
              if (onURLBehaviorChange && segment.rawFormat) {
                // Update the behavior in the pill format: ![behavior|width](url)
                const currentFormat = segment.rawFormat;
                const pillMatch = currentFormat.match(
                  /!\[([^|]+)(?:\|([^|]+))?\]\(([^)]+)\)/
                );
                if (pillMatch) {
                  const [, , currentWidth, currentUrl] = pillMatch;
                  const newFormat = currentWidth
                    ? `![${newMode}|${currentWidth}](${currentUrl})`
                    : `![${newMode}](${currentUrl})`;
                  onURLBehaviorChange(currentFormat, newFormat);
                }
              }
            };

            return (
              <URLPill
                key={index}
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
              <Link
                key={index}
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
              </Link>
            );

            // Wrap mention pills with InteractiveTooltip for interactive content
            if (shouldShowTooltip) {
              return (
                <InteractiveTooltip
                  key={index}
                  content={createMentionTooltipContent(segment)}
                  isInsideParagraph={true}
                  delay={500}
                >
                  {pillElement}
                </InteractiveTooltip>
              );
            }

            return pillElement;
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
