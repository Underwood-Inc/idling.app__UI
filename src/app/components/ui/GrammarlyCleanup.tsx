'use client';

import { useEffect } from 'react';

/**
 * Client-side component to clean up Grammarly extension attributes
 * that cause hydration mismatches
 */
export const GrammarlyCleanup = () => {
  useEffect(() => {
    // Clean up Grammarly extension attributes that cause hydration warnings
    const cleanupGrammarlyAttributes = () => {
      const body = document.body;
      if (body) {
        // Remove Grammarly-specific attributes that cause hydration mismatches
        body.removeAttribute('data-new-gr-c-s-check-loaded');
        body.removeAttribute('data-gr-ext-installed');
      }
    };

    // Clean up immediately
    cleanupGrammarlyAttributes();

    // Set up a mutation observer to continuously clean up these attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.target === document.body
        ) {
          const target = mutation.target as HTMLElement;
          if (
            target.hasAttribute('data-new-gr-c-s-check-loaded') ||
            target.hasAttribute('data-gr-ext-installed')
          ) {
            cleanupGrammarlyAttributes();
          }
        }
      });
    });

    // Start observing body attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed']
    });

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};
