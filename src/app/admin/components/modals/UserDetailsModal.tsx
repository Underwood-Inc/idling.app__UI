'use client';

import React, { useState } from 'react';
import { Avatar } from '../../../components/avatar/Avatar';

interface UserRole {
  id: string;
  name: string;
  display_name: string;
  assigned_at: string;
  expires_at?: string | null;
  reason?: string | null;
}

interface UserSubscription {
  id: string;
  service_name: string;
  plan_name: string;
  status: string;
  expires_at: string | null;
}

interface UserTimeout {
  id: string;
  reason: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at: string;
  provider_name?: string | null;
  is_timed_out?: boolean;
  active_timeout_id?: number | null;
  active_timeout_reason?: string | null;
  timeout_expires?: string | null;
  profile_public?: boolean;
  bio?: string | null;
  location?: string | null;
  role_names?: string | null;
  has_admin?: boolean;
  has_moderator?: boolean;
  roles?: UserRole[];
  subscriptions?: UserSubscription[];
  timeouts?: UserTimeout[];
}

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClose = () => {
    // Reset image error state when closing modal
    setImageError(false);
    onClose();
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (user.is_timed_out) {
      return <span className="timeout-status active">⏰ Timed Out</span>;
    }
    return <span className="status-badge active">✅ Active</span>;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content modal-content--large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-user-info">
            <div className="modal-user-avatars">
              {/* Provider account image */}
              {user.image && !imageError && (
                <img
                  src={user.image}
                  alt="Provider avatar"
                  className="modal-provider-avatar"
                  onError={handleImageError}
                />
              )}
              {/* Seeded avatar */}
              <Avatar seed={user.id} size="lg" />
            </div>
            <div className="modal-user-details">
              <h3>{user.name || 'Unnamed User'}</h3>
              <p>{user.email}</p>
              <p className="user-id-display">ID: {user.id}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="user-details-grid">
            {/* Basic Information Section */}
            <div className="detail-section">
              <h4>👤 Basic Information</h4>
              <div className="detail-item">
                <label>Status:</label>
                <span>{getStatusBadge()}</span>
              </div>
              <div className="detail-item">
                <label>Name:</label>
                <span>{user.name || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <label>Provider:</label>
                <span>{user.provider_name || 'Not Available'}</span>
              </div>
              <div className="detail-item">
                <label>Joined:</label>
                <span>{formatDate(user.created_at)}</span>
              </div>
              {user.location && (
                <div className="detail-item">
                  <label>Location:</label>
                  <span>{user.location}</span>
                </div>
              )}
              <div className="detail-item">
                <label>Profile Public:</label>
                <span>{user.profile_public ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="detail-section">
                <h4>📝 Bio</h4>
                <div className="bio-content">
                  <p>{user.bio}</p>
                </div>
              </div>
            )}

            {/* Roles Section */}
            <div className="detail-section">
              <h4>🎭 Roles & Permissions</h4>
              <div className="roles-management">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <div key={role.id} className="role-item">
                      <div>
                        <strong>{role.display_name}</strong>
                        <div className="role-date">
                          Assigned: {formatDateOnly(role.assigned_at)}
                          {role.expires_at && (
                            <span>
                              {' '}
                              • Expires: {formatDateOnly(role.expires_at)}
                            </span>
                          )}
                          {role.reason && <span> • Reason: {role.reason}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No roles assigned</div>
                )}
              </div>
            </div>

            {/* Subscriptions Section */}
            <div className="detail-section">
              <h4>💎 Subscriptions</h4>
              <div className="subscriptions-management">
                {user.subscriptions && user.subscriptions.length > 0 ? (
                  user.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="subscription-item">
                      <div>
                        <strong>{subscription.plan_name}</strong>
                        <div className="subscription-meta">
                          <span
                            className={`subscription-status ${subscription.status}`}
                          >
                            {subscription.status.toUpperCase()}
                          </span>
                          <div className="subscription-details">
                            <span>Service: {subscription.service_name}</span>
                            {subscription.expires_at && (
                              <span>
                                Expires:{' '}
                                {formatDateOnly(subscription.expires_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No active subscriptions</div>
                )}
              </div>
            </div>

            {/* Timeout Information */}
            {user.is_timed_out && (
              <div className="detail-section">
                <h4>⏰ Current Timeout</h4>
                <div className="timeout-info-detailed">
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className="timeout-status active">Active</span>
                  </div>
                  {user.active_timeout_reason && (
                    <div className="detail-item">
                      <label>Reason:</label>
                      <span>{user.active_timeout_reason}</span>
                    </div>
                  )}
                  {user.timeout_expires && (
                    <div className="detail-item">
                      <label>Expires:</label>
                      <span>{formatDate(user.timeout_expires)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeout History */}
            {user.timeouts && user.timeouts.length > 0 && (
              <div className="detail-section">
                <h4>📋 Timeout History</h4>
                <div className="timeouts-management">
                  {user.timeouts.map((timeout) => (
                    <div key={timeout.id} className="timeout-item">
                      <div>
                        <strong>{timeout.reason}</strong>
                        <div className="timeout-details">
                          <span
                            className={`timeout-status ${timeout.is_active ? 'active' : 'expired'}`}
                          >
                            {timeout.is_active ? 'Active' : 'Expired'}
                          </span>
                          <div className="timeout-date">
                            Created: {formatDateOnly(timeout.created_at)}
                            <br />
                            Expires: {formatDateOnly(timeout.expires_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
