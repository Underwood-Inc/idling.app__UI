'use client';

import {
  HashtagResult,
  searchHashtags,
  searchUsers,
  UserResult
} from '@lib/actions/search.actions';
import { useUserPreferences } from '@lib/context/UserPreferencesContext';
import * as React from 'react';
import { InteractiveTooltip } from '../../../tooltip/InteractiveTooltip';
import {
  EmojiData,
  EmojiPicker,
  formatEmojiForText
} from '../../../ui/EmojiPicker';
import './FloatingToolbar.css';

// Emoji panel component that accepts closeTooltip prop from InteractiveTooltip
const EmojiPanelContent: React.FC<{
  closeTooltip?: () => void;
  handleEmojiSelect: (emoji: EmojiData) => void;
  emojiPanelBehavior: 'close_after_select' | 'stay_open';
  emojiPickerConfig: {
    enablePagination: boolean;
    itemsPerPage?: number;
    maxResults: number;
  };
}> = React.memo(
  ({
    closeTooltip: tooltipClose,
    handleEmojiSelect,
    emojiPanelBehavior,
    emojiPickerConfig
  }) => (
    <div className="toolbar-tooltip-panel toolbar-tooltip-panel--wide">
      <EmojiPicker
        isOpen={true}
        onClose={() => {}}
        onEmojiSelect={(emoji) => {
          handleEmojiSelect(emoji);
          // Close tooltip based on user preference
          if (emojiPanelBehavior === 'close_after_select' && tooltipClose) {
            // Close the tooltip after a short delay to allow the emoji to be inserted
            setTimeout(() => {
              tooltipClose();
            }, 100);
          }
        }}
        className="toolbar-emoji-picker"
        autoFetch={true}
        enablePagination={emojiPickerConfig.enablePagination}
        itemsPerPage={emojiPickerConfig.itemsPerPage}
        maxResults={emojiPickerConfig.maxResults}
      />
    </div>
  )
);
EmojiPanelContent.displayName = 'EmojiPanelContent';

// Wrapper function component to receive closeTooltip from InteractiveTooltip
const EmojiPanelWrapper = (props: {
  closeTooltip?: () => void;
  handleEmojiSelect: (emoji: EmojiData) => void;
  emojiPanelBehavior: 'close_after_select' | 'stay_open';
  emojiPickerConfig: {
    enablePagination: boolean;
    itemsPerPage?: number;
    maxResults: number;
  };
}) => <EmojiPanelContent {...props} />;

interface FloatingToolbarProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onHashtagInsert: (text: string) => void;
  onMentionInsert: (text: string) => void;
  onEmojiInsert: (text: string) => void;
  disabled?: boolean;
  onToolbarInteractionStart?: () => void;
  onToolbarInteractionEnd?: () => void;
  closeTooltip?: () => void; // Passed by InteractiveTooltip
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  inputRef,
  onHashtagInsert,
  onMentionInsert,
  onEmojiInsert,
  disabled = false,
  onToolbarInteractionStart,
  onToolbarInteractionEnd,
  closeTooltip
}) => {
  const { paginationMode, emojiPanelBehavior } = useUserPreferences();

  // State for search functionality within the toolbar tooltips
  const [hashtagQuery, setHashtagQuery] = React.useState('');
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [hashtagResults, setHashtagResults] = React.useState<any[]>([]);
  const [mentionResults, setMentionResults] = React.useState<any[]>([]);
  const [loadingHashtags, setLoadingHashtags] = React.useState(false);
  const [loadingMentions, setLoadingMentions] = React.useState(false);

  // Search hashtags
  React.useEffect(() => {
    if (hashtagQuery.length >= 2) {
      setLoadingHashtags(true);

      const searchHashtagsAsync = async () => {
        try {
          const result = await searchHashtags(hashtagQuery, 1, 10);
          const transformedResults = result.items.map(
            (hashtag: HashtagResult) => ({
              id: hashtag.id,
              label: hashtag.label,
              value: hashtag.value,
              count: hashtag.count,
              disabled: false // No existing hashtags to check against in toolbar
            })
          );
          setHashtagResults(transformedResults);
        } catch (error) {
          console.warn('Error searching hashtags:', error);
          setHashtagResults([
            {
              id: `${hashtagQuery}-1`,
              label: hashtagQuery,
              value: hashtagQuery.startsWith('#')
                ? hashtagQuery
                : `#${hashtagQuery}`,
              count: 0,
              disabled: false
            }
          ]);
        } finally {
          setLoadingHashtags(false);
        }
      };

      const timeoutId = setTimeout(searchHashtagsAsync, 300);
      return () => {
        clearTimeout(timeoutId);
        setLoadingHashtags(false);
      };
    } else {
      setHashtagResults([]);
      setLoadingHashtags(false);
    }
  }, [hashtagQuery]);

  // Search mentions
  React.useEffect(() => {
    if (mentionQuery.length >= 2) {
      setLoadingMentions(true);

      const searchUsersAsync = async () => {
        try {
          const result = await searchUsers(mentionQuery, 1, 10);
          const transformedResults = result.items.map((user: UserResult) => ({
            id: user.id,
            label: user.label,
            value: user.value,
            displayName: user.displayName,
            avatar: user.avatar,
            isAuthor: false,
            disabled: false // No existing users to check against in toolbar
          }));
          setMentionResults(transformedResults);
        } catch (error) {
          console.warn('Error searching users:', error);
          setMentionResults([
            {
              id: `${mentionQuery}-user`,
              label: mentionQuery,
              value: `${mentionQuery}-id`,
              displayName: mentionQuery,
              avatar: null,
              isAuthor: false,
              disabled: false
            }
          ]);
        } finally {
          setLoadingMentions(false);
        }
      };

      const timeoutId = setTimeout(searchUsersAsync, 300);
      return () => {
        clearTimeout(timeoutId);
        setLoadingMentions(false);
      };
    } else {
      setMentionResults([]);
      setLoadingMentions(false);
    }
  }, [mentionQuery]);

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
  const handleEmojiSelect = React.useCallback(
    (emoji: EmojiData) => {
      const emojiText = formatEmojiForText(emoji);
      onEmojiInsert(emojiText + ' '); // Add space after emoji for proper separation
      // Don't try to focus here - let the RichInputAdapter handle it
    },
    [onEmojiInsert]
  );

  // Prevent mouse down events from propagating to prevent blur, but only on toolbar buttons
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (disabled) return null;

  // Determine emoji picker configuration based on user preference
  const useInfiniteScroll = paginationMode === 'infinite';
  const emojiPickerConfig = useInfiniteScroll
    ? {
        enablePagination: false,
        maxResults: 500, // Show more emojis for infinite scroll
        itemsPerPage: undefined
      }
    : {
        enablePagination: true,
        itemsPerPage: 18,
        maxResults: 200
      };

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
            className={`toolbar-result-item ${hashtag.disabled ? 'toolbar-result-item--disabled' : ''}`}
            onClick={() => {
              if (!hashtag.disabled) {
                handleHashtagSelect(hashtag);
                if (closeTooltip) closeTooltip();
              }
            }}
            disabled={hashtag.disabled}
            title={hashtag.disabled ? 'Already selected' : undefined}
          >
            <span className="toolbar-result-trigger">#</span>
            <span className="toolbar-result-label">{hashtag.label}</span>
            {hashtag.disabled && (
              <span className="toolbar-result-indicator">✓</span>
            )}
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
            className={`toolbar-result-item ${user.disabled ? 'toolbar-result-item--disabled' : ''}`}
            onClick={() => {
              if (!user.disabled) {
                handleMentionSelect(user);
                if (closeTooltip) closeTooltip();
              }
            }}
            disabled={user.disabled}
            title={user.disabled ? 'Already selected' : undefined}
          >
            {user.avatar && (
              <img src={user.avatar} alt="" className="toolbar-result-avatar" />
            )}
            <span className="toolbar-result-trigger">@</span>
            <span className="toolbar-result-label">{user.label}</span>
            {user.disabled && (
              <span className="toolbar-result-indicator">✓</span>
            )}
          </button>
        ))}
      </div>
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
        content={
          <EmojiPanelWrapper
            handleEmojiSelect={handleEmojiSelect}
            emojiPanelBehavior={emojiPanelBehavior}
            emojiPickerConfig={emojiPickerConfig}
          />
        }
        triggerOnClick={true}
        onClose={() => onToolbarInteractionEnd?.()}
        onShow={() => onToolbarInteractionStart?.()}
        className="interactive-tooltip--emoji"
      >
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            handleToolbarMouseDown(e);
            onToolbarInteractionStart?.();
          }}
          type="button"
          aria-label="Insert emoji"
          title="Insert emoji"
          disabled={disabled}
        >
          😀
        </button>
      </InteractiveTooltip>
    </div>
  );
};
