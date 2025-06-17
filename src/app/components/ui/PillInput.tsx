'use client';

import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ContentWithPills } from './ContentWithPills';
import './PillInput.css';

export interface PillInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  contextId: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => void;
}

interface ParsedContent {
  type: 'text' | 'hashtag' | 'mention';
  content: string;
  raw?: string; // For structured mentions: @[username|userId]
}

export const PillInput: React.FC<PillInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  contextId,
  onHashtagClick,
  onMentionClick
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the value into segments for pill rendering
  const parseContent = (text: string): ParsedContent[] => {
    if (!text) return [];

    const segments: ParsedContent[] = [];
    let currentIndex = 0;

    // Regex to match hashtags and structured mentions
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
        // Hashtag
        segments.push({ type: 'hashtag', content: matchedText });
      } else if (matchedText.startsWith('@[')) {
        // Structured mention: @[username|userId]
        segments.push({
          type: 'mention',
          content: matchedText,
          raw: matchedText
        });
      } else if (matchedText.startsWith('@')) {
        // Simple mention: @username
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
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(value.length, value.length);
        }
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleInputBlur = () => {
    commitEdit();
  };

  const commitEdit = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handlePillClick = (content: string, type: 'hashtag' | 'mention') => {
    if (type === 'hashtag' && onHashtagClick) {
      onHashtagClick(content);
    } else if (type === 'mention' && onMentionClick) {
      onMentionClick(content);
    }
  };

  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Handle click outside to commit edit
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isEditing
      ) {
        commitEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, editValue]);

  const parsedSegments = parseContent(value);
  const isEmpty = !value || value.trim() === '';

  return (
    <div
      ref={containerRef}
      className={`pill-input ${className} ${isEditing ? 'pill-input--editing' : ''} ${
        isEmpty ? 'pill-input--empty' : ''
      }`}
      onClick={handleContainerClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="pill-input__edit-field"
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <div className="pill-input__display">
          {isEmpty ? (
            <span className="pill-input__placeholder">{placeholder}</span>
          ) : (
            <div className="pill-input__content">
              {parsedSegments.map((segment, index) => {
                if (segment.type === 'text') {
                  return (
                    <span key={index} className="pill-input__text">
                      {segment.content}
                    </span>
                  );
                } else {
                  return (
                    <ContentWithPills
                      key={index}
                      content={segment.content}
                      contextId={contextId}
                      onHashtagClick={onHashtagClick}
                      onMentionClick={onMentionClick}
                      className="pill-input__pill"
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
