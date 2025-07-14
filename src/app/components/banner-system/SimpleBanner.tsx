'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface SimpleBannerProps {
  id: string;
  type: 'alert' | 'timeout' | 'rate-limit';
  title: string;
  message: string;
  dismissible?: boolean;
  onDismiss: () => void;
  metadata?: {
    reason?: string;
    expiresAt?: string;
    alertType?: string;
    userId?: number;
  };
  retryAfter?: number;
  createdAt?: number;
}

export function SimpleBanner({
  id,
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
  metadata,
  retryAfter,
  createdAt
}: SimpleBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(retryAfter || 0);
  const [progress, setProgress] = useState(100);

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Live countdown timer for rate limit banners
  useEffect(() => {
    if (!retryAfter) return;

    const startTime = createdAt || Date.now();
    const endTime = startTime + retryAfter * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      const progressPercent =
        retryAfter > 0 ? Math.max(0, (remaining / retryAfter) * 100) : 0;

      setTimeLeft(remaining);
      setProgress(progressPercent);

      if (remaining <= 0) {
        handleDismiss();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [retryAfter, createdAt]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  }, []);

  const config = useMemo(() => {
    const isRateLimit = type === 'rate-limit';
    const isTimeout = type === 'timeout';
    const isAlert = type === 'alert';

    if (isRateLimit) {
      return {
        icon: '⚡',
        bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderColor: '#f59e0b',
        textColor: '#92400e',
        accentColor: '#f59e0b',
        progressColor: '#fbbf24'
      };
    }

    if (isTimeout) {
      return {
        icon: '⏰',
        bgGradient: 'linear-gradient(135deg, #fed7aa, #fdba74)',
        borderColor: '#f97316',
        textColor: '#9a3412',
        accentColor: '#f97316',
        progressColor: '#fb923c'
      };
    }

    if (isAlert) {
      // Handle different alert types
      switch (metadata?.alertType) {
        case 'warning':
          return {
            icon: '⚠️',
            bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderColor: '#f59e0b',
            textColor: '#92400e',
            accentColor: '#f59e0b',
            progressColor: '#fbbf24'
          };
        case 'error':
          return {
            icon: '❌',
            bgGradient: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            borderColor: '#f87171',
            textColor: '#991b1b',
            accentColor: '#ef4444',
            progressColor: '#f87171'
          };
        case 'success':
          return {
            icon: '✅',
            bgGradient: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
            borderColor: '#34d399',
            textColor: '#065f46',
            accentColor: '#10b981',
            progressColor: '#34d399'
          };
        case 'maintenance':
          return {
            icon: '🔧',
            bgGradient: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
            borderColor: '#818cf8',
            textColor: '#3730a3',
            accentColor: '#6366f1',
            progressColor: '#818cf8'
          };
        default:
          return {
            icon: 'ℹ️',
            bgGradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            borderColor: '#60a5fa',
            textColor: '#1e40af',
            accentColor: '#3b82f6',
            progressColor: '#60a5fa'
          };
      }
    }

    // Default
    return {
      icon: 'ℹ️',
      bgGradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      borderColor: '#60a5fa',
      textColor: '#1e40af',
      accentColor: '#3b82f6',
      progressColor: '#60a5fa'
    };
  }, [type, metadata?.alertType]);

  return (
    <div
      style={{
        width: '100%',
        transform: isVisible
          ? 'translateY(0) scale(1)'
          : 'translateY(-10px) scale(0.98)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-out',
        marginBottom: '8px'
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderLeft: `4px solid ${config.borderColor}`,
          background: config.bgGradient,
          minHeight: '60px',
          width: '100%'
        }}
      >
        {/* Progress bar for timed banners */}
        {retryAfter && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <div
              style={{
                height: '100%',
                background: config.progressColor,
                width: `${progress}%`,
                transition: 'width 1s linear'
              }}
            />
          </div>
        )}

        <div style={{ padding: '12px 16px' }}>
          <div
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
          >
            {/* Icon */}
            <div style={{ flexShrink: 0, fontSize: '20px' }}>{config.icon}</div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: config.textColor,
                  margin: '0 0 4px 0',
                  lineHeight: '1.3'
                }}
              >
                {title}
              </h4>

              {message && (
                <p
                  style={{
                    fontSize: '14px',
                    color: config.textColor,
                    opacity: 0.9,
                    lineHeight: '1.4',
                    margin: '0'
                  }}
                >
                  {message}
                </p>
              )}

              {/* Live countdown */}
              {timeLeft > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: config.accentColor,
                      animation: 'pulse 2s infinite'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: config.textColor
                    }}
                  >
                    Try again in {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Additional info */}
              {metadata?.reason && (
                <p
                  style={{
                    fontSize: '11px',
                    marginTop: '6px',
                    color: config.textColor,
                    opacity: 0.75
                  }}
                >
                  Reason: {metadata.reason}
                </p>
              )}
            </div>

            {/* Dismiss button */}
            {dismissible && (
              <button
                onClick={handleDismiss}
                style={{
                  flexShrink: 0,
                  padding: '8px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: config.textColor,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
