'use client';

import { useGlobalLoading } from '@lib/context/GlobalLoadingContext';
import { ReactNode, useCallback, useState } from 'react';
import './LoadingButton.css';

interface LoadingButtonProps {
  onClick: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  loadingText?: string;
  globalLoadingMessage?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

export function LoadingButton({
  onClick,
  children,
  className = '',
  disabled = false,
  loadingText,
  globalLoadingMessage,
  variant = 'primary',
  size = 'md',
  type = 'button',
  title,
  'aria-label': ariaLabel,
  'data-testid': dataTestId
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoading();

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    // Generate unique request ID for global loading
    const requestId = `button-${Date.now()}-${Math.random()}`;

    // Start global loading if message provided
    if (globalLoadingMessage) {
      startLoading(requestId, globalLoadingMessage);
    }

    try {
      await onClick();
    } catch (error) {
      console.error('LoadingButton error:', error);
      throw error; // Re-throw to allow parent components to handle
    } finally {
      setIsLoading(false);

      // Stop global loading
      if (globalLoadingMessage) {
        stopLoading(requestId);
      }
    }
  }, [
    onClick,
    isLoading,
    disabled,
    globalLoadingMessage,
    startLoading,
    stopLoading
  ]);

  const buttonClasses = [
    'loading-button',
    `loading-button--${variant}`,
    `loading-button--${size}`,
    isLoading && 'loading-button--loading',
    (disabled || isLoading) && 'loading-button--disabled',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const displayText = isLoading && loadingText ? loadingText : children;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={title}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      aria-busy={isLoading}
    >
      {isLoading && (
        <span className="loading-button__spinner" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.22-8.56" />
          </svg>
        </span>
      )}
      <span className="loading-button__content">{displayText}</span>
    </button>
  );
}

// Convenience hook for async operations with loading state
export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoading();

  const execute = useCallback(
    async (
      asyncFn: () => Promise<void>,
      options?: {
        globalMessage?: string;
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      if (isLoading) return;

      setIsLoading(true);
      const requestId = `async-action-${Date.now()}-${Math.random()}`;

      if (options?.globalMessage) {
        startLoading(requestId, options.globalMessage);
      }

      try {
        await asyncFn();
        options?.onSuccess?.();
      } catch (error) {
        console.error('Async action error:', error);
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
        if (options?.globalMessage) {
          stopLoading(requestId);
        }
      }
    },
    [isLoading, startLoading, stopLoading]
  );

  return { execute, isLoading };
}
