'use client';

import React, { useState } from 'react';
import { Submission } from '../../components/submission-forms/schema';
import { SubmissionItem } from '../../components/submissions-list/SubmissionItem';
import { SubmissionWithReplies } from '../../components/submissions-list/types';
import './AdminSubmissionItem.css';
import { AdminUserTooltip } from './AdminUserTooltip';

interface AdminSubmissionItemProps {
  submission: SubmissionWithReplies;
  onTagClick: (tag: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  onSubmissionUpdate?: () => void;
  contextId: string;
  optimisticUpdateSubmission?: (
    submissionId: number,
    updatedSubmission: Submission
  ) => void;
  optimisticRemoveSubmission?: (submissionId: number) => void;
  onRefresh?: () => void;
}

export function AdminSubmissionItem(props: AdminSubmissionItemProps) {
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  // Handle timeout user
  const handleTimeoutUser = async (
    userId: number,
    timeoutType: string,
    reason: string,
    durationHours: number
  ) => {
    try {
      const response = await fetch('/api/admin/users/timeout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          timeoutType,
          reason,
          durationHours
        })
      });

      if (response.ok) {
        props.onRefresh?.();
        setShowTimeoutModal(false);
      } else {
        console.error('Failed to timeout user');
      }
    } catch (error) {
      console.error('Error timing out user:', error);
    }
  };

  return (
    <div className="admin-submission-item">
      <div className="admin-submission-item__content">
        <SubmissionItem
          {...props}
          // Override the author component to include admin controls
        />
      </div>

      <div className="admin-submission-item__admin-controls">
        <AdminUserTooltip
          userId={props.submission.user_id}
          username={props.submission.author}
          onTimeoutUser={handleTimeoutUser}
        />
      </div>

      {showTimeoutModal && (
        <TimeoutModal
          userId={props.submission.user_id}
          username={props.submission.author}
          onTimeout={handleTimeoutUser}
          onClose={() => setShowTimeoutModal(false)}
        />
      )}
    </div>
  );
}

// Timeout Modal Component
interface TimeoutModalProps {
  userId: number;
  username: string;
  onTimeout: (
    userId: number,
    timeoutType: string,
    reason: string,
    durationHours: number
  ) => void;
  onClose: () => void;
}

function TimeoutModal({
  userId,
  username,
  onTimeout,
  onClose
}: TimeoutModalProps) {
  const [timeoutType, setTimeoutType] = useState('post_creation');
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(24);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the timeout');
      return;
    }
    onTimeout(userId, timeoutType, reason, durationHours);
  };

  return (
    <div className="timeout-modal-overlay">
      <div className="timeout-modal">
        <div className="timeout-modal__header">
          <h3>Timeout User: {username}</h3>
          <button className="timeout-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="timeout-modal__form">
          <div className="timeout-modal__field">
            <label htmlFor="timeout-type">Timeout Type:</label>
            <select
              id="timeout-type"
              value={timeoutType}
              onChange={(e) => setTimeoutType(e.target.value)}
            >
              <option value="post_creation">Post Creation</option>
              <option value="comment_creation">Comment Creation</option>
              <option value="full_access">Full Access</option>
            </select>
          </div>

          <div className="timeout-modal__field">
            <label htmlFor="duration">Duration (hours):</label>
            <input
              type="number"
              id="duration"
              min="1"
              max="8760"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
            />
          </div>

          <div className="timeout-modal__field">
            <label htmlFor="reason">Reason:</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for this timeout..."
              rows={3}
              required
            />
          </div>

          <div className="timeout-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="timeout-modal__cancel"
            >
              Cancel
            </button>
            <button type="submit" className="timeout-modal__submit">
              Issue Timeout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
