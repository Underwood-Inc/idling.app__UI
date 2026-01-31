'use client';

import { useEffect, useRef } from 'react';
import './AdUnit.css';

/**
 * Props for the AdUnit component
 */
export interface AdUnitProps {
  /**
   * The ad slot ID from Google AdSense
   * @default "3334459243" - The default ad slot (001-2026)
   */
  slot?: string;
  /**
   * Ad format - controls how the ad is displayed
   * @default "auto"
   */
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  /**
   * Whether to enable full-width responsive behavior
   * @default true
   */
  fullWidthResponsive?: boolean;
  /**
   * Optional CSS class name for styling
   */
  className?: string;
  /**
   * Optional test ID for testing
   */
  testId?: string;
  /**
   * Layout style for in-article or in-feed ads
   */
  layout?: 'in-article' | 'in-feed-horizontal' | 'in-feed-vertical';
}

/**
 * Google AdSense publisher ID
 */
const AD_CLIENT = 'ca-pub-1546133996920392';

/**
 * Default ad slot ID (001-2026)
 */
const DEFAULT_AD_SLOT = '3334459243';

/**
 * AdUnit - A reusable Google AdSense ad component
 *
 * This component renders a Google AdSense ad unit with configurable options.
 * The AdSense script is already loaded in the root layout, so this component
 * only needs to render the ad container and push to adsbygoogle.
 *
 * @example
 * // Basic usage with defaults
 * <AdUnit />
 *
 * @example
 * // Custom slot with horizontal format
 * <AdUnit slot="1234567890" format="horizontal" />
 *
 * @example
 * // In-feed ad between posts
 * <AdUnit layout="in-feed-horizontal" className="feed-ad" />
 */
export function AdUnit({
  slot = DEFAULT_AD_SLOT,
  format = 'auto',
  fullWidthResponsive = true,
  className = '',
  testId = 'ad-unit',
  layout
}: AdUnitProps): React.JSX.Element {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once and only in browser
    if (typeof window === 'undefined' || isInitialized.current) {
      return;
    }

    // Check if adsbygoogle is available
    if (adRef.current && !adRef.current.dataset.adStatus) {
      try {
        // Push ad to render
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
        isInitialized.current = true;
      } catch (error) {
        // Ad blocked or failed - silently handle
        console.debug('AdUnit: Failed to push ad', error);
      }
    }
  }, []);

  // Build the data attributes based on layout
  const dataAttributes: Record<string, string> = {
    'data-ad-client': AD_CLIENT,
    'data-ad-slot': slot,
    'data-ad-format': format,
    'data-full-width-responsive': fullWidthResponsive.toString()
  };

  // Add layout-specific attributes
  if (layout === 'in-article') {
    dataAttributes['data-ad-layout'] = 'in-article';
    dataAttributes['data-ad-format'] = 'fluid';
  } else if (layout === 'in-feed-horizontal') {
    dataAttributes['data-ad-layout-key'] = '-fb+5w+4e-db+86';
    dataAttributes['data-ad-format'] = 'fluid';
  } else if (layout === 'in-feed-vertical') {
    dataAttributes['data-ad-layout-key'] = '-6t+ed+2i-1n-4w';
    dataAttributes['data-ad-format'] = 'fluid';
  }

  return (
    <div
      className={`ad-unit ${className}`.trim()}
      data-testid={testId}
      aria-label="Advertisement"
      role="complementary"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        {...dataAttributes}
      />
    </div>
  );
}

export default AdUnit;
