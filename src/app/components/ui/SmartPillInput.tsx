'use client';

import { createLogger } from '@/lib/logging';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ContentWithPills } from './ContentWithPills';
import { SmartInput } from './SmartInput';
import './SmartPillInput.css';

const logger = createLogger({
  context: { component: 'SmartPillInput' }
});

export interface SmartPillInputProps {
  value: string;
  onChange: (value: string) => void;
  onEditValueChange?: (editValue: string) => void;
  onPillClick?: (pillText: string, action: 'edit' | 'remove') => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  contextId: string;
  enableHashtags?: boolean;
  enableUserMentions?: boolean;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => void;
}

interface ParsedContent {
  type: 'text' | 'hashtag' | 'mention';
  content: string;
  raw?: string;
  filterType?: 'author' | 'mentions'; // For mention pills, store their specific filter type
}

export const SmartPillInput: React.FC<SmartPillInputProps> = ({
  value,
  onChange,
  onEditValueChange,
  onPillClick,
  placeholder,
  className = '',
  disabled = false,
  contextId,
  enableHashtags = true,
  enableUserMentions = true,
  onHashtagClick,
  onMentionClick
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [newInputValue, setNewInputValue] = useState(''); // For new text being typed
  const [hasSuggestions, setHasSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const smartInputRef = useRef<HTMLDivElement>(null);

  // Parse the value into segments for pill rendering
  const parseContent = (text: string): ParsedContent[] => {
    if (!text) return [];

    const segments: ParsedContent[] = [];
    let currentIndex = 0;

    // Enhanced regex to match hashtags and structured mentions only (prevent false positives)
    const pillRegex = /(#\w+)|(@\[[^\]]+\])/g;
    let match;

    logger.debug('SmartPillInput parseContent', {
      text,
      pillRegex: pillRegex.source
    });

    while ((match = pillRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        const textContent = text.slice(currentIndex, match.index);
        if (textContent) {
          segments.push({ type: 'text', content: textContent });
          logger.debug('Added text segment', {
            textContent,
            index: match.index,
            currentIndex
          });
        }
      }

      const matchedText = match[0];

      if (matchedText.startsWith('#')) {
        segments.push({ type: 'hashtag', content: matchedText });
        logger.debug('Added hashtag segment', { matchedText });
      } else if (matchedText.startsWith('@[')) {
        // Enhanced mention format: @[username|userId] or @[username|userId|filterType]
        const enhancedMatch = matchedText.match(
          /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
        );
        if (enhancedMatch) {
          const [, username, userId, filterType] = enhancedMatch;
          // Pass the clean @username format to ContentWithPills for display
          segments.push({
            type: 'mention',
            content: `@${username}`,
            raw: matchedText, // Keep the original structured format
            filterType: (filterType as 'author' | 'mentions') || 'author' // Default to author
          });
          logger.debug('Added mention segment', {
            username,
            userId,
            filterType,
            matchedText
          });
        } else {
          // Fallback for legacy format @[username|userId]
          const legacyMatch = matchedText.match(/^@\[([^|]+)\|([^\]]+)\]$/);
          if (legacyMatch) {
            const [, username, userId] = legacyMatch;
            segments.push({
              type: 'mention',
              content: `@${username}`,
              raw: matchedText,
              filterType: 'author' // Default to author for legacy format
            });
            logger.debug('Added legacy mention segment', {
              username,
              userId,
              matchedText
            });
          } else {
            // Fallback if parsing fails
            segments.push({
              type: 'mention',
              content: matchedText,
              raw: matchedText,
              filterType: 'author'
            });
            logger.debug('Added fallback mention segment', { matchedText });
          }
        }
      }

      currentIndex = match.index + matchedText.length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText) {
        segments.push({ type: 'text', content: remainingText });
        logger.debug('Added remaining text segment', {
          remainingText,
          currentIndex,
          textLength: text.length
        });
      }
    }

    logger.debug('SmartPillInput parseContent result', { segments });
    // eslint-disable-next-line no-console
    console.log('SmartPillInput parseContent debug:', { text, segments });
    return segments;
  };

  const handleContainerClick = () => {
    if (!disabled && !isEditing && !isValueEmpty) {
      setIsEditing(true);

      // Parse the current value to separate pills from text
      const segments = parseContent(value);
      const pillSegments = segments.filter(
        (s) => s.type === 'hashtag' || s.type === 'mention'
      );
      const textSegments = segments.filter((s) => s.type === 'text');

      // Reconstruct pills-only value for editValue
      const pillsValue = pillSegments.map((s) => s.raw || s.content).join(' ');

      // Combine all text segments for newInputValue
      const textValue = textSegments
        .map((s) => s.content)
        .join(' ')
        .trim();

      setEditValue(pillsValue);
      setNewInputValue(textValue);

      logger.debug('SmartPillInput entering edit mode', {
        originalValue: value,
        segments,
        pillsValue,
        textValue
      });

      // Notify parent of the current text being edited
      if (onEditValueChange) {
        onEditValueChange(textValue);
      }

      // Focus the input after entering edit mode
      setTimeout(() => {
        const input = smartInputRef.current?.querySelector('input');
        if (input) {
          input.focus();
        }
      }, 0);
    }
  };

  // Check if the input should start in editing mode
  const isValueEmpty = !value || value.trim() === '';

  const handleSmartInputChange = (newValue: string) => {
    setNewInputValue(newValue);

    // Combine existing pills with new input and update editValue immediately
    const combinedValue = editValue + (newValue ? ' ' + newValue : '');

    // Check if the new input contains complete pills (hashtags or structured mentions)
    // Only auto-create pills for:
    // 1. Structured mentions from suggestions: @[username|userId]
    // 2. Hashtags that end with a space (indicating completion/selection)
    const hasCompletePill =
      /@\[[^\]]+\]$/.test(newValue.trim()) || // Structured mentions
      (/^#\w+\s$/.test(newValue) && newValue.trim().length > 2); // Hashtags ending with space, 3+ chars total

    if (hasCompletePill) {
      const newPill = newValue.trim();

      // Check for duplicates - parse existing content to get all current pills
      const existingSegments = parseContent(editValue);
      const existingPills = existingSegments
        .filter(
          (segment) => segment.type === 'hashtag' || segment.type === 'mention'
        )
        .map((segment) => segment.raw || segment.content);

      // For mentions, we need to check both the structured format and display format
      const isDuplicate = existingPills.some((existingPill) => {
        if (newPill.startsWith('@[') && existingPill.startsWith('@[')) {
          // Both are structured mentions - compare the structured format
          return newPill === existingPill;
        } else if (newPill.startsWith('#') && existingPill.startsWith('#')) {
          // Both are hashtags - direct comparison
          return newPill === existingPill;
        } else if (newPill.startsWith('@[') && existingPill.startsWith('@')) {
          // New is structured, existing might be display format - extract username from structured
          const usernameMatch = newPill.match(/@\[([^|]+)\|/);
          const username = usernameMatch ? usernameMatch[1] : '';
          return existingPill === `@${username}`;
        } else if (existingPill.startsWith('@[') && newPill.startsWith('@')) {
          // Existing is structured, new might be display format
          const usernameMatch = existingPill.match(/@\[([^|]+)\|/);
          const username = usernameMatch ? usernameMatch[1] : '';
          return newPill === `@${username}`;
        }
        return false;
      });

      if (!isDuplicate) {
        // If not duplicate, add it to editValue and clear newInputValue
        const newEditValue = editValue + (editValue ? ' ' : '') + newPill;
        setEditValue(newEditValue);
        setNewInputValue('');

        if (onEditValueChange) {
          onEditValueChange(newEditValue); // Pass the updated edit value with the new pill
        }
      } else {
        // If duplicate, just clear the input without adding
        setNewInputValue('');

        if (onEditValueChange) {
          onEditValueChange(editValue); // Pass existing pills so parent knows complete content
        }
      }
    } else {
      // Notify parent of edit value changes for mode indicators
      // Pass the complete combined value so parent can process all pills
      const combinedForParent =
        editValue + (newValue ? (editValue ? ' ' : '') + newValue : '');
      if (onEditValueChange) {
        onEditValueChange(combinedForParent.trim());
      }
    }
  };

  // Monitor for suggestion dropdown visibility
  useEffect(() => {
    if (!isEditing || !smartInputRef.current) return;

    const observer = new MutationObserver(() => {
      const suggestionList =
        smartInputRef.current?.querySelector('.suggestion-list');
      setHasSuggestions(!!suggestionList);
    });

    observer.observe(smartInputRef.current, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [isEditing]);

  // Update edit value when prop value changes
  useEffect(() => {
    // Always sync when parent explicitly clears the value (empty string)
    if (value === '') {
      setEditValue('');
      setNewInputValue('');
      logger.debug('SmartPillInput cleared values due to empty prop value');
    } else if (!isEditing && !hasSuggestions) {
      // Only sync non-empty values when not editing AND no suggestions are visible
      // This prevents interference during suggestion selection
      setEditValue(value);
      logger.debug(
        'SmartPillInput synced with prop value (not editing, no suggestions)',
        {
          value
        }
      );
    }
    // When editing or suggestions are visible, completely ignore prop value changes
    // This prevents the input from becoming inactive when filters are processed
    // or when user is actively selecting from suggestions
  }, [value, isEditing, hasSuggestions]);

  // Commit changes
  const handleCommit = useCallback(() => {
    const finalValue =
      editValue + (newInputValue ? (editValue ? ' ' : '') + newInputValue : '');

    onChange(finalValue.trim());
    setIsEditing(false);
    setEditValue('');
    setNewInputValue('');
    if (onEditValueChange) {
      onEditValueChange('');
    }
  }, [editValue, newInputValue, onChange, onEditValueChange]);

  // Cancel changes
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setNewInputValue('');
    if (onEditValueChange) {
      onEditValueChange('');
    }
  }, [onEditValueChange]);

  // Handle clicks outside to commit changes
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isEditing) return;

      const target = e.target as Element;

      // Don't commit if clicking form buttons
      if (target?.closest('button[type="submit"]')) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        handleCommit();
      }
    };

    if (isEditing) {
      document.addEventListener('click', handleClickOutside);

      // Auto-focus input
      setTimeout(() => {
        containerRef.current?.querySelector('input')?.focus();
      }, 0);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isEditing, handleCommit]);

  // Handle pill click to remove the clicked pill
  const handlePillClick = (pillText: string) => {
    // console.log(
    //   'DEBUG: handlePillClick called with:',
    //   pillText,
    //   'isEditing:',
    //   isEditing,
    //   'value:',
    //   value
    // );

    const pillTextTrimmed = pillText.trim();
    // console.log('DEBUG: Removing pill:', pillTextTrimmed);

    // Remove the pill directly from the appropriate state
    let currentValue = value;

    // If we're in edit mode, work with editValue
    if (isEditing) {
      currentValue = editValue;
      // console.log('DEBUG: Using editValue for removal:', editValue);
    }

    // Split into segments and filter out the exact pill
    const segments = currentValue
      .split(/\s+/)
      .filter((segment) => segment.trim() !== '');
    const filteredSegments = segments.filter(
      (segment) => segment !== pillTextTrimmed
    );
    const newValue = filteredSegments.join(' ').trim();

    // console.log(
    //   'DEBUG: segments:',
    //   segments,
    //   'filteredSegments:',
    //   filteredSegments,
    //   'newValue:',
    //   newValue
    // );

    if (isEditing) {
      // Update edit value
      setEditValue(newValue);

      // Also clear newInputValue if it matches the pill
      if (newInputValue.trim() === pillTextTrimmed) {
        // console.log('DEBUG: Clearing newInputValue because it matches pill');
        setNewInputValue('');
      }

      // Call onEditValueChange with the updated value
      if (onEditValueChange) {
        const combinedValue =
          newValue +
          (newInputValue && newInputValue.trim() !== pillTextTrimmed
            ? (newValue ? ' ' : '') + newInputValue
            : '');
        // console.log(
        //   'DEBUG: Calling onEditValueChange with:',
        //   combinedValue.trim()
        // );
        onEditValueChange(combinedValue.trim());
      }
    } else {
      // Update main value immediately - this will trigger parent to update
      // console.log('DEBUG: Calling onChange with:', newValue);
      onChange(newValue);
    }

    // Also call the onPillClick callback if provided (for additional handling)
    if (onPillClick) {
      // console.log('DEBUG: Also calling onPillClick callback');
      onPillClick(pillText, 'remove');
    }
  };

  const parsedSegments = parseContent(value);
  const editParsedSegments = parseContent(editValue); // Parse current edit state
  const isEmpty = !value || value.trim() === '';

  // Extract existing pills to exclude from search results
  const extractExistingPills = (segments: ParsedContent[]) => {
    const hashtags: string[] = [];
    const userIds: string[] = [];

    segments.forEach((segment) => {
      if (segment.type === 'hashtag') {
        hashtags.push(segment.content);
      } else if (segment.type === 'mention') {
        // Extract user ID from structured mention format @[username|userId|filterType]
        if (segment.raw && segment.raw.includes('|')) {
          const userIdMatch = segment.raw.match(
            /@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]/
          );
          if (userIdMatch) {
            // userIdMatch[1] is username, userIdMatch[2] is userId, userIdMatch[3] is filterType (optional)
            userIds.push(userIdMatch[2]);
          }
        }
      }
    });

    return { hashtags, userIds };
  };

  // Get existing pills from current edit state
  const { hashtags: existingHashtags, userIds: existingUserIds } =
    extractExistingPills(editParsedSegments);

  // Handle filter type toggle for mention pills
  const handleFilterTypeToggle = (index: number, segment: ParsedContent) => {
    if (segment.type !== 'mention') return;

    const newFilterType =
      segment.filterType === 'author' ? 'mentions' : 'author';

    if (isEditing) {
      // Update the segment in editValue
      const updatedSegments = editParsedSegments.map((seg, i) => {
        if (i === index && seg.type === 'mention') {
          // Create new enhanced mention format with the toggled filter type
          const rawMatch = seg.raw?.match(
            /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
          );
          if (rawMatch) {
            const [, username, userId] = rawMatch;
            const newRaw = `@[${username}|${userId}|${newFilterType}]`;
            return {
              ...seg,
              raw: newRaw,
              filterType: newFilterType
            };
          }
        }
        return seg;
      });

      // Reconstruct the editValue from updated segments
      const newEditValue = updatedSegments
        .map((seg) => {
          if (seg.type === 'text') return seg.content;
          return seg.raw || seg.content;
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      setEditValue(newEditValue);

      // Notify parent of the change
      if (onEditValueChange) {
        onEditValueChange(newEditValue);
      }
    } else {
      // Update the segment in display mode (main value)
      const updatedSegments = parsedSegments.map((seg, i) => {
        if (i === index && seg.type === 'mention') {
          // Create new enhanced mention format with the toggled filter type
          const rawMatch = seg.raw?.match(
            /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
          );
          if (rawMatch) {
            const [, username, userId] = rawMatch;
            const newRaw = `@[${username}|${userId}|${newFilterType}]`;
            return {
              ...seg,
              raw: newRaw,
              filterType: newFilterType
            };
          }
        }
        return seg;
      });

      // Reconstruct the value from updated segments
      const newValue = updatedSegments
        .map((seg) => {
          if (seg.type === 'text') return seg.content;
          return seg.raw || seg.content;
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Notify parent of the change
      onChange(newValue);

      // Also notify onMentionClick if provided
      if (onMentionClick) {
        const rawMatch = segment.raw?.match(
          /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
        );
        if (rawMatch) {
          const [, username] = rawMatch;
          const newRaw = `@[${username}|${rawMatch[2]}|${newFilterType}]`;
          onMentionClick(newRaw, newFilterType);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`smart-pill-input ${className} ${isEditing ? 'smart-pill-input--editing' : ''} ${
        isEmpty ? 'smart-pill-input--empty' : ''
      } ${hasSuggestions ? 'smart-pill-input--with-suggestions' : ''}`}
    >
      {isEditing || isValueEmpty ? (
        <div className="smart-pill-input__edit-container">
          {/* Show existing pills in edit mode */}
          {editParsedSegments.length > 0 && (
            <div className="smart-pill-input__existing-pills">
              {editParsedSegments.map((segment, index) => {
                if (segment.type === 'text') {
                  return null; // Skip text segments in edit mode
                } else if (segment.type === 'mention') {
                  // For mention pills, show with external filter type control
                  const contentForPills = segment.raw || segment.content;
                  return (
                    <div
                      key={index}
                      className="smart-pill-input__mention-pill-wrapper"
                    >
                      <div className="smart-pill-input__mention-pill">
                        <ContentWithPills
                          content={contentForPills}
                          contextId={contextId}
                          onHashtagClick={(hashtag) => {
                            // console.log(
                            //   'DEBUG: SmartPillInput hashtag clicked:',
                            //   hashtag,
                            //   'contentForPills:',
                            //   contentForPills
                            // );
                            handlePillClick(contentForPills);
                          }}
                          onMentionClick={(mention, filterType) => {
                            // console.log(
                            //   'DEBUG: SmartPillInput mention clicked:',
                            //   mention,
                            //   'filterType:',
                            //   filterType,
                            //   'contentForPills:',
                            //   contentForPills
                            // );
                            handlePillClick(contentForPills);
                          }}
                          className="smart-pill-input__pill"
                          isFilterBarContext={true}
                          enableInlineFilterControl={false}
                        />
                        {/* External filter type toggle button */}
                        <button
                          type="button"
                          className={
                            `smart-pill-input__filter-type-toggle ` +
                            `smart-pill-input__filter-type-toggle--${segment.filterType}`
                          }
                          onClick={() => handleFilterTypeToggle(index, segment)}
                          title={`Current: ${
                            segment.filterType === 'author'
                              ? 'Author'
                              : 'Mentions'
                          } filter. Click to toggle.`}
                        >
                          {segment.filterType === 'author' ? 'BY' : 'IN'}
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // For hashtag pills, use the existing approach
                  const contentForPills = segment.raw || segment.content;
                  return (
                    <div key={index} className="smart-pill-input__pill-wrapper">
                      <ContentWithPills
                        content={contentForPills}
                        contextId={contextId}
                        onHashtagClick={(hashtag) => {
                          // console.log(
                          //   'DEBUG: SmartPillInput hashtag clicked:',
                          //   hashtag,
                          //   'contentForPills:',
                          //   contentForPills
                          // );
                          handlePillClick(contentForPills);
                        }}
                        onMentionClick={(mention, filterType) => {
                          // console.log(
                          //   'DEBUG: SmartPillInput mention clicked:',
                          //   mention,
                          //   'filterType:',
                          //   filterType,
                          //   'contentForPills:',
                          //   contentForPills
                          // );
                          handlePillClick(contentForPills);
                        }}
                        className="smart-pill-input__pill"
                        isFilterBarContext={true}
                        enableInlineFilterControl={false}
                      />
                    </div>
                  );
                }
              })}
            </div>
          )}

          <div ref={smartInputRef} className="smart-pill-input__smart-input">
            {/* Input for new content */}
            <SmartInput
              value={newInputValue}
              onChange={handleSmartInputChange}
              placeholder={placeholder}
              enableHashtags={enableHashtags}
              enableUserMentions={enableUserMentions}
              existingHashtags={existingHashtags}
              existingUserIds={existingUserIds}
            />
          </div>
        </div>
      ) : (
        <div
          className="smart-pill-input__display"
          onClick={handleContainerClick}
        >
          {isEmpty ? (
            <span className="smart-pill-input__placeholder">{placeholder}</span>
          ) : (
            <div className="smart-pill-input__content">
              {parsedSegments.map((segment, index) => {
                if (segment.type === 'text') {
                  return (
                    <span key={index} className="smart-pill-input__text">
                      {segment.content}
                    </span>
                  );
                } else if (segment.type === 'mention') {
                  // For mention pills in display mode, show with filter type indicator
                  const contentForPills = segment.raw || segment.content;
                  return (
                    <div
                      key={index}
                      className="smart-pill-input__mention-pill-wrapper"
                    >
                      <div className="smart-pill-input__mention-pill">
                        <ContentWithPills
                          content={contentForPills}
                          contextId={contextId}
                          onHashtagClick={(hashtag) => {
                            // console.log(
                            //   'DEBUG: SmartPillInput hashtag clicked:',
                            //   hashtag,
                            //   'contentForPills:',
                            //   contentForPills
                            // );
                            handlePillClick(contentForPills);
                          }}
                          onMentionClick={(mention, filterType) => {
                            // console.log(
                            //   'DEBUG: SmartPillInput mention clicked:',
                            //   mention,
                            //   'filterType:',
                            //   filterType,
                            //   'contentForPills:',
                            //   contentForPills
                            // );
                            handlePillClick(contentForPills);
                          }}
                          className="smart-pill-input__pill"
                          isFilterBarContext={true}
                          enableInlineFilterControl={false}
                        />
                        {/* Clickable filter type toggle in display mode */}
                        <button
                          type="button"
                          className={
                            `smart-pill-input__filter-type-toggle ` +
                            `smart-pill-input__filter-type-toggle--${segment.filterType}`
                          }
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering container click
                            handleFilterTypeToggle(index, segment);
                          }}
                          title={`Current: ${
                            segment.filterType === 'author'
                              ? 'Author'
                              : 'Mentions'
                          } filter. Click to toggle.`}
                        >
                          {segment.filterType === 'author' ? 'BY' : 'IN'}
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // For hashtag pills, use the existing approach
                  const contentForPills = segment.raw || segment.content;
                  return (
                    <div key={index} className="smart-pill-input__pill-wrapper">
                      <ContentWithPills
                        content={contentForPills}
                        contextId={contextId}
                        onHashtagClick={(hashtag) => {
                          // console.log(
                          //   'DEBUG: SmartPillInput hashtag clicked:',
                          //   hashtag,
                          //   'contentForPills:',
                          //   contentForPills
                          // );
                          handlePillClick(contentForPills);
                        }}
                        onMentionClick={(mention, filterType) => {
                          // console.log(
                          //   'DEBUG: SmartPillInput mention clicked:',
                          //   mention,
                          //   'filterType:',
                          //   filterType,
                          //   'contentForPills:',
                          //   contentForPills
                          // );
                          handlePillClick(contentForPills);
                        }}
                        className="smart-pill-input__pill"
                        isFilterBarContext={true}
                        enableInlineFilterControl={false}
                      />
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
