/**
 * Client Logger Adapter
 * Specialized logger for client-side operations with browser-specific features
 * and user interaction tracking
 */

import { Logger } from '../core/Logger';
import type { ErrorLike, LoggerConfig, StructuredData } from '../types';

export class ClientLogger extends Logger {
  private userAgent: string;
  private sessionId: string;

  constructor(config?: Partial<LoggerConfig>) {
    super({
      ...config,
      context: {
        context: 'client',
        environment: (process.env.NODE_ENV as any) || 'development',
        ...config?.context
      }
    });

    this.userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowserInfo(): any {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: this.userAgent,
      sessionId: this.sessionId,
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Enhanced error logging with client context
   */
  error(
    message: string,
    error?: Error | ErrorLike,
    data?: StructuredData
  ): void {
    const enhancedData = {
      ...data,
      clientContext: this.getBrowserInfo(),
      ...(error instanceof Error
        ? {
            errorInfo: {
              name: error.name,
              message: error.message,
              stack: error.stack,
              filename: (error as any).filename,
              lineno: (error as any).lineno,
              colno: (error as any).colno
            }
          }
        : {})
    };

    super.error(message, error, enhancedData);
  }

  /**
   * Log user interactions
   */
  interaction(event: string, element?: string, data?: StructuredData): void {
    const interactionData = {
      ...data,
      event,
      element,
      ...this.getBrowserInfo()
    };

    this.debug(`User interaction: ${event}`, interactionData);
  }

  /**
   * Log navigation events
   */
  navigation(from: string, to: string, data?: StructuredData): void {
    const navigationData = {
      ...data,
      from,
      to,
      ...this.getBrowserInfo()
    };

    this.info(`Navigation: ${from} → ${to}`, navigationData);
  }

  /**
   * Log API calls from client
   */
  api(
    method: string,
    url: string,
    status: number,
    duration?: number,
    data?: StructuredData
  ): void {
    const apiData = {
      ...data,
      method,
      url,
      status,
      ...(duration ? { duration: `${duration.toFixed(2)}ms` } : {}),
      ...this.getBrowserInfo()
    };

    if (status >= 400) {
      this.error(`API ${method} ${url} - ${status}`, undefined, apiData);
    } else if (status >= 300) {
      this.warn(`API ${method} ${url} - ${status}`, apiData);
    } else {
      this.debug(`API ${method} ${url} - ${status}`, apiData);
    }
  }

  /**
   * Log performance metrics for client operations
   */
  performance(metric: string, value: number, data?: StructuredData): void {
    const perfData = {
      ...data,
      metric,
      value,
      unit: 'ms',
      ...this.getBrowserInfo()
    };

    this.info(`Performance: ${metric} = ${value}ms`, perfData);
  }

  /**
   * Log component lifecycle events
   */
  component(
    name: string,
    event: 'mount' | 'unmount' | 'render' | 'error',
    data?: StructuredData
  ): void {
    const componentData = {
      ...data,
      component: name,
      event,
      ...this.getBrowserInfo()
    };

    switch (event) {
      case 'error':
        this.error(`Component error: ${name}`, undefined, componentData);
        break;
      case 'mount':
      case 'unmount':
        this.debug(`Component ${event}: ${name}`, componentData);
        break;
      case 'render':
        this.trace(`Component render: ${name}`, componentData);
        break;
    }
  }

  /**
   * Log cache operations
   */
  cache(
    operation: 'hit' | 'miss' | 'set' | 'clear',
    key: string,
    data?: StructuredData
  ): void {
    const cacheData = {
      ...data,
      operation,
      key,
      ...this.getBrowserInfo()
    };

    this.debug(`Cache ${operation}: ${key}`, cacheData);
  }

  /**
   * Log form interactions
   */
  form(
    action: 'submit' | 'validate' | 'error',
    formName: string,
    data?: StructuredData
  ): void {
    const formData = {
      ...data,
      action,
      formName,
      ...this.getBrowserInfo()
    };

    switch (action) {
      case 'error':
        this.warn(`Form error: ${formName}`, formData);
        break;
      case 'submit':
        this.info(`Form submit: ${formName}`, formData);
        break;
      case 'validate':
        this.debug(`Form validate: ${formName}`, formData);
        break;
    }
  }

  /**
   * Log authentication events on client
   */
  auth(event: string, data?: StructuredData): void {
    const authData = {
      ...data,
      event,
      ...this.getBrowserInfo()
    };

    this.info(`Auth: ${event}`, authData);
  }
}
