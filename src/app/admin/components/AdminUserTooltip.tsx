'use client';

import { useEffect, useState } from 'react';
import './AdminUserTooltip.css';

interface AdminUserTooltipProps {
  userId: number;
  username: string;
  onTimeoutUser: (
    userId: number,
    timeoutType: string,
    reason: string,
    durationHours: number
  ) => void;
}

interface TimeoutStatus {
  is_timed_out: boolean;
  expires_at?: string;
  reason?: string;
}

export function AdminUserTooltip({
  userId,
  username,
  onTimeoutUser
}: AdminUserTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTimeoutForm, setShowTimeoutForm] = useState(false);
  const [timeoutStatus, setTimeoutStatus] = useState<TimeoutStatus | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Form state
  const [timeoutType, setTimeoutType] = useState('post_creation');
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(24);

  // Check timeout status when tooltip opens
  useEffect(() => {
    if (showTooltip && !timeoutStatus) {
      checkTimeoutStatus();
    }
  }, [showTooltip]);

  const checkTimeoutStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/timeout?userId=${userId}&type=post_creation`
      );
      if (response.ok) {
        const data = await response.json();
        setTimeoutStatus(data);
      }
    } catch (error) {
      console.error('Error checking timeout status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the timeout');
      return;
    }

    await onTimeoutUser(userId, timeoutType, reason, durationHours);
    setShowTimeoutForm(false);
    setShowTooltip(false);
    // Refresh timeout status
    setTimeoutStatus(null);
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="admin-user-tooltip">
      <button
        className="admin-user-tooltip__trigger"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => !showTimeoutForm && setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        👤 {username}
      </button>

      {showTooltip && (
        <div
          className="admin-user-tooltip__content"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => !showTimeoutForm && setShowTooltip(false)}
        >
          <div className="admin-user-tooltip__header">
            <strong>Admin Controls: {username}</strong>
          </div>

          <div className="admin-user-tooltip__info">
            <div className="admin-user-tooltip__status">
              {loading ? (
                <span>Checking timeout status...</span>
              ) : timeoutStatus?.is_timed_out ? (
                <div className="admin-user-tooltip__timeout-active">
                  <span className="admin-user-tooltip__timeout-indicator">
                    ⏰ Timed Out
                  </span>
                  <div className="admin-user-tooltip__timeout-details">
                    <div>Reason: {timeoutStatus.reason}</div>
                    {timeoutStatus.expires_at && (
                      <div>{formatTimeRemaining(timeoutStatus.expires_at)}</div>
                    )}
                  </div>
                </div>
              ) : (
                <span className="admin-user-tooltip__status-normal">
                  ✅ Normal Status
                </span>
              )}
            </div>
          </div>

          <div className="admin-user-tooltip__actions">
            {!showTimeoutForm ? (
              <button
                className="admin-user-tooltip__timeout-btn"
                onClick={() => setShowTimeoutForm(true)}
                disabled={timeoutStatus?.is_timed_out}
              >
                {timeoutStatus?.is_timed_out
                  ? 'Already Timed Out'
                  : 'Issue Timeout'}
              </button>
            ) : (
              <form
                onSubmit={handleTimeoutSubmit}
                className="admin-user-tooltip__timeout-form"
              >
                <div className="admin-user-tooltip__form-field">
                  <label>Type:</label>
                  <select
                    value={timeoutType}
                    onChange={(e) => setTimeoutType(e.target.value)}
                  >
                    <option value="post_creation">Post Creation</option>
                    <option value="comment_creation">Comment Creation</option>
                    <option value="full_access">Full Access</option>
                  </select>
                </div>

                <div className="admin-user-tooltip__form-field">
                  <label>Duration (hours):</label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  />
                </div>

                <div className="admin-user-tooltip__form-field">
                  <label>Reason:</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for timeout..."
                    rows={2}
                    required
                  />
                </div>

                <div className="admin-user-tooltip__form-actions">
                  <button type="submit" className="admin-user-tooltip__submit">
                    Timeout
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimeoutForm(false)}
                    className="admin-user-tooltip__cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
