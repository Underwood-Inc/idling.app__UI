import React from 'react';

type CSSFlexJustifyContentOptions =
  | 'center'
  | 'end'
  | 'flex-end'
  | 'flex-start'
  | 'left'
  | 'normal'
  | 'right'
  | 'space-around'
  | 'space-between'
  | 'space-evenly'
  | 'start'
  | 'stretch'
  | 'inherit'
  | 'initial'
  | 'revert'
  | 'revert-layer';

export function NavbarContent({
  children,
  className = '',
  justify
}: {
  children: React.ReactNode;
  className?: string;
  justify: CSSFlexJustifyContentOptions;
}) {
  return (
    <div
      className={`navbar__content${justify ? `--jc-${justify}` : ''} ${className}`}
    >
      {children}
    </div>
  );
}
