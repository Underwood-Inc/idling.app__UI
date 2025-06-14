'use client';
import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { atom, useAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { GridLoader } from 'react-spinners';
import { AVATAR_SELECTORS } from 'src/lib/test-selectors/components/avatar.selectors';
import './Avatar.css';

export type AvatarPropSizes = 'full' | 'lg' | 'md' | 'sm';

const avatarCacheAtom = atom<Record<string, string>>({});

const Avatar = memo(
  ({ seed, size = 'md' }: { seed?: string; size?: AvatarPropSizes }) => {
    const [avatarCache, setAvatarCache] = useAtom(avatarCacheAtom);
    const cacheKey = seed || new Date().getTime().toString();
    const [img, setImg] = useState(avatarCache[cacheKey] || '');

    useEffect(() => {
      if (!avatarCache[cacheKey]) {
        const newAvatar = createAvatar(adventurer, {
          seed: cacheKey
        }).toDataUri();
        setAvatarCache((prev) => ({ ...prev, [cacheKey]: newAvatar }));
        setImg(newAvatar);
      }
    }, [cacheKey, setAvatarCache]);

    return (
      <div
        className={`avatar ${size}`}
        data-testid={AVATAR_SELECTORS.CONTAINER}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            className={`avatar__img ${size}`}
            alt="avatar"
            data-testid={AVATAR_SELECTORS.IMAGE}
          />
        ) : (
          <div className="avatar__loader" data-testid={AVATAR_SELECTORS.LOADER}>
            <GridLoader
              color="#edae49ff"
              size={15}
              margin={2}
              speedMultiplier={1}
              cssOverride={{
                animationDuration: '1.4s',
                animationDelay: '0.6s'
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
