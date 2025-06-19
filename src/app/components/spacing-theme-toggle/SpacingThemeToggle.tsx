'use client';

import { useSpacingTheme } from '../../../lib/context/SpacingThemeContext';
import './SpacingThemeToggle.css';

export function SpacingThemeToggle() {
  const { theme, setTheme } = useSpacingTheme();

  return (
    <div className="spacing-theme-toggle">
      <label className="spacing-theme-toggle__label">Display:</label>
      <div className="spacing-theme-toggle__options">
        <button
          className={`spacing-theme-toggle__button ${theme === 'cozy' ? 'active' : ''}`}
          onClick={() => setTheme('cozy')}
          aria-pressed={theme === 'cozy'}
        >
          Cozy
        </button>
        <button
          className={`spacing-theme-toggle__button ${theme === 'compact' ? 'active' : ''}`}
          onClick={() => setTheme('compact')}
          aria-pressed={theme === 'compact'}
        >
          Compact
        </button>
      </div>
    </div>
  );
}
