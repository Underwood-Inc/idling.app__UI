import React from 'react';

interface RichInputCursorProps {
  coordinates: { x: number; y: number } | null;
  isFocused: boolean;
}

/**
 * RichInputCursor is a component that renders the cursor of a RichInput.
 * It is used to render the cursor of a RichInput and to handle the cursor positioning.
 */
export const RichInputCursor: React.FC<RichInputCursorProps> = ({
  coordinates,
  isFocused
}) => {
  if (!coordinates || !isFocused) {
    return null;
  }

  return (
    <div
      className="rich-input-cursor"
      style={{
        left: coordinates.x,
        top: coordinates.y
      }}
    />
  );
};
