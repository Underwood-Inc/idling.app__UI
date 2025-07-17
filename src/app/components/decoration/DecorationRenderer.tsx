'use client';

import React, { memo } from 'react';
import './DecorationRenderer.css';

export type DecorationVariant =
  | 'enterprise-crown'
  | 'premium-galaxy'
  | 'pro-plasma'
  | 'active-glow'
  | 'trial-pulse';

export interface DecorationConfig {
  variant: DecorationVariant;
  className?: string;
  'data-testid'?: string;
}

export interface DecorationRendererProps {
  decoration: string | null;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  showError?: boolean;
  'data-testid'?: string;
}

/**
 * Modern, agnostic decoration renderer component
 *
 * Renders different decoration effects around content in a flexible,
 * reusable way that's not tied to specific business logic.
 */
const DecorationRenderer = memo<DecorationRendererProps>(
  ({
    decoration,
    children,
    className = '',
    isLoading = false,
    error = null,
    showError = false,
    'data-testid': testId
  }) => {
    // No decoration or loading - render plain content
    if (!decoration || isLoading) {
      return (
        <div
          className={`decoration-renderer ${className}`}
          data-testid={testId}
          data-loading={isLoading}
        >
          {children}
          {isLoading && (
            <div
              className="decoration-renderer__loading"
              aria-label="Loading decoration"
            >
              <div className="decoration-renderer__spinner" />
            </div>
          )}
        </div>
      );
    }

    // Error state - render content with optional error indicator
    if (error && showError) {
      return (
        <div
          className={`decoration-renderer decoration-renderer--error ${className}`}
          data-testid={testId}
          title={error}
        >
          {children}
          <div
            className="decoration-renderer__error"
            aria-label={`Decoration error: ${error}`}
          >
            <small>⚠️</small>
          </div>
        </div>
      );
    }

    // Valid decoration - render with effects
    const decorationClass = `decoration-renderer--${decoration}`;
    const containerClass = `decoration-renderer decoration-renderer--decorated ${decorationClass} ${className}`;

    return (
      <div
        className={containerClass}
        data-testid={testId}
        data-decoration={decoration}
      >
        {/* Enterprise Crown Effect */}
        {decoration === 'enterprise-crown' && (
          <>
            <div className="decoration-renderer__crown" aria-hidden="true">
              👑
            </div>
            <div
              className="decoration-renderer__glow decoration-renderer__glow--enterprise"
              aria-hidden="true"
            />
          </>
        )}

        {/* Premium Galaxy Effect */}
        {decoration === 'premium-galaxy' && (
          <>
            <div
              className="decoration-renderer__glow decoration-renderer__glow--galaxy"
              aria-hidden="true"
            />
            <div className="decoration-renderer__particles" aria-hidden="true">
              <div className="decoration-renderer__particle decoration-renderer__particle--star">
                ⭐
              </div>
              <div className="decoration-renderer__particle decoration-renderer__particle--sparkle">
                ✨
              </div>
              <div className="decoration-renderer__particle decoration-renderer__particle--diamond">
                💎
              </div>
            </div>
          </>
        )}

        {/* Pro Plasma Effect */}
        {decoration === 'pro-plasma' && (
          <div
            className="decoration-renderer__glow decoration-renderer__glow--plasma"
            aria-hidden="true"
          />
        )}

        {/* Active Glow Effect */}
        {decoration === 'active-glow' && (
          <div
            className="decoration-renderer__glow decoration-renderer__glow--active"
            aria-hidden="true"
          />
        )}

        {/* Trial Pulse Effect */}
        {decoration === 'trial-pulse' && (
          <div
            className="decoration-renderer__pulse decoration-renderer__pulse--trial"
            aria-hidden="true"
          />
        )}

        {/* Content */}
        <div className="decoration-renderer__content">{children}</div>
      </div>
    );
  }
);

DecorationRenderer.displayName = 'DecorationRenderer';

export { DecorationRenderer };
