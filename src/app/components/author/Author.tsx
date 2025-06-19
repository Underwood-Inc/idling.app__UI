'use client';

import React from 'react';
import { Avatar } from '../avatar/Avatar';
import './Author.css';

type AvatarPropSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AuthorProps {
  authorId: string;
  authorName: string;
  size?: AvatarPropSizes;
  showFullName?: boolean;
  onClick?: (authorId: string) => void;
  className?: string;
}

export const Author: React.FC<AuthorProps> = ({
  authorId,
  authorName,
  size = 'xs',
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
    <article className={containerClass} onClick={handleClick}>
      <div className="author__name" title={authorName}>
        <Avatar
          seed={authorName}
          size={size}
          enableTooltip={true}
          tooltipScale={2}
        />
        <span>{displayName}</span>
      </div>
    </article>
  );
};
