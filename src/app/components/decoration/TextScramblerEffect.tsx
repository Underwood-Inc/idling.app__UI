'use client';

import React, { useEffect, useState } from 'react';
import './TextScramblerEffect.css';

export interface TextScramblerEffectProps {
  /** Original text to scramble */
  originalText: string;
  /** Whether the effect is active */
  isActive: boolean;
  /** Animation speed in milliseconds */
  speed?: number;
  /** Character set to use for scrambling */
  characters?: string;
  /** Use only characters that exist in the original text */
  useSameCharacters?: boolean;
  /** When using same characters, respect word boundaries (scramble each word independently) */
  respectWordBoundaries?: boolean;
  /** CSS class name */
  className?: string;
  /** Children to render when effect is not active */
  children?: React.ReactNode;
}

/**
 * Dynamic character scrambling effect
 *
 * Creates a randomized character effect that maintains the exact length
 * of the original text while rapidly cycling through random characters.
 * Perfect for loading states where you want to show activity without
 * revealing the actual content.
 *
 * Features intelligent scrambling modes:
 * - Standard: Uses predefined character set
 * - Same Characters: Uses only characters from the original text
 * - Word Boundaries: When combined with same characters, scrambles each word independently
 */
export function TextScramblerEffect({
  originalText,
  isActive,
  speed = 50,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-=+#@',
  useSameCharacters = false,
  respectWordBoundaries = false,
  className = '',
  children
}: TextScramblerEffectProps) {
  const [scrambledText, setScrambledText] = useState(originalText);

  useEffect(() => {
    if (!isActive) {
      setScrambledText(originalText);
      return;
    }

    let intervalId: number;

    const scrambleText = () => {
      setScrambledText((prevText) => {
        if (useSameCharacters && respectWordBoundaries) {
          // Smart word-by-word scrambling using each word's own characters
          return originalText
            .split(/(\s+)/) // Split on whitespace but keep the separators
            .map((segment) => {
              // If this segment is whitespace, preserve it
              if (/^\s+$/.test(segment)) {
                return segment;
              }

              // Extract unique characters from this word (excluding spaces)
              const wordChars = [
                ...new Set(segment.split('').filter((char) => char !== ' '))
              ];

              // If no characters to work with, return as-is
              if (wordChars.length === 0) {
                return segment;
              }

              // Scramble each character in the word using only the word's characters
              return segment
                .split('')
                .map((char) => {
                  // Preserve spaces and special characters that should not be scrambled
                  if (char === ' ' || char === '_' || char === '-') {
                    return char;
                  }
                  // Use random character from this word's character set
                  return wordChars[
                    Math.floor(Math.random() * wordChars.length)
                  ];
                })
                .join('');
            })
            .join('');
        } else if (useSameCharacters) {
          // Use all unique characters from the original text
          const textChars = [
            ...new Set(
              originalText
                .split('')
                .filter((char) => char !== ' ' && char !== '_' && char !== '-')
            )
          ];

          // If no characters to work with, fall back to default
          if (textChars.length === 0) {
            return originalText;
          }

          return originalText
            .split('')
            .map((char) => {
              // Preserve spaces and special characters that are meaningful
              if (char === ' ' || char === '_' || char === '-') {
                return char;
              }
              // Use random character from the original text's character set
              return textChars[Math.floor(Math.random() * textChars.length)];
            })
            .join('');
        } else {
          // Original behavior - use predefined character set
          return originalText
            .split('')
            .map((char) => {
              // Preserve spaces and special characters that are meaningful
              if (char === ' ' || char === '_' || char === '-') {
                return char;
              }
              // Generate random character for scrambling
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join('');
        }
      });
    };

    // Start the scrambling animation
    intervalId = window.setInterval(scrambleText, speed);

    // Initial scramble
    scrambleText();

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    isActive,
    originalText,
    speed,
    characters,
    useSameCharacters,
    respectWordBoundaries
  ]);

  if (!isActive) {
    return <>{children || originalText}</>;
  }

  return (
    <span className={`text-scrambler-effect ${className}`}>
      <span className="text-scrambler-effect__text" aria-hidden="true">
        {scrambledText}
      </span>
      <span
        className="text-scrambler-effect__sr-only"
        style={{ position: 'absolute', left: '-10000px' }}
      >
        Loading decoration for {originalText}
      </span>
    </span>
  );
}
