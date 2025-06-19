'use client';

import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useState } from 'react';
import { avatarCacheAtom } from '../../../lib/state/atoms';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import './Avatar.css';

export type AvatarPropSizes = 'full' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

// Generate a stable fallback seed once per component instance
const generateStableFallbackSeed = () =>
  `fallback-${Math.random().toString(36).substring(2, 15)}`;

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

    // Create a stable seed that only changes when the seed prop changes
    const stableSeed = useMemo(() => {
      return seed || generateStableFallbackSeed();
    }, [seed]);

    // Check if we have a cached avatar
    const cachedAvatar = avatarCache[stableSeed];

    // Generate avatar using useMemo to prevent regeneration on every render
    const avatarDataUri = useMemo(() => {
      if (cachedAvatar) {
        return cachedAvatar;
      }

      try {
        const avatar = createAvatar(adventurer, {
          seed: stableSeed
        });
        return avatar.toDataUri();
      } catch (error) {
        console.error('Failed to generate avatar:', error);
        return null;
      }
    }, [stableSeed, cachedAvatar]);

    // Cache the generated avatar
    const cacheAvatar = useCallback(() => {
      if (avatarDataUri && !avatarCache[stableSeed]) {
        setAvatarCache((prev: Record<string, string>) => ({
          ...prev,
          [stableSeed]: avatarDataUri
        }));
      }
    }, [avatarDataUri, stableSeed, avatarCache, setAvatarCache]);

    // Cache the avatar when it's generated
    useMemo(() => {
      cacheAvatar();
    }, [cacheAvatar]);

    const [showTooltip, setShowTooltip] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        if (!enableTooltip) return;

        const rect = e.currentTarget.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX + rect.width / 2
        });
        setShowTooltip(true);
      },
      [enableTooltip]
    );

    const handleMouseLeave = useCallback(() => {
      if (!enableTooltip) return;
      setShowTooltip(false);
    }, [enableTooltip]);

    if (!avatarDataUri) {
      return (
        <div
          className={`avatar ${size} avatar--loading`}
          data-testid="avatar-loading"
        >
          <div className="avatar__placeholder" />
        </div>
      );
    }

    const avatarElement = (
      <div
        className={`avatar ${size}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="avatar"
      >
        <img
          src={avatarDataUri}
          className={`avatar__img ${size}`}
          alt="Avatar"
          style={{
            opacity: 1,
            transition: 'opacity 0.2s ease'
          }}
        />
      </div>
    );

    if (enableTooltip) {
      return (
        <InteractiveTooltip
          content={
            <div
              className={`avatar ${size === 'xs' ? 'lg' : size === 'xxs' ? 'lg' : 'full'}`}
              style={{ transform: `scale(${tooltipScale})` }}
            >
              <img
                src={avatarDataUri}
                className={`avatar__img ${size === 'xs' ? 'lg' : size === 'xxs' ? 'lg' : 'full'}`}
                alt="Avatar (enlarged)"
              />
            </div>
          }
        >
          {avatarElement}
        </InteractiveTooltip>
      );
    }

    return avatarElement;
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
