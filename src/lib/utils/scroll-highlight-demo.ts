/**
 * Demo utility for scroll restoration highlight animation
 *
 * This file demonstrates how to use the reusable scroll highlight animation system
 * anywhere in the application. The animation can be applied to any element with
 * configurable duration, intensity, colors, and behaviors.
 */

import { createLogger } from '@lib/logging';
import {
  applyScrollHighlight,
  HIGHLIGHT_PRESETS,
  type ScrollHighlightOptions
} from './scroll-highlight';

// Create logger for scroll highlight demo
const logger = createLogger({
  context: {
    component: 'ScrollHighlightDemo',
    module: 'utils'
  },
  enabled: false
});

/**
 * Example usage functions that can be called from anywhere in the app
 */

// Example 1: Basic highlight with default settings
export function highlightElementBasic(element: HTMLElement): void {
  applyScrollHighlight(element);
}

// Example 2: Quick feedback highlight (1.5 seconds, subtle)
export function highlightElementQuick(element: HTMLElement): void {
  applyScrollHighlight(element, HIGHLIGHT_PRESETS.quick);
}

// Example 3: Success feedback (green, 2.5 seconds)
export function highlightElementSuccess(element: HTMLElement): void {
  applyScrollHighlight(element, HIGHLIGHT_PRESETS.success);
}

// Example 4: Error indication (red, 4 seconds, no scaling)
export function highlightElementError(element: HTMLElement): void {
  applyScrollHighlight(element, HIGHLIGHT_PRESETS.error);
}

// Example 5: Attention-grabbing highlight (5 seconds, intense, warning color)
export function highlightElementAttention(element: HTMLElement): void {
  applyScrollHighlight(element, HIGHLIGHT_PRESETS.attention);
}

// Example 6: Custom configuration
export function highlightElementCustom(
  element: HTMLElement,
  durationMs: number = 3000,
  color: 'default' | 'success' | 'warning' | 'error' = 'default'
): void {
  const options: ScrollHighlightOptions = {
    duration: durationMs,
    intensity: 'normal',
    color: color,
    enablePulse: true,
    enableScale: true
  };

  applyScrollHighlight(element, options);
}

// Example 7: Highlight by selector
export function highlightElementBySelector(
  selector: string,
  options: ScrollHighlightOptions = {}
): boolean {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    logger.warn('Element not found for selector', { selector });
    return false;
  }

  applyScrollHighlight(element, options);
  return true;
}

// Example 8: Highlight multiple elements
export function highlightMultipleElements(
  elements: HTMLElement[],
  options: ScrollHighlightOptions = {},
  delay: number = 0
): void {
  elements.forEach((element, index) => {
    setTimeout(() => {
      applyScrollHighlight(element, options);
    }, delay * index);
  });
}

// Example 9: Conditional highlighting based on element type
export function highlightElementSmart(element: HTMLElement): void {
  const tagName = element.tagName.toLowerCase();
  const hasErrorClass =
    element.classList.contains('error') ||
    element.classList.contains('invalid');
  const hasSuccessClass =
    element.classList.contains('success') ||
    element.classList.contains('valid');

  let preset: ScrollHighlightOptions;

  if (hasErrorClass) {
    preset = HIGHLIGHT_PRESETS.error;
  } else if (hasSuccessClass) {
    preset = HIGHLIGHT_PRESETS.success;
  } else if (['button', 'a'].includes(tagName)) {
    preset = HIGHLIGHT_PRESETS.quick;
  } else {
    preset = HIGHLIGHT_PRESETS.standard;
  }

  applyScrollHighlight(element, preset);
}

/**
 * Test function to manually apply scroll highlight to the first submission item on the page
 * This can be called from the browser console for debugging
 */
export function testScrollHighlight(): void {
  const container = document.querySelector(
    '.submissions-list--virtual'
  ) as HTMLElement;
  if (!container) {
    logger.warn('Test: No submissions container found');
    return;
  }

  const submissionItems = container.querySelectorAll(
    '[data-testid*="submission-item"], .submission__wrapper, .submissions-list__item'
  );

  if (submissionItems.length === 0) {
    logger.warn('Test: No submission items found');
    return;
  }

  const firstItem = submissionItems[0] as HTMLElement;
  logger.debug('Test: Applying highlight to first submission item', {
    element: firstItem.tagName,
    className: firstItem.className,
    testId: firstItem.getAttribute('data-testid')
  });

  // Apply the highlight directly
  applyScrollHighlight(firstItem, {
    duration: 3500,
    intensity: 'normal',
    enablePulse: true,
    enableScale: true
  });
}

/**
 * Simple test to apply the CSS animation class directly to any element
 * This bypasses the JavaScript and tests the CSS animation directly
 */
export function testCSSAnimation(): void {
  // Find any element on the page to test with
  const testElement = document.querySelector(
    '.submission__wrapper, .submissions-list__item, body > div'
  ) as HTMLElement;

  if (!testElement) {
    logger.warn('CSS Test: No suitable element found for testing');
    return;
  }

  logger.info('CSS Test: Applying scroll-restore-highlight class to:', {
    element: testElement.tagName,
    id: testElement.id,
    className: testElement.className,
    text: testElement.textContent?.substring(0, 50)
  });

  // Add the CSS class directly
  testElement.classList.add('scroll-restore-highlight');

  // Remove it after the animation duration
  setTimeout(() => {
    testElement.classList.remove('scroll-restore-highlight');
    logger.info('CSS Test: Animation completed, class removed');
  }, 2000);
}

/**
 * Diagnostic test with enhanced visibility to ensure the animation is working
 */
export function testHighVisibilityAnimation(): void {
  // Find any element on the page to test with
  const testElement = document.querySelector(
    '.submission__wrapper, .submissions-list__item, body > div'
  ) as HTMLElement;

  if (!testElement) {
    logger.warn('Visibility Test: No suitable element found for testing');
    return;
  }

  logger.info('Visibility Test: Applying enhanced animation to:', {
    element: testElement.tagName,
    id: testElement.id,
    className: testElement.className,
    text: testElement.textContent?.substring(0, 50)
  });

  // Apply inline styles for maximum visibility
  const originalStyles = {
    position: testElement.style.position,
    zIndex: testElement.style.zIndex,
    boxShadow: testElement.style.boxShadow,
    animation: testElement.style.animation
  };

  // Force styles to ensure visibility
  testElement.style.position = 'relative';
  testElement.style.zIndex = '9999';
  testElement.style.setProperty('--scroll-highlight-duration', '5000ms');
  testElement.style.setProperty('--scroll-highlight-primary-color', '#ff0000'); // Red for visibility
  testElement.style.setProperty('--scroll-highlight-primary-rgb', '255, 0, 0');

  // Add the CSS class
  testElement.classList.add('scroll-restore-highlight');

  logger.info('Visibility Test: Starting animation with enhanced styles');

  // eslint-disable-next-line no-console
  console.log(
    '🎯 Visibility Test: Applied styles and class. Element should now have red expanding border.'
  );

  // Remove it after the animation duration
  setTimeout(() => {
    testElement.classList.remove('scroll-restore-highlight');
    // Restore original styles
    testElement.style.position = originalStyles.position;
    testElement.style.zIndex = originalStyles.zIndex;
    testElement.style.boxShadow = originalStyles.boxShadow;
    testElement.style.animation = originalStyles.animation;
    testElement.style.removeProperty('--scroll-highlight-duration');
    testElement.style.removeProperty('--scroll-highlight-primary-color');
    testElement.style.removeProperty('--scroll-highlight-primary-rgb');
    logger.info('Visibility Test: Animation completed, styles restored');
  }, 5000);
}

/**
 * Comprehensive diagnostic test that inspects computed styles and forces maximum visibility
 */
export function testAnimationDiagnostics(): void {
  // Find any element on the page to test with
  const testElement = document.querySelector(
    '.submission__wrapper, .submissions-list__item, body > div'
  ) as HTMLElement;

  if (!testElement) {
    logger.warn('Diagnostics: No suitable element found for testing');
    return;
  }

  logger.info('Diagnostics: Starting comprehensive animation test');

  // Get initial computed styles
  const initialStyles = getComputedStyle(testElement);
  logger.info('Diagnostics: Initial styles:', {
    position: initialStyles.position,
    zIndex: initialStyles.zIndex,
    contain: initialStyles.contain,
    boxShadow: initialStyles.boxShadow,
    animation: initialStyles.animation,
    transform: initialStyles.transform
  });

  // Apply our test styles with maximum visibility
  testElement.style.position = 'relative';
  testElement.style.zIndex = '9999';
  testElement.style.contain = 'none';
  testElement.style.setProperty('--scroll-highlight-duration', '8000ms');
  testElement.style.setProperty('--scroll-highlight-primary-color', '#ff0000');
  testElement.style.setProperty('--scroll-highlight-primary-rgb', '255, 0, 0');
  testElement.style.setProperty('--scroll-highlight-scale-max', '1.1');

  // Force a very visible box-shadow before adding the class
  testElement.style.boxShadow = '0 0 0 10px red';

  logger.info('Diagnostics: Applied forced red box-shadow. Can you see it?');

  setTimeout(() => {
    // Remove forced shadow and add animation class
    testElement.style.boxShadow = '';
    testElement.classList.add('scroll-restore-highlight');

    // Check computed styles after adding class
    const animatedStyles = getComputedStyle(testElement);
    logger.info('Diagnostics: Styles after adding animation class:', {
      animation: animatedStyles.animation,
      animationName: animatedStyles.animationName,
      animationDuration: animatedStyles.animationDuration,
      animationTimingFunction: animatedStyles.animationTimingFunction,
      boxShadow: animatedStyles.boxShadow,
      transform: animatedStyles.transform,
      contain: animatedStyles.contain,
      zIndex: animatedStyles.zIndex
    });

    // Check if the animation is actually running
    setTimeout(() => {
      const runningStyles = getComputedStyle(testElement);
      logger.info('Diagnostics: Styles 1 second into animation:', {
        boxShadow: runningStyles.boxShadow,
        transform: runningStyles.transform
      });
    }, 1000);

    // Remove after test duration
    setTimeout(() => {
      testElement.classList.remove('scroll-restore-highlight');
      testElement.style.position = '';
      testElement.style.zIndex = '';
      testElement.style.contain = '';
      testElement.style.removeProperty('--scroll-highlight-duration');
      testElement.style.removeProperty('--scroll-highlight-primary-color');
      testElement.style.removeProperty('--scroll-highlight-primary-rgb');
      testElement.style.removeProperty('--scroll-highlight-scale-max');
      logger.info('Diagnostics: Test completed, styles restored');
    }, 8000);
  }, 2000);
}

/**
 * Simple hardcoded animation test that bypasses all CSS variables
 */
export function testHardcodedAnimation(): void {
  // Find any element on the page to test with
  const testElement = document.querySelector(
    '.submission__wrapper, .submissions-list__item, body > div'
  ) as HTMLElement;

  if (!testElement) {
    logger.warn('Hardcoded Test: No suitable element found for testing');
    return;
  }

  logger.info('Hardcoded Test: Applying direct CSS animation');

  // Apply hardcoded animation directly via style attribute
  testElement.style.position = 'relative';
  testElement.style.zIndex = '9999';
  testElement.style.contain = 'none';
  testElement.style.animation = `
    scroll-restore-highlight 4000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards,
    scroll-restore-pulse 920ms ease-in-out 2 alternate
  `;
  testElement.style.setProperty('--scroll-highlight-primary-color', '#edae49');
  testElement.style.setProperty(
    '--scroll-highlight-primary-rgb',
    '237, 174, 73'
  );

  // Also add the class for good measure
  testElement.classList.add('scroll-restore-highlight');

  logger.info('Hardcoded Test: Starting hardcoded animation sequence');

  // eslint-disable-next-line no-console
  console.log(
    '🎯 Hardcoded Test: Animation applied. Element should now animate with hardcoded values.'
  );

  // Remove after animation duration
  setTimeout(() => {
    testElement.classList.remove('scroll-restore-highlight');
    testElement.style.position = '';
    testElement.style.zIndex = '';
    testElement.style.contain = '';
    testElement.style.animation = '';
    testElement.style.removeProperty('--scroll-highlight-primary-color');
    testElement.style.removeProperty('--scroll-highlight-primary-rgb');
    logger.info('Hardcoded Test: Animation completed, styles restored');
  }, 4000);
}

/**
 * Manual step-by-step animation test to show exactly what should happen
 */
export function testManualAnimation(): void {
  // Find any element on the page to test with
  const testElement = document.querySelector(
    '.submission__wrapper, .submissions-list__item, body > div'
  ) as HTMLElement;

  if (!testElement) {
    logger.warn('Manual Test: No suitable element found for testing');
    return;
  }

  logger.info('Manual Test: Starting step-by-step animation demonstration');

  // Store original styles
  const originalStyles = {
    position: testElement.style.position,
    zIndex: testElement.style.zIndex,
    boxShadow: testElement.style.boxShadow,
    transform: testElement.style.transform,
    contain: testElement.style.contain
  };

  // Set up element for animation
  testElement.style.position = 'relative';
  testElement.style.zIndex = '9999';
  testElement.style.contain = 'none';

  // Step 1: Show initial state (0%)
  testElement.style.boxShadow =
    '0 0 0 2px #edae49, 0 0 0 4px rgba(237, 174, 73, 0.3), 0 0 0 8px rgba(237, 174, 73, 0.2), 0 0 0 16px rgba(237, 174, 73, 0.1)';
  testElement.style.transform = 'scale(1)';
  // eslint-disable-next-line no-console
  console.log(
    '🎯 Manual Test: Step 1 - Initial state (small border). Can you see it?'
  );

  setTimeout(() => {
    // Step 2: Show middle state (50%)
    testElement.style.boxShadow =
      '0 0 0 4px #edae49, 0 0 0 12px rgba(237, 174, 73, 0.4), 0 0 0 24px rgba(237, 174, 73, 0.3), 0 0 0 48px rgba(237, 174, 73, 0.1)';
    testElement.style.transform = 'scale(1.02)';
    // eslint-disable-next-line no-console
    console.log(
      '🎯 Manual Test: Step 2 - Middle state (expanded border). Can you see the larger border?'
    );
  }, 2000);

  setTimeout(() => {
    // Step 3: Show final state (100%)
    testElement.style.boxShadow =
      '0 0 0 0px #edae49, 0 0 0 0px rgba(237, 174, 73, 0), 0 0 0 0px rgba(237, 174, 73, 0), 0 0 0 0px rgba(237, 174, 73, 0)';
    testElement.style.transform = 'scale(1)';
    // eslint-disable-next-line no-console
    console.log(
      '🎯 Manual Test: Step 3 - Final state (no border). Border should have disappeared.'
    );
  }, 4000);

  setTimeout(() => {
    // Restore original styles
    testElement.style.position = originalStyles.position;
    testElement.style.zIndex = originalStyles.zIndex;
    testElement.style.boxShadow = originalStyles.boxShadow;
    testElement.style.transform = originalStyles.transform;
    testElement.style.contain = originalStyles.contain;
    // eslint-disable-next-line no-console
    console.log(
      '🎯 Manual Test: Test completed, styles restored. Did you see the expanding border effect?'
    );
  }, 6000);

  logger.info('Manual Test: Step-by-step animation completed');
}

// Make all test functions available globally
if (typeof window !== 'undefined') {
  (window as any).testScrollHighlight = testScrollHighlight;
  (window as any).testCSSAnimation = testCSSAnimation;
  (window as any).testHighVisibilityAnimation = testHighVisibilityAnimation;
  (window as any).testAnimationDiagnostics = testAnimationDiagnostics;
  (window as any).testHardcodedAnimation = testHardcodedAnimation;
  (window as any).testManualAnimation = testManualAnimation;
}

/**
 * Usage examples in React components:
 *
 * ```tsx
 * import { highlightElementSuccess, highlightElementCustom } from 'src/lib/utils/scroll-highlight-demo';
 *
 * function MyComponent() {
 *   const handleSuccess = () => {
 *     const button = document.getElementById('submit-button');
 *     if (button) {
 *       highlightElementSuccess(button);
 *     }
 *   };
 *
 *   const handleCustomHighlight = () => {
 *     const element = document.querySelector('.my-element');
 *     if (element) {
 *       highlightElementCustom(element, 2000, 'warning');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button id="submit-button" onClick={handleSuccess}>
 *         Click me for success highlight
 *       </button>
 *       <div className="my-element" onClick={handleCustomHighlight}>
 *         Click me for custom highlight
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * CSS usage examples:
 *
 * ```css
 * // Apply to any element with custom duration
 * .my-element {
 *   --scroll-highlight-duration: 2000ms;
 * }
 *
 * .my-element.scroll-restore-highlight {
 *   // Animation will use the custom duration
 * }
 * ```
 *
 * Direct CSS class usage:
 *
 * ```tsx
 * // Add classes directly to trigger animation
 * element.classList.add('scroll-restore-highlight', 'scroll-restore-highlight--fast', 'scroll-restore-highlight--success');
 *
 * // Set custom duration
 * element.style.setProperty('--scroll-highlight-duration', '1500ms');
 *
 * // Remove after animation (optional - animation removes itself)
 * setTimeout(() => {
 *   element.classList.remove('scroll-restore-highlight', 'scroll-restore-highlight--fast', 'scroll-restore-highlight--success');
 *   element.style.removeProperty('--scroll-highlight-duration');
 * }, 1500);
 * ```
 */
