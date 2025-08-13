'use client';

import React, { useEffect, useRef, useState } from 'react';
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
 * Dynamic character scrambling effect with intelligent width management
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
 *
 * Width Management:
 * When useSameCharacters=true, the component pre-calculates the maximum possible
 * width by testing combinations using the widest characters from the text. This
 * prevents layout shifts during scrambling by applying a consistent minWidth.
 * The calculation considers character width ordering (W, M, Q are typically widest)
 * and generates test combinations to find the true maximum width needed.
 */
/**
 * Calculate the maximum possible width for scrambled text combinations
 * This prevents layout shifts by pre-calculating the widest possible text
 */
function calculateMaxWidth(
  originalText: string,
  useSameCharacters: boolean,
  respectWordBoundaries: boolean,
  measureElement: HTMLElement | null
): number {
  if (!measureElement || !useSameCharacters) {
    return 0; // Only calculate for same characters mode
  }

  const testCombinations: string[] = [];

  if (respectWordBoundaries) {
    // Generate test combinations for each word independently
    const result = originalText
      .split(/(\s+)/)
      .map((segment) => {
        if (/^\s+$/.test(segment)) {
          return segment; // Preserve whitespace
        }

        const wordChars = [
          ...new Set(segment.split('').filter((char) => char !== ' '))
        ];
        if (wordChars.length === 0) {
          return segment;
        }

        // Sort characters by typical width (widest first)
        const sortedChars = wordChars.sort((a, b) => {
          const widthOrder =
            'WMQOGDCBARHNUYTFLIPJKSVXZEwmqogdcbarhnutflijksxzpe1234567890';
          const aIndex = widthOrder.indexOf(a);
          const bIndex = widthOrder.indexOf(b);
          return (
            (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
          );
        });

        // Create combinations using widest characters
        return segment
          .split('')
          .map((char) => {
            if (char === ' ' || char === '_' || char === '-') {
              return char;
            }
            return sortedChars[0] || char; // Use widest character
          })
          .join('');
      })
      .join('');

    testCombinations.push(result);
  } else {
    // Generate test combinations using all characters from original text
    const textChars = [
      ...new Set(
        originalText
          .split('')
          .filter((char) => char !== ' ' && char !== '_' && char !== '-')
      )
    ];

    if (textChars.length > 0) {
      // Sort characters by typical width (widest first)
      const sortedChars = textChars.sort((a, b) => {
        const widthOrder =
          'WMQOGDCBARHNUYTFLIPJKSVXZEwmqogdcbarhnutflijksxzpe1234567890';
        const aIndex = widthOrder.indexOf(a);
        const bIndex = widthOrder.indexOf(b);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });

      // Generate combinations using different character patterns
      const widestCharCombo = originalText
        .split('')
        .map((char) => {
          if (char === ' ' || char === '_' || char === '-') {
            return char;
          }
          return sortedChars[0] || char; // All widest characters
        })
        .join('');

      const mixedCombo = originalText
        .split('')
        .map((char, index) => {
          if (char === ' ' || char === '_' || char === '-') {
            return char;
          }
          // Alternate between widest and second widest
          return sortedChars[index % Math.min(2, sortedChars.length)] || char;
        })
        .join('');

      testCombinations.push(widestCharCombo, mixedCombo);
    }
  }

  // Measure each combination and return the maximum width
  let maxWidth = 0;
  const originalContent = measureElement.textContent;

  // Always measure the original text first as baseline
  measureElement.textContent = originalText;
  maxWidth = measureElement.getBoundingClientRect().width;

  // Measure test combinations to find wider variants
  testCombinations.forEach((combination) => {
    measureElement.textContent = combination;
    const width = measureElement.getBoundingClientRect().width;
    maxWidth = Math.max(maxWidth, width);
  });

  // Restore original content and add buffer for safety
  measureElement.textContent = originalContent;
  return Math.ceil(maxWidth + 3); // Add 3px buffer for better safety
}

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
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [isWidthCalculated, setIsWidthCalculated] =
    useState<boolean>(!useSameCharacters);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Calculate maximum width to prevent layout shifts
  useEffect(() => {
    if (useSameCharacters && measureRef.current) {
      // Small delay to ensure the measurement element is properly rendered
      const timeoutId = setTimeout(() => {
        if (measureRef.current) {
          const calculatedMaxWidth = calculateMaxWidth(
            originalText,
            useSameCharacters,
            respectWordBoundaries,
            measureRef.current
          );
          setMaxWidth(calculatedMaxWidth);
          setIsWidthCalculated(true);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    } else {
      setMaxWidth(0);
      setIsWidthCalculated(true);
    }
  }, [originalText, useSameCharacters, respectWordBoundaries]);

  useEffect(() => {
    if (!isActive) {
      setScrambledText(originalText);
      return;
    }

    // Don't start scrambling until width calculation is complete (for useSameCharacters mode)
    if (!isWidthCalculated) {
      return;
    }

    let intervalId: number;

    const scrambleText = () => {
      setScrambledText((_prevText) => {
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
    respectWordBoundaries,
    isWidthCalculated
  ]);

  if (!isActive) {
    return (
      <>
        {children || originalText}
        {/* Hidden measurement element for width calculation */}
        <span
          ref={measureRef}
          className="text-scrambler-effect__text"
          aria-hidden="true"
          style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {originalText}
        </span>
      </>
    );
  }

  const containerStyle: React.CSSProperties = {};
  if (maxWidth > 0) {
    containerStyle.minWidth = `${maxWidth}px`;
    containerStyle.display = 'inline-block';
  }

  // Show original text if width calculation isn't complete yet
  const displayText = isWidthCalculated ? scrambledText : originalText;

  return (
    <>
      <span
        className={`text-scrambler-effect ${className}`}
        style={containerStyle}
      >
        <span className="text-scrambler-effect__text" aria-hidden="true">
          {displayText}
        </span>
        <span
          className="text-scrambler-effect__sr-only"
          style={{ position: 'absolute', left: '-10000px' }}
        >
          Loading decoration for {originalText}
        </span>
      </span>
      {/* Hidden measurement element for width calculation */}
      <span
        ref={measureRef}
        className="text-scrambler-effect__text"
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}
      >
        {originalText}
      </span>
    </>
  );
}
