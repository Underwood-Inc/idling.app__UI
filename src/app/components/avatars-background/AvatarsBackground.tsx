'use client';

import React, { useEffect, useRef, useState } from 'react';
import { makeid } from '../../../lib/utils/string/make-id';
import { Avatar } from '../avatar/Avatar';
import './AvatarsBackground.css';

// ================================
// TYPES
// ================================

interface AvatarInstance {
  id: string;
  seed: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 'sm' | 'md';
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  createdAt: number;
}

// ================================
// CONSTANTS
// ================================

const MAX_AVATARS = 15;
const GENERATION_INTERVAL = 4000; // 4 seconds
const AVATAR_LIFETIME = 45000; // 45 seconds
const GRAVITY = -0.3; // Gentle upward movement
const WIND_VARIATION = 0.1; // Subtle horizontal drift

// ================================
// MAIN COMPONENT
// ================================

const AvatarsBackground: React.FC = () => {
  const [avatars, setAvatars] = useState<AvatarInstance[]>([]);
  const animationRef = useRef<number>();
  const lastGenerationRef = useRef<number>(0);

  const generateAvatar = (): AvatarInstance => {
    const now = Date.now();
    return {
      id: `avatar-${now}-${makeid(6)}`,
      seed: makeid(8),
      x: Math.random() * (window.innerWidth - 100) + 50,
      y: window.innerHeight + 50,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 0.3,
      size: Math.random() > 0.5 ? 'md' : 'sm',
      opacity: 0.2 + Math.random() * 0.3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      createdAt: now
    };
  };

  const animate = () => {
    const now = Date.now();

    setAvatars((prevAvatars) => {
      let newAvatars = [...prevAvatars];

      // Generate new avatar if needed
      if (
        now - lastGenerationRef.current > GENERATION_INTERVAL &&
        newAvatars.length < MAX_AVATARS
      ) {
        newAvatars.push(generateAvatar());
        lastGenerationRef.current = now;
      }

      // Update positions and remove old avatars
      newAvatars = newAvatars
        .map((avatar) => ({
          ...avatar,
          x: avatar.x + avatar.vx,
          y: avatar.y + avatar.vy,
          vx: avatar.vx + (Math.random() - 0.5) * WIND_VARIATION,
          vy: avatar.vy + GRAVITY,
          rotation: avatar.rotation + avatar.rotationSpeed
        }))
        .filter((avatar) => {
          const age = now - avatar.createdAt;
          const isVisible =
            avatar.y > -100 && avatar.y < window.innerHeight + 100;
          return age < AVATAR_LIFETIME && (isVisible || age < 5000);
        });

      return newAvatars;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className="avatars-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden'
      }}
    >
      {avatars.map((avatar) => (
        <div
          key={avatar.id}
          style={{
            position: 'absolute',
            left: `${avatar.x}px`,
            top: `${avatar.y}px`,
            opacity: avatar.opacity,
            transform: `rotate(${avatar.rotation}deg)`,
            filter: 'blur(0.5px) saturate(0.8)',
            transition: 'opacity 0.5s ease-out'
          }}
        >
          <Avatar seed={avatar.seed} size={avatar.size} />
        </div>
      ))}
    </div>
  );
};

export default AvatarsBackground;
