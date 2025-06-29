'use client';

import React, { useCallback, useState } from 'react';
import './TimeoutModal.css';

interface TimeoutModalProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onTimeout: (userId: string, options: TimeoutOptions) => Promise<void>;
}

export interface TimeoutOptions {
  timeoutType: 'post_creation' | 'comment_creation' | 'full_access';
  reason: string;
  durationHours: number;
  customDuration?: {
    days: number;
    hours: number;
    minutes: number;
  };
}

const TIMEOUT_PRESETS = [
  { label: '1 Hour', hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '24 Hours (1 Day)', hours: 24 },
  { label: '72 Hours (3 Days)', hours: 72 },
  { label: '168 Hours (1 Week)', hours: 168 },
  { label: '720 Hours (30 Days)', hours: 720 },
  { label: 'Custom', hours: 0 }
];

const TIMEOUT_TYPES = [
  {
    value: 'post_creation' as const,
    label: 'Post Creation',
    description: 'User cannot create new posts'
  },
  {
    value: 'comment_creation' as const,
    label: 'Comment Creation',
    description: 'User cannot create comments or replies'
  },
  {
    value: 'full_access' as const,
    label: 'Full Access',
    description: 'User cannot perform any actions'
  }
];

const COMMON_REASONS = [
  'Violation of community guidelines',
  'Spam or excessive posting',
  'Inappropriate content',
  'Harassment or abuse',
  'Multiple rule violations',
  'Temporary cooling off period',
  'Administrative action'
];

export function TimeoutModal({
  user,
  isOpen,
  onClose,
  onTimeout
}: TimeoutModalProps) {
  const [timeoutType, setTimeoutType] =
    useState<TimeoutOptions['timeoutType']>('post_creation');
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(24); // Default to 24 hours
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomDuration = selectedPreset === 0;
  const totalHours = isCustomDuration
    ? customDays * 24 + customHours + customMinutes / 60
    : selectedPreset;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!reason.trim()) {
        setError('Please provide a reason for the timeout');
        return;
      }

      if (totalHours <= 0) {
        setError('Duration must be greater than 0');
        return;
      }

      if (totalHours > 8760) {
        // 1 year max
        setError('Duration cannot exceed 1 year (8760 hours)');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const options: TimeoutOptions = {
          timeoutType,
          reason: reason.trim(),
          durationHours: totalHours,
          ...(isCustomDuration && {
            customDuration: {
              days: customDays,
              hours: customHours,
              minutes: customMinutes
            }
          })
        };

        await onTimeout(user.id, options);
        handleClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to issue timeout'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user.id,
      timeoutType,
      reason,
      totalHours,
      isCustomDuration,
      customDays,
      customHours,
      customMinutes,
      onTimeout
    ]
  );

  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    // Reset form
    setTimeoutType('post_creation');
    setReason('');
    setSelectedPreset(24);
    setCustomDays(0);
    setCustomHours(1);
    setCustomMinutes(0);
    setError(null);
    onClose();
  }, [isSubmitting, onClose]);

  const formatDuration = useCallback(() => {
    if (totalHours <= 0) return 'Invalid duration';

    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.round((totalHours % 1) * 60);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0 && days === 0)
      parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 minutes';
  }, [totalHours]);

  if (!isOpen) return null;

  return (
    <div className="timeout-modal-overlay" onClick={handleClose}>
      <div className="timeout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="timeout-modal__header">
          <h2 className="timeout-modal__title">Issue Timeout</h2>
          <button
            type="button"
            className="timeout-modal__close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="timeout-modal__user-info">
          <strong>User:</strong> {user.name || 'Unknown'} ({user.email})
        </div>

        <form onSubmit={handleSubmit} className="timeout-modal__form">
          {/* Timeout Type */}
          <div className="timeout-modal__field">
            <label className="timeout-modal__label">
              Timeout Type <span className="required">*</span>
            </label>
            <div className="timeout-modal__radio-group">
              {TIMEOUT_TYPES.map((type) => (
                <label key={type.value} className="timeout-modal__radio-item">
                  <input
                    type="radio"
                    name="timeoutType"
                    value={type.value}
                    checked={timeoutType === type.value}
                    onChange={(e) =>
                      setTimeoutType(
                        e.target.value as TimeoutOptions['timeoutType']
                      )
                    }
                    disabled={isSubmitting}
                  />
                  <div className="timeout-modal__radio-content">
                    <div className="timeout-modal__radio-label">
                      {type.label}
                    </div>
                    <div className="timeout-modal__radio-description">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="timeout-modal__field">
            <label className="timeout-modal__label">
              Duration <span className="required">*</span>
            </label>
            <div className="timeout-modal__duration-presets">
              {TIMEOUT_PRESETS.map((preset) => (
                <button
                  key={preset.hours}
                  type="button"
                  className={`timeout-modal__preset ${selectedPreset === preset.hours ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(preset.hours)}
                  disabled={isSubmitting}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {isCustomDuration && (
              <div className="timeout-modal__custom-duration">
                <div className="timeout-modal__duration-inputs">
                  <div className="timeout-modal__duration-input">
                    <label>Days</label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={customDays}
                      onChange={(e) =>
                        setCustomDays(parseInt(e.target.value) || 0)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="timeout-modal__duration-input">
                    <label>Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={customHours}
                      onChange={(e) =>
                        setCustomHours(parseInt(e.target.value) || 0)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="timeout-modal__duration-input">
                    <label>Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) =>
                        setCustomMinutes(parseInt(e.target.value) || 0)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="timeout-modal__duration-preview">
              <strong>Total Duration:</strong> {formatDuration()}
              {totalHours > 0 && (
                <span className="timeout-modal__expires">
                  {' '}
                  (Expires:{' '}
                  {new Date(
                    Date.now() + totalHours * 60 * 60 * 1000
                  ).toLocaleString()}
                  )
                </span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="timeout-modal__field">
            <label className="timeout-modal__label" htmlFor="timeout-reason">
              Reason <span className="required">*</span>
            </label>
            <div className="timeout-modal__reason-presets">
              {COMMON_REASONS.map((commonReason) => (
                <button
                  key={commonReason}
                  type="button"
                  className="timeout-modal__reason-preset"
                  onClick={() => setReason(commonReason)}
                  disabled={isSubmitting}
                >
                  {commonReason}
                </button>
              ))}
            </div>
            <textarea
              id="timeout-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this timeout..."
              rows={3}
              className="timeout-modal__textarea"
              disabled={isSubmitting}
              required
            />
          </div>

          {error && <div className="timeout-modal__error">{error}</div>}

          <div className="timeout-modal__actions">
            <button
              type="button"
              onClick={handleClose}
              className="timeout-modal__cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="timeout-modal__submit"
              disabled={isSubmitting || !reason.trim() || totalHours <= 0}
            >
              {isSubmitting ? 'Issuing Timeout...' : 'Issue Timeout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
