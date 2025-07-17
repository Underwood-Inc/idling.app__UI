'use client';

import { useFlairPreference } from '@lib/context/UserPreferencesContext';
import { useState } from 'react';
import { Card } from '../card/Card';
import './FlairSelector.css';

interface FlairSelectorProps {
  userId: string;
}

const flairOptions = [
  {
    value: 'auto',
    label: 'Auto',
    icon: '✨',
    description: 'Show highest tier subscription flair'
  },
  {
    value: 'enterprise-crown',
    label: 'Enterprise Crown',
    icon: '👑',
    description: 'Golden crown with royal glow effect'
  },
  {
    value: 'premium-galaxy',
    label: 'Premium Galaxy',
    icon: '🌌',
    description: 'Cosmic shimmer with floating particles'
  },
  {
    value: 'pro-plasma',
    label: 'Pro Plasma',
    icon: '⚡',
    description: 'Electric blue flowing energy effect'
  },
  {
    value: 'active-glow',
    label: 'Active Glow',
    icon: '✨',
    description: 'Gentle green aura indicating activity'
  },
  {
    value: 'trial-pulse',
    label: 'Trial Pulse',
    icon: '🔄',
    description: 'Amber pulse for trial subscriptions'
  },
  {
    value: 'none',
    label: 'None',
    icon: '🚫',
    description: 'Hide all subscription flair'
  }
];

export function FlairSelector({ userId }: FlairSelectorProps) {
  const {
    preference: flairPreference,
    setPreference: setFlairPreference,
    isUpdating: isUpdatingFlairPreference,
    error: flairPreferenceError
  } = useFlairPreference();

  const [isExpanded, setIsExpanded] = useState(false);

  const currentOption =
    flairOptions.find((option) => option.value === flairPreference) ||
    flairOptions[0];

  return (
    <div className="flair-selector" style={{ marginTop: '1.5rem' }}>
      <Card className="flair-selector__card">
        <div className="flair-selector__header">
          <div className="flair-selector__title-section">
            <h3 className="flair-selector__title">⭐ Username Flair</h3>
            <p className="flair-selector__description">
              Customize how your username appears across the site
            </p>
          </div>
          <button
            className="flair-selector__current"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isUpdatingFlairPreference}
          >
            <span className="flair-selector__current-icon">
              {currentOption.icon}
            </span>
            <span className="flair-selector__current-label">
              {currentOption.label}
            </span>
            <span
              className={`flair-selector__chevron ${isExpanded ? 'flair-selector__chevron--open' : ''}`}
            >
              ⌄
            </span>
          </button>
        </div>

        {isExpanded && (
          <div className="flair-selector__options">
            {flairOptions.map((option) => (
              <button
                key={option.value}
                className={`flair-selector__option ${
                  flairPreference === option.value
                    ? 'flair-selector__option--active'
                    : ''
                }`}
                onClick={() => {
                  setFlairPreference(option.value as any);
                  setIsExpanded(false);
                }}
                disabled={isUpdatingFlairPreference}
              >
                <span className="flair-selector__option-icon">
                  {option.icon}
                </span>
                <div className="flair-selector__option-content">
                  <span className="flair-selector__option-label">
                    {option.label}
                  </span>
                  <span className="flair-selector__option-description">
                    {option.description}
                  </span>
                </div>
                {flairPreference === option.value && (
                  <span className="flair-selector__option-check">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {flairPreferenceError && (
          <div className="flair-selector__error">{flairPreferenceError}</div>
        )}

        {isUpdatingFlairPreference && (
          <div className="flair-selector__loading">
            Updating flair preference...
          </div>
        )}
      </Card>
    </div>
  );
}
