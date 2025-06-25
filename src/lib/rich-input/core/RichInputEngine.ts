/**
 * Core engine for the rich input system
 * Handles state management, text operations, and parsing
 */

import { ContentParser } from '../../utils/content-parsers';
import { RichTextParser } from '../../utils/parsers/rich-text-parser';
import type {
  RichContentParser,
  RichContentToken,
  RichInputAPI,
  RichInputConfig,
  RichInputHistoryEntry,
  RichInputPosition,
  RichInputRange,
  RichInputSelection,
  RichInputState
} from '../types';
import { logParsing, richTextLogger } from '../utils/logger';
import { navigateDownLine, navigateUpLine } from '../utils/navigationUtils';

export class RichInputEngine implements RichInputAPI {
  private state: RichInputState;
  private config: RichInputConfig;
  private parsers: Map<string, RichContentParser>;
  private richTextParser: RichTextParser;
  private stateChangeCallbacks: Set<(state: RichInputState) => void>;

  constructor(config: RichInputConfig = {}) {
    this.config = config;
    this.parsers = new Map();
    this.stateChangeCallbacks = new Set();

    // Set up logger context
    if (config.styling?.className) {
      richTextLogger.setContext(config.styling.className);
    }

    // Initialize rich text parser
    this.richTextParser = new RichTextParser({
      enableHashtags: config.parsers?.hashtags !== false,
      enableMentions: config.parsers?.mentions !== false,
      enableUrls: config.parsers?.urls !== false,
      enableEmojis: config.parsers?.emojis !== false,
      enableImages: config.parsers?.images !== false,
      enableMarkdown: config.parsers?.markdown !== false
    });

    // Load emojis from API if emoji parsing is enabled
    if (config.parsers?.emojis !== false) {
      // Load emojis asynchronously to avoid blocking initialization
      this.loadEmojisFromAPI().catch((error) => {
        richTextLogger.logWarning('Failed to initialize emoji loading:', error);
      });
    }

    // Initialize state
    this.state = {
      rawText: '',
      tokens: [],
      selection: {
        start: { index: 0 },
        end: { index: 0 },
        direction: 'none'
      },
      cursorPosition: { index: 0 },
      isMultiline: config.multiline || false,
      isFocused: false,
      history: [],
      historyIndex: -1
    };

    // Register built-in parsers
    this.registerBuiltInParsers();

    // Register custom parsers
    if (config.parsers?.custom) {
      config.parsers.custom.forEach((parser) => this.addParser(parser));
    }
  }

  // State management
  getState(): RichInputState {
    return { ...this.state };
  }

  setState(newState: Partial<RichInputState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    // Reparse if text changed
    if (
      newState.rawText !== undefined &&
      newState.rawText !== oldState.rawText
    ) {
      this.reparse();
    }

    this.notifyStateChange();
  }

  // Text operations
  insertText(text: string, position?: RichInputPosition): void {
    const insertPos = position || this.state.cursorPosition;
    const { rawText } = this.state;

    // If we're inserting into an empty input (with dummy token), replace entirely
    if (
      rawText.length === 0 &&
      this.state.tokens.length === 1 &&
      this.state.tokens[0].metadata?.isDummy
    ) {
      const newCursorPos = { index: text.length };

      this.saveHistoryEntry();
      this.setState({
        rawText: text,
        cursorPosition: newCursorPos,
        selection: {
          start: newCursorPos,
          end: newCursorPos,
          direction: 'none'
        }
      });
      return;
    }

    const newText =
      rawText.slice(0, insertPos.index) + text + rawText.slice(insertPos.index);
    const newCursorPos = { index: insertPos.index + text.length };

    this.saveHistoryEntry();
    this.setState({
      rawText: newText,
      cursorPosition: newCursorPos,
      selection: {
        start: newCursorPos,
        end: newCursorPos,
        direction: 'none'
      }
    });
  }

  deleteText(range: RichInputRange): void {
    const { rawText } = this.state;
    const newText = rawText.slice(0, range.start) + rawText.slice(range.end);
    const newCursorPos = { index: range.start };

    this.saveHistoryEntry();
    this.setState({
      rawText: newText,
      cursorPosition: newCursorPos,
      selection: {
        start: newCursorPos,
        end: newCursorPos,
        direction: 'none'
      }
    });
  }

  replaceText(range: RichInputRange, newText: string): void {
    const { rawText } = this.state;
    const updatedText =
      rawText.slice(0, range.start) + newText + rawText.slice(range.end);
    const newCursorPos = { index: range.start + newText.length };

    this.saveHistoryEntry();
    this.setState({
      rawText: updatedText,
      cursorPosition: newCursorPos,
      selection: {
        start: newCursorPos,
        end: newCursorPos,
        direction: 'none'
      }
    });
  }

  // Selection operations
  setSelection(selection: RichInputSelection): void {
    // Apply pill-aware snapping to both start and end positions
    const snappedStart = this.snapCursorToPillBoundary(selection.start);
    const snappedEnd = this.snapCursorToPillBoundary(selection.end);

    let finalSelection: RichInputSelection = {
      start: snappedStart,
      end: snappedEnd,
      direction: selection.direction
    };

    // Smart selection: expand to token boundaries if enabled
    if (this.config.behavior?.smartSelection) {
      finalSelection = this.expandSelectionToTokens(finalSelection);
    }

    this.setState({
      selection: finalSelection,
      cursorPosition: finalSelection.end
    });
  }

  selectAll(): void {
    this.setSelection({
      start: { index: 0 },
      end: { index: this.state.rawText.length },
      direction: 'forward'
    });
  }

  selectToken(token: RichContentToken): void {
    this.setSelection({
      start: { index: token.start },
      end: { index: token.end },
      direction: 'forward'
    });
  }

  getSelectedText(): string {
    const { selection, rawText } = this.state;
    return rawText.slice(selection.start.index, selection.end.index);
  }

  // Cursor operations
  setCursor(position: RichInputPosition): void {
    // Snap cursor to pill boundaries
    const snappedPosition = this.snapCursorToPillBoundary(position);

    // Set cursor directly without triggering smart selection
    this.setState({
      cursorPosition: snappedPosition,
      selection: {
        start: snappedPosition,
        end: snappedPosition,
        direction: 'none'
      }
    });
  }

  moveCursor(
    direction: 'left' | 'right' | 'up' | 'down',
    extend: boolean = false
  ): void {
    const { cursorPosition, selection, rawText, isMultiline } = this.state;
    let newPosition = { ...cursorPosition };

    switch (direction) {
      case 'left':
        newPosition = this.moveCursorLeftWithPillAwareness(cursorPosition);
        break;
      case 'right':
        newPosition = this.moveCursorRightWithPillAwareness(cursorPosition);
        break;
      case 'up':
        if (isMultiline) {
          newPosition = this.moveCursorVertically(cursorPosition, -1);
          newPosition = this.snapCursorToPillBoundary(newPosition);
        }
        break;
      case 'down':
        if (isMultiline) {
          newPosition = this.moveCursorVertically(cursorPosition, 1);
          newPosition = this.snapCursorToPillBoundary(newPosition);
        }
        break;
    }

    if (extend) {
      this.setSelection({
        start: selection.start,
        end: newPosition,
        direction:
          newPosition.index > selection.start.index ? 'forward' : 'backward'
      });
    } else {
      this.setCursor(newPosition);
    }
  }

  // History operations
  undo(): void {
    if (this.state.historyIndex > 0) {
      const historyEntry = this.state.history[this.state.historyIndex - 1];
      this.setState({
        rawText: historyEntry.rawText,
        selection: historyEntry.selection,
        cursorPosition: historyEntry.selection.end,
        historyIndex: this.state.historyIndex - 1
      });
    }
  }

  redo(): void {
    if (this.state.historyIndex < this.state.history.length - 1) {
      const historyEntry = this.state.history[this.state.historyIndex + 1];
      this.setState({
        rawText: historyEntry.rawText,
        selection: historyEntry.selection,
        cursorPosition: historyEntry.selection.end,
        historyIndex: this.state.historyIndex + 1
      });
    }
  }

  saveHistoryEntry(): void {
    const entry: RichInputHistoryEntry = {
      rawText: this.state.rawText,
      selection: this.state.selection,
      timestamp: Date.now()
    };

    // Don't save duplicate entries
    const lastEntry = this.state.history[this.state.history.length - 1];
    if (lastEntry && lastEntry.rawText === entry.rawText) {
      return;
    }

    // Remove any future history if we're not at the end
    const newHistory = this.state.history.slice(0, this.state.historyIndex + 1);
    newHistory.push(entry);

    // Limit history size
    if (newHistory.length > 100) {
      newHistory.shift();
    }

    this.setState({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  }

  // Parser operations
  reparse(): void {
    const tokens = this.parseText(this.state.rawText);

    // Log parsing results for debugging
    const segments = ContentParser.parse(this.state.rawText);
    logParsing(this.state.rawText, segments, tokens);

    this.setState({ tokens });
  }

  addParser(parser: RichContentParser): void {
    this.parsers.set(parser.name, parser);
    this.reparse();
  }

  removeParser(name: string): void {
    this.parsers.delete(name);
    this.reparse();
  }

  // Utility operations
  focus(): void {
    this.setState({ isFocused: true });
  }

  blur(): void {
    this.setState({ isFocused: false });
  }

  clear(): void {
    this.saveHistoryEntry();
    this.setState({
      rawText: '',
      tokens: [],
      cursorPosition: { index: 0 },
      selection: {
        start: { index: 0 },
        end: { index: 0 },
        direction: 'none'
      }
    });
  }

  isEmpty(): boolean {
    return this.state.rawText.length === 0;
  }

  // Event subscription
  onStateChange(callback: (state: RichInputState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  // Private methods
  private parseText(text: string): RichContentToken[] {
    const tokens: RichContentToken[] = [];

    // If text is empty, create a dummy token for cursor positioning
    if (text.length === 0) {
      tokens.push({
        type: 'text',
        content: '',
        rawText: '',
        start: 0,
        end: 0,
        metadata: {
          isWhitespace: false,
          isNewline: false,
          hasNewlines: false,
          isDummy: true // Mark as dummy token for special handling
        }
      });
      return tokens;
    }

    // Use the rich text parser to get all tokens including emojis
    const richTextTokens = this.richTextParser.parse(text);

    // Convert RichTextTokens to RichContentTokens
    for (const richToken of richTextTokens) {
      if (richToken.type === 'text') {
        // For text tokens, split on newlines to create separate tokens
        const textValue = richToken.content;
        const segmentStart = richToken.start;

        if (textValue.includes('\n')) {
          // For text with newlines, create line-aware tokens for better cursor positioning
          this.createLineAwareTokens(textValue, segmentStart, tokens);
        } else {
          // For text segments without newlines, create single tokens that preserve whitespace
          tokens.push({
            type: 'text',
            content: textValue,
            rawText: textValue,
            start: segmentStart,
            end: richToken.end,
            metadata: {
              isWhitespace: /^\s+$/.test(textValue),
              isNewline: false,
              hasNewlines: false
            }
          });
        }
      } else {
        // Convert rich text token to rich content token
        const richContentToken: RichContentToken = {
          type: richToken.type as any,
          content: richToken.content,
          rawText: richToken.rawText,
          start: richToken.start,
          end: richToken.end,
          metadata: {}
        };

        // Add type-specific metadata
        switch (richToken.type) {
          case 'hashtag':
            richContentToken.metadata!.hashtag = richToken.content;
            break;
          case 'mention':
            richContentToken.metadata!.userId = richToken.userId;
            richContentToken.metadata!.username = richToken.displayName;
            richContentToken.metadata!.displayName = richToken.displayName;
            richContentToken.metadata!.filterType = richToken.filterType as any;
            break;
          case 'url':
            richContentToken.metadata!.href = richToken.href;
            richContentToken.metadata!.behavior = richToken.behavior as any;
            richContentToken.metadata!.originalFormat = richToken.rawText;
            break;
          case 'emoji':
            richContentToken.metadata!.emojiId = richToken.emojiId;
            richContentToken.metadata!.emojiUnicode = richToken.emojiUnicode;
            richContentToken.metadata!.emojiImageUrl = richToken.emojiImageUrl;
            break;
          case 'markdown':
            richContentToken.metadata!.markdownType = richToken.markdownType;
            richContentToken.metadata!.href = richToken.href;
            break;
          case 'image':
            richContentToken.metadata!.imageSrc = richToken.imageSrc;
            richContentToken.metadata!.imageAlt = richToken.imageAlt;
            richContentToken.metadata!.imageTitle = richToken.imageTitle;
            break;
        }

        // Set common metadata
        richContentToken.metadata!.isWhitespace = false;
        richContentToken.metadata!.isNewline = false;
        richContentToken.metadata!.hasNewlines = false;

        tokens.push(richContentToken);
      }
    }

    // Apply custom parsers (if any)
    const customTokens: RichContentToken[] = [];
    const sortedParsers = Array.from(this.parsers.values()).sort(
      (a, b) => b.priority - a.priority
    );

    for (const parser of sortedParsers) {
      const parserTokens = parser.parse(text);
      customTokens.push(...parserTokens);
    }

    // Merge and sort all tokens by start position
    const allTokens = [...tokens, ...customTokens];
    return allTokens.sort((a, b) => a.start - b.start);
  }

  private expandSelectionToTokens(
    selection: RichInputSelection
  ): RichInputSelection {
    const { tokens } = this.state;
    let expandedStart = selection.start;
    let expandedEnd = selection.end;

    // Get selection bounds
    const selectionStart = Math.min(selection.start.index, selection.end.index);
    const selectionEnd = Math.max(selection.start.index, selection.end.index);

    // If this is a zero-length selection (cursor position), don't expand
    if (selectionStart === selectionEnd) {
      return selection;
    }

    // Find all tokens that are COMPLETELY intersected by the selection
    for (const token of tokens) {
      if (token.type === 'text') continue;

      // Only expand if the selection significantly overlaps with the pill
      // This prevents accidental expansion when clicking near pills
      const overlapStart = Math.max(selectionStart, token.start);
      const overlapEnd = Math.min(selectionEnd, token.end);
      const overlapLength = Math.max(0, overlapEnd - overlapStart);
      const tokenLength = token.end - token.start;
      const overlapPercentage = overlapLength / tokenLength;

      // Only expand if more than 50% of the pill is selected
      if (overlapPercentage > 0.5) {
        // Expand selection to include entire token
        if (token.start < expandedStart.index) {
          expandedStart = {
            index: token.start,
            line: expandedStart.line,
            column: expandedStart.column
          };
        }
        if (token.end > expandedEnd.index) {
          expandedEnd = {
            index: token.end,
            line: expandedEnd.line,
            column: expandedEnd.column
          };
        }
      }
    }

    return {
      start: expandedStart,
      end: expandedEnd,
      direction: selection.direction
    };
  }

  private moveCursorVertically(
    position: RichInputPosition,
    direction: number
  ): RichInputPosition {
    const { rawText } = this.state;

    // Use the enhanced navigation utilities that handle edge cases
    if (direction < 0) {
      // Moving up - use navigateUpLine which handles first line edge case
      return navigateUpLine(position, rawText);
    } else {
      // Moving down - use navigateDownLine which handles last line edge case
      return navigateDownLine(position, rawText);
    }
  }

  private registerBuiltInParsers(): void {
    // Parsers are handled by the ContentParser and RichTextParser
    // Custom parsers can be added via the config
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach((callback) => callback(this.state));
  }

  /**
   * Snaps cursor position to pill and newline boundaries
   * If cursor is inside a pill or newline, moves it to the closest boundary
   */
  private snapCursorToPillBoundary(
    position: RichInputPosition
  ): RichInputPosition {
    const { tokens } = this.state;

    // Find if cursor is inside a pill or newline token (not at boundaries)
    const atomicToken = tokens.find(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        position.index > token.start &&
        position.index < token.end
    );

    if (atomicToken) {
      // Cursor is inside a pill or newline - snap to closest boundary
      const distanceToStart = position.index - atomicToken.start;
      const distanceToEnd = atomicToken.end - position.index;

      // Snap to the closest boundary
      const snapToStart = distanceToStart <= distanceToEnd;
      return {
        index: snapToStart ? atomicToken.start : atomicToken.end,
        line: position.line,
        column: position.column
      };
    }

    // Check if cursor is exactly at a pill or newline boundary - don't snap
    const atAtomicBoundary = tokens.some(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        (position.index === token.start || position.index === token.end)
    );

    if (atAtomicBoundary) {
      // Cursor is exactly at a pill or newline boundary, keep it there
      return position;
    }

    // Cursor is not inside or at a pill/newline boundary, return as-is
    return position;
  }

  /**
   * Moves cursor left with pill and newline awareness
   * Skips over entire pills and newlines instead of moving character by character
   */
  private moveCursorLeftWithPillAwareness(
    position: RichInputPosition
  ): RichInputPosition {
    const { tokens } = this.state;

    // Find the token that ends at current position (pill or newline)
    const tokenAtCursor = tokens.find(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        token.end === position.index
    );

    if (tokenAtCursor) {
      // If we're at the end of a pill or newline, jump to its start
      return {
        index: tokenAtCursor.start,
        line: position.line,
        column: position.column
      };
    }

    // Find the token that would be to the left (pill or newline)
    const newIndex = Math.max(0, position.index - 1);
    const tokenToLeft = tokens.find(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        newIndex > token.start &&
        newIndex <= token.end
    );

    if (tokenToLeft) {
      // If moving left would put us inside a pill or newline, jump to its start
      return {
        index: tokenToLeft.start,
        line: position.line,
        column: position.column
      };
    }

    // Normal left movement
    return {
      index: newIndex,
      line: position.line,
      column: position.column
    };
  }

  /**
   * Moves cursor right with pill and newline awareness
   * Skips over entire pills and newlines instead of moving character by character
   */
  private moveCursorRightWithPillAwareness(
    position: RichInputPosition
  ): RichInputPosition {
    const { tokens, rawText } = this.state;

    // Find the token that starts at current position (pill or newline)
    const tokenAtCursor = tokens.find(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        token.start === position.index
    );

    if (tokenAtCursor) {
      // If we're at the start of a pill or newline, jump to its end
      return {
        index: tokenAtCursor.end,
        line: position.line,
        column: position.column
      };
    }

    // Find the token that would be to the right (pill or newline)
    const newIndex = Math.min(rawText.length, position.index + 1);
    const tokenToRight = tokens.find(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        newIndex >= token.start &&
        newIndex < token.end
    );

    if (tokenToRight) {
      // If moving right would put us inside a pill or newline, jump to its end
      return {
        index: tokenToRight.end,
        line: position.line,
        column: position.column
      };
    }

    // Normal right movement
    return {
      index: newIndex,
      line: position.line,
      column: position.column
    };
  }

  /**
   * Create line-aware tokens for multiline text content
   * This improves cursor positioning accuracy by creating separate tokens for each line
   */
  private createLineAwareTokens(
    textValue: string,
    segmentStart: number,
    tokens: RichContentToken[]
  ): void {
    const lines = textValue.split('\n');
    let currentOffset = segmentStart;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isLastLine = i === lines.length - 1;

      // Create a token for the line content (if not empty)
      if (line.length > 0) {
        tokens.push({
          type: 'text',
          content: line,
          rawText: line,
          start: currentOffset,
          end: currentOffset + line.length,
          metadata: {
            isWhitespace: /^\s+$/.test(line),
            isNewline: false,
            hasNewlines: false,
            customData: {
              lineIndex: i,
              isLineStart: true,
              isLineEnd: !isLastLine // Not line end if there's a newline after
            }
          }
        });
      }

      currentOffset += line.length;

      // Create a newline token (except after the last line)
      if (!isLastLine) {
        tokens.push({
          type: 'text',
          content: '\n',
          rawText: '\n',
          start: currentOffset,
          end: currentOffset + 1,
          metadata: {
            isWhitespace: true,
            isNewline: true,
            hasNewlines: false,
            customData: {
              lineIndex: i,
              isLineStart: false,
              isLineEnd: true
            }
          }
        });
        currentOffset += 1; // Move past the newline character
      }
    }
  }

  private async loadEmojisFromAPI(): Promise<void> {
    // Only load emojis in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Fetch emojis from the API
      const response = await fetch(
        '/api/emojis?per_page=1000&include_custom=true'
      );
      if (!response.ok) {
        throw new Error('Failed to load emojis from API');
      }

      const data = await response.json();

      // Convert API emoji data to EmojiDefinition format and add to parser
      const apiEmojis = data.emojis.map((emoji: any) => ({
        id: emoji.emoji_id, // Use emoji_id as the primary ID (e.g., "beaming_face_with_smiling_eyes")
        name: emoji.emoji_id, // Use emoji_id as name for consistency
        imageUrl: emoji.custom_image_url,
        unicode: emoji.unicode_char,
        category: emoji.category.name,
        tags: emoji.tags || [],
        aliases: [
          emoji.emoji_id, // Primary alias: "beaming_face_with_smiling_eyes"
          ...(emoji.aliases || []), // Existing aliases from API
          ...(emoji.name ? [emoji.name.toLowerCase().replace(/\s+/g, '_')] : []) // Convert human name to underscore format
        ]
      }));

      // Add emojis to the rich text parser using the public API
      for (const emoji of apiEmojis) {
        this.richTextParser.addCustomEmoji(emoji);
      }

      richTextLogger.logInfo(`Loaded ${apiEmojis.length} emojis from API`);
    } catch (error) {
      richTextLogger.logWarning('Failed to load emojis from API:', error);
      // Continue with built-in emojis if API fails
    }
  }
}
