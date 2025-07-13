/**
 * Auto-initialization script for Analytics Tracker
 * Balanced tracking: essential debugging features without invasive surveillance
 * 
 * @author System Wizard 🧙‍♂️
 * @version 2.0.0 - Balanced & Useful
 */

import { initializeAnalytics } from './AnalyticsTracker';

// Balanced configuration for useful but privacy-respecting tracking
const defaultConfig = {
  enabled: true,
  debug: false,
  autoInit: true,
  
  // Essential tracking for debugging and UX
  collectClicks: true,
  collectPageViews: true,
  collectPerformance: true,
  collectErrors: true,
  collectRageClicks: true,
  
  // Performance settings
  batchSize: 10,
  flushInterval: 5000,
  
  // Exclude analytics elements to prevent tracking loops
  excludeSelectors: [
    '[data-analytics-ignore]',
    '.analytics-ignore',
    '[data-no-track]',
    '.no-track'
  ]
};

// Initialize analytics if we're in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const initialize = () => {
    try {
      const analytics = initializeAnalytics(defaultConfig);
      
      if (defaultConfig.debug) {
        // eslint-disable-next-line no-console
        console.log('🧙‍♂️ Balanced Analytics Tracking initialized!');
        (window as any).analytics = analytics;
      }
      
      return analytics;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}

export { defaultConfig };
