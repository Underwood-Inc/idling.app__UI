import React from 'react';
import './Card.css';

export const Card: React.FC<{
  children: React.ReactNode;
  size?: 'full' | 'lg' | 'md' | 'sm';
}> = ({ children, size = 'md' }) => {
  return <div className={`card ${size}`}>{children}</div>;
};
