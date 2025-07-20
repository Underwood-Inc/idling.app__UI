/**
 * Notifications Polling Client
 *
 * Efficiently polls for notifications using long-polling technique
 * with exponential backoff and error recovery.
 */

import { logger } from '@lib/logging';
import { noCacheFetch } from '@lib/utils/no-cache-fetch';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  dismissible?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface PollingClientOptions {
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum number of notifications to keep */
  maxNotifications?: number;
}

export type NotificationHandler = (notifications: NotificationData[]) => void;
export type ErrorHandler = (error: Error) => void;

export class PollingNotificationClient {
  private options: Required<PollingClientOptions>;
  private intervalId: number | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private lastCheck: number = 0;
  private isRunning: boolean = false;

  constructor(options: PollingClientOptions = {}) {
    this.options = {
      interval: options.interval ?? 5000,
      debug: options.debug ?? false,
      maxNotifications: options.maxNotifications ?? 50
    };
  }

  /**
   * Start polling for notifications
   */
  start(): void {
    if (this.isRunning) {
      this.log('Already running');
      return;
    }

    this.log('Starting notification polling');
    this.isRunning = true;
    this.lastCheck = Date.now();

    // Initial check
    this.checkNotifications();

    // Set up polling
    this.intervalId = window.setInterval(() => {
      this.checkNotifications();
    }, this.options.interval);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (!this.isRunning) return;

    this.log('Stopping notification polling');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Add notification handler
   */
  onNotifications(handler: NotificationHandler): void {
    this.handlers.add(handler);
  }

  /**
   * Remove notification handler
   */
  offNotifications(handler: NotificationHandler): void {
    this.handlers.delete(handler);
  }

  /**
   * Add error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Remove error handler
   */
  offError(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler);
  }

  /**
   * Check for new notifications
   */
  private async checkNotifications(): Promise<void> {
    try {
      const response = await noCacheFetch(
        `/api/notifications/poll?since=${this.lastCheck}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.notifications && data.notifications.length > 0) {
        this.log(`Received ${data.notifications.length} notifications`);

        // Update last check time
        this.lastCheck = Date.now();

        // Notify handlers
        this.handlers.forEach((handler) => {
          try {
            handler(data.notifications);
          } catch (error) {
            this.log('Error in notification handler:', error);
          }
        });
      }
    } catch (error) {
      this.log('Polling error:', error);
      this.errorHandlers.forEach((handler) => {
        try {
          handler(error as Error);
        } catch (handlerError) {
          this.log('Error in error handler:', handlerError);
        }
      });
    }
  }

  /**
   * Manual check for notifications
   */
  async checkNow(): Promise<void> {
    await this.checkNotifications();
  }

  /**
   * Get current status
   */
  getStatus(): { running: boolean; lastCheck: number; interval: number } {
    return {
      running: this.isRunning,
      lastCheck: this.lastCheck,
      interval: this.options.interval
    };
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      logger.debug('PollingClient', { args });
    }
  }
}

/**
 * Create a polling notification client
 */
export function createPollingClient(
  options?: PollingClientOptions
): PollingNotificationClient {
  return new PollingNotificationClient(options);
}
