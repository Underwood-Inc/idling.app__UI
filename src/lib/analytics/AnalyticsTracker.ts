/**
 * Analytics Tracker - Balanced Client-side tracking system
 * Essential debugging features: sessions, page views, clicks, errors, performance, rage clicks
 * No invasive surveillance: no forms, hovers, keystrokes, geolocation, or mouse tracking
 * 
 * @author System Wizard 🧙‍♂️
 * @version 2.0.0 - Balanced & Useful
 */

import { v4 as uuidv4 } from 'uuid';

// ================================
// TYPES & INTERFACES
// ================================

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint: string;
  collectClicks: boolean;
  collectPageViews: boolean;
  collectPerformance: boolean;
  collectErrors: boolean;
  collectRageClicks: boolean;
  batchSize: number;
  flushInterval: number;
  debug: boolean;
  autoInit: boolean;
  excludeSelectors: string[];
}

export interface SessionData {
  sessionToken: string;
  deviceType: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  timezone: string;
  language: string;
  firstPageUrl: string;
  referrerUrl: string;
}

export interface PageViewData {
  sessionId: string;
  pageTitle: string;
  pagePath: string;
  pageQueryParams?: string;
  pageHash?: string;
  referrerUrl?: string;
  referrerDomain?: string;
  pageLoadTime?: number;
  domReadyTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export interface ClickData {
  sessionId: string;
  pageViewId: string;
  clickX: number;
  clickY: number;
  viewportWidth: number;
  viewportHeight: number;
  elementTag?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  elementHref?: string;
  elementSelector?: string;
  clickType: string;
  pageUrl: string;
  pageTitle: string;
  isRageClick?: boolean;
}

export interface ErrorData {
  sessionId: string;
  pageViewId: string;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  errorUrl?: string;
  errorLine?: number;
  errorColumn?: number;
  pageUrl: string;
}

// ================================
// MAIN ANALYTICS TRACKER CLASS
// ================================

export class AnalyticsTracker {
  private config: AnalyticsConfig;
  private sessionId: string;
  private currentPageViewId: string | null = null;
  private eventQueue: any[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;
  private rageClickTracker: Map<string, { count: number; lastClick: number }> = new Map();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      endpoint: '/api/analytics/collect',
      collectClicks: true,
      collectPageViews: true,
      collectPerformance: true,
      collectErrors: true,
      collectRageClicks: true,
      batchSize: 10,
      flushInterval: 5000,
      debug: false,
      autoInit: true,
      excludeSelectors: ['[data-analytics-ignore]', '.analytics-ignore'],
      ...config
    };

    this.sessionId = this.getOrCreateSessionId();
    
    if (this.config.autoInit && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // ================================
  // INITIALIZATION
  // ================================

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.config.enabled) return;

    try {
      // Send session first
      await this.createSession();
      
      // Set up tracking
      this.setupEventListeners();
      this.setupErrorTracking();
      this.startFlushTimer();
      this.isInitialized = true;
      
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log('🧙‍♂️ Analytics Tracker initialized (balanced: errors, performance, rage clicks enabled)');
      }
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }

  // ================================
  // SESSION MANAGEMENT
  // ================================

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return uuidv4();
    
    const existingSession = sessionStorage.getItem('analytics_session_id');
    if (existingSession) {
      return existingSession;
    }
    
    const newSessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', newSessionId);
    return newSessionId;
  }

  private async createSession(): Promise<void> {
    const sessionData: SessionData = {
      sessionToken: this.sessionId,
      deviceType: this.getDeviceType(),
      browserName: this.getBrowserName(),
      browserVersion: this.getBrowserVersion(),
      osName: this.getOSName(),
      osVersion: this.getOSVersion(),
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      firstPageUrl: window.location.href,
      referrerUrl: document.referrer
    };

    await this.sendEvent('session', sessionData);
  }

  // ================================
  // ERROR TRACKING
  // ================================

  private setupErrorTracking(): void {
    if (!this.config.collectErrors) return;

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.sendEvent('error', {
        sessionId: this.sessionId,
        pageViewId: this.currentPageViewId,
        errorType: 'javascript',
        errorMessage: event.message,
        errorStack: event.error?.stack,
        errorUrl: event.filename,
        errorLine: event.lineno,
        errorColumn: event.colno,
        pageUrl: window.location.href
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.sendEvent('error', {
        sessionId: this.sessionId,
        pageViewId: this.currentPageViewId,
        errorType: 'promise_rejection',
        errorMessage: event.reason?.message || String(event.reason),
        errorStack: event.reason?.stack,
        pageUrl: window.location.href
      });
    });
  }

  // ================================
  // PERFORMANCE METRICS
  // ================================

  private getPerformanceMetrics(): Partial<PageViewData> {
    if (!this.config.collectPerformance || typeof window === 'undefined' || !window.performance) {
      return {};
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        pageLoadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : undefined,
        domReadyTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : undefined,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime,
      };
    } catch (error) {
      return {};
    }
  }

  // ================================
  // RAGE CLICK DETECTION
  // ================================

  private detectRageClick(element: HTMLElement): boolean {
    if (!this.config.collectRageClicks) return false;

    const elementKey = this.getElementSelector(element);
    const now = Date.now();
    const tracker = this.rageClickTracker.get(elementKey);

    if (!tracker) {
      this.rageClickTracker.set(elementKey, { count: 1, lastClick: now });
      return false;
    }

    // Reset if more than 2 seconds have passed
    if (now - tracker.lastClick > 2000) {
      this.rageClickTracker.set(elementKey, { count: 1, lastClick: now });
      return false;
    }

    tracker.count++;
    tracker.lastClick = now;

    // Rage click detected: 5+ clicks within 2 seconds
    return tracker.count >= 5;
  }

  // ================================
  // EVENT LISTENERS
  // ================================

  private setupEventListeners(): void {
    // Basic click tracking
    if (this.config.collectClicks) {
      document.addEventListener('click', (event) => {
        this.trackClick(event);
      }, { passive: true });
    }

    // Page view tracking for SPA navigation
    if (this.config.collectPageViews) {
      let lastUrl = window.location.href;
      const checkUrlChange = () => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          this.trackPageView();
        }
      };

      window.addEventListener('popstate', checkUrlChange);
      
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(checkUrlChange, 0);
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(checkUrlChange, 0);
      };

      // Initial page view
      this.trackPageView();
    }
  }

  // ================================
  // TRACKING METHODS
  // ================================

  async trackPageView(): Promise<void> {
    if (!this.config.collectPageViews) return;

    const pageViewData: PageViewData = {
      sessionId: this.sessionId,
      pageTitle: document.title,
      pagePath: window.location.pathname,
      pageQueryParams: window.location.search,
      pageHash: window.location.hash,
      referrerUrl: document.referrer,
      referrerDomain: document.referrer ? new URL(document.referrer).hostname : undefined,
      ...this.getPerformanceMetrics()
    };

    const result = await this.sendEvent('pageview', pageViewData);
    if (result?.pageViewId) {
      this.currentPageViewId = result.pageViewId;
    }
  }

  async trackClick(event: MouseEvent): Promise<void> {
    if (!this.config.collectClicks) return;

    const target = event.target as HTMLElement;
    if (!target || this.shouldIgnoreElement(target)) return;

    const isRageClick = this.detectRageClick(target);

    const clickData: ClickData = {
      sessionId: this.sessionId,
      pageViewId: this.currentPageViewId || '',
      clickX: event.clientX,
      clickY: event.clientY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      elementTag: target.tagName?.toLowerCase(),
      elementId: target.id || undefined,
      elementClass: target.className || undefined,
      elementText: this.getElementText(target),
      elementHref: (target as HTMLAnchorElement).href || undefined,
      elementSelector: this.getElementSelector(target),
      clickType: this.getClickType(event),
      pageUrl: window.location.href,
      pageTitle: document.title,
      isRageClick: isRageClick || undefined
    };

    await this.sendEvent('click', clickData);
  }

  // ================================
  // DEVICE DETECTION
  // ================================

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(firefox|chrome|safari|edge|opera)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('X11')) return 'UNIX';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  private getOSVersion(): string {
    const userAgent = navigator.userAgent;
    
    // Windows
    if (userAgent.includes('Windows NT 10.0')) return '10/11';
    if (userAgent.includes('Windows NT 6.3')) return '8.1';
    if (userAgent.includes('Windows NT 6.2')) return '8';
    if (userAgent.includes('Windows NT 6.1')) return '7';
    
    // macOS
    const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (macMatch) return macMatch[1].replace('_', '.');
    
    // Android
    const androidMatch = userAgent.match(/Android (\d+[._]\d+)/);
    if (androidMatch) return androidMatch[1].replace('_', '.');
    
    // iOS
    const iOSMatch = userAgent.match(/OS (\d+[._]\d+)/);
    if (iOSMatch) return iOSMatch[1].replace('_', '.');
    
    return 'Unknown';
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private shouldIgnoreElement(element: HTMLElement): boolean {
    return this.config.excludeSelectors.some(selector => {
      try {
        return element.matches?.(selector) || element.closest?.(selector);
      } catch {
        return false;
      }
    });
  }

  private getElementText(element: HTMLElement): string {
    return element.textContent?.trim().substring(0, 100) || '';
  }

  private getElementSelector(element: HTMLElement): string {
    const parts: string[] = [];
    
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        parts.push(`.${classes[0]}`);
      }
    }
    
    parts.unshift(element.tagName.toLowerCase());
    return parts.join('');
  }

  private getClickType(event: MouseEvent): string {
    if (event.detail === 2) return 'double_click';
    if (event.button === 2) return 'right_click';
    return 'click';
  }

  // ================================
  // EVENT QUEUE AND SENDING
  // ================================

  private async sendEvent(type: string, data: any): Promise<any> {
    this.eventQueue.push({
      type,
      data,
      timestamp: Date.now()
    });

    if (this.eventQueue.length >= this.config.batchSize) {
      return await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: events.map(event => ({
            type: event.type,
            data: event.data,
            timestamp: event.timestamp
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log(`🧙‍♂️ Flushed ${events.length} analytics events`);
      }
    } catch (error) {
      console.error('Analytics flush failed:', error);
      
      // Re-queue events on failure (max 3 retries)
      events.forEach(event => {
        if (!event.retryCount || event.retryCount < 3) {
          event.retryCount = (event.retryCount || 0) + 1;
          this.eventQueue.push(event);
        }
      });
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // ================================
  // PUBLIC API
  // ================================

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Clear rage click tracker
    this.rageClickTracker.clear();
    
    // Flush remaining events
    this.flush();
    
    this.isInitialized = false;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCurrentPageViewId(): string | null {
    return this.currentPageViewId;
  }

  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (!newConfig.enabled) {
      this.destroy();
    }
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
}

// ================================
// GLOBAL INSTANCE MANAGEMENT
// ================================

let globalAnalytics: AnalyticsTracker | null = null;

export function initializeAnalytics(config: Partial<AnalyticsConfig> = {}): AnalyticsTracker {
  if (globalAnalytics) {
    globalAnalytics.destroy();
  }
  
  globalAnalytics = new AnalyticsTracker(config);
  
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('🧙‍♂️ Balanced Analytics Tracker initialized');
  }
  
  return globalAnalytics;
}

export function getAnalyticsTracker(): AnalyticsTracker | null {
  return globalAnalytics;
}

export function destroyAnalytics(): void {
  if (globalAnalytics) {
    globalAnalytics.destroy();
    globalAnalytics = null;
  }
} 