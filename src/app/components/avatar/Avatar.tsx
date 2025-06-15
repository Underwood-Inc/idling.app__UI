'use client';
import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { atom, useAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { AVATAR_SELECTORS } from 'src/lib/test-selectors/components/avatar.selectors';
import './Avatar.css';

export type AvatarPropSizes = 'full' | 'lg' | 'md' | 'sm';

const avatarCacheAtom = atom<Record<string, string>>({});

const Avatar = memo(
  ({ seed, size = 'md' }: { seed?: string; size?: AvatarPropSizes }) => {
    const [avatarCache, setAvatarCache] = useAtom(avatarCacheAtom);
    const cacheKey = seed || new Date().getTime().toString();
    const [img, setImg] = useState(avatarCache[cacheKey] || null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (!avatarCache[cacheKey]) {
        const newAvatar = createAvatar(adventurer, {
          seed: cacheKey
        }).toDataUri();
        setAvatarCache((prev) => ({ ...prev, [cacheKey]: newAvatar }));
        setImg(newAvatar);
      }
    }, [cacheKey, setAvatarCache, avatarCache]);

    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setError(true);
    };

    return (
      <div
        className={`avatar ${size}`}
        data-testid={AVATAR_SELECTORS.CONTAINER}
        style={{ width: size, height: size }}
      >
        {isLoading && (
          <div className="loading-overlay">
            <div className="grid-loader">
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
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
