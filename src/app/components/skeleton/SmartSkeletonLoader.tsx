'use client';

import React, { useEffect, useState } from 'react';
import './SkeletonLoader.css';

// Development-only import that gets tree-shaken in production
let useDevSkeletonState: () => {
  shouldShowSkeleton: boolean;
  isDevModeActive: boolean;
};

if (process.env.NODE_ENV === 'development') {
  const devModule = require('../dev-tools/DevSkeletonToggle');
  useDevSkeletonState = devModule.useDevSkeletonState;
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

// Enhanced element analysis that preserves exact DOM structure
interface SkeletonElementInfo {
  tagName: string;
  type: 'element' | 'text';
  skeletonType:
    | 'text'
    | 'box'
    | 'circle'
    | 'button'
    | 'input'
    | 'image'
    | 'container';
  rect: {
    width: number;
    height: number;
  };
  styles: {
    [key: string]: string | number;
  };
  className: string;
  children: SkeletonElementInfo[];
  textContent?: string;
  hasSignificantContent: boolean;
}

const getAllLayoutStyles = (
  element: Element
): Record<string, string | number> => {
  const computedStyle = window.getComputedStyle(element);

  // Capture all layout-affecting properties
  return {
    display: computedStyle.display,
    position: computedStyle.position,
    flexDirection: computedStyle.flexDirection,
    flexWrap: computedStyle.flexWrap,
    justifyContent: computedStyle.justifyContent,
    alignItems: computedStyle.alignItems,
    alignContent: computedStyle.alignContent,
    gap: computedStyle.gap,
    gridTemplateColumns: computedStyle.gridTemplateColumns,
    gridTemplateRows: computedStyle.gridTemplateRows,
    gridGap: computedStyle.gridGap,
    padding: computedStyle.padding,
    paddingTop: computedStyle.paddingTop,
    paddingRight: computedStyle.paddingRight,
    paddingBottom: computedStyle.paddingBottom,
    paddingLeft: computedStyle.paddingLeft,
    margin: computedStyle.margin,
    marginTop: computedStyle.marginTop,
    marginRight: computedStyle.marginRight,
    marginBottom: computedStyle.marginBottom,
    marginLeft: computedStyle.marginLeft,
    borderRadius: computedStyle.borderRadius,
    border: computedStyle.border,
    borderTop: computedStyle.borderTop,
    borderRight: computedStyle.borderRight,
    borderBottom: computedStyle.borderBottom,
    borderLeft: computedStyle.borderLeft,
    width: computedStyle.width,
    height: computedStyle.height,
    minWidth: computedStyle.minWidth,
    minHeight: computedStyle.minHeight,
    maxWidth: computedStyle.maxWidth,
    maxHeight: computedStyle.maxHeight,
    boxSizing: computedStyle.boxSizing,
    overflow: computedStyle.overflow,
    overflowX: computedStyle.overflowX,
    overflowY: computedStyle.overflowY,
    fontSize: computedStyle.fontSize,
    lineHeight: computedStyle.lineHeight,
    fontWeight: computedStyle.fontWeight,
    textAlign: computedStyle.textAlign,
    verticalAlign: computedStyle.verticalAlign,
    float: computedStyle.float,
    clear: computedStyle.clear,
    zIndex: computedStyle.zIndex,
    background: computedStyle.background,
    backgroundColor: computedStyle.backgroundColor,
    opacity: computedStyle.opacity,
    transform: computedStyle.transform,
    transition: computedStyle.transition
  };
};

const getElementSkeletonType = (
  element: Element
): SkeletonElementInfo['skeletonType'] => {
  const tagName = element.tagName.toLowerCase();
  const rect = element.getBoundingClientRect();

  // Images and avatars should be circles
  if (
    tagName === 'img' ||
    element.classList.contains('avatar') ||
    element.classList.contains('profile-image') ||
    element.classList.contains('profile-pic')
  ) {
    return 'circle';
  }

  // SVG icons should be circles
  if (tagName === 'svg' || element.classList.contains('icon')) {
    return 'circle';
  }

  // Form elements
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return 'input';
  }

  // Buttons
  if (
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    element.classList.contains('button') ||
    element.classList.contains('btn')
  ) {
    return 'button';
  }

  // Text elements - check if it has text content and is not too tall
  if (
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
    tagName === 'li' ||
    tagName === 'td' ||
    tagName === 'th' ||
    element.classList.contains('text')
  ) {
    return 'text';
  }

  // If it's small and has text content, treat as text
  if (
    rect.height <= 60 &&
    element.textContent?.trim() &&
    element.children.length === 0
  ) {
    return 'text';
  }

  // Check if it's a pure container (has children but no direct text content)
  const hasChildren = element.children.length > 0;
  const hasDirectText =
    element.childNodes.length > 0 &&
    Array.from(element.childNodes).some(
      (node) =>
        node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
    );

  // More intelligent container detection
  if (hasChildren) {
    // If it's very tall, it's likely a layout container that should be analyzed
    if (rect.height > 200) {
      return 'container';
    }

    // If it has no direct text and is a structural element, it's a container
    if (
      !hasDirectText &&
      (tagName === 'div' ||
        tagName === 'section' ||
        tagName === 'article' ||
        tagName === 'main' ||
        tagName === 'aside' ||
        tagName === 'header' ||
        tagName === 'footer' ||
        tagName === 'nav' ||
        tagName === 'ul' ||
        tagName === 'ol' ||
        element.classList.contains('container') ||
        element.classList.contains('wrapper') ||
        element.classList.contains('list'))
    ) {
      return 'container';
    }

    // If it has flex or grid display, it's likely a container
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'flex' || computedStyle.display === 'grid') {
      return 'container';
    }

    // If it has both children and direct text, treat as mixed content (not pure container)
    if (hasDirectText) {
      return 'box'; // Will be handled in mixed content logic
    }
  }

  // Default to box for everything else
  return 'box';
};

const shouldSkipElement = (element: Element | Node): boolean => {
  // Skip text nodes that are only whitespace
  if (element.nodeType === Node.TEXT_NODE) {
    return !element.textContent?.trim();
  }

  if (element.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }

  const el = element as Element;
  const tagName = el.tagName.toLowerCase();

  // Skip these tags entirely
  const skipTags = [
    'script',
    'style',
    'noscript',
    'meta',
    'link',
    'title',
    'head'
  ];
  if (skipTags.includes(tagName)) return true;

  // Skip elements with no visual impact
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return true;

  const computedStyle = window.getComputedStyle(el);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden')
    return true;

  // Skip very large page-level containers that are just wrappers
  if (
    rect.height > window.innerHeight * 0.8 &&
    (tagName === 'main' ||
      tagName === 'body' ||
      el.classList.contains('page') ||
      el.classList.contains('app') ||
      el.classList.contains('layout'))
  ) {
    return true;
  }

  return false;
};

const analyzeElementStructure = (element: Element): SkeletonElementInfo => {
  const rect = element.getBoundingClientRect();
  const tagName = element.tagName.toLowerCase();
  const styles = getAllLayoutStyles(element);
  const skeletonType = getElementSkeletonType(element);

  // Check if element has significant content
  const hasSignificantContent =
    rect.width > 0 &&
    rect.height > 0 &&
    (Boolean(element.textContent?.trim()) ||
      element.children.length > 0 ||
      ['img', 'input', 'button', 'svg'].includes(tagName));

  // Analyze all child nodes (including text nodes)
  const children: SkeletonElementInfo[] = [];

  for (const child of Array.from(element.childNodes)) {
    if (shouldSkipElement(child)) continue;

    if (child.nodeType === Node.TEXT_NODE) {
      const textContent = child.textContent?.trim();
      if (textContent) {
        // Create a virtual text element
        children.push({
          tagName: '#text',
          type: 'text',
          skeletonType: 'text',
          rect: { width: 0, height: 0 }, // Will be estimated
          styles: {},
          className: '',
          children: [],
          textContent,
          hasSignificantContent: true
        });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childInfo = analyzeElementStructure(child as Element);
      if (childInfo.hasSignificantContent) {
        children.push(childInfo);
      }
    }
  }

  return {
    tagName,
    type: 'element',
    skeletonType,
    rect: {
      width: rect.width,
      height: rect.height
    },
    styles,
    className: element.className || '',
    children,
    textContent: element.textContent?.trim(),
    hasSignificantContent
  };
};

const generateRealisticSkeleton = (
  elementInfo: SkeletonElementInfo,
  key: string = ''
): React.ReactNode => {
  const {
    tagName,
    skeletonType,
    rect,
    styles,
    className,
    children,
    textContent
  } = elementInfo;

  // Create base style object preserving layout
  const skeletonStyle: React.CSSProperties = {
    ...styles,
    // Override size properties to use measured values for leaf elements
    ...(children.length === 0 && {
      width: rect.width > 0 ? `${rect.width}px` : styles.width,
      height: rect.height > 0 ? `${rect.height}px` : styles.height
    })
  };

  // For containers, preserve all layout properties
  if (skeletonType === 'container' && children.length > 0) {
    return (
      <div
        key={key}
        className={`skeleton-replica skeleton-replica--container ${className}`}
        style={skeletonStyle}
      >
        {children.map((child, index) =>
          generateRealisticSkeleton(child, `${key}-${index}`)
        )}
      </div>
    );
  }

  // For text nodes, create appropriately sized text skeletons
  if (tagName === '#text' && textContent) {
    // Estimate text dimensions based on content length and typical character width
    const charWidth = 8; // Average character width in pixels
    const lineHeight = 20; // Average line height
    const words = textContent.split(/\s+/);
    const estimatedWidth = Math.min(words.join('').length * charWidth, 300);

    return (
      <SkeletonText
        key={key}
        width={estimatedWidth}
        height={lineHeight}
        className="skeleton--auto skeleton--text-node"
      />
    );
  }

  // For other elements, create appropriate skeleton based on type
  const baseClassName = `skeleton--auto skeleton--${skeletonType}`;

  switch (skeletonType) {
    case 'circle':
      return (
        <div
          key={key}
          style={skeletonStyle}
          className={`skeleton-replica ${className}`}
        >
          <SkeletonCircle
            size={Math.min(rect.width, rect.height)}
            className={baseClassName}
          />
        </div>
      );

    case 'text':
      return (
        <div
          key={key}
          style={skeletonStyle}
          className={`skeleton-replica ${className}`}
        >
          <SkeletonText width="100%" height="1em" className={baseClassName} />
        </div>
      );

    case 'button':
      return (
        <div
          key={key}
          style={skeletonStyle}
          className={`skeleton-replica ${className}`}
        >
          <SkeletonBox
            width="100%"
            height="100%"
            className={`${baseClassName} skeleton--button-auto`}
          />
        </div>
      );

    case 'input':
      return (
        <div
          key={key}
          style={skeletonStyle}
          className={`skeleton-replica ${className}`}
        >
          <SkeletonBox
            width="100%"
            height="100%"
            className={`${baseClassName} skeleton--input-auto`}
          />
        </div>
      );

    default:
      // For 'box' type elements, be smarter about whether to render structure or solid box
      if (children.length > 0) {
        // If it's a large element with children, analyze the structure
        if (rect.height > 100 || rect.width > 300) {
          return (
            <div
              key={key}
              className={`skeleton-replica skeleton-replica--mixed ${className}`}
              style={skeletonStyle}
            >
              {children.map((child, index) =>
                generateRealisticSkeleton(child, `${key}-${index}`)
              )}
            </div>
          );
        }
        // For smaller elements with children, render as a structured box but still show children
        else {
          return (
            <div
              key={key}
              className={`skeleton-replica skeleton-replica--mixed ${className}`}
              style={skeletonStyle}
            >
              {children.map((child, index) =>
                generateRealisticSkeleton(child, `${key}-${index}`)
              )}
            </div>
          );
        }
      } else {
        // Only render as solid box if it's small and has no children
        if (rect.height <= 100 && rect.width <= 300) {
          return (
            <div
              key={key}
              style={skeletonStyle}
              className={`skeleton-replica ${className}`}
            >
              <SkeletonBox
                width="100%"
                height="100%"
                className={baseClassName}
              />
            </div>
          );
        } else {
          // For large elements with no children, create a more reasonable skeleton
          return (
            <div
              key={key}
              style={skeletonStyle}
              className={`skeleton-replica ${className}`}
            >
              <SkeletonBox
                width="100%"
                height="60px"
                className={baseClassName}
              />
            </div>
          );
        }
      }
  }
};

// Smart Skeleton Hook
export const useSmartSkeleton = (targetRef: React.RefObject<HTMLElement>) => {
  const [skeletonContent, setSkeletonContent] = useState<React.ReactNode>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedLayout, setCapturedLayout] =
    useState<SkeletonElementInfo | null>(null);

  const captureLayout = () => {
    if (!targetRef.current) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Small delay to ensure DOM is stable
      setTimeout(() => {
        if (targetRef.current) {
          // Analysis starting
          const elementInfo = analyzeElementStructure(targetRef.current);
          setCapturedLayout(elementInfo);

          const skeleton = generateRealisticSkeleton(elementInfo, 'root');
          setSkeletonContent(skeleton);

          // Analysis completed
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
  onAnalysisComplete?: (elementInfo: SkeletonElementInfo) => void;
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

export default SmartSkeletonLoader;
