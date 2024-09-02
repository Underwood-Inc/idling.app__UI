import React from 'react';
import { CARD_SELECTORS } from 'src/lib/test-selectors/components/card.selectors';
import './Card.css';

export type CardPropsWidth = 'full' | 'lg' | 'md' | 'sm' | 'min';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  width?: CardPropsWidth;
  height?: number; // TODO: deprecate with introduction of a maintainable alternative
}> = ({ children, className, width = 'md', height }) => {
  return (
    <div
      className={`card ${width}${className ? ` ${className}` : ''}`}
      style={height ? { height: `${height}rem` } : undefined}
      data-testid={CARD_SELECTORS.CONTAINER}
    >
      {children}
    </div>
  );
};
