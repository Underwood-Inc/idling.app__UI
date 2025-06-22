import React from 'react';

interface RichInputCursorProps {
  coordinates: { x: number; y: number } | null;
  isFocused: boolean;
  atomicContext?: {
    isNearAtomic: boolean;
    isOverAtomic: boolean;
    isAtomicBoundary: boolean;
    type: string;
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
