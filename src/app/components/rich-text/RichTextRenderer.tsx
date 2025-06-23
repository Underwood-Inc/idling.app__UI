'use client';

import React, { useMemo } from 'react';
import { emojiRegistry } from '../../../lib/utils/parsers/emoji-parser';
import {
  RichTextConfig,
  richTextParser
} from '../../../lib/utils/parsers/rich-text-parser';
import './RichText.css';

export interface RichTextRendererProps {
  content: string;
  config?: Partial<RichTextConfig>;
  className?: string;
  onEmojiClick?: (emojiId: string) => void;
  onImageClick?: (imageSrc: string) => void;
  onLinkClick?: (url: string) => void;
  maxLength?: number;
  showEmojiTooltips?: boolean;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  config = {},
  className = '',
  onEmojiClick,
  onImageClick,
  onLinkClick,
  maxLength,
  showEmojiTooltips = true
}) => {
  // Memoize the parsed content to avoid re-parsing on every render
  const parsedContent = useMemo(() => {
    if (!content) return '';

    // Truncate content if maxLength is specified
    const processedContent =
      maxLength && content.length > maxLength
        ? content.slice(0, maxLength) + '...'
        : content;

    // Update parser config
    const parser = richTextParser;
    parser.updateConfig({
      enableMarkdown: true,
      enableEmojis: true,
      enableImages: true,
      enableHashtags: true,
      enableMentions: true,
      enableUrls: true,
      ...config
    });

    // Parse and convert to HTML
    const tokens = parser.parse(processedContent);
    return parser.tokensToHtml(tokens);
  }, [content, config, maxLength]);

  // Handle click events
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    // Handle emoji clicks
    if (target.classList.contains('emoji') && onEmojiClick) {
      const emojiId = target.getAttribute('data-emoji');
      if (emojiId) {
        onEmojiClick(emojiId);
      }
    }

    // Handle image clicks
    if (target.classList.contains('embedded-image') && onImageClick) {
      const imageSrc = target.getAttribute('src');
      if (imageSrc) {
        onImageClick(imageSrc);
      }
    }

    // Handle link clicks
    if (target.tagName === 'A' && onLinkClick) {
      event.preventDefault();
      const url = target.getAttribute('href');
      if (url && url !== '#') {
        onLinkClick(url);
      }
    }

    // Handle URL embed clicks
    if (target.classList.contains('url-embed') && onLinkClick) {
      const url = target.getAttribute('data-url');
      if (url) {
        onLinkClick(url);
      }
    }
  };

  return (
    <div
      className={`rich-text-container ${className}`}
      dangerouslySetInnerHTML={{ __html: parsedContent }}
      onClick={handleClick}
    />
  );
};

// Hook for managing custom emojis
export const useCustomEmojis = () => {
  const addCustomEmoji = (emoji: {
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    tags: string[];
    aliases: string[];
  }) => {
    emojiRegistry.registerEmoji(emoji);
  };

  const addCustomEmojis = (
    emojis: Array<{
      id: string;
      name: string;
      imageUrl: string;
      category: string;
      tags: string[];
      aliases: string[];
    }>
  ) => {
    emojiRegistry.registerEmojis(emojis);
  };

  const searchEmojis = (query: string) => {
    return emojiRegistry.searchEmojis(query);
  };

  const getEmojisByCategory = (category: string) => {
    return emojiRegistry.getEmojisByCategory(category);
  };

  const getAllEmojis = () => {
    return emojiRegistry.getAllEmojis();
  };

  return {
    addCustomEmoji,
    addCustomEmojis,
    searchEmojis,
    getEmojisByCategory,
    getAllEmojis
  };
};

// Component for emoji picker/selector
export interface EmojiPickerProps {
  onEmojiSelect: (emoji: {
    id: string;
    name: string;
    unicode?: string;
    imageUrl?: string;
  }) => void;
  categories?: string[];
  maxResults?: number;
  searchQuery?: string;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  categories = ['faces', 'gestures', 'hearts', 'objects', 'nature'],
  maxResults = 50,
  searchQuery = '',
  className = ''
}) => {
  const { searchEmojis, getEmojisByCategory, getAllEmojis } = useCustomEmojis();

  const emojis = useMemo(() => {
    if (searchQuery) {
      return searchEmojis(searchQuery).slice(0, maxResults);
    }

    if (categories.length === 0) {
      return getAllEmojis().slice(0, maxResults);
    }

    const categoryEmojis = categories.flatMap((category) =>
      getEmojisByCategory(category)
    );

    return categoryEmojis.slice(0, maxResults);
  }, [searchQuery, categories, maxResults]);

  return (
    <div className={`emoji-picker ${className}`}>
      <div className="emoji-grid">
        {emojis.map((emoji) => (
          <button
            key={emoji.id}
            className="emoji-button"
            onClick={() => onEmojiSelect(emoji)}
            title={`:${emoji.name}:`}
          >
            {emoji.unicode ? (
              <span className="emoji emoji--unicode">{emoji.unicode}</span>
            ) : emoji.imageUrl ? (
              <img
                className="emoji emoji--custom"
                src={emoji.imageUrl}
                alt={`:${emoji.name}:`}
                loading="lazy"
              />
            ) : (
              <span>:{emoji.name}:</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Utility component for rendering just emojis
export interface EmojiRendererProps {
  emojiId: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const EmojiRenderer: React.FC<EmojiRendererProps> = ({
  emojiId,
  size = 'medium',
  className = ''
}) => {
  const emoji = emojiRegistry.getEmoji(emojiId);

  if (!emoji) {
    return <span className={className}>:{emojiId}:</span>;
  }

  const sizeClass = `emoji--${size}`;

  return emoji.unicode ? (
    <span
      className={`emoji emoji--unicode ${sizeClass} ${className}`}
      title={`:${emoji.name}:`}
    >
      {emoji.unicode}
    </span>
  ) : emoji.imageUrl ? (
    <img
      className={`emoji emoji--custom ${sizeClass} ${className}`}
      src={emoji.imageUrl}
      alt={`:${emoji.name}:`}
      title={`:${emoji.name}:`}
      loading="lazy"
    />
  ) : (
    <span className={className}>:{emoji.name}:</span>
  );
};

export default RichTextRenderer;
