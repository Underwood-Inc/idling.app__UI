'use client';

import { LucideIcon } from '@molecules/lucide/LucideIcon';
import { RefreshCw } from 'lucide';
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
        <LucideIcon icon={RefreshCw} sizeRem={1} className="refresh-button__icon" />
      )}
    </button>
  );
}
