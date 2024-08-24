'use client';
import React, { useEffect, useState } from 'react';
import './FadeIn.css';

interface FadeInProps {
  children: React.ReactNode;
  display?: 'div' | 'span' | 'p' | 'code';
}

const FadeIn: React.FC<FadeInProps> = ({ children, display = 'div' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const className = `fade-in ${isVisible ? 'visible' : ''}`;

  switch (display) {
    case 'code':
      return <code className={className}>{children}</code>;
    case 'p':
      return <p className={className}>{children}</p>;
    case 'span':
      return <span className={className}>{children}</span>;
    default:
      return <div className={className}>{children}</div>;
  }
};

export default FadeIn;
