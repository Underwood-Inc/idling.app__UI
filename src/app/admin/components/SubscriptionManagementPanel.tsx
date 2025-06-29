'use client';

import { useState } from 'react';

export default function SubscriptionManagementPanel() {
  const [loading] = useState(false);

  return (
    <div className="subscription-management-panel">
      <div className="subscription-management-panel__header">
        <h2>Subscription Management</h2>
        <p>Manage subscription plans and user subscriptions</p>
      </div>

      {loading ? (
        <div className="subscription-management-panel__loading">
          Loading subscriptions...
        </div>
      ) : (
        <div className="subscription-management-panel__content">
          <div className="subscription-management-panel__empty">
            <p>Subscription management features coming soon...</p>
            <p className="subscription-management-panel__empty-note">
              This panel will allow you to manage subscription plans and user
              subscriptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
