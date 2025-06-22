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
  position?: { x: number; y: number };
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
  position,
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
    trackEmojiUsage,
    filters
  } = useEmojis({
    autoFetch: true,
    defaultFilters: {
      includeCustom: true,
      includeUsage: true
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Sync selected category with the filters from useEmojis hook
  useEffect(() => {
    if (!filters.category) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(filters.category);
    }
  }, [filters.category]);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Use emojis directly from API - no client-side filtering needed
  const filteredEmojis = useMemo(() => {
    return emojis.slice(0, maxResults);
  }, [emojis, maxResults]);

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

  // Handle category selection with loading state
  const handleCategorySelect = useCallback(
    async (category: string) => {
      // Prevent rapid category changes
      if (isChangingCategory) return;

      setIsChangingCategory(true);
      setSelectedCategory(category);
      setLocalSearchQuery(''); // Clear search when selecting category

      try {
        if (category === 'all') {
          selectCategory(null); // Clear category filter to show all
        } else {
          selectCategory(category);
        }
        // Add slight delay to prevent flickering
        await new Promise((resolve) => setTimeout(resolve, 100));
      } finally {
        setIsChangingCategory(false);
      }
    },
    [selectCategory, isChangingCategory]
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

  // Determine if we should show loading state
  const showLoadingState = loading || isChangingCategory;
  const showContent = !loading && !error && filteredEmojis.length > 0;
  const showEmptyState = !loading && !error && filteredEmojis.length === 0;

  const content = (
    <div
      className={`emoji-picker ${className}`}
      style={
        position
          ? {
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 10000
            }
          : undefined
      }
    >
      <div className="emoji-picker__header">
        <input
          type="text"
          placeholder="Search emojis..."
          value={localSearchQuery}
          onChange={handleSearchChange}
          className="emoji-picker__search"
          autoFocus
          disabled={isChangingCategory}
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
          disabled={isChangingCategory}
        >
          🌟
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={`emoji-picker__category ${selectedCategory === category.name ? 'emoji-picker__category--active' : ''}`}
            onClick={() => handleCategorySelect(category.name)}
            title={category.display_name}
            disabled={isChangingCategory}
          >
            {getCategoryIcon(category.name)}
          </button>
        ))}
      </div>

      <div className="emoji-picker__content">
        {showLoadingState && (
          <div className="emoji-picker__loading">
            <div className="emoji-picker__loading-spinner"></div>
            <span>
              {isChangingCategory
                ? 'Switching category...'
                : 'Loading emojis...'}
            </span>
          </div>
        )}

        {error && !isChangingCategory && (
          <div className="emoji-picker__error">Error loading emojis</div>
        )}

        {showEmptyState && !isChangingCategory && (
          <div className="emoji-picker__empty">
            {localSearchQuery ? 'No emojis found' : 'No emojis available'}
          </div>
        )}

        {showContent && (
          <div
            className={`emoji-picker__grid ${isChangingCategory ? 'emoji-picker__grid--loading' : ''}`}
          >
            {filteredEmojis.map((emoji: EmojiData, index: number) => (
              <button
                key={`${emoji.emoji_id}-${index}`}
                className="emoji-picker__emoji"
                onClick={() => handleEmojiClick(emoji)}
                title={`:${emoji.emoji_id}:`}
                disabled={isChangingCategory}
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

      {filteredEmojis.length > 0 && !isChangingCategory && (
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
