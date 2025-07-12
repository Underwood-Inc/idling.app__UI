'use client';

import React from 'react';
import { InteractiveTooltip } from '../../components/tooltip/InteractiveTooltip';
import './AlertStatusTooltip.css';

export interface AlertStatusTooltipProps {
  type: 'active' | 'published';
  isActive?: boolean;
  isPublished?: boolean;
  children: React.ReactNode;
}

interface StatusInfo {
  title: string;
  description: string;
  icon: string;
  purpose: string;
  examples: string[];
  currentState?: {
    status: string;
    meaning: string;
    color: 'success' | 'warning' | 'danger' | 'info';
  };
}

const getStatusInfo = (
  type: 'active' | 'published',
  isActive?: boolean,
  isPublished?: boolean
): StatusInfo => {
  const baseInfo = {
    active: {
      title: 'Active Status',
      description: 'Internal system control for alert functionality',
      icon: '🔧',
      purpose: 'Technical enable/disable switch for administrators',
      examples: [
        'Temporarily disable during maintenance',
        'Keep draft alerts ready but not live',
        'Emergency pause without losing settings',
        'System-level control independent of publishing'
      ]
    },
    published: {
      title: 'Published Status',
      description: 'Public visibility control for end users',
      icon: '📢',
      purpose: 'Editorial control over what users can see',
      examples: [
        'Draft → Review → Publish workflow',
        'Content approval process',
        'Scheduled publishing preparation',
        'Public-facing visibility toggle'
      ]
    }
  };

  const info = baseInfo[type];

  // Add current state information if values are provided
  let currentState;
  if (isActive !== undefined && isPublished !== undefined) {
    if (type === 'active') {
      currentState = {
        status: isActive ? 'Active' : 'Inactive',
        meaning: isActive
          ? 'System is ready to process this alert'
          : 'System will ignore this alert completely',
        color: isActive ? 'success' : 'danger'
      } as const;
    } else {
      currentState = {
        status: isPublished ? 'Published' : 'Draft',
        meaning: isPublished
          ? 'Users can see this alert (if also active)'
          : 'Hidden from users, in draft mode',
        color: isPublished ? 'success' : 'warning'
      } as const;
    }
  }

  return { ...info, currentState };
};

const AlertStatusTooltipContent: React.FC<{
  info: StatusInfo;
  type: 'active' | 'published';
  isActive?: boolean;
  isPublished?: boolean;
}> = ({ info, type, isActive, isPublished }) => {
  const showVisibilityMatrix =
    isActive !== undefined && isPublished !== undefined;

  return (
    <div className="alert-status-tooltip">
      <div className="alert-status-tooltip__header">
        <span className="alert-status-tooltip__icon">{info.icon}</span>
        <h4 className="alert-status-tooltip__title">{info.title}</h4>
      </div>

      <p className="alert-status-tooltip__description">{info.description}</p>

      {info.currentState && (
        <div
          className={`alert-status-tooltip__current alert-status-tooltip__current--${info.currentState.color}`}
        >
          <strong>Current State:</strong> {info.currentState.status}
          <br />
          <span className="alert-status-tooltip__meaning">
            {info.currentState.meaning}
          </span>
        </div>
      )}

      <div className="alert-status-tooltip__purpose">
        <strong>Purpose:</strong> {info.purpose}
      </div>

      <div className="alert-status-tooltip__examples">
        <strong>Use Cases:</strong>
        <ul>
          {info.examples.map((example, index) => (
            <li key={index}>{example}</li>
          ))}
        </ul>
      </div>

      {showVisibilityMatrix && (
        <div className="alert-status-tooltip__matrix">
          <strong>Visibility Matrix:</strong>
          <div className="alert-status-tooltip__matrix-grid">
            <div
              className={`alert-status-tooltip__matrix-item ${
                !isActive && !isPublished
                  ? 'alert-status-tooltip__matrix-item--current'
                  : ''
              }`}
            >
              <span className="alert-status-tooltip__matrix-status">❌ ❌</span>
              <span className="alert-status-tooltip__matrix-label">
                Disabled Draft
              </span>
              <span className="alert-status-tooltip__matrix-result">
                Hidden
              </span>
            </div>
            <div
              className={`alert-status-tooltip__matrix-item ${
                isActive && !isPublished
                  ? 'alert-status-tooltip__matrix-item--current'
                  : ''
              }`}
            >
              <span className="alert-status-tooltip__matrix-status">✅ ❌</span>
              <span className="alert-status-tooltip__matrix-label">
                Active Draft
              </span>
              <span className="alert-status-tooltip__matrix-result">
                Hidden
              </span>
            </div>
            <div
              className={`alert-status-tooltip__matrix-item ${
                !isActive && isPublished
                  ? 'alert-status-tooltip__matrix-item--current'
                  : ''
              }`}
            >
              <span className="alert-status-tooltip__matrix-status">❌ ✅</span>
              <span className="alert-status-tooltip__matrix-label">
                Published Inactive
              </span>
              <span className="alert-status-tooltip__matrix-result">
                Hidden
              </span>
            </div>
            <div
              className={`alert-status-tooltip__matrix-item ${
                isActive && isPublished
                  ? 'alert-status-tooltip__matrix-item--current'
                  : ''
              }`}
            >
              <span className="alert-status-tooltip__matrix-status">✅ ✅</span>
              <span className="alert-status-tooltip__matrix-label">Live</span>
              <span className="alert-status-tooltip__matrix-result">
                🟢 Visible
              </span>
            </div>
          </div>
          <div className="alert-status-tooltip__matrix-legend">
            <span>Active | Published</span>
          </div>
        </div>
      )}

      <div className="alert-status-tooltip__key-point">
        <strong>💡 Key Point:</strong>{' '}
        {type === 'active'
          ? 'Active controls system functionality - Published controls user visibility'
          : 'Published controls user visibility - Active controls system functionality'}
      </div>
    </div>
  );
};

export const AlertStatusTooltip: React.FC<AlertStatusTooltipProps> = ({
  type,
  isActive,
  isPublished,
  children
}) => {
  const info = getStatusInfo(type, isActive, isPublished);

  return (
    <InteractiveTooltip
      content={
        <AlertStatusTooltipContent
          info={info}
          type={type}
          isActive={isActive}
          isPublished={isPublished}
        />
      }
      delay={200}
      className="alert-status-tooltip-wrapper"
    >
      {children}
    </InteractiveTooltip>
  );
};
