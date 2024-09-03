'use client';
import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { useEffect, useState } from 'react';
import { GridLoader } from 'react-spinners';
import { AVATAR_SELECTORS } from 'src/lib/test-selectors/components/avatar.selectors';
import './Avatar.css';

export type AvatarPropSizes = 'full' | 'lg' | 'md' | 'sm';

const Avatar = ({
  seed,
  size = 'md'
}: {
  seed?: string;
  size?: AvatarPropSizes;
}) => {
  const [img, setImg] = useState('');

  useEffect(() => {
    setImg(
      createAvatar(adventurer, {
        seed: seed || new Date().getTime().toString()
      }).toDataUriSync()
    );
  }, [seed]);

  return (
    <div className={`avatar ${size}`} data-testid={AVATAR_SELECTORS.CONTAINER}>
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
          {/* loader use brand primary color */}
          <GridLoader color="#edae49ff" />
        </div>
      )}
    </div>
  );
};

export default Avatar;
