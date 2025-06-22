/**
 * Core types for the composable rich input system
 * Implementation-agnostic interfaces that can be used anywhere
 */

export interface RichInputPosition {
  index: number;
  line?: number;
  column?: number;
}

export interface RichInputSelection {
  start: RichInputPosition;
  end: RichInputPosition;
  direction?: 'forward' | 'backward' | 'none';
}

export interface RichInputRange {
  start: number;
  end: number;
}

export type RichContentTokenType =
  | 'text'
  | 'hashtag'
  | 'mention'
  | 'url'
  | 'emoji'
  | 'image'
  | 'markdown'
  | 'custom';

export interface RichContentToken {
  type: RichContentTokenType;
  content: string;
  rawText: string;
  start: number;
  end: number;

  // Type-specific metadata
  metadata?: {
    // Hashtag
    hashtag?: string;

    // Mention
    userId?: string;
    username?: string;
    displayName?: string;
    filterType?: 'author' | 'mentions';

    // URL
    href?: string;
    behavior?: 'link' | 'embed' | 'modal';

    // Emoji
    emojiId?: string;
    emojiUnicode?: string;
    emojiImageUrl?: string;

    // Image
    imageSrc?: string;
    imageAlt?: string;
    imageTitle?: string;

    // Markdown
    markdownType?: string;

    // Custom
    customType?: string;
    customData?: Record<string, any>;

    // Storage format (for editing/persistence)
    originalFormat?: string;

    // Whitespace and text properties
    isWhitespace?: boolean;
    hasNewlines?: boolean;
  };

  // Width measurement for accurate cursor positioning
  measuredWidth?: {
    normal: number; // Width in normal mode
    editMode?: number; // Width in edit mode (with controls)
    lastMeasured?: number; // Timestamp of last measurement
    containerSelector?: string; // CSS selector for the outer container to measure
  };
}

export interface RichInputState {
  rawText: string;
  tokens: RichContentToken[];
  selection: RichInputSelection;
  cursorPosition: RichInputPosition;
  isMultiline: boolean;
  isFocused: boolean;
  history: RichInputHistoryEntry[];
  historyIndex: number;
}

export interface RichInputHistoryEntry {
  rawText: string;
  selection: RichInputSelection;
  timestamp: number;
}

export interface RichInputConfig {
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;

  // Parser configuration
  parsers?: {
    hashtags?: boolean;
    mentions?: boolean;
    urls?: boolean;
    emojis?: boolean;
    images?: boolean;
    markdown?: boolean;
    custom?: RichContentParser[];
  };

  // Behavior configuration
  behavior?: {
    smartSelection?: boolean;
    autoComplete?: boolean;
    spellCheck?: boolean;
    tabSize?: number;
  };

  // Styling configuration
  styling?: {
    className?: string;
    style?: React.CSSProperties;
    tokenStyles?: Record<RichContentTokenType, React.CSSProperties>;
  };
}

export interface RichContentParser {
  name: string;
  priority: number;
  parse: (text: string) => RichContentToken[];
  render?: (token: RichContentToken) => React.ReactNode;

  // Width measurement capabilities
  measureWidth?: (
    token: RichContentToken,
    context: {
      isEditMode?: boolean;
      containerElement?: HTMLElement;
      measurementContainer?: HTMLElement;
    }
  ) => number;

  // Pre-render for accurate measurements
  preRender?: (
    token: RichContentToken,
    context: {
      isEditMode?: boolean;
      className?: string;
    }
  ) => HTMLElement;
}

export interface RichInputEventHandlers {
  onChange?: (state: RichInputState) => void;
  onFocus?: (state: RichInputState) => void;
  onBlur?: (state: RichInputState) => void;
  onSelectionChange?: (
    selection: RichInputSelection,
    state: RichInputState
  ) => void;
  onKeyDown?: (event: KeyboardEvent, state: RichInputState) => boolean | void;
  onKeyUp?: (event: KeyboardEvent, state: RichInputState) => boolean | void;
  onPaste?: (event: ClipboardEvent, state: RichInputState) => boolean | void;
  onCopy?: (event: ClipboardEvent, state: RichInputState) => boolean | void;
  onCut?: (event: ClipboardEvent, state: RichInputState) => boolean | void;
  onTokenClick?: (token: RichContentToken, state: RichInputState) => void;
  onTokenHover?: (token: RichContentToken, state: RichInputState) => void;
}

export interface RichInputAPI {
  // State management
  getState: () => RichInputState;
  setState: (state: Partial<RichInputState>) => void;

  // Text operations
  insertText: (text: string, position?: RichInputPosition) => void;
  deleteText: (range: RichInputRange) => void;
  replaceText: (range: RichInputRange, newText: string) => void;

  // Selection operations
  setSelection: (selection: RichInputSelection) => void;
  selectAll: () => void;
  selectToken: (token: RichContentToken) => void;
  getSelectedText: () => string;

  // Cursor operations
  setCursor: (position: RichInputPosition) => void;
  moveCursor: (
    direction: 'left' | 'right' | 'up' | 'down',
    extend?: boolean
  ) => void;

  // History operations
  undo: () => void;
  redo: () => void;
  saveHistoryEntry: () => void;

  // Parser operations
  reparse: () => void;
  addParser: (parser: RichContentParser) => void;
  removeParser: (name: string) => void;

  // Utility operations
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isEmpty: () => boolean;
}

export interface RichInputRenderer {
  renderToken: (
    token: RichContentToken,
    index: number,
    state: RichInputState
  ) => React.ReactNode;
  renderCursor: (
    position: RichInputPosition,
    state: RichInputState
  ) => React.ReactNode;
  renderSelection: (
    selection: RichInputSelection,
    state: RichInputState
  ) => React.ReactNode;
  renderPlaceholder: (
    placeholder: string,
    state: RichInputState
  ) => React.ReactNode;

  // Width measurement support
  measureTokenWidth?: (
    token: RichContentToken,
    context: {
      isEditMode?: boolean;
      containerElement?: HTMLElement;
      measurementContainer?: HTMLElement;
    }
  ) => number;

  // Pre-render token for measurements
  preRenderToken?: (
    token: RichContentToken,
    context: {
      isEditMode?: boolean;
      className?: string;
    }
  ) => HTMLElement;
}

export interface RichInputComponent {
  config: RichInputConfig;
  handlers: RichInputEventHandlers;
  renderer: RichInputRenderer;
  api: RichInputAPI;
}
