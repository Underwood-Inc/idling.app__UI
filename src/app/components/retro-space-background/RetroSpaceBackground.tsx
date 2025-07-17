'use client';

import { useUserPreferences } from '@lib/context/UserPreferencesContext';
import { useEffect, useState } from 'react';
import './RetroSpaceBackground.scss';

// Keep prop interface for potential override capabilities
interface RetroSpaceBackgroundProps {
  movementDirection?:
    | 'static'
    | 'forward'
    | 'backward'
    | 'left'
    | 'right'
    | 'up'
    | 'down';
  movementSpeed?: 'slow' | 'normal' | 'fast';
  enableSpeedLines?: boolean;
}

export default function RetroSpaceBackground({
  movementDirection: overrideDirection,
  movementSpeed: overrideSpeed,
  enableSpeedLines = false
}: RetroSpaceBackgroundProps) {
  // Client-side only rendering to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  // Get settings from user preferences context
  const {
    backgroundMovementDirection,
    backgroundMovementSpeed,
    backgroundAnimationLayers
  } = useUserPreferences();

  // Use context values unless overridden by props
  const movementDirection = overrideDirection || backgroundMovementDirection;
  const movementSpeed = overrideSpeed || backgroundMovementSpeed;

  // Ensure client-side only rendering for dynamic elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Build dynamic class names based on settings
  const containerClasses = [
    'retro-space-background',
    `movement-${movementDirection}`,
    `speed-${movementSpeed}`,
    !backgroundAnimationLayers.stars && 'hide-stars',
    !backgroundAnimationLayers.particles && 'hide-particles',
    !backgroundAnimationLayers.nebula && 'hide-nebula',
    !backgroundAnimationLayers.planets && 'hide-planets',
    !backgroundAnimationLayers.aurora && 'hide-aurora'
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* 1. Twinkling Star Field - Client-side only for dynamic randomness */}
      {backgroundAnimationLayers.stars && isMounted && (
        <div className="star-field">
          {Array.from({ length: 200 }, (_, i) => (
            <div
              key={i}
              className={`star ${i % 3 === 0 ? 'star-small' : i % 2 === 0 ? 'star-medium' : 'star-large'}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 2. Drifting Space Particles - Client-side only for dynamic randomness */}
      {backgroundAnimationLayers.particles && isMounted && (
        <div className="space-particles">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="space-particle"
              style={{
                left: `${Math.random() * -10}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Nebula Cloud Gradients - Static elements safe for SSR */}
      {backgroundAnimationLayers.nebula && (
        <div className="nebula-clouds">
          <div className="nebula-cloud"></div>
          <div className="nebula-cloud"></div>
          <div className="nebula-cloud"></div>
        </div>
      )}

      {/* 4. Distant Planets/Orbs - Static elements safe for SSR */}
      {backgroundAnimationLayers.planets && (
        <div className="distant-planets">
          <div className="distant-planet"></div>
          <div className="distant-planet"></div>
          <div className="distant-planet"></div>
        </div>
      )}

      {/* 5. Aurora Waves - Static elements safe for SSR */}
      {backgroundAnimationLayers.aurora && (
        <div className="aurora-waves">
          <div className="aurora-wave"></div>
          <div className="aurora-wave"></div>
          <div className="aurora-wave"></div>
        </div>
      )}

      {/* Speed Lines - Client-side only for dynamic randomness */}
      {enableSpeedLines &&
        (movementDirection === 'forward' || movementDirection === 'backward') &&
        isMounted && (
          <div className="speed-lines">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="speed-line"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
    </div>
  );
}
