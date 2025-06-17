'use client';

import React from 'react';
import Avatar from '../avatar/Avatar';
import './Author.css';

export interface AuthorProps {
  authorId: string;
  authorName: string;
  size?: 'sm' | 'md' | 'lg';
  showFullName?: boolean;
  onClick?: (authorId: string) => void;
  className?: string;
}

export const Author: React.FC<AuthorProps> = ({
  authorId,
  authorName,
  size = 'sm',
  showFullName = true,
  onClick,
  className = ''
}) => {
  const displayName = showFullName ? authorName : `@${authorName}`;

  const handleClick = () => {
    if (onClick) {
      onClick(authorId);
    }
  };

  const containerClass = `author ${size} ${onClick ? 'clickable' : ''} ${className}`;

  return (
    <div className={containerClass} onClick={handleClick}>
      <Avatar seed={authorName} size={size} />
      <span className="author__name" title={authorName}>
        {displayName}
      </span>
    </div>
  );
};
