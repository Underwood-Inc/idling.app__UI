'use client';

import React from 'react';
import './RetroSpaceBackground.scss';

type MovementDirection =
  | 'static'
  | 'forward'
  | 'backward'
  | 'left'
  | 'right'
  | 'up'
  | 'down';

interface RetroSpaceBackgroundProps {
  enableStarField?: boolean;
  enableSpaceParticles?: boolean;
  enableNebula?: boolean;
  enablePlanets?: boolean;
  enableAurora?: boolean;
  enableSpeedLines?: boolean;
  movementDirection?: MovementDirection;
  movementSpeed?: 'slow' | 'normal' | 'fast';
}

const RetroSpaceBackground: React.FC<RetroSpaceBackgroundProps> = ({
  enableStarField = true,
  enableSpaceParticles = true,
  enableNebula = true,
  enablePlanets = true,
  enableAurora = true,
  enableSpeedLines = false,
  movementDirection = 'static',
  movementSpeed = 'normal'
}) => {
  // Generate random positions for stars
  const generateStars = (count: number, className: string) => {
    return Array.from({ length: count }, (_, i) => (
      <div
        key={`${className}-${i}`}
        className={`star ${className}`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 4}s`
        }}
      />
    ));
  };

  // Generate space particles
  const generateParticles = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <div
        key={`particle-${i}`}
        className="space-particle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 4}s`
        }}
      />
    ));
  };

  // Generate planets
  const generatePlanets = () => {
    return Array.from({ length: 3 }, (_, i) => (
      <div
        key={`planet-${i}`}
        className={`planet planet-${i + 1}`}
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          animationDelay: `${Math.random() * 20}s`
        }}
      />
    ));
  };

  // Generate speed lines for movement effect
  const generateSpeedLines = () => {
    return Array.from({ length: 30 }, (_, i) => (
      <div
        key={`speed-line-${i}`}
        className="speed-line"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${0.5 + Math.random() * 1}s`
        }}
      />
    ));
  };

  const containerClasses = [
    'retro-space-background',
    `movement-${movementDirection}`,
    `speed-${movementSpeed}`
  ].join(' ');

  return (
    <div className={containerClasses}>
      {/* Twinkling Star Field */}
      {enableStarField && (
        <div className="star-field">
          {generateStars(80, 'star-small')}
          {generateStars(40, 'star-medium')}
          {generateStars(20, 'star-large')}
        </div>
      )}

      {/* Speed Lines for Movement Effect */}
      {enableSpeedLines && (
        <div className="speed-lines-container">{generateSpeedLines()}</div>
      )}

      {/* Drifting Space Particles */}
      {enableSpaceParticles && (
        <div className="space-particles">{generateParticles(15)}</div>
      )}

      {/* Nebula Cloud Gradients */}
      {enableNebula && (
        <div className="nebula-container">
          <div className="nebula nebula-1" />
          <div className="nebula nebula-2" />
          <div className="nebula nebula-3" />
        </div>
      )}

      {/* Distant Planets/Orbs */}
      {enablePlanets && (
        <div className="planets-container">{generatePlanets()}</div>
      )}

      {/* Aurora Waves */}
      {enableAurora && (
        <div className="aurora-container">
          <div className="aurora aurora-1" />
          <div className="aurora aurora-2" />
          <div className="aurora aurora-3" />
        </div>
      )}
    </div>
  );
};

export default RetroSpaceBackground;
