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
  lifetime: number;
}

// ================================
// CONSTANTS
// ================================

const MAX_AVATARS = 12;
const GENERATION_INTERVAL = 1500; // 1.5 seconds - more frequent
const MIN_LIFETIME = 8000; // 8 seconds minimum
const MAX_LIFETIME = 15000; // 15 seconds maximum
const GRAVITY = 0.05; // Gentle downward movement
const WIND_VARIATION = 0.02; // Very subtle horizontal drift
const BASE_SPEED = 0.3; // Base movement speed

// ================================
// MAIN COMPONENT
// ================================

const AvatarsBackground: React.FC = () => {
  const [avatars, setAvatars] = useState<AvatarInstance[]>([]);
  const animationRef = useRef<number>();
  const lastGenerationRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateAvatar = (): AvatarInstance => {
    const now = Date.now();
    const lifetime =
      MIN_LIFETIME + Math.random() * (MAX_LIFETIME - MIN_LIFETIME);

    return {
      id: `avatar-${now}-${makeid(6)}`,
      seed: makeid(8),
      x: Math.random() * (window.innerWidth - 80) + 40,
      y: window.innerHeight + 60, // Start just below screen
      vx: (Math.random() - 0.5) * 0.2, // Gentle horizontal movement
      vy: -BASE_SPEED - Math.random() * 0.2, // Upward movement
      size: Math.random() > 0.6 ? 'md' : 'sm',
      opacity: 0.15 + Math.random() * 0.25, // Subtle opacity
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.3, // Gentle rotation
      createdAt: now,
      lifetime
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
        .map((avatar) => {
          const age = now - avatar.createdAt;
          const progress = age / avatar.lifetime;

          // Fade out as avatar approaches end of life
          const fadeOpacity =
            progress > 0.8
              ? avatar.opacity * (1 - (progress - 0.8) * 5)
              : avatar.opacity;

          return {
            ...avatar,
            x: avatar.x + avatar.vx,
            y: avatar.y + avatar.vy,
            vx: avatar.vx + (Math.random() - 0.5) * WIND_VARIATION,
            vy: avatar.vy + GRAVITY, // Gentle downward acceleration
            rotation: avatar.rotation + avatar.rotationSpeed,
            opacity: Math.max(0, fadeOpacity)
          };
        })
        .filter((avatar) => {
          const age = now - avatar.createdAt;
          const isVisible =
            avatar.y > -100 && avatar.y < window.innerHeight + 100;
          const isAlive = age < avatar.lifetime;

          return isAlive && (isVisible || age < 2000); // Keep for 2 seconds even if off-screen
        });

      return newAvatars;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  // Initialize with a few avatars immediately
  useEffect(() => {
    const initialAvatars: AvatarInstance[] = [];
    const now = Date.now();

    // Create 3-5 initial avatars
    const initialCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < initialCount; i++) {
      const avatar = generateAvatar();
      // Stagger their start positions
      avatar.y = window.innerHeight + 60 + i * 100;
      avatar.createdAt = now - i * 500; // Stagger creation time
      initialAvatars.push(avatar);
    }

    setAvatars(initialAvatars);
    lastGenerationRef.current = now;
  }, []);

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
      ref={containerRef}
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
            filter: 'blur(0.3px) saturate(0.7)',
            transition: 'opacity 0.3s ease-out',
            willChange: 'transform, opacity'
          }}
        >
          <Avatar seed={avatar.seed} size={avatar.size} />
        </div>
      ))}
    </div>
  );
};

export default AvatarsBackground;
