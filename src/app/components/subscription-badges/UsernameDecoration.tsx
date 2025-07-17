'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { getUserDecoration } from '../../../lib/actions/subscription.actions';
import './UsernameDecoration.css';

export interface UsernameDecorationProps {
  userId?: string;
  children: React.ReactNode;
  forceDecoration?: string; // For admin testing
}

export function UsernameDecoration({
  userId,
  children,
  forceDecoration
}: UsernameDecorationProps) {
  const [decoration, setDecoration] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (forceDecoration) {
      setDecoration(forceDecoration);
      return;
    }

    if (!userId) {
      setDecoration(null);
      return;
    }

    // Use server action to fetch decoration
    setLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await getUserDecoration(userId);

        if (result.error) {
          setError(result.error);
          setDecoration(null);
        } else {
          setDecoration(result.decoration);
        }
      } catch (err) {
        console.error('Failed to fetch user decoration:', err);
        setError('Failed to load decoration');
        setDecoration(null);
      } finally {
        setLoading(false);
      }
    });
  }, [userId, forceDecoration]);

  if (!decoration) {
    return <>{children}</>;
  }

  const isLoading = loading || isPending;

  return (
    <div className={`username-decoration username-decoration--${decoration}`}>
      {/* Enterprise Crown Effect */}
      {decoration === 'enterprise-crown' && (
        <>
          <div className="username-decoration__crown">👑</div>
          <div className="username-decoration__glow username-decoration__glow--enterprise" />
        </>
      )}

      {/* Premium Galaxy Effect */}
      {decoration === 'premium-galaxy' && (
        <>
          <div className="username-decoration__glow username-decoration__glow--galaxy" />
          <div className="username-decoration__particles">
            <div className="username-decoration__particle username-decoration__particle--star">
              ⭐
            </div>
            <div className="username-decoration__particle username-decoration__particle--sparkle">
              ✨
            </div>
            <div className="username-decoration__particle username-decoration__particle--diamond">
              💎
            </div>
          </div>
        </>
      )}

      {/* Pro Plasma Effect */}
      {decoration === 'pro-plasma' && (
        <div className="username-decoration__glow username-decoration__glow--plasma" />
      )}

      {/* Active Glow Effect */}
      {decoration === 'active-glow' && (
        <div className="username-decoration__glow username-decoration__glow--active" />
      )}

      {/* Trial Pulse Effect */}
      {decoration === 'trial-pulse' && (
        <div className="username-decoration__pulse username-decoration__pulse--trial" />
      )}

      {/* Username Content */}
      <div className="username-decoration__content">{children}</div>

      {/* Loading overlay - Temporarily disabled for debugging */}
      {false && isLoading && (
        <div className="username-decoration__loading">
          <div className="username-decoration__spinner" />
        </div>
      )}

      {/* Error handling - subtle, doesn't interfere with UX */}
      {error && process.env.NODE_ENV === 'development' && (
        <div className="username-decoration__error" title={error}>
          <small>⚠️</small>
        </div>
      )}
    </div>
  );
}
