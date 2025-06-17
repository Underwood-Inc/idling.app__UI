'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ContentWithPills } from './ContentWithPills';
import { SmartInput } from './SmartInput';
import './SmartPillInput.css';

export interface SmartPillInputProps {
  value: string;
  onChange: (value: string) => void;
  onEditValueChange?: (editValue: string) => void;
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
}

export const SmartPillInput: React.FC<SmartPillInputProps> = ({
  value,
  onChange,
  onEditValueChange,
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

    // Enhanced regex to match hashtags and structured mentions
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
        // Extract display name from structured format @[username|userId]
        const structuredMatch = matchedText.match(/^@\[([^|]+)\|([^\]]+)\]$/);
        if (structuredMatch) {
          const [, username, userId] = structuredMatch;
          // Pass the clean @username format to ContentWithPills for display
          segments.push({
            type: 'mention',
            content: `@${username}`,
            raw: matchedText // Keep the original structured format
          });
        } else {
          // Fallback if parsing fails
          segments.push({
            type: 'mention',
            content: matchedText,
            raw: matchedText
          });
        }
      } else if (matchedText.startsWith('@')) {
        segments.push({ type: 'mention', content: matchedText });
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
    const hasCompletePill =
      /@\[[^\]]+\]$/.test(newValue.trim()) || /^#\w+$/.test(newValue.trim());

    if (hasCompletePill) {
      // If we have a complete pill, add it to editValue and clear newInputValue
      const newEditValue = editValue + (editValue ? ' ' : '') + newValue.trim();
      setEditValue(newEditValue);
      setNewInputValue('');

      if (onEditValueChange) {
        onEditValueChange(''); // Clear since we moved it to editValue
      }
    } else {
      // Notify parent of edit value changes for mode indicators
      if (onEditValueChange) {
        onEditValueChange(newValue); // Only pass the new input for mode detection
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
    if (!isEditing) {
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

  // Handle keyboard events and clicks outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleCommit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (!isEditing) return;

      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleCommit();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);

      // Auto-focus the input
      setTimeout(() => {
        const input = containerRef.current?.querySelector('input');
        if (input) {
          input.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isEditing, handleCommit, handleCancel]);

  // Handle pill click to remove it from the input
  const handlePillRemove = (pillText: string) => {
    if (isEditing) {
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
        onEditValueChange(newInputValue); // Keep the current new input for mode detection
      }
    } else {
      // Remove the pill from main value
      const newValue = value.replace(pillText, '').replace(/\s+/g, ' ').trim();
      onChange(newValue);
    }
  };

  const parsedSegments = parseContent(value);
  const editParsedSegments = parseContent(editValue); // Parse current edit state
  const isEmpty = !value || value.trim() === '';

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
                } else {
                  const contentForPills = segment.raw || segment.content;
                  return (
                    <div key={index} className="smart-pill-input__pill-wrapper">
                      <ContentWithPills
                        content={contentForPills}
                        contextId={contextId}
                        onHashtagClick={() => handlePillRemove(contentForPills)}
                        onMentionClick={() => handlePillRemove(contentForPills)}
                        className="smart-pill-input__pill"
                        isFilterBarContext={true}
                      />
                    </div>
                  );
                }
              })}
            </div>
          )}

          <div ref={smartInputRef} className="smart-pill-input__smart-input">
            <SmartInput
              value={newInputValue}
              onChange={handleSmartInputChange}
              placeholder={placeholder}
              className="smart-pill-input__smart-input-field"
              enableHashtags={enableHashtags}
              enableUserMentions={enableUserMentions}
              as="input"
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
                } else {
                  // For hashtags and mentions, pass the original raw format to ContentWithPills
                  // so it can properly parse and style them
                  const contentForPills = segment.raw || segment.content;
                  return (
                    <ContentWithPills
                      key={index}
                      content={contentForPills}
                      contextId={contextId}
                      onHashtagClick={() => handlePillRemove(contentForPills)}
                      onMentionClick={() => handlePillRemove(contentForPills)}
                      className="smart-pill-input__pill"
                      isFilterBarContext={true}
                    />
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
