'use client';

import React, { useEffect, useState } from 'react';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

export interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (
    roleId: string,
    expiresAt?: string,
    reason?: string
  ) => Promise<void>;
  userName: string;
  userId: string;
  currentRoles?: Role[];
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  userName,
  userId,
  currentRoles = []
}) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available roles
  useEffect(() => {
    if (isOpen) {
      loadAvailableRoles();
    }
  }, [isOpen]);

  const loadAvailableRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const roles = await response.json();
        // Filter out roles the user already has
        const currentRoleIds = currentRoles.map((r) => r.id);
        const filteredRoles = roles.filter(
          (role: Role) => !currentRoleIds.includes(role.id)
        );
        setAvailableRoles(filteredRoles);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await onAssign(selectedRole, expiresAt || undefined, reason || undefined);
      handleClose();
    } catch (error) {
      console.error('Failed to assign role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedRole('');
    setExpiresAt('');
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <div>
            <h3>🎭 Assign Role to {userName}</h3>
            <p
              style={{
                margin: '4px 0 0 0',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}
            >
              ID: {userId}
            </p>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2rem'
                }}
              >
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Role Selection */}
                <div className="form-group">
                  <label htmlFor="role-select">Role *</label>
                  <select
                    id="role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                    className="admin-select"
                  >
                    <option value="">Select a role...</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.display_name} ({role.name})
                      </option>
                    ))}
                  </select>
                  {availableRoles.length === 0 && !loading && (
                    <div className="form-help">
                      No additional roles available for this user.
                    </div>
                  )}
                </div>

                {/* Role Description */}
                {selectedRole && (
                  <div
                    style={{
                      padding: '12px',
                      background: 'var(--light-background--secondary)',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <strong>Role Description:</strong>
                    <br />
                    {availableRoles.find((r) => r.id === selectedRole)
                      ?.description || 'No description available.'}
                  </div>
                )}

                {/* Expiration Date */}
                <div className="form-group">
                  <label htmlFor="expires-at">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    id="expires-at"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid var(--light-background--tertiary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  />
                  <div className="form-help">
                    Leave empty for permanent role assignment.
                  </div>
                </div>

                {/* Reason */}
                <div className="form-group">
                  <label htmlFor="reason">Reason (Optional)</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for role assignment..."
                    rows={3}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid var(--light-background--tertiary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Current Roles Display */}
                {currentRoles.length > 0 && (
                  <div>
                    <label style={{ marginBottom: '8px', display: 'block' }}>
                      Current Roles:
                    </label>
                    <div
                      style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
                    >
                      {currentRoles.map((role) => (
                        <span key={role.id} className="role-badge">
                          {role.display_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!selectedRole || isSubmitting || loading}
              >
                {isSubmitting ? '🔄 Assigning...' : '🎭 Assign Role'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
