'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SkeletonLoader, SkeletonText } from './SkeletonLoader';

// DevSkeletonToggle removed - always return inactive state
const useDevSkeletonState = () => ({
  shouldShowSkeleton: false,
  isDevModeActive: false
});

interface PostsSkeletonConfig {
  submissionCount?: number;
  showPagination?: boolean;
  enableThreadMode?: boolean;
}

// Pre-built skeleton for submission cards
const SubmissionCardSkeleton = ({
  enableThreadMode = false
}: {
  enableThreadMode?: boolean;
}) => (
  <div className="skeleton--submission-card">
    {/* Meta row - author and date - match submission__meta spacing */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem' /* Match submission__meta margin-bottom */
      }}
    >
      <SkeletonText width="120px" height="0.875rem" />
      <SkeletonText width="100px" height="0.875rem" />
    </div>

    {/* Content section - match submission__content */}
    <div style={{ marginBottom: '0.75rem' }}>
      {/* Title - match submission__title */}
      <SkeletonText
        width="85%"
        height="1.125rem"
        style={{ marginBottom: '0.5rem' }}
      />

      {/* Description (sometimes) - match submission__description */}
      {Math.random() > 0.3 && <SkeletonText width="100%" height="0.95rem" />}
    </div>

    {/* Tags - match submission__tags spacing */}
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap'
      }}
    >
      {Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => (
        <SkeletonText
          key={i}
          width={`${Math.random() * 60 + 40}px`}
          height="1.5rem"
          style={{ borderRadius: '0.25rem' }}
        />
      ))}
    </div>

    {/* Actions - match submission__actions spacing */}
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        marginBottom: '0.5rem' /* Match submission__actions margin-bottom */
      }}
    >
      <SkeletonText
        width="60px"
        height="1.75rem"
        style={{ borderRadius: '0.25rem' }}
      />
      {Math.random() > 0.5 && (
        <SkeletonText
          width="80px"
          height="1.75rem"
          style={{ borderRadius: '0.25rem' }}
        />
      )}
    </div>

    {/* Thread replies (if expanded) */}
    {enableThreadMode && Math.random() > 0.7 && (
      <div style={{ marginTop: '1rem', marginLeft: '2rem' }}>
        <div
          className="skeleton--submission-card"
          style={{ marginBottom: '0.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}
          >
            <SkeletonText width="100px" height="0.8rem" />
            <SkeletonText width="80px" height="0.8rem" />
          </div>
          <SkeletonText width="90%" height="1rem" className="mb-2" />
          <SkeletonText width="70%" height="0.875rem" />
        </div>
      </div>
    )}
  </div>
);

// Pagination skeleton - now just the inner content since wrapper is added separately
const PaginationSkeleton = () => (
  <>
    <SkeletonText width="100px" height="1.4rem" />
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <SkeletonText
        width="80px"
        height="2.5rem"
        style={{ borderRadius: '0.5rem' }}
      />
      <SkeletonText
        width="4rem"
        height="2.5rem"
        style={{ borderRadius: '0.5rem' }}
      />
      <SkeletonText
        width="80px"
        height="2.5rem"
        style={{ borderRadius: '0.5rem' }}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <SkeletonText width="50px" height="1.4rem" />
      <SkeletonText
        width="4rem"
        height="2.5rem"
        style={{ borderRadius: '0.5rem' }}
      />
    </div>
  </>
);

export const useSmartPostsSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [capturedLayout, setCapturedLayout] =
    useState<PostsSkeletonConfig | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Get development mode state
  const { shouldShowSkeleton, isDevModeActive } = useDevSkeletonState();

  const captureCurrentLayout = () => {
    if (!containerRef.current) return null;

    setIsCapturing(true);

    try {
      // Analyze the current posts list structure
      const submissionElements = containerRef.current.querySelectorAll(
        '.submission__wrapper, .submission-thread'
      );
      const paginationElement = containerRef.current.querySelector(
        '.submissions-list__pagination'
      );
      const threadElements =
        containerRef.current.querySelectorAll('.submission-thread');

      const config: PostsSkeletonConfig = {
        submissionCount: Math.max(submissionElements.length, 3), // At least 3 for good UX
        showPagination: !!paginationElement,
        enableThreadMode: threadElements.length > 0
      };

      setCapturedLayout(config);

      // eslint-disable-next-line no-console
      console.log('📸 [SKELETON] Captured layout:', config);

      return config;
    } catch (error) {
      console.warn('Failed to capture layout:', error);
      // Default fallback
      const fallback: PostsSkeletonConfig = {
        submissionCount: 5,
        showPagination: true,
        enableThreadMode: false
      };
      setCapturedLayout(fallback);
      return fallback;
    } finally {
      setIsCapturing(false);
    }
  };

  const generatePostsSkeleton = (config?: PostsSkeletonConfig) => {
    const activeConfig = config ||
      capturedLayout || {
        submissionCount: 5,
        showPagination: true,
        enableThreadMode: false
      };

    const elements: React.ReactNode[] = [];

    // Generate submission skeletons
    for (let i = 0; i < (activeConfig.submissionCount || 5); i++) {
      elements.push(
        <SubmissionCardSkeleton
          key={`submission-${i}`}
          enableThreadMode={activeConfig.enableThreadMode}
        />
      );
    }

    // Add pagination if needed - wrap in submissions-list__pagination div to match real structure
    if (activeConfig.showPagination) {
      elements.push(
        <div key="pagination" className="submissions-list__pagination">
          <PaginationSkeleton />
        </div>
      );
    }

    return (
      <div className="skeleton-container skeleton--posts-list">{elements}</div>
    );
  };

  const getSmartSkeletonLoader = (isLoading: boolean = true) => {
    // In dev mode, check if skeleton should be forced
    const shouldShow = (() => {
      if (process.env.NODE_ENV === 'development' && isDevModeActive) {
        return shouldShowSkeleton;
      }
      return isLoading;
    })();

    // Don't render anything if skeleton shouldn't be shown
    if (!shouldShow) {
      return null;
    }

    if (!capturedLayout) {
      // Return a default skeleton configuration
      return (
        <SkeletonLoader
          config={{
            type: 'manual',
            customElements: [generatePostsSkeleton()]
          }}
          isLoading={isLoading}
        />
      );
    }

    return generatePostsSkeleton(capturedLayout);
  };

  const resetCapture = () => {
    setCapturedLayout(null);
    setIsCapturing(false);
  };

  // Auto-capture when component mounts and data changes
  useEffect(() => {
    if (containerRef.current && !capturedLayout && !isCapturing) {
      // Small delay to ensure DOM is stable
      const timer = setTimeout(() => {
        captureCurrentLayout();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [capturedLayout, isCapturing]);

  return {
    containerRef,
    capturedLayout,
    isCapturing,
    captureCurrentLayout,
    generatePostsSkeleton,
    getSmartSkeletonLoader,
    resetCapture
  };
};

// Convenience component for immediate use
export const SmartPostsSkeleton: React.FC<
  PostsSkeletonConfig & { isLoading?: boolean }
> = ({ isLoading = true, ...config }) => {
  const { generatePostsSkeleton } = useSmartPostsSkeleton();

  // Get development mode state
  const { shouldShowSkeleton, isDevModeActive } = useDevSkeletonState();

  // Determine if skeleton should be visible
  const shouldShow = (() => {
    if (process.env.NODE_ENV === 'development' && isDevModeActive) {
      return shouldShowSkeleton;
    }
    return isLoading;
  })();

  // Don't render anything if skeleton shouldn't be shown
  if (!shouldShow) {
    return null;
  }

  return <>{generatePostsSkeleton(config)}</>;
};

export default useSmartPostsSkeleton;
