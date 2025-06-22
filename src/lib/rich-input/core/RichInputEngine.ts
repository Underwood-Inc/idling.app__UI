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

    // Use existing content parser to get segments
    const contentSegments = ContentParser.parse(text);

    for (const segment of contentSegments) {
      if (segment.type === 'text') {
        // For text segments, create single tokens that preserve whitespace
        tokens.push({
          type: 'text',
          content: segment.value,
          rawText: segment.value,
          start: segment.start || 0,
          end: segment.end || segment.value.length,
          metadata: {
            isWhitespace: /^\s+$/.test(segment.value),
            hasNewlines: segment.value.includes('\n')
          }
        });
      } else {
        // Generate display format for rawText
        let displayText = segment.value;
        if (segment.type === 'hashtag') {
          displayText = `#${segment.value}`;
        } else if (segment.type === 'mention') {
          displayText = `@${segment.displayName || segment.value}`;
        } else if (segment.type === 'url') {
          displayText = segment.value;
        }

        tokens.push({
          type: segment.type as any,
          content: segment.value,
          rawText: displayText,
          start: segment.start || 0,
          end: segment.end || displayText.length,
          metadata: {
            hashtag: segment.type === 'hashtag' ? segment.value : undefined,
            userId: segment.userId,
            username: segment.displayName,
            displayName: segment.displayName,
            filterType: segment.filterType,
            href: segment.type === 'url' ? segment.value : undefined,
            behavior: segment.behavior as any,
            originalFormat: segment.rawFormat,
            isWhitespace: false
          }
        });
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
    const lines = rawText.split('\n');

    // Calculate current line and column
    let currentLine = 0;
    let currentColumn = position.index;
    let lineStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineEnd = lineStart + lines[i].length;
      if (position.index <= lineEnd) {
        currentLine = i;
        currentColumn = position.index - lineStart;
        break;
      }
      lineStart = lineEnd + 1; // +1 for newline character
    }

    // Calculate new line
    const newLine = Math.max(
      0,
      Math.min(lines.length - 1, currentLine + direction)
    );
    const newLineText = lines[newLine];
    const newColumn = Math.min(currentColumn, newLineText.length);

    // Calculate new index
    let newIndex = 0;
    for (let i = 0; i < newLine; i++) {
      newIndex += lines[i].length + 1; // +1 for newline
    }
    newIndex += newColumn;

    return {
      index: newIndex,
      line: newLine,
      column: newColumn
    };
  }

  private registerBuiltInParsers(): void {
    // Parsers are handled by the ContentParser and RichTextParser
    // Custom parsers can be added via the config
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach((callback) => callback(this.state));
  }

  /**
   * Snaps cursor position to pill boundaries
   * If cursor is inside a pill, moves it to the closest boundary
   */
  private snapCursorToPillBoundary(
    position: RichInputPosition
  ): RichInputPosition {
    const { tokens } = this.state;

    // Find if cursor is inside a pill token (not at boundaries)
    const pillToken = tokens.find(
      (token) =>
        token.type !== 'text' &&
        position.index > token.start &&
        position.index < token.end
    );

    if (pillToken) {
      // Cursor is inside a pill - snap to closest boundary
      const distanceToStart = position.index - pillToken.start;
      const distanceToEnd = pillToken.end - position.index;

      // Snap to the closest boundary
      const snapToStart = distanceToStart <= distanceToEnd;
      return {
        index: snapToStart ? pillToken.start : pillToken.end,
        line: position.line,
        column: position.column
      };
    }

    // Check if cursor is exactly at a pill boundary - don't snap
    const atPillBoundary = tokens.some(
      (token) =>
        token.type !== 'text' &&
        (position.index === token.start || position.index === token.end)
    );

    if (atPillBoundary) {
      // Cursor is exactly at a pill boundary, keep it there
      return position;
    }

    // Cursor is not inside or at a pill boundary, return as-is
    return position;
  }

  /**
   * Moves cursor left with pill awareness
   * Skips over entire pills instead of moving character by character
   */
  private moveCursorLeftWithPillAwareness(
    position: RichInputPosition
  ): RichInputPosition {
    const { tokens } = this.state;

    // Find the pill that ends at current position
    const pillAtCursor = tokens.find(
      (token) => token.type !== 'text' && token.end === position.index
    );

    if (pillAtCursor) {
      // If we're at the end of a pill, jump to its start
      return {
        index: pillAtCursor.start,
        line: position.line,
        column: position.column
      };
    }

    // Find the pill that would be to the left
    const newIndex = Math.max(0, position.index - 1);
    const pillToLeft = tokens.find(
      (token) =>
        token.type !== 'text' && newIndex > token.start && newIndex <= token.end
    );

    if (pillToLeft) {
      // If moving left would put us inside a pill, jump to its start
      return {
        index: pillToLeft.start,
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
   * Moves cursor right with pill awareness
   * Skips over entire pills instead of moving character by character
   */
  private moveCursorRightWithPillAwareness(
    position: RichInputPosition
  ): RichInputPosition {
    const { tokens, rawText } = this.state;

    // Find the pill that starts at current position
    const pillAtCursor = tokens.find(
      (token) => token.type !== 'text' && token.start === position.index
    );

    if (pillAtCursor) {
      // If we're at the start of a pill, jump to its end
      return {
        index: pillAtCursor.end,
        line: position.line,
        column: position.column
      };
    }

    // Find the pill that would be to the right
    const newIndex = Math.min(rawText.length, position.index + 1);
    const pillToRight = tokens.find(
      (token) =>
        token.type !== 'text' && newIndex >= token.start && newIndex < token.end
    );

    if (pillToRight) {
      // If moving right would put us inside a pill, jump to its end
      return {
        index: pillToRight.end,
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
}
