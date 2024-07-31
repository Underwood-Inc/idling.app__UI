'use client';
import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { useEffect, useState } from 'react';
import { GridLoader } from 'react-spinners';
import './Avatar.css';

const Avatar = ({
  seed,
  size = 'md'
}: {
  seed?: string;
  size?: 'full' | 'lg' | 'md' | 'sm';
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
    <div className="avatar">
      {img ? (
        <img src={img} className={`avatar__img ${size}`} alt="avatar" />
      ) : (
        <div className="avatar__loader">
          {/* loader use brand primary color */}
          <GridLoader color="#edae49ff" />
        </div>
      )}
    </div>
  );
};

export default Avatar;
