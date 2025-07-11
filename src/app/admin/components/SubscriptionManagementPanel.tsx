'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOverlay } from '../../../lib/context/OverlayContext';
import { AssignSubscriptionModal } from './modals/AssignSubscriptionModal';
import { EditPlanModal } from './modals/EditPlanModal';
import { EditSubscriptionModal } from './modals/EditSubscriptionModal';
import './SubscriptionManagementPanel.css';

// ================================
// TYPES & INTERFACES
// ================================

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  price_monthly_cents?: number;
  price_yearly_cents?: number;
  price_lifetime_cents?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status:
    | 'active'
    | 'cancelled'
    | 'expired'
    | 'suspended'
    | 'pending'
    | 'trialing';
  billing_cycle?: string;
  expires_at?: string;
  trial_ends_at?: string;
  assigned_by?: string;
  assignment_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  plan_name: string;
  plan_display_name: string;
  user_name?: string;
  user_email?: string;
  assigned_by_name?: string;
}

interface SubscriptionStats {
  total_plans: number;
  active_plans: number;
  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  expired_subscriptions: number;
  revenue_monthly_cents: number;
  revenue_yearly_cents: number;
  plan_distribution: Array<{
    plan_name: string;
    plan_display_name: string;
    subscriber_count: number;
    revenue_monthly_cents: number;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

type TabType = 'overview' | 'plans' | 'subscriptions' | 'analytics';

export default function SubscriptionManagementPanel() {
  // ================================
  // STATE MANAGEMENT
  // ================================

  const { openOverlay, closeOverlay } = useOverlay();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [userSubscriptions, setUserSubscriptions] = useState<
    UserSubscription[]
  >([]);
  const [subscriptionStats, setSubscriptionStats] =
    useState<SubscriptionStats | null>(null);

  // Modal states - keeping for backwards compatibility with other modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Subscription filtering and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // ================================
  // DATA FETCHING
  // ================================

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Subscription system not available');
        }
        throw new Error(
          `Failed to fetch subscription plans: ${response.status}`
        );
      }
      const plans = await response.json();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch subscription plans'
      );
    }
  }, []);

  const fetchUserSubscriptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/user-subscriptions');
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Subscription system not available');
        }
        throw new Error(
          `Failed to fetch user subscriptions: ${response.status}`
        );
      }
      const subscriptions = await response.json();
      setUserSubscriptions(subscriptions);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch user subscriptions'
      );
    }
  }, []);

  const fetchSubscriptionStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscription-stats');
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Subscription system not available');
        }
        throw new Error(
          `Failed to fetch subscription stats: ${response.status}`
        );
      }
      const stats = await response.json();
      setSubscriptionStats(stats);
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch subscription stats'
      );
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSubscriptionPlans(),
        fetchUserSubscriptions(),
        fetchSubscriptionStats()
      ]);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptionPlans, fetchUserSubscriptions, fetchSubscriptionStats]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ================================
  // HELPER FUNCTIONS
  // ================================

  const formatPrice = (cents?: number) => {
    if (!cents || cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Active', className: 'status-badge--success' },
      trialing: { label: 'Trial', className: 'status-badge--info' },
      cancelled: { label: 'Cancelled', className: 'status-badge--warning' },
      expired: { label: 'Expired', className: 'status-badge--danger' },
      suspended: { label: 'Suspended', className: 'status-badge--danger' },
      pending: { label: 'Pending', className: 'status-badge--secondary' }
    };

    const config = statusMap[status as keyof typeof statusMap] || {
      label: status,
      className: 'status-badge--secondary'
    };
    return (
      <span className={`status-badge ${config.className}`}>{config.label}</span>
    );
  };

  // ================================
  // EVENT HANDLERS
  // ================================

  const handleCreatePlan = () => {
    // TODO: Implement create plan modal
    alert('Create Plan functionality coming soon!');
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    const modalId = `edit-plan-modal-${plan.id}`;

    openOverlay({
      id: modalId,
      type: 'modal',
      component: EditPlanModal,
      props: {
        plan,
        onSave: async (planId: string, updates: Partial<SubscriptionPlan>) => {
          try {
            const response = await fetch(
              `/api/admin/subscription-plans/${planId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to update plan');
            }

            // Refresh plans data
            await fetchAllData();
          } catch (error) {
            console.error('Error updating plan:', error);
            throw error; // Re-throw to show in modal
          }
        }
      }
    });
  };

  const handleSavePlan = async (
    planId: string,
    updates: Partial<SubscriptionPlan>
  ) => {
    try {
      const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update plan');
      }

      // Refresh plans data
      await fetchAllData();
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error; // Re-throw to show in modal
    }
  };

  const handleTogglePlan = async (plan: SubscriptionPlan) => {
    try {
      const newStatus = !plan.is_active;
      const response = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus ? 'enable' : 'disable'} plan`);
      }

      // Refresh plans data
      await fetchAllData();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update plan status'
      );
    }
  };

  const handleAssignSubscription = async (
    planId: string,
    billingCycle: string,
    expiresAt?: string,
    reason?: string
  ) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}/assign-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planId: parseInt(planId),
            billingCycle,
            expiresAt,
            reason
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign subscription');
      }

      // Refresh data after successful assignment
      await fetchAllData();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error assigning subscription:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to assign subscription'
      );
    }
  };

  const handleEditSubscription = (subscription: UserSubscription) => {
    const modalId = `edit-subscription-modal-${subscription.id}`;

    openOverlay({
      id: modalId,
      type: 'modal',
      component: EditSubscriptionModal,
      props: {
        subscription,
        onSave: async (
          subscriptionId: string,
          updates: Partial<UserSubscription>
        ) => {
          try {
            const response = await fetch(
              `/api/admin/user-subscriptions/${subscriptionId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Failed to update subscription'
              );
            }

            // Refresh subscriptions data
            await fetchAllData();
          } catch (error) {
            console.error('Error updating subscription:', error);
            throw error; // Re-throw to show in modal
          }
        }
      }
    });
  };

  const handleCancelSubscription = async (subscription: UserSubscription) => {
    if (
      !confirm(
        `Are you sure you want to cancel the subscription for ${subscription.user_name || subscription.user_email}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/user-subscriptions/${subscription.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscriptions data
      await fetchAllData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to cancel subscription'
      );
    }
  };

  // ================================
  // SUBSCRIPTION FILTERING & PAGINATION
  // ================================

  const filteredSubscriptions = userSubscriptions.filter((subscription) => {
    const matchesSearch =
      !searchTerm ||
      subscription.user_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      subscription.user_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      subscription.plan_display_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || subscription.status === statusFilter;
    const matchesPlan =
      planFilter === 'all' || subscription.plan_name === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ================================
  // RENDER FUNCTIONS
  // ================================

  const renderOverview = () => {
    if (!subscriptionStats) return <div>Loading stats...</div>;

    return (
      <div className="subscription-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>📋 Total Plans</h3>
            <div className="stat-value">{subscriptionStats.total_plans}</div>
            <div className="stat-subtitle">
              {subscriptionStats.active_plans} active
            </div>
          </div>

          <div className="stat-card">
            <h3>👥 Total Subscriptions</h3>
            <div className="stat-value">
              {subscriptionStats.total_subscriptions}
            </div>
            <div className="stat-subtitle">
              {subscriptionStats.active_subscriptions} active
            </div>
          </div>

          <div className="stat-card">
            <h3>🚀 Trial Users</h3>
            <div className="stat-value">
              {subscriptionStats.trialing_subscriptions}
            </div>
            <div className="stat-subtitle">Currently trialing</div>
          </div>

          <div className="stat-card">
            <h3>💰 Monthly Revenue</h3>
            <div className="stat-value">
              {formatPrice(subscriptionStats.revenue_monthly_cents)}
            </div>
            <div className="stat-subtitle">Recurring monthly</div>
          </div>
        </div>

        <div className="plan-distribution">
          <h3>📊 Plan Distribution</h3>
          <div className="distribution-list">
            {subscriptionStats.plan_distribution.map((plan) => (
              <div key={plan.plan_name} className="distribution-item">
                <div className="distribution-info">
                  <span className="plan-name">{plan.plan_display_name}</span>
                  <span className="subscriber-count">
                    {plan.subscriber_count} subscribers
                  </span>
                </div>
                <div className="distribution-revenue">
                  {formatPrice(plan.revenue_monthly_cents)}/mo
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPlans = () => (
    <div className="subscription-plans">
      <div className="plans-header">
        <h3>📋 Subscription Plans</h3>
        <button className="btn btn-primary" onClick={handleCreatePlan}>
          ➕ Create New Plan
        </button>
      </div>

      <div className="plans-grid">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${!plan.is_active ? 'plan-card--inactive' : ''}`}
          >
            <div className="plan-header">
              <h4>{plan.display_name}</h4>
              <span className={`plan-type plan-type--${plan.plan_type}`}>
                {plan.plan_type}
              </span>
            </div>

            <div className="plan-pricing">
              {plan.price_monthly_cents ? (
                <div className="pricing-options">
                  <div className="price-option">
                    <span className="price">
                      {formatPrice(plan.price_monthly_cents)}
                    </span>
                    <span className="period">/month</span>
                  </div>
                  {plan.price_yearly_cents && (
                    <div className="price-option">
                      <span className="price">
                        {formatPrice(plan.price_yearly_cents)}
                      </span>
                      <span className="period">/year</span>
                    </div>
                  )}
                  {plan.price_lifetime_cents && (
                    <div className="price-option">
                      <span className="price">
                        {formatPrice(plan.price_lifetime_cents)}
                      </span>
                      <span className="period">lifetime</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="price-free">Free</div>
              )}
            </div>

            {plan.description && (
              <div className="plan-description">{plan.description}</div>
            )}

            <div className="plan-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleEditPlan(plan)}
              >
                ✏️ Edit
              </button>
              <button
                className={`btn btn-sm ${plan.is_active ? 'btn-danger' : 'btn-success'}`}
                onClick={() => handleTogglePlan(plan)}
              >
                {plan.is_active ? '🚫 Disable' : '✅ Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="user-subscriptions">
      <div className="subscriptions-header">
        <h3>👥 User Subscriptions</h3>
        <div className="subscriptions-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAssignModal(true)}
          >
            ➕ Assign Subscription
          </button>
        </div>
      </div>

      <div className="subscriptions-filters">
        <input
          type="text"
          placeholder="Search users or plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Plans</option>
          {subscriptionPlans.map((plan) => (
            <option key={plan.id} value={plan.name}>
              {plan.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="subscriptions-table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Billing</th>
              <th>Expires</th>
              <th>Assigned By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">
                      {subscription.user_name || 'Unknown User'}
                    </div>
                    <div className="user-email">{subscription.user_email}</div>
                  </div>
                </td>
                <td>
                  <div className="plan-info">
                    <div className="plan-name">
                      {subscription.plan_display_name}
                    </div>
                    <div className="plan-type">({subscription.plan_name})</div>
                  </div>
                </td>
                <td>{getStatusBadge(subscription.status)}</td>
                <td>{subscription.billing_cycle || 'N/A'}</td>
                <td>
                  {subscription.expires_at
                    ? formatDate(subscription.expires_at)
                    : 'Never'}
                </td>
                <td>{subscription.assigned_by_name || 'System'}</td>
                <td>
                  <div className="subscription-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditSubscription(subscription)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleCancelSubscription(subscription)}
                    >
                      🚫 Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary btn-sm"
          >
            ← Previous
          </button>

          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({filteredSubscriptions.length}{' '}
            total)
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="subscription-analytics">
      <h3>📈 Analytics</h3>
      <div className="analytics-placeholder">
        <p>📊 Advanced subscription analytics coming soon...</p>
        <ul>
          <li>📈 Revenue trends and forecasting</li>
          <li>👥 User acquisition and churn analysis</li>
          <li>🔄 Conversion funnel metrics</li>
          <li>💡 Plan performance insights</li>
          <li>📋 Custom reports and exports</li>
        </ul>
      </div>
    </div>
  );

  // ================================
  // MAIN RENDER
  // ================================

  if (loading) {
    return (
      <div className="subscription-management-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('not available')) {
    return (
      <div className="subscription-management-panel">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Subscription System Not Available</h3>
          <p>The subscription system is not configured or available.</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-management-panel">
      <div className="panel-header">
        <h2>💳 Subscription Management</h2>
        <p>
          Manage subscription plans, user subscriptions, and analytics with
          quota system integration
        </p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'plans' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          📋 Plans
        </button>
        <button
          className={`tab-button ${activeTab === 'subscriptions' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          👥 Subscriptions
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'tab-button--active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'plans' && renderPlans()}
        {activeTab === 'subscriptions' && renderSubscriptions()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignSubscriptionModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedUser(null);
          }}
          onAssign={handleAssignSubscription}
          userName={selectedUser?.name || ''}
          userId={selectedUser?.id || ''}
        />
      )}
    </div>
  );
}
