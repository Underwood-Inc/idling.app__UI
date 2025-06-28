import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFocusManagementProps {
  containerRef: React.RefObject<HTMLElement>;
  onFocusChange?: (isFocused: boolean) => void;
  blurDelay?: number;
}

export function useFocusManagement({
  containerRef,
  onFocusChange,
  blurDelay = 150
}: UseFocusManagementProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = useCallback(() => {
    // Clear any pending focus loss
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    
    if (!isFocused) {
      setIsFocused(true);
      onFocusChange?.(true);
    }
  }, [isFocused, onFocusChange]);

  const handleBlur = useCallback(() => {
    // Don't immediately lose focus - use a timeout to check if focus truly left
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    focusTimeoutRef.current = setTimeout(() => {
      // Only lose focus if we're not interacting and focus has truly left the component
      if (!isInteracting) {
        const activeElement = document.activeElement;
        const container = containerRef.current;

        // Check if focus is still within our component
        if (
          !container ||
          !activeElement ||
          !container.contains(activeElement)
        ) {
          setIsFocused(false);
          onFocusChange?.(false);
        }
      }
    }, blurDelay);
  }, [isInteracting, containerRef, onFocusChange, blurDelay]);

  const setInteracting = useCallback((interacting: boolean) => {
    setIsInteracting(interacting);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  return {
    isFocused,
    handleFocus,
    handleBlur,
    setInteracting
  };
} 