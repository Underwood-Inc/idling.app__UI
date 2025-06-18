'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ContentWithPills } from './ContentWithPills';
import { SmartInput } from './SmartInput';
import './SmartPillInput.css';

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

    // Enhanced regex to match hashtags and structured mentions (with optional filter type)
    const pillRegex = /(#\w+)|(@\[[^\]]+\])|(@\w+)/g;
    let match;

    while ((match = pillRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        const textContent = text.slice(currentIndex, match.index);
        if (textContent) {
          segments.push({ type: 'text', content: textContent });
        }
      }

      const matchedText = match[0];

      if (matchedText.startsWith('#')) {
        segments.push({ type: 'hashtag', content: matchedText });
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
          } else {
            // Fallback if parsing fails
            segments.push({
              type: 'mention',
              content: matchedText,
              raw: matchedText,
              filterType: 'author'
            });
          }
        }
      } else if (matchedText.startsWith('@')) {
        segments.push({
          type: 'mention',
          content: matchedText,
          filterType: 'author' // Default for simple mentions
        });
      }

      currentIndex = match.index + matchedText.length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText) {
        segments.push({ type: 'text', content: remainingText });
      }
    }

    return segments;
  };

  const handleContainerClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
      setEditValue(value);
      setNewInputValue('');

      // Notify parent of the current value when entering edit mode
      if (onEditValueChange) {
        onEditValueChange(''); // Start with empty new input
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
    // Only sync when parent explicitly clears the value (empty string) AND we're not currently editing
    // This prevents interference with normal typing while still allowing parent to clear the input
    if (value === '' && !isEditing) {
      setEditValue('');
      setNewInputValue('');
    } else if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

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

  // Handle pill click to edit incomplete pills or remove complete ones
  const handlePillClick = (pillText: string) => {
    // Check if this is a complete pill (matches complete patterns)
    const isCompletePill =
      /^#\w+$/.test(pillText.trim()) || // Complete hashtag
      /^@\[[^\]]+\]$/.test(pillText.trim()) || // Complete structured mention (any format)
      /^@[^\s@#]+(?:\s+[^\s@#]+)*$/.test(pillText.trim()); // Simple mention (updated to match ContentWithPills)

    if (!isEditing) {
      // Not in edit mode - remove complete pills directly, edit incomplete ones
      if (isCompletePill) {
        // Complete pill - remove it directly
        const newValue = value
          .replace(pillText, '')
          .replace(/\s+/g, ' ')
          .trim();
        onChange(newValue);
        return;
      } else {
        // Incomplete pill - enter edit mode to allow editing
        setIsEditing(true);

        // Remove the incomplete pill from the main value and put it in the input
        const remainingValue = value
          .replace(pillText, '')
          .replace(/\s+/g, ' ')
          .trim();
        setEditValue(remainingValue);
        setNewInputValue(pillText.trim());

        if (onEditValueChange) {
          const combinedValue =
            remainingValue + (remainingValue ? ' ' : '') + pillText.trim();
          onEditValueChange(combinedValue);
        }

        // Focus the input after entering edit mode
        setTimeout(() => {
          const input = smartInputRef.current?.querySelector('input');
          if (input) {
            input.focus();
            // Position cursor at end of incomplete pill text
            const pillLength = pillText.trim().length;
            input.setSelectionRange(pillLength, pillLength);
          }
        }, 0);
        return;
      }
    }

    // Already in edit mode - always remove the pill
    if (onPillClick) {
      onPillClick(pillText, 'remove');
      return;
    }

    // Remove the pill from edit value and update immediately
    const newEditValue = editValue
      .replace(pillText, '')
      .replace(/\s+/g, ' ')
      .trim();
    setEditValue(newEditValue);

    // Also clear newInputValue if it matches
    if (newInputValue.trim() === pillText.trim()) {
      setNewInputValue('');
    }

    if (onEditValueChange) {
      // Pass the complete combined value after removal
      const combinedAfterRemoval =
        newEditValue +
        (newInputValue && newInputValue.trim() !== pillText.trim()
          ? (newEditValue ? ' ' : '') + newInputValue
          : '');
      onEditValueChange(combinedAfterRemoval.trim());
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
        // Extract user ID from structured mention format @[username|userId]
        if (segment.raw && segment.raw.includes('|')) {
          const userIdMatch = segment.raw.match(/@\[[^|]+\|([^\]]+)\]/);
          if (userIdMatch) {
            userIds.push(userIdMatch[1]);
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
  };

  return (
    <div
      ref={containerRef}
      className={`smart-pill-input ${className} ${isEditing ? 'smart-pill-input--editing' : ''} ${
        isEmpty ? 'smart-pill-input--empty' : ''
      } ${hasSuggestions ? 'smart-pill-input--with-suggestions' : ''}`}
    >
      {isEditing ? (
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
                          onHashtagClick={() =>
                            handlePillClick(contentForPills)
                          }
                          onMentionClick={() =>
                            handlePillClick(contentForPills)
                          }
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
                        onHashtagClick={() => handlePillClick(contentForPills)}
                        onMentionClick={() => handlePillClick(contentForPills)}
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
                          onHashtagClick={() =>
                            handlePillClick(contentForPills)
                          }
                          onMentionClick={() =>
                            handlePillClick(contentForPills)
                          }
                          className="smart-pill-input__pill"
                          isFilterBarContext={true}
                          enableInlineFilterControl={false}
                        />
                        {/* Non-clickable filter type display */}
                        <span
                          className={
                            `smart-pill-input__filter-type-display ` +
                            `smart-pill-input__filter-type-display--${segment.filterType}`
                          }
                          title={`Filtering by ${
                            segment.filterType === 'author'
                              ? 'posts authored by this user'
                              : 'posts that mention this user'
                          }`}
                        >
                          {segment.filterType === 'author' ? 'BY' : 'IN'}
                        </span>
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
                        onHashtagClick={() => handlePillClick(contentForPills)}
                        onMentionClick={() => handlePillClick(contentForPills)}
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
