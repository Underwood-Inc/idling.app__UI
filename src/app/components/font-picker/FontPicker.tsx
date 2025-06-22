'use client';

import React, { useEffect, useState } from 'react';
import './FontPicker.css';

export type FontOption = 'monospace' | 'default';

interface FontPickerProps {
  className?: string;
  onChange?: (font: FontOption) => void;
}

const FONT_OPTIONS = {
  monospace: {
    name: 'Code',
    description: 'Fira Code - Perfect for coding',
    preview: 'Aa 123 {code}',
    cssValue:
      "'Fira Code', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', monospace"
  },
  default: {
    name: 'Reading',
    description: 'System fonts - Easy on the eyes',
    preview: 'Aa 123 text',
    cssValue:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
  }
} as const;

const STORAGE_KEY = 'idling-app-font-preference';

export const FontPicker: React.FC<FontPickerProps> = ({
  className = '',
  onChange
}) => {
  const [selectedFont, setSelectedFont] = useState<FontOption>('monospace');
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved font preference and ensure font is applied
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedFont = localStorage.getItem(STORAGE_KEY) as FontOption;
      if (savedFont && savedFont in FONT_OPTIONS) {
        setSelectedFont(savedFont);
        applyFont(savedFont);
      } else {
        // Default to monospace (current app default)
        setSelectedFont('monospace');
        applyFont('monospace');
      }
    } catch (error) {
      console.warn('Failed to load font preference:', error);
      setSelectedFont('monospace');
      applyFont('monospace');
    }
  }, [isClient]);

  // Additional effect to ensure font is applied after component mount
  useEffect(() => {
    if (!isClient) return;

    // Small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      applyFont(selectedFont);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isClient, selectedFont]);

  const applyFont = (font: FontOption) => {
    if (!isClient) return;

    try {
      const fontValue = FONT_OPTIONS[font].cssValue;

      // Set CSS variable on root element - this should now work properly
      document.documentElement.style.setProperty(
        '--app-font-family',
        fontValue
      );

      // Force a repaint to ensure the font change is immediately visible
      document.body.offsetHeight;

      console.log(`✅ Font applied: ${font} -> ${fontValue}`);
    } catch (error) {
      console.warn('❌ Failed to apply font:', error);
    }
  };

  const handleFontChange = (font: FontOption) => {
    setSelectedFont(font);
    setIsOpen(false);

    try {
      // Save preference
      if (isClient) {
        localStorage.setItem(STORAGE_KEY, font);
      }

      // Apply font
      applyFont(font);

      // Notify parent component
      if (onChange) {
        onChange(font);
      }
    } catch (error) {
      console.warn('Failed to change font:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent,
    font: FontOption
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFontChange(font);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.font-picker')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Don't render on server to avoid hydration mismatches
  if (!isClient) {
    return null;
  }

  return (
    <div className={`font-picker ${className}`}>
      <button
        type="button"
        className={`font-picker__trigger ${isOpen ? 'font-picker__trigger--open' : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select application font"
        title="Change application font family"
      >
        <span className="font-picker__icon">🔤</span>
        <span className="font-picker__label">
          {FONT_OPTIONS[selectedFont].name}
        </span>
        <span
          className={`font-picker__arrow ${isOpen ? 'font-picker__arrow--open' : ''}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="font-picker__dropdown" role="listbox">
          {Object.entries(FONT_OPTIONS).map(([key, option]) => (
            <div
              key={key}
              className={`font-picker__option ${
                selectedFont === key ? 'font-picker__option--selected' : ''
              }`}
              role="option"
              aria-selected={selectedFont === key}
              tabIndex={0}
              onClick={() => handleFontChange(key as FontOption)}
              onKeyDown={(e) => handleOptionKeyDown(e, key as FontOption)}
            >
              <div className="font-picker__option-content">
                <span className="font-picker__option-name">{option.name}</span>
                <span className="font-picker__option-description">
                  {option.description}
                </span>
                <span
                  className="font-picker__option-preview"
                  style={{ fontFamily: option.cssValue }}
                >
                  {option.preview}
                </span>
              </div>
              {selectedFont === key && (
                <span className="font-picker__option-check">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontPicker;
