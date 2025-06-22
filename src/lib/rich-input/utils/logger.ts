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

  private constructor() {
    // Check if debug mode is enabled
    this.isEnabled =
      typeof window !== 'undefined' &&
      (window.localStorage?.getItem('richtext-debug') === 'true' ||
        window.location?.search.includes('debug=richtext') ||
        process.env.NODE_ENV === 'development');
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

  private getContextPrefix(): string {
    return this.contextId ? `[${this.contextId}] ` : '';
  }

  /**
   * Log detailed click information
   */
  logClick(info: ClickDebugInfo): void {
    if (!this.isEnabled) return;

    console.group(`🖱️ ${this.getContextPrefix()}Rich Text Click Debug`);

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

    // Context visualization
    this.logTextContext(info.fullText, info.textIndex);

    console.groupEnd();
  }

  /**
   * Log cursor positioning information
   */
  logCursor(info: CursorDebugInfo): void {
    if (!this.isEnabled) return;

    console.group(`📍 ${this.getContextPrefix()}Cursor Position Debug`);

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

    console.groupEnd();
  }

  /**
   * Log selection information
   */
  logSelection(info: SelectionDebugInfo): void {
    if (!this.isEnabled) return;

    console.group(`🎯 ${this.getContextPrefix()}Selection Debug`);

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

    console.groupEnd();
  }

  /**
   * Log parsing results
   */
  logParsing(text: string, segments: any[], tokens: any[]): void {
    if (!this.isEnabled) return;

    console.group(`🔍 ${this.getContextPrefix()}Content Parsing Debug`);

    console.info('Text Analysis:', {
      originalText: `"${text}"`,
      textLength: text.length,
      segmentCount: segments.length,
      tokenCount: tokens.length
    });

    if (segments.length > 0) {
      console.info('Parsed Segments:');
      console.table(
        segments.map((segment, index) => ({
          Index: index,
          Type: segment.type,
          Value: segment.value,
          Start: segment.start,
          End: segment.end,
          'Raw Format': segment.rawFormat || segment.value
        }))
      );
    }

    if (tokens.length > 0) {
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
    }

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
    const char = text[position] || '';

    console.info('📋 Text Context:', {
      before: `"${before}"`,
      atCursor: char === ' ' ? '·' : char === '\n' ? '\\n' : `"${char}"`,
      after: `"${after}"`,
      position: `${position}/${text.length}`
    });
  }

  /**
   * Log errors and warnings
   */
  logError(message: string, error?: any): void {
    if (!this.isEnabled) return;
    console.error(
      `❌ ${this.getContextPrefix()}Rich Text Error: ${message}`,
      error
    );
  }

  logWarning(message: string, data?: any): void {
    if (!this.isEnabled) return;
    console.warn(
      `⚠️ ${this.getContextPrefix()}Rich Text Warning: ${message}`,
      data
    );
  }

  /**
   * Log general info
   */
  logInfo(message: string, data?: any): void {
    if (!this.isEnabled) return;
    console.info(`ℹ️ ${this.getContextPrefix()}${message}`, data);
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

// Global window access for debugging
if (typeof window !== 'undefined') {
  (window as any).richTextLogger = richTextLogger;
}
