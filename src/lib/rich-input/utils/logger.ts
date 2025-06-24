/* eslint-disable no-console */
/**
 * Rich Text Editor Debug Logger
 * Provides structured logging for debugging rich text editor interactions
 */

export interface ClickDebugInfo {
  // Click position info
  clickX: number;
  clickY: number;
  textIndex: number;

  // Word info (if clicked in a word)
  word?: {
    text: string;
    start: number;
    end: number;
    cursorPositionInWord: number;
    isWhitespace: boolean;
  };

  // Line info (for multiline support)
  line?: {
    lineNumber: number;
    lineStart: number;
    lineEnd: number;
    columnIndex: number;
    lineText: string;
  };

  // Pill info (if clicked on a pill)
  pill?: {
    type: 'hashtag' | 'mention' | 'url';
    variant?: string;
    rawText: string;
    displayText: string;
    start: number;
    end: number;
    data: any;
  };

  // Character info
  character?: {
    char: string;
    isWhitespace: boolean;
    isNewline: boolean;
    isPunctuation: boolean;
  };

  // Full text context
  fullText: string;
  textLength: number;
}

export interface CursorDebugInfo {
  position: number;
  coordinates: { x: number; y: number };
  character?: {
    char: string;
    isWhitespace: boolean;
    isNewline: boolean;
  };
  nearbyPills: Array<{
    type: string;
    text: string;
    distance: number;
  }>;
}

export interface SelectionDebugInfo {
  start: number;
  end: number;
  selectedText: string;
  selectedLength: number;
  hasCompletePills: boolean;
  affectedPills: Array<{
    type: string;
    text: string;
    fullySelected: boolean;
  }>;
}

export class RichTextLogger {
  private static instance: RichTextLogger | null = null;
  private isEnabled: boolean = false;
  private contextId: string = '';
  private plaintextMode: boolean = false;

  private constructor() {
    // Check if debug mode is enabled
    this.isEnabled =
      typeof window !== 'undefined' &&
      (window.localStorage?.getItem('richtext-debug') === 'true' ||
        window.location?.search.includes('debug=richtext') ||
        process.env.NODE_ENV === 'development');

    // Check if plaintext mode is enabled
    this.plaintextMode =
      typeof window !== 'undefined' &&
      (window.localStorage?.getItem('richtext-debug-plaintext') === 'true' ||
        window.location?.search.includes('debug=plaintext'));
  }

  static getInstance(): RichTextLogger {
    if (!RichTextLogger.instance) {
      RichTextLogger.instance = new RichTextLogger();
    }
    return RichTextLogger.instance;
  }

  setContext(contextId: string): void {
    this.contextId = contextId;
  }

  enable(): void {
    this.isEnabled = true;
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('richtext-debug', 'true');
    }
  }

  disable(): void {
    this.isEnabled = false;
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('richtext-debug');
    }
  }

  enablePlaintextMode(): void {
    this.plaintextMode = true;
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('richtext-debug-plaintext', 'true');
    }
  }

  disablePlaintextMode(): void {
    this.plaintextMode = false;
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('richtext-debug-plaintext');
    }
  }

  isPlaintextMode(): boolean {
    return this.plaintextMode;
  }

  private getContextPrefix(): string {
    return this.contextId ? `[${this.contextId}] ` : '';
  }

  /**
   * Convert object to plaintext format for easy copy-paste debugging
   */
  private toPlaintext(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return `"${obj}"`;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj
        .map((item) => `${spaces}  ${this.toPlaintext(item, indent + 1)}`)
        .join(',\n');
      return `[\n${items}\n${spaces}]`;
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      const items = keys
        .map((key) => {
          const value = this.toPlaintext(obj[key], indent + 1);
          return `${spaces}  ${key}: ${value}`;
        })
        .join(',\n');
      return `{\n${items}\n${spaces}}`;
    }

    return String(obj);
  }

  /**
   * Log in plaintext format if enabled, otherwise use regular formatting
   */
  private logPlaintext(title: string, data: any): void {
    if (this.plaintextMode) {
      console.log(`\n=== ${this.getContextPrefix()}${title} ===`);
      console.log(this.toPlaintext(data));
      console.log(
        '='.repeat(title.length + this.getContextPrefix().length + 8)
      );
    }
  }

  /**
   * Log detailed click information
   */
  logClick(info: ClickDebugInfo): void {
    if (!this.isEnabled) return;

    // If plaintext mode is enabled, output copy-pasteable format
    if (this.plaintextMode) {
      this.logPlaintext('Rich Text Click Debug', {
        clickPosition: {
          coordinates: `(${info.clickX}, ${info.clickY})`,
          textIndex: info.textIndex,
          textLength: info.textLength
        },
        character: info.character
          ? {
              char:
                info.character.char === ' '
                  ? '·'
                  : info.character.char === '\n'
                    ? '\\n'
                    : info.character.char,
              isWhitespace: info.character.isWhitespace,
              isNewline: info.character.isNewline,
              isPunctuation: info.character.isPunctuation
            }
          : null,
        word: info.word
          ? {
              text: info.word.text,
              bounds: `${info.word.start}-${info.word.end}`,
              cursorPositionInWord: info.word.cursorPositionInWord,
              isWhitespace: info.word.isWhitespace
            }
          : null,
        line: info.line
          ? {
              lineNumber: info.line.lineNumber,
              bounds: `${info.line.lineStart}-${info.line.lineEnd}`,
              columnIndex: info.line.columnIndex,
              lineText: info.line.lineText
            }
          : null,
        pill: info.pill
          ? {
              type: info.pill.type,
              variant: info.pill.variant || 'default',
              rawText: info.pill.rawText,
              displayText: info.pill.displayText,
              bounds: `${info.pill.start}-${info.pill.end}`,
              clickInsidePill:
                info.textIndex >= info.pill.start &&
                info.textIndex < info.pill.end,
              data: info.pill.data
            }
          : null,
        fullText: info.fullText
      });
      return;
    }

    // Original console formatting
    console.groupCollapsed(
      `🖱️ ${this.getContextPrefix()}Rich Text Click Debug`
    );

    // Basic click info
    console.info('📍 Click Position:', {
      coordinates: `(${info.clickX}, ${info.clickY})`,
      textIndex: info.textIndex,
      textLength: info.textLength
    });

    // Character info
    if (info.character) {
      console.info('🔤 Character Info:', {
        character:
          info.character.char === ' '
            ? '·'
            : info.character.char === '\n'
              ? '\\n'
              : info.character.char,
        isWhitespace: info.character.isWhitespace,
        isNewline: info.character.isNewline,
        isPunctuation: info.character.isPunctuation
      });
    }

    // Word info
    if (info.word) {
      console.info('📝 Word Info:', {
        word: `"${info.word.text}"`,
        wordBounds: `${info.word.start}-${info.word.end}`,
        cursorPositionInWord: info.word.cursorPositionInWord,
        isWhitespace: info.word.isWhitespace
      });
    }

    // Line info (for multiline)
    if (info.line) {
      console.info('📏 Line Info:', {
        lineNumber: info.line.lineNumber,
        lineBounds: `${info.line.lineStart}-${info.line.lineEnd}`,
        columnIndex: info.line.columnIndex,
        lineText: `"${info.line.lineText}"`
      });
    }

    // Pill info (most important for debugging)
    if (info.pill) {
      console.warn('💊 Pill Click Detected:', {
        type: info.pill.type,
        variant: info.pill.variant || 'default',
        rawText: `"${info.pill.rawText}"`,
        displayText: `"${info.pill.displayText}"`,
        pillBounds: `${info.pill.start}-${info.pill.end}`,
        pillData: info.pill.data
      });

      // Create a detailed table for pill analysis
      console.table([
        {
          'Pill Type': info.pill.type,
          'Raw Format': info.pill.rawText,
          'Display Format': info.pill.displayText,
          'Start Position': info.pill.start,
          'End Position': info.pill.end,
          'Click Position': info.textIndex,
          'Click Inside Pill':
            info.textIndex >= info.pill.start && info.textIndex < info.pill.end
              ? '✅'
              : '❌'
        }
      ]);
    }

    // Text context (show surrounding characters)
    this.logTextContext(info.fullText, info.textIndex);

    // Always properly close the group
    console.groupEnd();
  }

  /**
   * Log cursor positioning information
   */
  logCursor(info: CursorDebugInfo): void {
    if (!this.isEnabled) return;

    console.groupCollapsed(
      `📍 ${this.getContextPrefix()}Cursor Position Debug`
    );

    console.info('Cursor Details:', {
      position: info.position,
      coordinates: `(${info.coordinates.x}, ${info.coordinates.y})`
    });

    if (info.character) {
      console.info('Character at Cursor:', {
        char:
          info.character.char === ' '
            ? '·'
            : info.character.char === '\n'
              ? '\\n'
              : info.character.char,
        isWhitespace: info.character.isWhitespace,
        isNewline: info.character.isNewline
      });
    }

    if (info.nearbyPills.length > 0) {
      console.info('Nearby Pills:', info.nearbyPills);
    }

    // Always properly close the group
    console.groupEnd();
  }

  /**
   * Log selection information
   */
  logSelection(info: SelectionDebugInfo): void {
    if (!this.isEnabled) return;

    console.groupCollapsed(`🎯 ${this.getContextPrefix()}Selection Debug`);

    console.info('Selection Details:', {
      range: `${info.start}-${info.end}`,
      length: info.selectedLength,
      text: `"${info.selectedText}"`,
      hasCompletePills: info.hasCompletePills
    });

    if (info.affectedPills.length > 0) {
      console.warn('Affected Pills:', info.affectedPills);

      // Create table for pill selection analysis
      console.table(
        info.affectedPills.map((pill) => ({
          'Pill Type': pill.type,
          'Pill Text': pill.text,
          'Fully Selected': pill.fullySelected ? '✅' : '⚠️'
        }))
      );
    }

    // Always properly close the group
    console.groupEnd();
  }

  /**
   * Log parsing results
   */
  logParsing(text: string, segments: any[], tokens: any[]): void {
    if (!this.isEnabled) return;

    // If plaintext mode is enabled, output copy-pasteable format
    if (this.plaintextMode) {
      this.logPlaintext('Content Parsing Debug', {
        textAnalysis: {
          originalText: text,
          textLength: text.length,
          segmentCount: segments.length,
          tokenCount: tokens.length
        },
        parsedSegments: segments.map((segment, index) => ({
          index,
          type: segment.type,
          value: segment.value,
          start: segment.start,
          end: segment.end,
          rawFormat: segment.raw || segment.value
        })),
        generatedTokens: tokens.map((token, index) => ({
          index,
          type: token.type,
          content: token.content,
          rawText: token.rawText,
          start: token.start,
          end: token.end
        }))
      });
      return;
    }

    // Original console formatting
    console.groupCollapsed(
      `🔍 ${this.getContextPrefix()}Content Parsing Debug`
    );

    console.info('Text Analysis:', {
      originalText: text,
      textLength: text.length,
      segmentCount: segments.length,
      tokenCount: tokens.length
    });

    console.info('Parsed Segments:');
    console.table(
      segments.map((segment, index) => ({
        Index: index,
        Type: segment.type,
        Value: segment.value,
        Start: segment.start,
        End: segment.end,
        'Raw Format': segment.raw || segment.value
      }))
    );

    console.info('Generated Tokens:');
    console.table(
      tokens.map((token, index) => ({
        Index: index,
        Type: token.type,
        Content: token.content,
        'Raw Text': token.rawText,
        Start: token.start,
        End: token.end
      }))
    );

    // Always properly close the group
    console.groupEnd();
  }

  /**
   * Log text context around a position
   */
  private logTextContext(
    text: string,
    position: number,
    contextSize: number = 20
  ): void {
    const start = Math.max(0, position - contextSize);
    const end = Math.min(text.length, position + contextSize);
    const before = text.slice(start, position);
    const after = text.slice(position, end);

    console.info('📝 Text Context:', {
      before: `"${before}"`,
      cursor: '|',
      after: `"${after}"`,
      position: position,
      contextRange: `${start}-${end}`
    });
  }

  /**
   * Log errors and warnings
   */
  logError(message: string, error?: any): void {
    if (!this.isEnabled) return;

    if (this.plaintextMode) {
      this.logPlaintext(`ERROR: ${message}`, error || {});
      return;
    }

    console.error(`❌ ${this.getContextPrefix()}${message}`, error);
  }

  logWarning(message: string, data?: any): void {
    if (!this.isEnabled) return;

    if (this.plaintextMode) {
      this.logPlaintext(`WARNING: ${message}`, data || {});
      return;
    }

    console.warn(`⚠️ ${this.getContextPrefix()}${message}`, data);
  }

  /**
   * Log general info
   */
  logInfo(message: string, data?: any): void {
    if (!this.isEnabled) return;

    if (this.plaintextMode) {
      this.logPlaintext(`INFO: ${message}`, data || {});
      return;
    }

    console.info(`ℹ️ ${this.getContextPrefix()}${message}`, data);
  }

  /**
   * Log comprehensive cursor positioning debug information
   */
  logCursorPositioning(data: {
    clickCoordinates?: { x: number; y: number };
    textIndex?: number;
    tokens?: any[];
    rawText?: string;
    foundToken?: any;
    calculatedPosition?: any;
    domElements?: any;
    newlineInfo?: {
      hasNewlines: boolean;
      newlinePositions: number[];
      lineCount: number;
      clickedLine?: number;
    };
    blankLineInfo?: {
      clickedLineIndex: number;
      targetNewlineIndex?: number;
      newlinePosition?: number;
      positionedAtStart?: boolean;
      positionedAfterNewline?: boolean;
    };
  }): void {
    if (!this.isEnabled) return;

    if (this.plaintextMode) {
      this.logPlaintext('Cursor Positioning Debug', {
        clickInfo: data.clickCoordinates
          ? {
              coordinates: `(${data.clickCoordinates.x}, ${data.clickCoordinates.y})`,
              textIndex: data.textIndex
            }
          : null,
        textAnalysis: data.rawText
          ? {
              fullText: data.rawText,
              textLength: data.rawText.length,
              hasNewlines: data.newlineInfo?.hasNewlines || false,
              newlinePositions: data.newlineInfo?.newlinePositions || [],
              lineCount: data.newlineInfo?.lineCount || 1,
              clickedLine: data.newlineInfo?.clickedLine
            }
          : null,
        tokenAnalysis: data.tokens
          ? {
              totalTokens: data.tokens.length,
              tokens: data.tokens.map((token, index) => ({
                index,
                type: token.type,
                content: token.content || token.rawText,
                bounds: `${token.start}-${token.end}`,
                isNewline: token.metadata?.isNewline || false,
                hasNewlines: token.metadata?.hasNewlines || false
              }))
            }
          : null,
        foundToken: data.foundToken
          ? {
              tokenIndex: data.foundToken.tokenIndex,
              tokenType: data.foundToken.type,
              tokenContent: data.foundToken.content || data.foundToken.rawText,
              tokenBounds: `${data.foundToken.start}-${data.foundToken.end}`,
              isNewline: data.foundToken.metadata?.isNewline || false,
              characterOffset: data.calculatedPosition?.charOffsetInToken
            }
          : null,
        calculatedPosition: data.calculatedPosition
          ? {
              textIndex: data.calculatedPosition.index,
              tokenIndex: data.calculatedPosition.tokenIndex,
              charOffsetInToken: data.calculatedPosition.charOffsetInToken,
              line: data.calculatedPosition.line,
              column: data.calculatedPosition.column
            }
          : null,
        domElements: data.domElements
          ? {
              clickedElement: data.domElements.clickedElement?.tagName,
              contentElement: data.domElements.contentElement?.tagName,
              tokenElements: data.domElements.tokenElements?.length || 0
            }
          : null
      });
      return;
    }

    // Original console formatting
    console.groupCollapsed(
      `🎯 ${this.getContextPrefix()}Cursor Positioning Debug`
    );

    if (data.clickCoordinates) {
      console.info('📍 Click Info:', {
        coordinates: `(${data.clickCoordinates.x}, ${data.clickCoordinates.y})`,
        textIndex: data.textIndex
      });
    }

    if (data.rawText && data.newlineInfo) {
      console.info('📝 Text Analysis:', {
        textLength: data.rawText.length,
        hasNewlines: data.newlineInfo.hasNewlines,
        newlineCount: data.newlineInfo.newlinePositions.length,
        lineCount: data.newlineInfo.lineCount,
        clickedLine: data.newlineInfo.clickedLine,
        newlinePositions: data.newlineInfo.newlinePositions
      });
    }

    if (data.tokens) {
      console.info('🔤 Token Analysis:');
      console.table(
        data.tokens.map((token, index) => ({
          Index: index,
          Type: token.type,
          Content: (token.content || token.rawText || '').substring(0, 20),
          Bounds: `${token.start}-${token.end}`,
          IsNewline: token.metadata?.isNewline || false,
          HasNewlines: token.metadata?.hasNewlines || false
        }))
      );
    }

    if (data.foundToken) {
      console.warn('🎯 Found Token:', {
        tokenIndex: data.foundToken.tokenIndex || data.foundToken.index,
        type: data.foundToken.type,
        content: data.foundToken.content || data.foundToken.rawText,
        bounds: `${data.foundToken.start}-${data.foundToken.end}`,
        isNewline: data.foundToken.metadata?.isNewline || false,
        characterOffset: data.calculatedPosition?.charOffsetInToken
      });
    }

    if (data.calculatedPosition) {
      console.info('📐 Calculated Position:', data.calculatedPosition);
    }

    // Always properly close the group
    console.groupEnd();
  }
}

// Export singleton instance
export const richTextLogger = RichTextLogger.getInstance();

// Utility functions for easy logging
export function logClick(info: ClickDebugInfo): void {
  richTextLogger.logClick(info);
}

export function logCursor(info: CursorDebugInfo): void {
  richTextLogger.logCursor(info);
}

export function logSelection(info: SelectionDebugInfo): void {
  richTextLogger.logSelection(info);
}

export function logParsing(text: string, segments: any[], tokens: any[]): void {
  richTextLogger.logParsing(text, segments, tokens);
}

export function logCursorPositioning(data: {
  clickCoordinates?: { x: number; y: number };
  textIndex?: number;
  tokens?: any[];
  rawText?: string;
  foundToken?: any;
  calculatedPosition?: any;
  domElements?: any;
  newlineInfo?: {
    hasNewlines: boolean;
    newlinePositions: number[];
    lineCount: number;
    clickedLine?: number;
  };
  blankLineInfo?: {
    clickedLineIndex: number;
    targetNewlineIndex?: number;
    newlinePosition?: number;
    positionedAtStart?: boolean;
    positionedAfterNewline?: boolean;
  };
}): void {
  richTextLogger.logCursorPositioning(data);
}

// Helper functions for easy console access
export function enablePlaintextLogging(): void {
  richTextLogger.enablePlaintextMode();
  console.log('✅ Rich Text Plaintext Logging Enabled');
  console.log(
    '📋 Objects will now be logged in copy-pasteable plaintext format'
  );
  console.log(
    '🔧 To disable: richTextLogger.disablePlaintextMode() or call disablePlaintextLogging()'
  );
}

export function disablePlaintextLogging(): void {
  richTextLogger.disablePlaintextMode();
  console.log('❌ Rich Text Plaintext Logging Disabled');
  console.log('🎨 Logging will now use formatted console output');
}

export function isPlaintextLogging(): boolean {
  return richTextLogger.isPlaintextMode();
}

// Make helper functions available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).enablePlaintextLogging = enablePlaintextLogging;
  (window as any).disablePlaintextLogging = disablePlaintextLogging;
  (window as any).isPlaintextLogging = isPlaintextLogging;
  (window as any).richTextLogger = richTextLogger;
}
