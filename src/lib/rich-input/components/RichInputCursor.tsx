import React from 'react';

interface RichInputCursorProps {
  coordinates: { x: number; y: number } | null;
  isFocused: boolean;
  atomicContext?: {
    isNearAtomic: boolean;
    isOverAtomic: boolean;
    isAtomicBoundary: boolean;
    type: string;
    proximity?: 'immediate' | 'close' | 'near';
    distance?: number;
  };
  height?: number;
}

/**
 * RichInputCursor is a component that renders the cursor of a RichInput.
 * It is used to render the cursor of a RichInput and to handle the cursor positioning.
 * Now supports enhanced animations and visibility for atomic units (pills, images).
 */
export const RichInputCursor: React.FC<RichInputCursorProps> = ({
  coordinates,
  isFocused,
  atomicContext,
  height = 20
}) => {
  if (!coordinates || !isFocused) {
    return null;
  }

  // Build CSS classes based on atomic context
  let cursorClasses = 'rich-input-cursor';

  if (atomicContext) {
    if (atomicContext.isNearAtomic) {
      cursorClasses += ' rich-input-cursor--near-atomic';

      // Add proximity-specific classes for progressive orange intensity
      if (atomicContext.proximity === 'immediate') {
        cursorClasses += ' rich-input-cursor--immediate';
      } else if (atomicContext.proximity === 'close') {
        cursorClasses += ' rich-input-cursor--close';
      } else if (atomicContext.proximity === 'near') {
        cursorClasses += ' rich-input-cursor--far';
      }
    }
    if (atomicContext.isOverAtomic) {
      cursorClasses += ' rich-input-cursor--over-atomic';
    }
    if (atomicContext.isAtomicBoundary) {
      cursorClasses += ' rich-input-cursor--atomic';
    }
  }

  return (
    <div
      className={cursorClasses}
      data-atomic-context={atomicContext?.type || 'text'}
      data-atomic-proximity={atomicContext?.proximity || 'none'}
      data-atomic-distance={atomicContext?.distance || 0}
      data-is-near-atomic={atomicContext?.isNearAtomic || false}
      data-is-over-atomic={atomicContext?.isOverAtomic || false}
      data-is-atomic-boundary={atomicContext?.isAtomicBoundary || false}
      style={{
        left: coordinates.x,
        top: coordinates.y,
        height: `${height}px`
      }}
    />
  );
};
