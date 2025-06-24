/**
 * Type definitions for the consolidated logging system
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'TRACE' | 'PERF';

export type Environment = 'development' | 'production' | 'test';

export type Context = 'client' | 'server' | 'universal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: StructuredData;
  timestamp: string;
  context: LogContext;
  error?: Error | ErrorLike;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogContext {
  environment?: Environment;
  context?: Context;
  component?: string;
  module?: string;
  function?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  category?: string;
}

export interface StructuredData {
  [key: string]: any;
}

export interface ErrorLike {
  name: string;
  message: string;
  stack?: string;
  cause?: any;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  threshold?: number;
  metadata?: StructuredData;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  context: LogContext;
  formatters: LogFormatter[];
  transports: LogTransport[];
  grouping: GroupingConfig;
  performance: PerformanceConfig;
}

export interface GroupingConfig {
  enabled: boolean;
  autoGroup: boolean;
  groupThreshold: number; // Number of logs before auto-grouping
  collapseGroups: boolean;
}

export interface PerformanceConfig {
  enabled: boolean;
  slowThreshold: number; // ms
  trackOperations: boolean;
  trackQueries: boolean;
}

export interface LogFormatter {
  name: string;
  format: (entry: LogEntry) => string | FormattedOutput;
}

export interface LogTransport {
  name: string;
  transport: (entry: LogEntry, formatted: string | FormattedOutput) => void;
}

export interface FormattedOutput {
  message: string;
  data?: any;
  style?: string;
  emoji?: string;
}

export interface LoggerMethods {
  debug: (message: string, data?: StructuredData) => void;
  info: (message: string, data?: StructuredData) => void;
  warn: (message: string, data?: StructuredData) => void;
  error: (
    message: string,
    error?: Error | ErrorLike,
    data?: StructuredData
  ) => void;
  trace: (message: string, data?: StructuredData) => void;
  perf: (operation: string, duration: number, data?: StructuredData) => void;
  group: (title: string) => void;
  groupEnd: () => void;
  table: (data: any[]) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

export interface LoggerInstance extends LoggerMethods {
  setContext: (context: Partial<LogContext>) => void;
  setLevel: (level: LogLevel) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  child: (context: Partial<LogContext>) => LoggerInstance;
}

// Utility types for specific logging patterns
export interface ClickDebugInfo {
  clickX: number;
  clickY: number;
  textIndex: number;
  word?: {
    text: string;
    start: number;
    end: number;
    cursorPositionInWord: number;
    isWhitespace: boolean;
  };
  line?: {
    lineNumber: number;
    lineStart: number;
    lineEnd: number;
    columnIndex: number;
    lineText: string;
  };
  pill?: {
    type: 'hashtag' | 'mention' | 'url';
    variant?: string;
    rawText: string;
    displayText: string;
    start: number;
    end: number;
    data: any;
  };
  character?: {
    char: string;
    isWhitespace: boolean;
    isNewline: boolean;
    isPunctuation: boolean;
  };
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
  nearbyPills: any[];
}

export interface SelectionDebugInfo {
  start: number;
  end: number;
  selectedLength: number;
  selectedText: string;
  hasCompletePills: boolean;
  affectedPills: Array<{
    type: string;
    text: string;
    fullySelected: boolean;
  }>;
}
