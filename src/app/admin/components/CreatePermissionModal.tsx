'use client';

/**
 * Create Permission Modal
 * Professional modal for creating new permissions with comprehensive validation
 *
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import './CreatePermissionModal.css';

// ================================
// TYPES & SCHEMAS
// ================================

const PermissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Only letters, numbers, underscore, dot, and dash allowed'
    ),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(200, 'Display name must be less than 200 characters'),
  description: z.string().optional(),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  is_inheritable: z.boolean(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  dependencies: z.array(z.string()).optional(),
  reason: z.string().optional()
});

type PermissionFormData = z.infer<typeof PermissionSchema>;

interface CreatePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCategories?: string[];
  existingPermissions?: Array<{
    id: number;
    name: string;
    display_name: string;
  }>;
}

// ================================
// MAIN COMPONENT
// ================================

export default function CreatePermissionModal({
  isOpen,
  onClose,
  onSuccess,
  existingCategories = [],
  existingPermissions = []
}: CreatePermissionModalProps) {
  // ================================
  // STATE
  // ================================

  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    display_name: '',
    description: '',
    category: '',
    is_inheritable: false,
    risk_level: 'low',
    dependencies: [],
    reason: ''
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof PermissionFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ================================
  // EFFECTS
  // ================================

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        name: '',
        display_name: '',
        description: '',
        category: '',
        is_inheritable: false,
        risk_level: 'low',
        dependencies: [],
        reason: ''
      });
      setErrors({});
      setShowAdvanced(false);
    }
  }, [isOpen]);

  // ================================
  // HANDLERS
  // ================================

  const handleInputChange = (field: keyof PermissionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Auto-generate name from display_name if name is empty
    if (field === 'display_name' && !formData.name) {
      const autoName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      setFormData((prev) => ({ ...prev, name: autoName }));
    }
  };

  const handleDependencyAdd = (permissionName: string) => {
    if (permissionName && !formData.dependencies?.includes(permissionName)) {
      setFormData((prev) => ({
        ...prev,
        dependencies: [...(prev.dependencies || []), permissionName]
      }));
    }
  };

  const handleDependencyRemove = (permissionName: string) => {
    setFormData((prev) => ({
      ...prev,
      dependencies:
        prev.dependencies?.filter((dep) => dep !== permissionName) || []
    }));
  };

  const validateForm = (): boolean => {
    try {
      PermissionSchema.parse(formData);

      // Check for duplicate names
      const nameExists = existingPermissions.some(
        (p) => p.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (nameExists) {
        setErrors({ name: 'Permission name already exists' });
        return false;
      }

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof PermissionFormData, string>> =
          {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof PermissionFormData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create permission');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating permission:', error);
      setErrors({
        name:
          error instanceof Error ? error.message : 'Failed to create permission'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // ================================
  // RENDER HELPERS
  // ================================

  const renderRiskLevelOption = (
    level: string,
    description: string,
    color: string
  ) => (
    <label
      key={level}
      className={`risk-option ${formData.risk_level === level ? 'risk-option--selected' : ''}`}
    >
      <input
        type="radio"
        name="risk_level"
        value={level}
        checked={formData.risk_level === level}
        onChange={(e) => handleInputChange('risk_level', e.target.value)}
        className="risk-radio"
      />
      <div className="risk-content">
        <div
          className="risk-indicator"
          style={{ backgroundColor: color }}
        ></div>
        <div className="risk-text">
          <span className="risk-level-name">
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
          <span className="risk-description">{description}</span>
        </div>
      </div>
    </label>
  );

  // ================================
  // MAIN RENDER
  // ================================

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="title-icon">🛡️</span>
            Create New Permission
          </h2>
          <button
            onClick={handleClose}
            className="close-button"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Display Name *
                  <span className="field-hint">
                    User-friendly name for the permission
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) =>
                    handleInputChange('display_name', e.target.value)
                  }
                  className={`form-input ${errors.display_name ? 'form-input--error' : ''}`}
                  placeholder="e.g., Manage Users"
                  disabled={loading}
                />
                {errors.display_name && (
                  <span className="form-error">{errors.display_name}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  System Name *
                  <span className="field-hint">
                    Internal identifier (auto-generated)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  placeholder="e.g., admin.users.manage"
                  disabled={loading}
                />
                {errors.name && (
                  <span className="form-error">{errors.name}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Description
                <span className="field-hint">
                  Detailed explanation of what this permission allows
                </span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className="form-textarea"
                placeholder="Describe what this permission allows users to do..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Category *
                  <span className="field-hint">
                    Permission category for organization
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange('category', e.target.value)
                  }
                  className={`form-input ${errors.category ? 'form-input--error' : ''}`}
                  placeholder="e.g., User Management"
                  list="categories"
                  disabled={loading}
                />
                <datalist id="categories">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && (
                  <span className="form-error">{errors.category}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_inheritable}
                    onChange={(e) =>
                      handleInputChange('is_inheritable', e.target.checked)
                    }
                    className="form-checkbox"
                    disabled={loading}
                  />
                  <span className="checkbox-text">
                    Inheritable Permission
                    <span className="field-hint">
                      Child roles automatically inherit this permission
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Risk Assessment</h3>
            <div className="risk-levels">
              {renderRiskLevelOption(
                'low',
                'Minimal impact on system security',
                '#10b981'
              )}
              {renderRiskLevelOption(
                'medium',
                'Moderate impact on system security',
                '#f59e0b'
              )}
              {renderRiskLevelOption(
                'high',
                'Significant impact on system security',
                '#f97316'
              )}
              {renderRiskLevelOption(
                'critical',
                'Critical impact on system security',
                '#ef4444'
              )}
            </div>
            {errors.risk_level && (
              <span className="form-error">{errors.risk_level}</span>
            )}
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Advanced Options</h3>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="toggle-button"
                disabled={loading}
              >
                {showAdvanced ? '↑ Hide' : '↓ Show'}
              </button>
            </div>

            {showAdvanced && (
              <div className="advanced-options">
                <div className="form-group">
                  <label className="form-label">
                    Dependencies
                    <span className="field-hint">
                      Permissions that must be granted first
                    </span>
                  </label>

                  <div className="dependencies-section">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleDependencyAdd(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="form-select"
                      disabled={loading}
                    >
                      <option value="">Select a dependency...</option>
                      {existingPermissions
                        .filter(
                          (p) =>
                            p.name !== formData.name &&
                            !formData.dependencies?.includes(p.name)
                        )
                        .map((permission) => (
                          <option key={permission.id} value={permission.name}>
                            {permission.display_name} ({permission.name})
                          </option>
                        ))}
                    </select>

                    {formData.dependencies &&
                      formData.dependencies.length > 0 && (
                        <div className="dependency-list">
                          {formData.dependencies.map((dep) => (
                            <div key={dep} className="dependency-item">
                              <span className="dependency-name">{dep}</span>
                              <button
                                type="button"
                                onClick={() => handleDependencyRemove(dep)}
                                className="dependency-remove"
                                disabled={loading}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Reason for Creation
                    <span className="field-hint">
                      Why is this permission being created?
                    </span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      handleInputChange('reason', e.target.value)
                    }
                    className="form-textarea"
                    placeholder="Explain the business need or requirement..."
                    rows={2}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="submit-icon">✨</span>
                  Create Permission
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
