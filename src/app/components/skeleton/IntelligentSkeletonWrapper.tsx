'use client';

import { createLogger } from '@/lib/logging';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './SkeletonLoader.css';

const logger = createLogger({
  context: { component: 'IntelligentSkeletonWrapper' },
  enabled: false
});

interface CapturedElement {
  tagName: string;
  className: string;
  id: string;
  rect: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  computedStyles: Record<string, string>;
  textContent: string;
  isContentElement: boolean;
  isContainer: boolean;
  children: CapturedElement[];
  attributes: Record<string, string>;
}

interface SkeletonConfig {
  rootElement: CapturedElement | null;
  containerDimensions: {
    width: number;
    height: number;
    totalHeight: number;
  };
  captureTime: number;
  metadata: {
    expectedItemCount?: number;
    itemPattern?: CapturedElement;
    containerPattern?: CapturedElement;
    paginationPattern?: CapturedElement;
    hasInfiniteScroll?: boolean;
    hasPagination?: boolean;
  };
}

interface IntelligentSkeletonWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
  preserveExactHeight?: boolean;
  fallbackMinHeight?: string;
  onStructureCaptured?: (config: SkeletonConfig) => void;
  expectedItemCount?: number;
  expectedTotalRecords?: number;
  hasPagination?: boolean;
  hasInfiniteScroll?: boolean;
  currentPage?: number;
  pageSize?: number;
}

// CSS properties that are important for layout replication
const LAYOUT_PROPERTIES = [
  'display',
  'position',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'border',
  'borderWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'gap',
  'rowGap',
  'columnGap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'overflow',
  'overflowX',
  'overflowY',
  'zIndex',
  'transform',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'boxShadow',
  'opacity',
  'visibility'
];

// Properties that should be inherited for skeleton styling
const SKELETON_PROPERTIES = [
  'borderRadius',
  'margin',
  'padding',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',
  'position'
];

const isContentElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  const textContent = element.textContent?.trim() || '';

  // Text elements with content
  const textTags = [
    'p',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'label',
    'strong',
    'em',
    'small',
    'time',
    'div'
  ];
  if (
    textTags.includes(tagName) &&
    textContent.length > 0 &&
    textContent.length < 200
  ) {
    return true;
  }

  // Interactive elements
  const interactiveTags = ['button', 'input', 'textarea', 'select', 'a'];
  if (interactiveTags.includes(tagName)) {
    return true;
  }

  // Media elements
  const mediaTags = ['img', 'svg', 'video', 'canvas', 'iframe'];
  if (mediaTags.includes(tagName)) {
    return true;
  }

  // Elements with specific roles
  const role = element.getAttribute('role');
  if (role && ['button', 'link', 'textbox', 'image'].includes(role)) {
    return true;
  }

  return false;
};

const isContainerElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  const containerTags = [
    'div',
    'section',
    'article',
    'header',
    'footer',
    'main',
    'aside',
    'nav',
    'ul',
    'ol',
    'li'
  ];

  if (!containerTags.includes(tagName)) {
    return false;
  }

  // Check if it has layout-related styling
  const computedStyle = window.getComputedStyle(element);
  const display = computedStyle.display;

  return (
    ['flex', 'grid', 'block', 'inline-block'].includes(display) &&
    element.children.length > 0
  );
};

const shouldSkipElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();

  // Skip script, style, and other non-visual elements
  const skipTags = [
    'script',
    'style',
    'noscript',
    'meta',
    'link',
    'title',
    'br',
    'hr'
  ];
  if (skipTags.includes(tagName)) return true;

  // Skip elements with no dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return true;

  // Skip hidden elements
  const computedStyle = window.getComputedStyle(element);
  if (
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden'
  ) {
    return true;
  }

  return false;
};

const captureComputedStyles = (element: Element): Record<string, string> => {
  const computedStyle = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  LAYOUT_PROPERTIES.forEach((property) => {
    const value = computedStyle.getPropertyValue(property);
    if (
      value &&
      value !== 'auto' &&
      value !== 'normal' &&
      value !== 'initial'
    ) {
      styles[property] = value;
    }
  });

  return styles;
};

const captureElementStructure = (
  element: Element,
  parentRect?: DOMRect
): CapturedElement => {
  const rect = element.getBoundingClientRect();
  const computedStyles = captureComputedStyles(element);

  // Capture attributes
  const attributes: Record<string, string> = {};
  Array.from(element.attributes).forEach((attr) => {
    if (!['class', 'id', 'style'].includes(attr.name)) {
      attributes[attr.name] = attr.value;
    }
  });

  const captured: CapturedElement = {
    tagName: element.tagName.toLowerCase(),
    className: String(element.className || ''),
    id: String(element.id || ''),
    rect: {
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    },
    computedStyles,
    textContent: element.textContent?.trim() || '',
    isContentElement: isContentElement(element),
    isContainer: isContainerElement(element),
    children: [],
    attributes
  };

  // Recursively capture children
  Array.from(element.children).forEach((child) => {
    if (!shouldSkipElement(child)) {
      captured.children.push(captureElementStructure(child, rect));
    }
  });

  return captured;
};

const generateSkeletonStyles = (
  captured: CapturedElement
): React.CSSProperties => {
  const styles: React.CSSProperties = {};

  // Copy essential layout properties with type safety
  SKELETON_PROPERTIES.forEach((prop) => {
    const value = captured.computedStyles[prop];
    if (
      value &&
      value !== 'auto' &&
      value !== 'initial' &&
      value !== 'inherit'
    ) {
      // Convert kebab-case to camelCase for React styles
      const camelProp = prop.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );

      // Type-safe assignment - only assign valid CSS values
      try {
        (styles as any)[camelProp] = value;
      } catch (e) {
        // Skip invalid CSS values
        logger.debug('Skipped invalid CSS property', { prop, value });
      }
    }
  });

  // Override with skeleton-specific styling
  if (captured.isContentElement) {
    styles.backgroundColor = 'var(--light-background--secondary, #e0e0e0)';
    styles.color = 'transparent';
    styles.borderRadius = styles.borderRadius || '4px';

    // Ensure minimum dimensions for content elements
    if (!styles.width && captured.rect.width > 0) {
      styles.width = `${captured.rect.width}px`;
    }
    if (!styles.height && captured.rect.height > 0) {
      styles.height = `${captured.rect.height}px`;
    }
  }

  // Preserve container layout but remove backgrounds
  if (captured.isContainer) {
    styles.backgroundColor = 'transparent';
  }

  return styles;
};

const findItemPattern = (element: CapturedElement): CapturedElement | null => {
  // Look for repeating item patterns in the captured structure
  const itemSelectors = [
    'submission',
    'submission__wrapper',
    'submission-item',
    'list-item',
    'card',
    'post',
    'item',
    'entry',
    'row'
  ];

  // Safely handle className and id - ensure they're strings
  const className =
    typeof element.className === 'string' ? element.className : '';
  const id = typeof element.id === 'string' ? element.id : '';

  // Check if this element looks like a list item
  const isListItem = itemSelectors.some(
    (selector) =>
      className.toLowerCase().includes(selector) ||
      id.toLowerCase().includes(selector)
  );

  // Also check for common structural patterns
  const hasItemStructure =
    element.children.length > 2 && // Has multiple child elements
    element.rect.height > 50 && // Has reasonable height
    element.rect.width > 100 && // Has reasonable width
    (element.tagName === 'div' ||
      element.tagName === 'article' ||
      element.tagName === 'li');

  logger.debug('Checking element for item pattern', {
    className,
    tagName: element.tagName,
    isListItem,
    hasItemStructure,
    childrenCount: element.children.length,
    height: element.rect.height,
    width: element.rect.width
  });

  if (isListItem || hasItemStructure) {
    logger.debug('Found potential item pattern', {
      className,
      tagName: element.tagName,
      reason: isListItem ? 'matching selector' : 'structural pattern'
    });
    return element;
  }

  // Recursively search children, prioritizing elements that look like items
  const potentialItems: CapturedElement[] = [];

  for (const child of element.children) {
    const pattern = findItemPattern(child);
    if (pattern) {
      potentialItems.push(pattern);
    }
  }

  // If we found multiple similar items, return the first one as the pattern
  if (potentialItems.length > 0) {
    logger.debug('Found item pattern in children', {
      count: potentialItems.length,
      firstItemClass:
        typeof potentialItems[0].className === 'string'
          ? potentialItems[0].className
          : ''
    });
    return potentialItems[0];
  }

  return null;
};

const findPaginationPattern = (
  element: CapturedElement
): CapturedElement | null => {
  // Look for pagination patterns
  const paginationSelectors = ['pagination', 'page', 'nav'];

  // Safely handle className - ensure it's a string
  const className =
    typeof element.className === 'string' ? element.className : '';

  const isPagination = paginationSelectors.some((selector) =>
    className.toLowerCase().includes(selector)
  );

  if (isPagination) {
    return element;
  }

  // Recursively search children
  for (const child of element.children) {
    const pattern = findPaginationPattern(child);
    if (pattern) return pattern;
  }

  return null;
};

const generateIntelligentSkeleton = (
  config: SkeletonConfig
): React.ReactNode => {
  if (!config.rootElement) return null;

  const { metadata, rootElement } = config;
  const expectedCount = metadata.expectedItemCount || 5;

  logger.debug('Generating intelligent skeleton', {
    expectedCount,
    hasRootElement: !!rootElement,
    rootClassName: rootElement.className,
    rootTagName: rootElement.tagName
  });

  // Find the item pattern from captured structure
  const itemPattern = findItemPattern(rootElement);
  const paginationPattern = findPaginationPattern(rootElement);

  logger.debug('Pattern detection results', {
    hasItemPattern: !!itemPattern,
    itemPatternClass: itemPattern?.className,
    hasPaginationPattern: !!paginationPattern,
    paginationPatternClass: paginationPattern?.className
  });

  // Generate multiple items based on expected count
  const skeletonItems: React.ReactNode[] = [];

  if (itemPattern) {
    // Use the detected item pattern
    for (let i = 0; i < expectedCount; i++) {
      skeletonItems.push(
        reconstructSkeleton(itemPattern, `skeleton-item-${i}`)
      );
    }
  } else {
    // No specific pattern found - create generic skeleton items
    // Use the root element as a template but make it more generic
    const genericItemHeight = Math.max(
      rootElement.rect.height / Math.max(rootElement.children.length, 1),
      80
    );

    for (let i = 0; i < expectedCount; i++) {
      skeletonItems.push(
        <div
          key={`skeleton-generic-${i}`}
          className="skeleton skeleton--auto"
          style={{
            width: '100%',
            height: `${genericItemHeight}px`,
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
          }}
          aria-hidden="true"
        />
      );
    }
  }

  logger.debug('Generated skeleton items', {
    itemCount: skeletonItems.length,
    expectedCount
  });

  // If we have an item pattern, try to find its container and replace content
  if (itemPattern) {
    const itemContainer = findItemContainer(rootElement, itemPattern);

    if (itemContainer) {
      // Reconstruct the root structure but replace the item container content
      const reconstructWithItems = (
        element: CapturedElement,
        key: string
      ): React.ReactNode => {
        if (element === itemContainer) {
          // This is the items container - replace with our generated skeleton items
          const styles = generateSkeletonStyles(element);
          return (
            <div
              key={key}
              style={styles}
              className={`skeleton-container ${element.className}`}
              aria-hidden="true"
            >
              {skeletonItems}
            </div>
          );
        }

        // For other elements, reconstruct normally but check children
        const styles = generateSkeletonStyles(element);

        if (element.isContentElement) {
          return (
            <div
              key={key}
              className="skeleton skeleton--auto"
              style={styles}
              aria-hidden="true"
            />
          );
        }

        return (
          <div
            key={key}
            style={styles}
            className={`skeleton-container ${element.className}`}
            aria-hidden="true"
          >
            {element.children.map((child, index) =>
              reconstructWithItems(child, `${key}-${index}`)
            )}
          </div>
        );
      };

      const result = reconstructWithItems(rootElement, 'skeleton-root');

      // Add pagination if expected
      if (metadata.hasPagination && paginationPattern) {
        return (
          <div className="skeleton-wrapper">
            {result}
            {reconstructSkeleton(paginationPattern, 'skeleton-pagination')}
          </div>
        );
      }

      return result;
    }
  }

  // Fallback: create a simple container with multiple skeleton items
  const containerStyles = generateSkeletonStyles(rootElement);

  return (
    <div
      className={`skeleton-container ${rootElement.className}`}
      style={containerStyles}
      aria-hidden="true"
    >
      {skeletonItems}
      {metadata.hasPagination && paginationPattern && (
        <div className="skeleton-pagination">
          {reconstructSkeleton(paginationPattern, 'skeleton-pagination')}
        </div>
      )}
    </div>
  );
};

// Helper function to find the container that holds the item pattern
const findItemContainer = (
  rootElement: CapturedElement,
  itemPattern: CapturedElement
): CapturedElement | null => {
  // Check if this container has the item as a direct child
  const hasItemChild = rootElement.children.some(
    (child) => child === itemPattern || findItemPattern(child) === itemPattern
  );

  if (hasItemChild) {
    return rootElement;
  }

  // Recursively search
  for (const child of rootElement.children) {
    const container = findItemContainer(child, itemPattern);
    if (container) return container;
  }

  return null;
};

const reconstructSkeleton = (
  captured: CapturedElement,
  key: string = ''
): React.ReactNode => {
  const styles = generateSkeletonStyles(captured);

  // For content elements, render as skeleton
  if (captured.isContentElement) {
    return (
      <div
        key={key}
        className="skeleton skeleton--auto"
        style={styles}
        aria-hidden="true"
      />
    );
  }

  // For containers, preserve structure and render children
  if (captured.isContainer || captured.children.length > 0) {
    return (
      <div
        key={key}
        style={styles}
        className={`skeleton-container ${captured.className}`}
        aria-hidden="true"
      >
        {captured.children.map((child, index) =>
          reconstructSkeleton(child, `${key}-${index}`)
        )}
      </div>
    );
  }

  // For other elements, render as simple skeleton
  return (
    <div
      key={key}
      className="skeleton skeleton--auto"
      style={styles}
      aria-hidden="true"
    />
  );
};

export const IntelligentSkeletonWrapper: React.FC<
  IntelligentSkeletonWrapperProps
> = ({
  children,
  isLoading,
  className = '',
  preserveExactHeight = true,
  fallbackMinHeight = '400px',
  onStructureCaptured,
  expectedItemCount,
  expectedTotalRecords,
  hasPagination,
  hasInfiniteScroll,
  currentPage,
  pageSize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [skeletonConfig, setSkeletonConfig] = useState<SkeletonConfig>({
    rootElement: null,
    containerDimensions: { width: 0, height: 0, totalHeight: 0 },
    captureTime: 0,
    metadata: {}
  });
  const [isCapturing, setIsCapturing] = useState(false);

  const captureStructure = useCallback(() => {
    if (!containerRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      logger.debug('Starting automatic DOM structure capture');

      const rootRect = containerRef.current.getBoundingClientRect();
      const rootElement = captureElementStructure(containerRef.current);

      const config: SkeletonConfig = {
        rootElement,
        containerDimensions: {
          width: rootRect.width,
          height: rootRect.height,
          totalHeight: rootRect.height
        },
        captureTime: Date.now(),
        metadata: {
          expectedItemCount,
          itemPattern: rootElement,
          containerPattern: rootElement,
          paginationPattern: rootElement,
          hasInfiniteScroll,
          hasPagination
        }
      };

      setSkeletonConfig(config);
      onStructureCaptured?.(config);

      logger.debug('DOM structure captured successfully', {
        elementCount: countElements(rootElement),
        contentElements: countContentElements(rootElement),
        containerDimensions: config.containerDimensions
      });
    } catch (error) {
      logger.error('Failed to capture DOM structure', error as Error);
    } finally {
      setIsCapturing(false);
    }
  }, [
    isCapturing,
    onStructureCaptured,
    expectedItemCount,
    hasInfiniteScroll,
    hasPagination
  ]);

  const countElements = (element: CapturedElement): number => {
    return (
      1 +
      element.children.reduce((count, child) => count + countElements(child), 0)
    );
  };

  const countContentElements = (element: CapturedElement): number => {
    let count = element.isContentElement ? 1 : 0;
    return (
      count +
      element.children.reduce(
        (total, child) => total + countContentElements(child),
        0
      )
    );
  };

  // Auto-capture when content becomes available
  useEffect(() => {
    if (!isLoading && containerRef.current && !skeletonConfig.rootElement) {
      // Delay to ensure DOM is stable and styled
      const timer = setTimeout(captureStructure, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, captureStructure, skeletonConfig.rootElement]);

  // Re-capture on window resize for responsive layouts
  useEffect(() => {
    const handleResize = () => {
      if (!isLoading && skeletonConfig.rootElement && containerRef.current) {
        const rootRect = containerRef.current.getBoundingClientRect();
        setSkeletonConfig((prev) => ({
          ...prev,
          containerDimensions: {
            width: rootRect.width,
            height: rootRect.height,
            totalHeight: rootRect.height
          }
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading, skeletonConfig.rootElement]);

  if (isLoading) {
    if (skeletonConfig.rootElement) {
      // Render captured structure as skeleton
      const containerStyle: React.CSSProperties = preserveExactHeight
        ? {
            width: `${skeletonConfig.containerDimensions.width}px`,
            height: `${skeletonConfig.containerDimensions.height}px`,
            minHeight: `${skeletonConfig.containerDimensions.height}px`
          }
        : {
            minHeight: fallbackMinHeight
          };

      return (
        <div
          className={`skeleton-container--intelligent ${className}`}
          style={containerStyle}
          aria-label="Loading content..."
          role="status"
        >
          {generateIntelligentSkeleton(skeletonConfig)}
        </div>
      );
    }

    // Fallback skeleton while structure is being captured
    return (
      <div
        className={`skeleton-container--fallback ${className}`}
        style={{ minHeight: fallbackMinHeight }}
        aria-label="Loading content..."
        role="status"
      >
        {/* Generate multiple fallback skeleton items based on expected count */}
        {Array.from({ length: expectedItemCount || 5 }, (_, i) => (
          <div
            key={`fallback-skeleton-${i}`}
            className="skeleton-item-fallback"
          >
            <div
              className="skeleton skeleton--box"
              style={{ width: '100%', height: '100px', marginBottom: '1rem' }}
            />
            <div
              className="skeleton skeleton--text"
              style={{ width: '80%', height: '20px', marginBottom: '0.5rem' }}
            />
            <div
              className="skeleton skeleton--text"
              style={{ width: '60%', height: '16px', marginBottom: '0.5rem' }}
            />
            <div
              className="skeleton skeleton--text"
              style={{ width: '40%', height: '16px', marginBottom: '1rem' }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default IntelligentSkeletonWrapper;
