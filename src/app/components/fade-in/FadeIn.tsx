'use client';
import React, { CSSProperties, useEffect, useState } from 'react';
import { FADE_IN_SELECTORS } from 'src/lib/test-selectors/components/fade-in.selectors';
import './FadeIn.css';

export const enum DisplayType {
  DIV = 'DIV',
  SPAN = 'SPAN',
  P = 'P',
  CODE = 'CODE',
  LI = 'LI'
}

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  display?: DisplayType;
  style?: CSSProperties;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  display = DisplayType.DIV,
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const cssName = `fade-in${isVisible ? ' visible' : ''}${className ? ` ${className}` : ''}`;

  const props = {
    className: cssName,
    style,
    'data-testid': FADE_IN_SELECTORS[display]
  };

  // Update the switch statement to use DisplayType
  switch (display) {
    case DisplayType.CODE:
      return <code {...props}>{children}</code>;
    case DisplayType.LI:
      return <li {...props}>{children}</li>;
    case DisplayType.P:
      return <p {...props}>{children}</p>;
    case DisplayType.SPAN:
      return <span {...props}>{children}</span>;
    default:
      return <div {...props}>{children}</div>;
  }
};

export default FadeIn;
