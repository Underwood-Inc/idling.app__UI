'use client';
import React, { useEffect, useState } from 'react';
import { FADE_IN_SELECTORS } from 'src/lib/test-selectors/components/fade-in.selectors';
import './FadeIn.css';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  display?: 'div' | 'span' | 'p' | 'code' | 'li';
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  display = 'div'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const cssName = `fade-in${isVisible ? ' visible' : ''}${className ? ` ${className}` : ''}`;

  switch (display) {
    case 'code':
      return (
        <code className={cssName} data-testid={FADE_IN_SELECTORS.CODE}>
          {children}
        </code>
      );
    case 'li':
      return (
        <li className={cssName} data-testid={FADE_IN_SELECTORS.LI}>
          {children}
        </li>
      );
    case 'p':
      return (
        <p className={cssName} data-testid={FADE_IN_SELECTORS.P}>
          {children}
        </p>
      );
    case 'span':
      return (
        <span className={cssName} data-testid={FADE_IN_SELECTORS.SPAN}>
          {children}
        </span>
      );
    default:
      return (
        <div className={cssName} data-testid={FADE_IN_SELECTORS.DIV}>
          {children}
        </div>
      );
  }
};

export default FadeIn;
