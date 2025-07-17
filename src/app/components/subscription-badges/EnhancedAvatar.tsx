'use client';

import { Avatar, AvatarPropSizes } from '../avatar/Avatar';
import { AvatarDecoration } from './AvatarDecoration';
import './EnhancedAvatar.css';

export interface EnhancedAvatarProps {
  seed?: string;
  size?: AvatarPropSizes;
  userId?: string;
  enableTooltip?: boolean;
  tooltipScale?: 2 | 3 | 4;
  showDecorations?: boolean;
  forceDecoration?: string;
  className?: string;
}

export function EnhancedAvatar({
  seed,
  size = 'md',
  userId,
  enableTooltip = false,
  tooltipScale = 2,
  showDecorations = true,
  forceDecoration,
  className = ''
}: EnhancedAvatarProps) {
  const avatarElement = (
    <Avatar
      seed={seed}
      size={size}
      enableTooltip={enableTooltip}
      tooltipScale={tooltipScale}
    />
  );

  const decoratedAvatar = showDecorations ? (
    <AvatarDecoration
      userId={userId}
      size={size}
      forceDecoration={forceDecoration}
    >
      {avatarElement}
    </AvatarDecoration>
  ) : (
    avatarElement
  );

  return (
    <div className={`enhanced-avatar enhanced-avatar--${size} ${className}`}>
      {decoratedAvatar}
    </div>
  );
}
