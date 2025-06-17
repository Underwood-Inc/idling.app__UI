'use client';

import React, { useEffect, useState } from 'react';
import './SkeletonLoader.css';

// Development-only import that gets tree-shaken in production
let useDevSkeletonState: () => {
  shouldShowSkeleton: boolean;
  isDevModeActive: boolean;
};

// Always define the hook, but conditionally import the real implementation
if (process.env.NODE_ENV === 'development') {
  try {
    const devModule = require('../dev-tools/DevSkeletonToggle');
    useDevSkeletonState = devModule.useDevSkeletonState;
  } catch {
    // Fallback if dev module not available
    useDevSkeletonState = () => ({
      shouldShowSkeleton: false,
      isDevModeActive: false
    });
  }
} else {
  // Production fallback - returns inactive state
  useDevSkeletonState = () => ({
    shouldShowSkeleton: false,
    isDevModeActive: false
  });
}

// Base skeleton components
export const SkeletonText: React.FC<{
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '1rem', className = '', style = {} }) => (
  <div
    className={`skeleton skeleton--text ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style
    }}
  />
);

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '100px', className = '', style = {} }) => (
  <div
    className={`skeleton skeleton--box ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style
    }}
  />
);

export const SkeletonCircle: React.FC<{
  size?: string | number;
  className?: string;
}> = ({ size = '40px', className = '' }) => (
  <div
    className={`skeleton skeleton--circle ${className}`}
    style={{
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size
    }}
  />
);

// Enhanced element analysis
interface ElementInfo {
  type: 'text' | 'box' | 'circle' | 'button' | 'input' | 'image' | 'icon';
  width: number;
  height: number;
  x: number;
  y: number;
  borderRadius: string;
  margin: string;
  padding: string;
  backgroundColor: string;
  display: string;
  flexDirection?: string;
  gap?: string;
  justifyContent?: string;
  alignItems?: string;
  className?: string;
  tagName: string;
  textContent?: string;
  isContainer: boolean;
  children: ElementInfo[];
}

const shouldSkipElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  const skipTags = ['script', 'style', 'noscript', 'meta', 'link', 'title'];

  if (skipTags.includes(tagName)) return true;

  // Skip elements with no content and no visual impact
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return true;

  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden')
    return true;

  // Skip SVG internals but keep the SVG container
  if (
    element.parentElement?.tagName.toLowerCase() === 'svg' &&
    tagName !== 'svg'
  )
    return true;

  return false;
};

const analyzeElement = (
  element: Element,
  parentRect?: DOMRect
): ElementInfo => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const tagName = element.tagName.toLowerCase();

  // Calculate relative position if we have a parent
  const x = parentRect ? rect.left - parentRect.left : rect.left;
  const y = parentRect ? rect.top - parentRect.top : rect.top;

  // Determine element type based on various factors
  let type: ElementInfo['type'] = 'box';

  if (
    tagName === 'img' ||
    element.classList.contains('avatar') ||
    element.classList.contains('profile-image')
  ) {
    type = 'circle';
  } else if (tagName === 'svg' || element.classList.contains('icon')) {
    type = 'icon';
  } else if (
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    element.classList.contains('button')
  ) {
    type = 'button';
  } else if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  ) {
    type = 'input';
  } else if (
    tagName === 'p' ||
    tagName === 'span' ||
    tagName === 'a' ||
    tagName === 'h1' ||
    tagName === 'h2' ||
    tagName === 'h3' ||
    tagName === 'h4' ||
    tagName === 'h5' ||
    tagName === 'h6' ||
    tagName === 'label' ||
    element.classList.contains('text') ||
    (rect.height < 40 && element.textContent?.trim()) // Likely text if small and has text content
  ) {
    type = 'text';
  }

  // Check if this is a container element
  const isContainer =
    computedStyle.display === 'flex' ||
    computedStyle.display === 'grid' ||
    (computedStyle.display === 'block' && element.children.length > 0);

  // Analyze children recursively
  const children: ElementInfo[] = [];
  if (isContainer) {
    for (const child of Array.from(element.children)) {
      if (!shouldSkipElement(child)) {
        children.push(analyzeElement(child, rect));
      }
    }
  }

  return {
    type,
    width: rect.width,
    height: rect.height,
    x,
    y,
    borderRadius: computedStyle.borderRadius || '0',
    margin: computedStyle.margin || '0',
    padding: computedStyle.padding || '0',
    backgroundColor: computedStyle.backgroundColor || 'transparent',
    display: computedStyle.display || 'block',
    flexDirection: computedStyle.flexDirection || undefined,
    gap: computedStyle.gap || undefined,
    justifyContent: computedStyle.justifyContent || undefined,
    alignItems: computedStyle.alignItems || undefined,
    className: element.className || '',
    tagName,
    textContent: element.textContent?.trim(),
    isContainer,
    children
  };
};

const generateSkeletonFromElement = (
  elementInfo: ElementInfo,
  key: string = ''
): React.ReactNode => {
  const {
    type,
    width,
    height,
    borderRadius,
    margin,
    padding,
    display,
    children,
    isContainer
  } = elementInfo;

  // Style object for the skeleton element
  const style: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: borderRadius !== '0' ? borderRadius : undefined,
    margin: margin !== '0' ? margin : undefined,
    padding: padding !== '0' ? padding : undefined,
    display: display
  };

  // Handle flex properties
  if (display === 'flex') {
    style.flexDirection = elementInfo.flexDirection as any;
    style.gap = elementInfo.gap;
    style.justifyContent = elementInfo.justifyContent as any;
    style.alignItems = elementInfo.alignItems as any;
  }

  // If this is a container with children, render the container structure
  if (isContainer && children.length > 0) {
    return (
      <div key={key} className="skeleton-container--auto" style={style}>
        {children.map((child, index) =>
          generateSkeletonFromElement(child, `${key}-${index}`)
        )}
      </div>
    );
  }

  // Render appropriate skeleton component based on type
  switch (type) {
    case 'circle':
    case 'icon':
      return (
        <SkeletonCircle
          key={key}
          size={Math.min(width, height)}
          className="skeleton--auto"
        />
      );
    case 'text':
      return (
        <SkeletonText
          key={key}
          width={width}
          height={height}
          className="skeleton--auto"
          style={{ borderRadius }}
        />
      );
    case 'button':
      return (
        <SkeletonBox
          key={key}
          width={width}
          height={height}
          className="skeleton--auto skeleton--button-auto"
          style={{ borderRadius }}
        />
      );
    case 'input':
      return (
        <SkeletonBox
          key={key}
          width={width}
          height={height}
          className="skeleton--auto skeleton--input-auto"
          style={{ borderRadius }}
        />
      );
    default:
      return (
        <SkeletonBox
          key={key}
          width={width}
          height={height}
          className="skeleton--auto"
          style={{ borderRadius }}
        />
      );
  }
};

// Smart Skeleton Hook
export const useSmartSkeleton = (targetRef: React.RefObject<HTMLElement>) => {
  const [skeletonContent, setSkeletonContent] = useState<React.ReactNode>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedLayout, setCapturedLayout] = useState<ElementInfo | null>(
    null
  );

  const captureLayout = () => {
    setIsAnalyzing(true);

    try {
      // Small delay to ensure DOM is stable
      setTimeout(() => {
        if (targetRef.current) {
          const elementInfo = analyzeElement(targetRef.current);
          setCapturedLayout(elementInfo);

          const skeleton = generateSkeletonFromElement(elementInfo, 'root');
          setSkeletonContent(skeleton);
        }
        setIsAnalyzing(false);
      }, 100);
    } catch (error) {
      setIsAnalyzing(false);
    }
  };

  const clearCapture = () => {
    setCapturedLayout(null);
    setSkeletonContent(null);
    setIsAnalyzing(false);
  };

  return {
    skeletonContent,
    isAnalyzing,
    capturedLayout,
    captureLayout,
    clearCapture
  };
};

// Main Smart Skeleton Loader Component
interface SmartSkeletonLoaderProps {
  targetRef: React.RefObject<HTMLElement>;
  isLoading?: boolean;
  forceShow?: boolean;
  fallback?: React.ReactNode;
  onAnalysisComplete?: (elementInfo: ElementInfo) => void;
  className?: string;
}

export const SmartSkeletonLoader: React.FC<SmartSkeletonLoaderProps> = ({
  targetRef,
  isLoading = true,
  forceShow = false,
  fallback = null,
  onAnalysisComplete,
  className = ''
}) => {
  const { skeletonContent, isAnalyzing, capturedLayout, captureLayout } =
    useSmartSkeleton(targetRef);
  const [shouldAutoCapture, setShouldAutoCapture] = useState(true);

  // Get development mode state
  const { shouldShowSkeleton, isDevModeActive } = useDevSkeletonState();

  // Determine if skeleton should be visible
  const shouldShow = (() => {
    if (process.env.NODE_ENV === 'development' && isDevModeActive) {
      return shouldShowSkeleton;
    }
    return forceShow || isLoading;
  })();

  // Auto-capture when target becomes available and we need to show skeleton
  useEffect(() => {
    if (
      shouldShow &&
      !capturedLayout &&
      !isAnalyzing &&
      shouldAutoCapture &&
      targetRef.current
    ) {
      captureLayout();
      setShouldAutoCapture(false); // Prevent repeated captures
    }
  }, [
    shouldShow,
    capturedLayout,
    isAnalyzing,
    shouldAutoCapture,
    targetRef,
    captureLayout
  ]);

  // Call callback when analysis completes
  useEffect(() => {
    if (capturedLayout && onAnalysisComplete) {
      onAnalysisComplete(capturedLayout);
    }
  }, [capturedLayout, onAnalysisComplete]);

  // Reset auto-capture when loading state changes
  useEffect(() => {
    if (!isLoading) {
      setShouldAutoCapture(true);
    }
  }, [isLoading]);

  if (!shouldShow) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <div className={`skeleton-container skeleton--analyzing ${className}`}>
        <SkeletonBox width="100%" height="50px" />
        <SkeletonText width="80%" height="1rem" />
        <SkeletonText width="60%" height="1rem" />
      </div>
    );
  }

  if (skeletonContent) {
    return (
      <div
        className={`skeleton-container--smart ${className}`}
        role="status"
        aria-label="Loading content"
      >
        {skeletonContent}
      </div>
    );
  }

  // Fallback skeleton
  return (
    <div
      className={`skeleton-container ${className}`}
      role="status"
      aria-label="Loading content"
    >
      {fallback || (
        <>
          <SkeletonBox width="100%" height="50px" />
          <SkeletonText width="80%" height="1rem" />
          <SkeletonText width="60%" height="1rem" />
        </>
      )}
    </div>
  );
};

// Legacy SkeletonLoader for backwards compatibility
interface SkeletonLoaderProps {
  config:
    | {
        type: 'smart';
        targetRef: React.RefObject<HTMLElement>;
        fallback?: React.ReactNode;
      }
    | {
        type: 'manual';
        customElements: React.ReactNode[];
      };
  className?: string;
  forceShow?: boolean;
  isLoading?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  config,
  className = '',
  forceShow = false,
  isLoading = true
}) => {
  // Always call hooks at the top level
  const { shouldShowSkeleton, isDevModeActive } = useDevSkeletonState();

  if (config.type === 'smart') {
    return (
      <SmartSkeletonLoader
        targetRef={config.targetRef}
        isLoading={isLoading}
        forceShow={forceShow}
        fallback={config.fallback}
        className={className}
      />
    );
  }

  // Manual mode - just render the custom elements
  const shouldShow = (() => {
    if (process.env.NODE_ENV === 'development' && isDevModeActive) {
      return shouldShowSkeleton;
    }
    return forceShow || isLoading;
  })();

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={`skeleton-container ${className}`}
      role="status"
      aria-label="Loading content"
    >
      {config.customElements}
    </div>
  );
};

export default SmartSkeletonLoader;
