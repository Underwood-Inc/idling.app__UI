import React from 'react';

interface RichInputSelectionProps {
  coordinates: Array<{ x: number; y: number; width: number; height: number }>;
}

/**
 * RichInputSelection is a component that renders the selection of a RichInput.
 * It is used to render the selection of a RichInput and to handle the selection positioning.
 */
export const RichInputSelection: React.FC<RichInputSelectionProps> = ({
  coordinates
}) => {
  return (
    <>
      {coordinates.map((coords, index) => (
        <div
          key={`selection-${index}`}
          className="rich-input-selection"
          style={{
            left: coords.x,
            top: coords.y,
            width: coords.width,
            height: coords.height
          }}
        />
      ))}
    </>
  );
};
