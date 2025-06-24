/**
 * Debug Logger Adapter
 * Specialized logger for debug operations, particularly rich text editing
 * and development-specific logging with enhanced formatting
 */

import { Logger } from '../core/Logger';
import type {
  ClickDebugInfo,
  CursorDebugInfo,
  LoggerConfig,
  SelectionDebugInfo
} from '../types';

export class DebugLogger extends Logger {
  private plaintextMode: boolean = false;

  constructor(config?: Partial<LoggerConfig>) {
    super({
      ...config,
      context: {
        context: 'universal',
        environment: 'development',
        category: 'debug',
        ...config?.context
      },
      level: 'DEBUG',
      grouping: {
        enabled: true,
        autoGroup: false,
        groupThreshold: 1,
        collapseGroups: false
      }
    });

    // Check if plaintext mode is enabled
    this.plaintextMode = this.isPlaintextModeEnabled();
  }

  private isPlaintextModeEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    return (
      window.localStorage?.getItem('debug-plaintext') === 'true' ||
      window.location?.search.includes('debug=plaintext')
    );
  }

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

  private logPlaintext(title: string, data: any): void {
    if (this.plaintextMode) {
      // eslint-disable-next-line no-console
      console.info(`\n=== ${title} ===`);
      // eslint-disable-next-line no-console
      console.info(this.toPlaintext(data));
      // eslint-disable-next-line no-console
      console.info('='.repeat(title.length + 8));
    }
  }

  /**
   * Enable plaintext logging mode
   */
  enablePlaintextMode(): void {
    this.plaintextMode = true;
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('debug-plaintext', 'true');
    }
  }

  /**
   * Disable plaintext logging mode
   */
  disablePlaintextMode(): void {
    this.plaintextMode = false;
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('debug-plaintext');
    }
  }

  /**
   * Log rich text click events with detailed analysis
   */
  logClick(info: ClickDebugInfo): void {
    if (!this.isEnabled()) return;

    if (this.plaintextMode) {
      this.logPlaintext('Rich Text Click Debug', info);
      return;
    }

    this.group('🖱️ Rich Text Click Debug');

    // Basic click info
    this.info('📍 Click Position', {
      coordinates: `(${info.clickX}, ${info.clickY})`,
      textIndex: info.textIndex,
      textLength: info.textLength
    });

    // Character info
    if (info.character) {
      this.info('🔤 Character Info', {
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
      this.info('📝 Word Info', {
        word: `"${info.word.text}"`,
        wordBounds: `${info.word.start}-${info.word.end}`,
        cursorPositionInWord: info.word.cursorPositionInWord,
        isWhitespace: info.word.isWhitespace
      });
    }

    // Line info
    if (info.line) {
      this.info('📏 Line Info', {
        lineNumber: info.line.lineNumber,
        lineBounds: `${info.line.lineStart}-${info.line.lineEnd}`,
        columnIndex: info.line.columnIndex,
        lineText: `"${info.line.lineText}"`
      });
    }

    // Pill info (most important)
    if (info.pill) {
      this.warn('💊 Pill Click Detected', {
        type: info.pill.type,
        variant: info.pill.variant || 'default',
        rawText: `"${info.pill.rawText}"`,
        displayText: `"${info.pill.displayText}"`,
        pillBounds: `${info.pill.start}-${info.pill.end}`,
        pillData: info.pill.data
      });

      // Create detailed table for pill analysis
      this.table([
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

    this.groupEnd();
  }

  /**
   * Log cursor positioning information
   */
  logCursor(info: CursorDebugInfo): void {
    if (!this.isEnabled()) return;

    if (this.plaintextMode) {
      this.logPlaintext('Cursor Position Debug', info);
      return;
    }

    this.group('📍 Cursor Position Debug');

    this.info('Cursor Details', {
      position: info.position,
      coordinates: `(${info.coordinates.x}, ${info.coordinates.y})`
    });

    if (info.character) {
      this.info('Character at Cursor', {
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
      this.info('Nearby Pills', info.nearbyPills);
    }

    this.groupEnd();
  }

  /**
   * Log selection information
   */
  logSelection(info: SelectionDebugInfo): void {
    if (!this.isEnabled()) return;

    if (this.plaintextMode) {
      this.logPlaintext('Selection Debug', info);
      return;
    }

    this.group('🎯 Selection Debug');

    this.info('Selection Details', {
      range: `${info.start}-${info.end}`,
      length: info.selectedLength,
      text: `"${info.selectedText}"`,
      hasCompletePills: info.hasCompletePills
    });

    if (info.affectedPills.length > 0) {
      this.warn('Affected Pills', info.affectedPills);

      this.table(
        info.affectedPills.map((pill) => ({
          'Pill Type': pill.type,
          'Pill Text': pill.text,
          'Fully Selected': pill.fullySelected ? '✅' : '⚠️'
        }))
      );
    }

    this.groupEnd();
  }

  /**
   * Log parsing results with detailed analysis
   */
  logParsing(text: string, segments: any[], tokens: any[]): void {
    if (!this.isEnabled()) return;

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

    this.group('🔍 Content Parsing Debug');

    this.info('Text Analysis', {
      originalText: text,
      textLength: text.length,
      segmentCount: segments.length,
      tokenCount: tokens.length
    });

    if (segments.length > 0) {
      this.info('Parsed Segments:');
      this.table(
        segments.map((segment, index) => ({
          Index: index,
          Type: segment.type,
          Value: segment.value,
          Start: segment.start,
          End: segment.end,
          'Raw Format': segment.raw || segment.value
        }))
      );
    }

    if (tokens.length > 0) {
      this.info('Generated Tokens:');
      this.table(
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

    this.groupEnd();
  }

  /**
   * Log cursor positioning calculations
   */
  logCursorPositioning(data: any): void {
    if (!this.isEnabled()) return;

    if (this.plaintextMode) {
      this.logPlaintext('Cursor Positioning Debug', data);
      return;
    }

    this.group('🎯 Cursor Positioning Debug');

    if (data.clickCoordinates) {
      this.info('📍 Click Info', {
        coordinates: `(${data.clickCoordinates.x}, ${data.clickCoordinates.y})`,
        textIndex: data.textIndex
      });
    }

    if (data.foundToken) {
      this.warn('🎯 Found Token', {
        tokenIndex: data.foundToken.tokenIndex,
        tokenType: data.foundToken.type,
        tokenContent: data.foundToken.content || data.foundToken.rawText,
        tokenBounds: `${data.foundToken.start}-${data.foundToken.end}`,
        isNewline: data.foundToken.metadata?.isNewline || false
      });
    }

    if (data.calculatedPosition) {
      this.info('📐 Calculated Position', data.calculatedPosition);
    }

    this.groupEnd();
  }
}
