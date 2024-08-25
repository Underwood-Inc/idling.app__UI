'use client';
import React, { useEffect, useState } from 'react';
import './FadeIn.css';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  display?: 'div' | 'span' | 'p' | 'code';
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
      return <code className={cssName}>{children}</code>;
    case 'p':
      return <p className={cssName}>{children}</p>;
    case 'span':
      return <span className={cssName}>{children}</span>;
    default:
      return <div className={cssName}>{children}</div>;
  }
};

export default FadeIn;
