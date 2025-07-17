'use client';

import { useUserPreferences } from '@lib/context/UserPreferencesProvider';
import './SpacingThemeToggle.css';

export function SpacingThemeToggle() {
  const { spacingTheme, setSpacingTheme } = useUserPreferences();

  return (
    <div className="spacing-theme-toggle">
      <label className="spacing-theme-toggle__label">Display:</label>
      <div className="spacing-theme-toggle__options">
        <button
          className={`spacing-theme-toggle__button ${spacingTheme === 'cozy' ? 'active' : ''}`}
          onClick={() => setSpacingTheme('cozy')}
          aria-pressed={spacingTheme === 'cozy'}
        >
          Cozy
        </button>
        <button
          className={`spacing-theme-toggle__button ${spacingTheme === 'compact' ? 'active' : ''}`}
          onClick={() => setSpacingTheme('compact')}
          aria-pressed={spacingTheme === 'compact'}
        >
          Compact
        </button>
      </div>
    </div>
  );
}
