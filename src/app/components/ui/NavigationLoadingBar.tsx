'use client';

import { useGlobalLoading } from '@lib/context/GlobalLoadingContext';
import { useNavigationLoading } from '@lib/context/NavigationLoadingContext';
import { useEffect, useState } from 'react';
import './NavigationLoadingBar.css';

export function NavigationLoadingBar() {
  const { isNavigating, targetPath } = useNavigationLoading();
  const { isLoading: isGlobalLoading, loadingMessage } = useGlobalLoading();

  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Combine navigation and global loading states
  const isAnyLoading = isNavigating || isGlobalLoading;
  const displayMessage = targetPath
    ? `Loading ${targetPath}...`
    : loadingMessage;

  // Ensure we only show on client to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    if (isAnyLoading && isClient) {
      setIsVisible(true);
      setProgress(10); // Start with 10%

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) {
            return prev + Math.random() * 10;
          }
          return prev;
        });
      }, 200);
    } else if (!isAnyLoading && isVisible) {
      // Complete the progress bar
      setProgress(100);

      // Hide after animation completes
      hideTimeout = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 500);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [isAnyLoading, isClient, isVisible]);

  // Don't render on server or if not visible
  if (!isClient || !isVisible) return null;

  return (
    <div className="navigation-loading-bar">
      <div
        className="navigation-loading-bar__progress"
        style={{ width: `${progress}%` }}
      >
        <div className="navigation-loading-bar__glow" />
      </div>
      {displayMessage && (
        <div className="navigation-loading-bar__info">
          <span className="navigation-loading-bar__text">{displayMessage}</span>
        </div>
      )}
    </div>
  );
}
