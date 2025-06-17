'use client';

import React, { useEffect, useRef, useState } from 'react';
import './FooterBadge.css';

export interface FooterBadgeProps {
  /** Text to show when expanded */
  text: string;
  /** Icon or content to show in collapsed state */
  icon?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Position from right edge in pixels */
  rightOffset?: number;
  /** Position from bottom edge in pixels */
  bottomOffset?: number;
  /** Badge color theme */
  theme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Custom CSS class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Hover proximity distance in pixels */
  hoverDistance?: number;
}

export const FooterBadge: React.FC<FooterBadgeProps> = ({
  text,
  icon = '+',
  onClick,
  rightOffset = 20,
  bottomOffset = 4,
  theme = 'primary',
  className = '',
  disabled = false,
  hoverDistance = 80
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      if (badgeRef.current && !disabled) {
        const rect = badgeRef.current.getBoundingClientRect();
        const badgeCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        const distance = Math.sqrt(
          Math.pow(e.clientX - badgeCenter.x, 2) +
            Math.pow(e.clientY - badgeCenter.y, 2)
        );

        setIsExpanded(distance <= hoverDistance);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [hoverDistance, disabled]);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const themeClasses = {
    primary: 'footer-badge--primary',
    secondary: 'footer-badge--secondary',
    success: 'footer-badge--success',
    warning: 'footer-badge--warning',
    danger: 'footer-badge--danger'
  };

  const badgeContent = (
    <div className="footer-badge__content">
      <div className="footer-badge__icon">{icon}</div>
      <div className="footer-badge__text">{text}</div>
    </div>
  );

  const baseClasses = `
    footer-badge
    ${themeClasses[theme]}
    ${isExpanded ? 'footer-badge--expanded' : 'footer-badge--collapsed'}
    ${disabled ? 'footer-badge--disabled' : ''}
    ${className}
  `.trim();

  const baseStyles = {
    right: rightOffset,
    bottom: bottomOffset
  };

  return (
    <>
      {/* Background button - full button behind footer */}
      <button
        className={`${baseClasses} footer-badge--background`}
        style={baseStyles}
        onClick={handleClick}
        disabled={disabled}
        aria-label={text}
        title={text}
      >
        {badgeContent}
      </button>

      {/* Clipped button - partial button in front of footer */}
      <button
        ref={badgeRef}
        className={`${baseClasses} footer-badge--clipped`}
        style={baseStyles}
        onClick={handleClick}
        disabled={disabled}
        aria-label={text}
        title={text}
      >
        {badgeContent}
      </button>
    </>
  );
};

export default FooterBadge;
