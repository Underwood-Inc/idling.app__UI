'use client';

import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { makeid } from '@lib/utils/string/make-id';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AvatarsBackground.css';

// ================================
// BACKGROUND AVATAR COMPONENT
// ================================

// Simple avatar component that generates SVG directly without caching
const BackgroundAvatar: React.FC<{ seed: string; size: 'sm' | 'md' }> = ({
  seed,
  size
}) => {
  const avatarSvg = React.useMemo(() => {
    try {
      const avatar = createAvatar(adventurer, { seed });
      return avatar.toDataUri();
    } catch (error) {
      console.error('Failed to generate background avatar:', error);
      return null;
    }
  }, [seed]);

  if (!avatarSvg) {
    return null;
  }

  return (
    <img
      src={avatarSvg}
      alt="Background Avatar"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%'
      }}
    />
  );
};

// ================================
// TYPES
// ================================

interface FloatingAvatar {
  id: string;
  seed: string;
  x: number;
  y: number;
  velocity: {
    x: number;
    y: number;
  };
  size: 'sm' | 'md';
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  createdAt: number;
  lifetime: number;
  scale: number;
}

interface ViewportDimensions {
  width: number;
  height: number;
}

// ================================
// CONSTANTS
// ================================

const ANIMATION_CONFIG = {
  MAX_AVATARS: 8,
  GENERATION_INTERVAL: 2000, // 2 seconds
  MIN_LIFETIME: 15000, // 15 seconds (longer lifetime for slow movement)
  MAX_LIFETIME: 35000, // 35 seconds
  BASE_SPEED: 0.0, // Very slow dreamy floating speed
  GRAVITY: -0.00005, // Very gentle anti-gravity
  WIND_STRENGTH: 0.005, // Gentle wind drift
  FADE_DURATION: 2000 // 2 seconds fade out
} as const;

const AVATAR_CONFIG = {
  MIN_SIZE: 60, // Increased from 40
  MAX_SIZE: 80, // Increased from 60
  MIN_OPACITY: 0.4, // Increased for better visibility
  MAX_OPACITY: 0.8, // Increased for better visibility
  SIZE_PROBABILITY: 0.7 // 70% chance for small size
} as const;

// Temporary debug mode - set to true to see avatars more clearly
const DEBUG_MODE = false; // Disabled to remove red overlay

// ================================
// UTILITY FUNCTIONS
// ================================

const getViewportDimensions = (): ViewportDimensions => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  height: typeof window !== 'undefined' ? window.innerHeight : 768
});

const generateRandomAvatar = (viewport: ViewportDimensions): FloatingAvatar => {
  const now = Date.now();
  const lifetime =
    ANIMATION_CONFIG.MIN_LIFETIME +
    Math.random() *
      (ANIMATION_CONFIG.MAX_LIFETIME - ANIMATION_CONFIG.MIN_LIFETIME);

  return {
    id: `avatar-${now}-${makeid(6)}`,
    seed: makeid(8),
    x: Math.random() * (viewport.width - AVATAR_CONFIG.MAX_SIZE),
    y: viewport.height + 50, // Start just below viewport (much closer)
    velocity: {
      x: (Math.random() - 0.5) * 0.4, // Gentle horizontal drift
      y: -ANIMATION_CONFIG.BASE_SPEED - Math.random() * 0.8 // Upward movement (faster)
    },
    size: Math.random() > AVATAR_CONFIG.SIZE_PROBABILITY ? 'md' : 'sm',
    opacity:
      AVATAR_CONFIG.MIN_OPACITY +
      Math.random() * (AVATAR_CONFIG.MAX_OPACITY - AVATAR_CONFIG.MIN_OPACITY),
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 0.5,
    createdAt: now,
    lifetime,
    scale: 0.8 + Math.random() * 0.4 // Random scale between 0.8 and 1.2
  };
};

const updateAvatarPosition = (
  avatar: FloatingAvatar,
  deltaTime: number
): FloatingAvatar => {
  const age = Date.now() - avatar.createdAt;
  const progress = Math.min(age / avatar.lifetime, 1);

  // Calculate fade effect for the last 20% of lifetime
  const fadeStart = 0.8;
  const fadeOpacity =
    progress > fadeStart
      ? avatar.opacity * (1 - (progress - fadeStart) / (1 - fadeStart))
      : avatar.opacity;

  return {
    ...avatar,
    x: avatar.x + avatar.velocity.x * deltaTime,
    y: avatar.y + avatar.velocity.y * deltaTime,
    velocity: {
      x:
        avatar.velocity.x +
        (Math.random() - 0.5) * ANIMATION_CONFIG.WIND_STRENGTH,
      y: avatar.velocity.y + ANIMATION_CONFIG.GRAVITY * deltaTime
    },
    rotation: avatar.rotation + avatar.rotationSpeed * deltaTime,
    opacity: Math.max(0, fadeOpacity)
  };
};

const isAvatarValid = (
  avatar: FloatingAvatar,
  viewport: ViewportDimensions
): boolean => {
  const age = Date.now() - avatar.createdAt;
  const isAlive = age < avatar.lifetime;
  const isVisible =
    avatar.y > -AVATAR_CONFIG.MAX_SIZE &&
    avatar.y < viewport.height + AVATAR_CONFIG.MAX_SIZE;

  return isAlive && (isVisible || age < 3000); // Keep for 3 seconds even if off-screen
};

// ================================
// MAIN COMPONENT
// ================================

const AvatarsBackground: React.FC = () => {
  const [avatars, setAvatars] = useState<Map<string, FloatingAvatar>>(
    new Map()
  );
  const [viewport, setViewport] = useState<ViewportDimensions>(
    getViewportDimensions
  );
  const [isActive, setIsActive] = useState(true);

  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());
  const lastSpawnRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle viewport resize
  const handleResize = useCallback(() => {
    setViewport(getViewportDimensions());
  }, []);

  // Single spawn function for all avatars
  const spawnAvatar = useCallback(() => {
    const currentViewport = getViewportDimensions();
    const avatar = generateRandomAvatar(currentViewport);

    // Position avatar somewhere on screen for immediate visibility
    avatar.y = currentViewport.height - Math.random() * 300 + 100;

    return avatar;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!isActive) return;

    const now = Date.now();
    const deltaTime = Math.min(now - lastUpdateRef.current, 16.67); // Cap at 60fps
    lastUpdateRef.current = now;

    setAvatars((prevAvatars) => {
      const newAvatars = new Map(prevAvatars);

      // Spawn new avatar if needed
      const timeSinceLastSpawn = now - lastSpawnRef.current;
      if (
        timeSinceLastSpawn > ANIMATION_CONFIG.GENERATION_INTERVAL &&
        newAvatars.size < ANIMATION_CONFIG.MAX_AVATARS
      ) {
        const newAvatar = spawnAvatar();
        newAvatars.set(newAvatar.id, newAvatar);
        lastSpawnRef.current = now;
      }

      // Update and filter existing avatars
      const currentViewport = getViewportDimensions();
      for (const [id, avatar] of newAvatars) {
        const updated = updateAvatarPosition(avatar, deltaTime);
        if (isAvatarValid(updated, currentViewport)) {
          newAvatars.set(id, updated);
        } else {
          newAvatars.delete(id);
        }
      }

      return newAvatars;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [isActive, spawnAvatar]);

  // Initialize component
  useEffect(() => {
    // Spawn initial avatars
    setAvatars(new Map());
    lastSpawnRef.current = Date.now() - ANIMATION_CONFIG.GENERATION_INTERVAL; // Allow immediate spawning

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array to run only once

  // Start/stop animation
  useEffect(() => {
    if (isActive) {
      lastUpdateRef.current = Date.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isActive]);

  // Pause animation when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Debug logging
  if (DEBUG_MODE) {
    // eslint-disable-next-line no-console
    console.log('🎭 AvatarsBackground render:', {
      avatarCount: avatars.size,
      isActive,
      viewport
    });
  }

  return (
    <div
      ref={containerRef}
      className={`avatars-background ${DEBUG_MODE ? 'avatars-background-debug' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: DEBUG_MODE ? 1000 : -1,
        overflow: 'hidden',
        background: DEBUG_MODE ? 'rgba(255, 0, 0, 0.1)' : 'transparent'
      }}
      aria-hidden="true"
    >
      {DEBUG_MODE && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        >
          Avatars: {avatars.size} | Active: {isActive ? 'Yes' : 'No'}
        </div>
      )}
      {Array.from(avatars.values()).map((avatar) => (
        <div
          key={avatar.id}
          className={`floating-avatar ${DEBUG_MODE ? 'floating-avatar-debug' : ''}`}
          style={{
            position: 'absolute',
            left: `${avatar.x}px`,
            top: `${avatar.y}px`,
            opacity: DEBUG_MODE
              ? Math.max(avatar.opacity, 0.7)
              : avatar.opacity,
            transform: `rotate(${avatar.rotation}deg) scale(${avatar.scale})`,
            filter: DEBUG_MODE ? 'none' : 'blur(0.5px) saturate(0.8)',
            transition: 'opacity 0.3s ease-out',
            willChange: 'transform, opacity',
            width: '50px',
            height: '50px',
            border: DEBUG_MODE ? '2px solid blue' : 'none',
            background: DEBUG_MODE ? 'rgba(0, 255, 0, 0.2)' : 'transparent'
          }}
        >
          <BackgroundAvatar seed={avatar.seed} size={avatar.size} />
        </div>
      ))}
    </div>
  );
};

export default AvatarsBackground;
