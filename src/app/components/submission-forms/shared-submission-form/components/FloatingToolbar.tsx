'use client';

import * as React from 'react';
import { InteractiveTooltip } from '../../../tooltip/InteractiveTooltip';
import {
  EmojiData,
  EmojiPicker,
  formatEmojiForText
} from '../../../ui/EmojiPicker';
import { useFloatingToolbar } from '../hooks/useFloatingToolbar';
import './FloatingToolbar.css';

interface FloatingToolbarProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onHashtagInsert: (text: string) => void;
  onMentionInsert: (text: string) => void;
  onEmojiInsert: (text: string) => void;
  disabled?: boolean;
  onToolbarInteractionStart?: () => void;
  onToolbarInteractionEnd?: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  inputRef,
  onHashtagInsert,
  onMentionInsert,
  onEmojiInsert,
  disabled = false,
  onToolbarInteractionStart,
  onToolbarInteractionEnd
}) => {
  const {
    hashtagQuery,
    setHashtagQuery,
    mentionQuery,
    setMentionQuery,
    hashtagResults,
    mentionResults,
    loadingHashtags,
    loadingMentions
  } = useFloatingToolbar();

  // Insert hashtag
  const handleHashtagSelect = (hashtag: any) => {
    const hashtagText = hashtag.value.startsWith('#')
      ? hashtag.value
      : `#${hashtag.value}`;
    onHashtagInsert(hashtagText + ' ');
    setHashtagQuery('');
    // Don't try to focus here - let the RichInputAdapter handle it
  };

  // Insert mention
  const handleMentionSelect = (user: any) => {
    const mentionText = `@[${user.displayName || user.label}|${user.value}|author] `;
    onMentionInsert(mentionText);
    setMentionQuery('');
    // Don't try to focus here - let the RichInputAdapter handle it
  };

  // Insert emoji
  const handleEmojiSelect = (emoji: EmojiData) => {
    const emojiText = formatEmojiForText(emoji);
    onEmojiInsert(emojiText);
    // Don't try to focus here - let the RichInputAdapter handle it
  };

  // Prevent mouse down events from propagating to prevent blur, but only on toolbar buttons
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (disabled) return null;

  // Hashtag search panel content
  const HashtagContent: React.FC<{ closeTooltip?: () => void }> = ({
    closeTooltip
  }) => (
    <div className="toolbar-tooltip-panel">
      <div className="toolbar-search-header">
        <input
          type="text"
          placeholder="Search hashtags..."
          value={hashtagQuery}
          onChange={(e) => setHashtagQuery(e.target.value)}
          className="toolbar-search-input"
          autoFocus
        />
      </div>
      <div className="toolbar-search-results">
        {loadingHashtags && <div className="toolbar-loading">Searching...</div>}
        {!loadingHashtags &&
          hashtagResults.length === 0 &&
          hashtagQuery.length >= 2 && (
            <div className="toolbar-no-results">No hashtags found</div>
          )}
        {hashtagResults.map((hashtag, index) => (
          <button
            key={hashtag.id || index}
            className="toolbar-result-item"
            onClick={() => {
              handleHashtagSelect(hashtag);
              if (closeTooltip) closeTooltip();
            }}
          >
            <span className="toolbar-result-trigger">#</span>
            <span className="toolbar-result-label">{hashtag.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Mention search panel content
  const MentionContent: React.FC<{ closeTooltip?: () => void }> = ({
    closeTooltip
  }) => (
    <div className="toolbar-tooltip-panel">
      <div className="toolbar-search-header">
        <input
          type="text"
          placeholder="Search users..."
          value={mentionQuery}
          onChange={(e) => setMentionQuery(e.target.value)}
          className="toolbar-search-input"
          autoFocus
        />
      </div>
      <div className="toolbar-search-results">
        {loadingMentions && <div className="toolbar-loading">Searching...</div>}
        {!loadingMentions &&
          mentionResults.length === 0 &&
          mentionQuery.length >= 2 && (
            <div className="toolbar-no-results">No users found</div>
          )}
        {mentionResults.map((user, index) => (
          <button
            key={user.id || index}
            className="toolbar-result-item"
            onClick={() => {
              handleMentionSelect(user);
              if (closeTooltip) closeTooltip();
            }}
          >
            {user.avatar && (
              <img src={user.avatar} alt="" className="toolbar-result-avatar" />
            )}
            <span className="toolbar-result-trigger">@</span>
            <span className="toolbar-result-label">{user.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Emoji picker content
  const EmojiContent: React.FC<{ closeTooltip?: () => void }> = ({
    closeTooltip
  }) => (
    <div className="toolbar-tooltip-panel toolbar-tooltip-panel--wide">
      <EmojiPicker
        isOpen={true}
        onClose={() => {
          if (closeTooltip) closeTooltip();
        }}
        onEmojiSelect={(emoji) => {
          handleEmojiSelect(emoji);
          if (closeTooltip) closeTooltip();
        }}
        className="toolbar-emoji-picker"
      />
    </div>
  );

  return (
    <div className="floating-toolbar">
      {/* Hashtag Button with Interactive Tooltip */}
      <InteractiveTooltip
        content={<HashtagContent />}
        delay={0}
        className="toolbar-tooltip"
        triggerOnClick={true}
        onClose={() => onToolbarInteractionEnd?.()}
      >
        <button
          type="button"
          className="toolbar-button"
          onMouseDown={(e) => {
            handleToolbarMouseDown(e);
            onToolbarInteractionStart?.();
          }}
          title="Insert hashtag"
          disabled={disabled}
        >
          #
        </button>
      </InteractiveTooltip>

      {/* Mention Button with Interactive Tooltip */}
      <InteractiveTooltip
        content={<MentionContent />}
        delay={0}
        className="toolbar-tooltip"
        triggerOnClick={true}
        onClose={() => onToolbarInteractionEnd?.()}
      >
        <button
          type="button"
          className="toolbar-button"
          onMouseDown={(e) => {
            handleToolbarMouseDown(e);
            onToolbarInteractionStart?.();
          }}
          title="Insert mention"
          disabled={disabled}
        >
          @
        </button>
      </InteractiveTooltip>

      {/* Emoji Button with Interactive Tooltip */}
      <InteractiveTooltip
        content={<EmojiContent />}
        delay={0}
        className="toolbar-tooltip toolbar-tooltip--wide"
        triggerOnClick={true}
        onClose={() => onToolbarInteractionEnd?.()}
      >
        <button
          type="button"
          className="toolbar-button"
          onMouseDown={(e) => {
            handleToolbarMouseDown(e);
            onToolbarInteractionStart?.();
          }}
          title="Insert emoji"
          disabled={disabled}
        >
          😀
        </button>
      </InteractiveTooltip>
    </div>
  );
};
