'use client';
import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { atom, useAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { AVATAR_SELECTORS } from 'src/lib/test-selectors/components/avatar.selectors';
import './Avatar.css';

export type AvatarPropSizes = 'full' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

const avatarCacheAtom = atom<Record<string, string>>({});

const Avatar = memo(
  ({
    seed,
    size = 'md',
    enableTooltip = false,
    tooltipScale = 2
  }: {
    seed?: string;
    size?: AvatarPropSizes;
    enableTooltip?: boolean;
    tooltipScale?: 2 | 3 | 4;
  }) => {
    const [avatarCache, setAvatarCache] = useAtom(avatarCacheAtom);
    const cacheKey = seed || new Date().getTime().toString();
    const [img, setImg] = useState(avatarCache[cacheKey] || null);
    const [isLoading, setIsLoading] = useState(!avatarCache[cacheKey]);
    const [error, setError] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const avatarRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!avatarCache[cacheKey]) {
        const newAvatar = createAvatar(adventurer, {
          seed: cacheKey
        }).toDataUri();
        setAvatarCache((prev) => ({ ...prev, [cacheKey]: newAvatar }));
        setImg(newAvatar);
        setIsLoading(false);
      } else {
        setImg(avatarCache[cacheKey]);
        setIsLoading(false);
      }
    }, [cacheKey, setAvatarCache, avatarCache]);

    const updateTooltipPosition = () => {
      if (!avatarRef.current || !tooltipRef.current) return;

      const avatarRect = avatarRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate available space
      const spaceAbove = avatarRect.top;
      const spaceBelow = viewportHeight - avatarRect.bottom;

      // Determine vertical position
      let top: number;
      if (spaceBelow >= tooltipRect.height || spaceBelow >= spaceAbove) {
        // Position below if there's more space below
        top = avatarRect.bottom + 8;
      } else {
        // Position above if there's more space above
        top = avatarRect.top - tooltipRect.height - 8;
      }

      // Ensure tooltip stays within viewport vertically
      top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));

      // Determine horizontal position - center on avatar
      let left = avatarRect.left + (avatarRect.width - tooltipRect.width) / 2;

      // Ensure tooltip stays within viewport horizontally
      left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));

      setPosition({ top, left });
    };

    const handleMouseEnter = () => {
      if (!enableTooltip) return;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      const timeout = setTimeout(() => {
        setShowTooltip(true);
        // Update position after a short delay to ensure content is rendered
        setTimeout(updateTooltipPosition, 0);
      }, 500);
      hideTimeoutRef.current = timeout;
    };

    const handleMouseLeave = () => {
      if (!enableTooltip) return;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      const timeout = setTimeout(() => {
        setShowTooltip(false);
      }, 100);
      hideTimeoutRef.current = timeout;
    };

    const handleTooltipMouseEnter = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };

    const handleTooltipMouseLeave = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      const timeout = setTimeout(() => {
        setShowTooltip(false);
      }, 100);
      hideTimeoutRef.current = timeout;
    };

    useEffect(() => {
      if (showTooltip) {
        updateTooltipPosition();
        window.addEventListener('scroll', updateTooltipPosition);
        window.addEventListener('resize', updateTooltipPosition);
      }

      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }, [showTooltip]);

    useEffect(() => {
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setError(true);
    };

    const getTooltipSize = () => {
      const sizeMap = {
        xxs: 2,
        xs: 3,
        sm: 5,
        md: 7,
        lg: 10,
        full: 20
      };
      const baseSize = sizeMap[size] || 7; // Default to md size
      return baseSize * tooltipScale;
    };

    return (
      <>
        <div
          ref={avatarRef}
          className={`avatar ${size}`}
          data-testid={AVATAR_SELECTORS.CONTAINER}
          style={{ width: size, height: size }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Always render image container to maintain layout */}
          <div className="avatar__image-container">
            {isLoading && (
              <div className="avatar__loading-overlay">
                <div className="avatar__grid-loader">
                  {[...Array(9)].map((_, i) => (
                    <span key={i} />
                  ))}
                </div>
              </div>
            )}
            {!error && img && (
              <img
                src={img}
                className={`avatar__img ${size}`}
                alt="Avatar"
                data-testid={AVATAR_SELECTORS.IMAGE}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                  opacity: isLoading ? 0 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              />
            )}
          </div>
        </div>

        {/* Avatar Tooltip */}
        {enableTooltip && showTooltip && !error && img && (
          <div
            ref={tooltipRef}
            className="avatar-tooltip"
            style={position}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <div
              className="avatar-tooltip__container"
              style={{
                width: `${getTooltipSize()}rem`,
                height: `${getTooltipSize()}rem`
              }}
            >
              <img
                src={img}
                className="avatar-tooltip__image"
                alt="Avatar (enlarged)"
              />
            </div>
          </div>
        )}
      </>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
