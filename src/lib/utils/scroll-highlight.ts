/**
 * Scroll restoration highlight utilities
 * Provides functionality to visually highlight elements after scroll restoration
 */

import { createLogger } from '../logging';

// Create logger for scroll highlight utilities
const logger = createLogger({
  context: {
    module: 'scroll-highlight'
  },
  enabled: false
});

export interface ScrollHighlightOptions {
  duration?: number;
  offset?: number;
  className?: string;
  intensity?: 'subtle' | 'normal' | 'intense';
  color?: 'default' | 'success' | 'warning' | 'error';
  speed?: 'instant' | 'fast' | 'normal' | 'slow';
  enablePulse?: boolean;
  enableScale?: boolean;
}

const DEFAULT_OPTIONS: Required<ScrollHighlightOptions> = {
  duration: 3500, // Total animation duration in milliseconds
  offset: 150, // Offset from scroll position to find target element
  className: 'scroll-restore-highlight',
  intensity: 'normal',
  color: 'default',
  speed: 'normal',
  enablePulse: true,
  enableScale: true
};

/**
 * Generate CSS classes based on options
 */
function generateCssClasses(options: ScrollHighlightOptions): string[] {
  const { className, intensity, color, speed, enablePulse, enableScale } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  const classes = [className];

  // Add intensity modifier
  if (intensity !== 'normal') {
    classes.push(`${className}--${intensity}`);
  }

  // Add color modifier
  if (color !== 'default') {
    classes.push(`${className}--${color}`);
  }

  // Add speed modifier
  if (speed !== 'normal') {
    classes.push(`${className}--${speed}`);
  }

  // Add behavior modifiers
  if (!enablePulse) {
    classes.push(`${className}--no-pulse`);
  }

  if (!enableScale) {
    classes.push(`${className}--no-scale`);
  }

  return classes;
}

/**
 * Set custom CSS duration property on element
 */
function setCustomDuration(element: HTMLElement, duration: number): void {
  element.style.setProperty('--scroll-highlight-duration', `${duration}ms`);
}

/**
 * Find the element closest to the scroll position that should be highlighted
 */
export function findElementToHighlight(
  container: HTMLElement,
  scrollPosition: number,
  options: ScrollHighlightOptions = {}
): HTMLElement | null {
  const { offset } = { ...DEFAULT_OPTIONS, ...options };

  // Look for submission items within the container
  const submissionItems = container.querySelectorAll(
    '[data-testid*="submission-item"], .submission__wrapper, .submissions-list__item'
  );

  // Debug logging
  logger.debug('findElementToHighlight debug', {
    scrollPosition,
    offset,
    submissionItemsCount: submissionItems.length,
    containerInfo: {
      tagName: container.tagName,
      className: container.className,
      scrollTop: container.scrollTop,
      clientHeight: container.clientHeight
    }
  });

  if (submissionItems.length === 0) {
    logger.warn('No submission items found in container');
    return null;
  }

  let closestElement: HTMLElement | null = null;
  let closestDistance = Infinity;

  // Find the element closest to the scroll position
  submissionItems.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const elementTop = htmlElement.offsetTop;
    const distance = Math.abs(elementTop - scrollPosition);

    // Consider elements within the offset range
    if (distance < closestDistance && distance <= offset) {
      closestDistance = distance;
      closestElement = htmlElement;
    }
  });

  // If no element found within offset, find the one closest to viewport
  if (!closestElement) {
    const viewportTop = scrollPosition;
    const viewportBottom = scrollPosition + container.clientHeight;

    submissionItems.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const elementTop = htmlElement.offsetTop;
      const elementBottom = elementTop + htmlElement.offsetHeight;

      // Check if element is visible in viewport
      const isVisible =
        elementTop < viewportBottom && elementBottom > viewportTop;

      if (isVisible) {
        const distanceFromTop = Math.abs(elementTop - viewportTop);
        if (distanceFromTop < closestDistance) {
          closestDistance = distanceFromTop;
          closestElement = htmlElement;
        }
      }
    });
  }

  // Debug logging for result
  if (closestElement) {
    const element = closestElement as HTMLElement;
    logger.debug('Found element to highlight', {
      element: element.tagName,
      className: element.className,
      testId: element.getAttribute('data-testid'),
      offsetTop: element.offsetTop,
      scrollPosition,
      distance: closestDistance
    });
  } else {
    logger.warn('No suitable element found for highlighting');
  }

  return closestElement;
}

/**
 * Apply highlight animation to an element
 */
export function highlightElement(
  element: HTMLElement,
  options: ScrollHighlightOptions = {}
): void {
  const { duration } = { ...DEFAULT_OPTIONS, ...options };
  const cssClasses = generateCssClasses(options);

  // Remove any existing highlight classes
  cssClasses.forEach((className) => element.classList.remove(className));

  // Force reflow to ensure class removal takes effect
  element.offsetHeight;

  // Set custom duration if specified
  if (duration !== DEFAULT_OPTIONS.duration) {
    setCustomDuration(element, duration);
  }

  // Add the highlight classes
  cssClasses.forEach((className) => element.classList.add(className));

  // Remove the classes after animation completes
  setTimeout(() => {
    cssClasses.forEach((className) => element.classList.remove(className));
    // Reset custom duration
    element.style.removeProperty('--scroll-highlight-duration');
    logger.debug('Scroll highlight animation completed, classes removed');
  }, duration);

  // Log for debugging
  logger.debug('Scroll highlight applied to element', {
    element: element.tagName,
    className: element.className,
    testId: element.getAttribute('data-testid'),
    duration,
    options,
    appliedClasses: cssClasses,
    customDuration: element.style.getPropertyValue(
      '--scroll-highlight-duration'
    )
  });
}

/**
 * Main function to highlight element after scroll restoration
 */
export function highlightScrollTarget(
  container: HTMLElement,
  scrollPosition: number,
  options: ScrollHighlightOptions = {}
): boolean {
  const targetElement = findElementToHighlight(
    container,
    scrollPosition,
    options
  );

  if (!targetElement) {
    logger.warn('No element found to highlight for scroll position', {
      scrollPosition
    });
    return false;
  }

  // Apply highlight with a small delay to ensure scroll is complete
  setTimeout(() => {
    highlightElement(targetElement, options);
  }, 100);

  return true;
}

/**
 * Remove all highlight classes from elements in container
 */
export function clearScrollHighlights(
  container: HTMLElement,
  className: string = DEFAULT_OPTIONS.className
): void {
  const highlightedElements = container.querySelectorAll(`.${className}`);
  highlightedElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.remove(className);
    // Also remove variant classes
    const classesToRemove = [
      `${className}--subtle`,
      `${className}--intense`,
      `${className}--success`,
      `${className}--warning`,
      `${className}--error`,
      `${className}--instant`,
      `${className}--fast`,
      `${className}--slow`,
      `${className}--no-pulse`,
      `${className}--no-scale`
    ];
    classesToRemove.forEach((cls) => htmlElement.classList.remove(cls));
    // Reset custom duration
    htmlElement.style.removeProperty('--scroll-highlight-duration');
  });
}

/**
 * Utility function to apply highlight to any element with custom options
 */
export function applyScrollHighlight(
  element: HTMLElement,
  options: ScrollHighlightOptions = {}
): void {
  highlightElement(element, options);
}

/**
 * Preset configurations for common use cases
 */
export const HIGHLIGHT_PRESETS = {
  // Quick, subtle highlight for frequent actions
  quick: {
    duration: 1500,
    intensity: 'subtle' as const,
    speed: 'fast' as const,
    enablePulse: false
  },

  // Standard scroll restoration highlight
  standard: {
    duration: 3500,
    intensity: 'normal' as const,
    speed: 'normal' as const
  },

  // Attention-grabbing highlight for important elements
  attention: {
    duration: 5000,
    intensity: 'intense' as const,
    speed: 'slow' as const,
    color: 'warning' as const
  },

  // Success feedback highlight
  success: {
    duration: 2500,
    intensity: 'normal' as const,
    color: 'success' as const,
    speed: 'fast' as const
  },

  // Error indication highlight
  error: {
    duration: 4000,
    intensity: 'intense' as const,
    color: 'error' as const,
    enableScale: false
  }
} as const;
