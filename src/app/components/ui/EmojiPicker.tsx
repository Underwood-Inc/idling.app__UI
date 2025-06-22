'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EmojiData, useEmojis } from '../../hooks/useEmojis';
import './EmojiPicker.css';

// Re-export EmojiData for use in other components
export type { EmojiData } from '../../hooks/useEmojis';

export interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: EmojiData) => void;
  searchQuery?: string;
  maxResults?: number;
  className?: string;
}

export interface EmojiPickerTriggerProps {
  children: React.ReactNode;
  onEmojiSelect: (emojiText: string) => void;
  searchQuery?: string;
  disabled?: boolean;
}

// Main Emoji Picker Component
export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  searchQuery = '',
  maxResults = 24,
  className = ''
}) => {
  const {
    emojis,
    categories,
    loading,
    error,
    searchEmojis,
    selectCategory,
    trackEmojiUsage
  } = useEmojis({
    autoFetch: true,
    defaultFilters: {
      includeCustom: true,
      includeUsage: true
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Filter emojis based on search or category - FIXED: Show all emojis by default
  const filteredEmojis = useMemo(() => {
    if (localSearchQuery.trim()) {
      // If there's a search query, show search results regardless of category
      return emojis.slice(0, maxResults);
    }

    if (selectedCategory === 'all') {
      return emojis.slice(0, maxResults);
    }

    // Filter by specific category
    return emojis
      .filter((emoji: EmojiData) => emoji.category.name === selectedCategory)
      .slice(0, maxResults);
  }, [emojis, selectedCategory, localSearchQuery, maxResults]);

  // Handle emoji selection
  const handleEmojiClick = useCallback(
    (emoji: EmojiData) => {
      // Track usage
      const emojiType = emoji.is_custom ? 'custom' : 'mac'; // Default to mac for standard emojis
      trackEmojiUsage(emoji.emoji_id, emojiType);

      // Call the parent handler
      onEmojiSelect(emoji);
    },
    [onEmojiSelect, trackEmojiUsage]
  );

  // Handle category selection
  const handleCategorySelect = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      if (category === 'all') {
        selectCategory(null); // Clear category filter to show all
      } else {
        selectCategory(category);
      }
    },
    [selectCategory]
  );

  // Handle search input - FIXED: Trigger search properly
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setLocalSearchQuery(query);
      if (query.trim()) {
        searchEmojis(query.trim());
        setSelectedCategory('all'); // Switch to 'all' when searching
      } else {
        // Clear search by selecting current category or 'all'
        if (selectedCategory !== 'all') {
          selectCategory(selectedCategory);
        } else {
          selectCategory(null);
        }
      }
    },
    [searchEmojis, selectCategory, selectedCategory]
  );

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle clicks outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.emoji-picker')) {
        onClose();
      }
    };

    // Add delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className={`emoji-picker ${className}`}>
      <div className="emoji-picker__header">
        <input
          type="text"
          placeholder="Search emojis..."
          value={localSearchQuery}
          onChange={handleSearchChange}
          className="emoji-picker__search"
          autoFocus
        />
        <button onClick={onClose} className="emoji-picker__close" title="Close">
          ×
        </button>
      </div>

      <div className="emoji-picker__categories">
        <button
          className={`emoji-picker__category ${selectedCategory === 'all' ? 'emoji-picker__category--active' : ''}`}
          onClick={() => handleCategorySelect('all')}
          title="All emojis"
        >
          🌟
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={`emoji-picker__category ${selectedCategory === category.name ? 'emoji-picker__category--active' : ''}`}
            onClick={() => handleCategorySelect(category.name)}
            title={category.display_name}
          >
            {getCategoryIcon(category.name)}
          </button>
        ))}
      </div>

      <div className="emoji-picker__content">
        {loading && (
          <div className="emoji-picker__loading">Loading emojis...</div>
        )}

        {error && (
          <div className="emoji-picker__error">Error loading emojis</div>
        )}

        {!loading && !error && filteredEmojis.length === 0 && (
          <div className="emoji-picker__empty">
            {localSearchQuery ? 'No emojis found' : 'No emojis available'}
          </div>
        )}

        {!loading && !error && filteredEmojis.length > 0 && (
          <div className="emoji-picker__grid">
            {filteredEmojis.map((emoji: EmojiData, index: number) => (
              <button
                key={`${emoji.emoji_id}-${index}`}
                className="emoji-picker__emoji"
                onClick={() => handleEmojiClick(emoji)}
                title={`:${emoji.emoji_id}:`}
              >
                {emoji.is_custom && emoji.custom_image_url ? (
                  <img
                    src={emoji.custom_image_url}
                    alt={`:${emoji.emoji_id}:`}
                    className="emoji-picker__emoji-image"
                    loading="lazy"
                  />
                ) : (
                  <span className="emoji-picker__emoji-char">
                    {emoji.unicode_char || `:${emoji.emoji_id}:`}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredEmojis.length > 0 && (
        <div className="emoji-picker__footer">
          <span className="emoji-picker__count">
            {filteredEmojis.length} emoji
            {filteredEmojis.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );

  // Render content directly - no portal needed
  return content;
};

// Helper function to get category icons
function getCategoryIcon(categoryName: string): string {
  const icons: Record<string, string> = {
    faces: '😀',
    gestures: '👋',
    hearts: '❤️',
    objects: '🔧',
    nature: '🌿',
    food: '🍎',
    travel: '✈️',
    activities: '⚽',
    symbols: '🔥',
    flags: '🏁',
    custom: '⭐'
  };
  return icons[categoryName] || '📁';
}

// Format emoji for text insertion
export function formatEmojiForText(emoji: EmojiData): string {
  if (emoji.is_custom) {
    return `:${emoji.emoji_id}:`; // Custom emoji syntax
  }
  return emoji.unicode_char || `:${emoji.emoji_id}:`;
}

// Hook for managing emoji picker state
export function useEmojiPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const openAt = useCallback((x: number, y: number, query = '') => {
    setPosition({ x, y });
    setSearchQuery(query);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  return {
    isOpen,
    position,
    searchQuery,
    openAt,
    close
  };
}
