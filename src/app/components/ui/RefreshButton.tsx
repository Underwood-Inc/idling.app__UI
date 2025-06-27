'use client';

import { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import './RefreshButton.css';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
  title?: string;
}

export function RefreshButton({
  onRefresh,
  className = '',
  disabled = false,
  title = 'Refresh post'
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || disabled) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      className={`refresh-button ${className} ${isRefreshing ? 'refresh-button--refreshing' : ''}`}
      onClick={handleRefresh}
      disabled={isRefreshing || disabled}
      title={title}
      aria-label={title}
    >
      {isRefreshing ? (
        <ClipLoader
          size={16}
          color="var(--brand-secondary)"
          loading={true}
          aria-label="Loading"
        />
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="refresh-button__icon"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      )}
    </button>
  );
}
