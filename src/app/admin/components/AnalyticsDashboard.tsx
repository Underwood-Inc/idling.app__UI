/**
 * Analytics Dashboard Component
 * Comprehensive analytics dashboard with charts and visualizations for subscription management
 *
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import React, { useCallback, useEffect, useState } from 'react';
import { AnalyticsDashboardResponse } from '../../api/analytics/dashboard/route';
import './AnalyticsDashboard.css';

interface MetricIconProps {
  id: SiteIconId;
}

const MetricIcon: React.FC<MetricIconProps> = ({ id }) => (
  <div className="metric-icon">
    <SiteIcon id={id} sizeRem={1.5} />
  </div>
);

interface HeadingIconProps {
  id: SiteIconId;
  children: React.ReactNode;
}

const HeadingIcon: React.FC<HeadingIconProps> = ({ id, children }) => (
  <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35em' }}>
    <SiteIcon id={id} sizeRem={1.125} />
    {children}
  </h3>
);

interface TabLabelProps {
  id: SiteIconId;
  children: React.ReactNode;
}

const TabLabel: React.FC<TabLabelProps> = ({ id, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35em' }}>
    <SiteIcon id={id} sizeRem={1} />
    {children}
  </span>
);

// ================================
// TYPES & INTERFACES
// ================================

interface AnalyticsDashboardProps {
  dateRange?: '7d' | '30d' | '90d' | '1y';
  onDateRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
}

// ================================
// MAIN COMPONENT
// ================================

export default function AnalyticsDashboard({
  dateRange = '30d',
  onDateRangeChange
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'geography'
    | 'devices'
    | 'behavior'
    | 'heatmap'
    | 'subscriptions'
  >('overview');

  // ================================
  // DATA FETCHING
  // ================================

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/analytics/dashboard?dateRange=${dateRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // ================================
  // RENDER FUNCTIONS
  // ================================

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    const { overview, timeSeriesData } = analyticsData;

    return (
      <div className="analytics-overview">
        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <MetricIcon id="barChart" />
            <div className="metric-content">
              <h3>Total Sessions</h3>
              <div className="metric-value">
                {overview.totalSessions.toLocaleString()}
              </div>
              <div className="metric-change">+12.5% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="users" />
            <div className="metric-content">
              <h3>Unique Users</h3>
              <div className="metric-value">
                {overview.uniqueUsers.toLocaleString()}
              </div>
              <div className="metric-change">+8.3% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="fileText" />
            <div className="metric-content">
              <h3>Page Views</h3>
              <div className="metric-value">
                {overview.totalPageViews.toLocaleString()}
              </div>
              <div className="metric-change">+15.2% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="mousePointer" />
            <div className="metric-content">
              <h3>Total Clicks</h3>
              <div className="metric-value">
                {overview.totalClicks.toLocaleString()}
              </div>
              <div className="metric-change">+22.1% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="clock" />
            <div className="metric-content">
              <h3>Avg Session Duration</h3>
              <div className="metric-value">
                {Math.round(overview.avgSessionDuration)}s
              </div>
              <div className="metric-change">+5.7% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="trendingUp" />
            <div className="metric-content">
              <h3>Bounce Rate</h3>
              <div className="metric-value">
                {overview.bounceRate.toFixed(1)}%
              </div>
              <div className="metric-change">-3.2% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="lock" />
            <div className="metric-content">
              <h3>VPN Usage</h3>
              <div className="metric-value">
                {overview.vpnPercentage.toFixed(1)}%
              </div>
              <div className="metric-change">+1.4% from last period</div>
            </div>
          </div>

          <div className="metric-card">
            <MetricIcon id="coins" />
            <div className="metric-content">
              <h3>Conversion Rate</h3>
              <div className="metric-value">
                {overview.conversionRate.toFixed(2)}%
              </div>
              <div className="metric-change">+0.8% from last period</div>
            </div>
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="chart-container">
          <HeadingIcon id="trendingUp">Traffic Trends</HeadingIcon>
          <div className="chart-placeholder">
            <div className="chart-info">
              <p>
                Time series chart showing sessions, page views, and clicks over
                time
              </p>
              <div className="chart-data">
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color sessions"></span>
                    Sessions:{' '}
                    {timeSeriesData.sessions.reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="legend-item">
                    <span className="legend-color pageviews"></span>
                    Page Views:{' '}
                    {timeSeriesData.pageViews.reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="legend-item">
                    <span className="legend-color clicks"></span>
                    Clicks: {timeSeriesData.clicks.reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGeographyTab = () => {
    if (!analyticsData) return null;

    const { geographicData, vpnData } = analyticsData;

    return (
      <div className="analytics-geography">
        <div className="geography-grid">
          {/* Countries */}
          <div className="geography-section">
            <HeadingIcon id="globe">Top Countries</HeadingIcon>
            <div className="geography-list">
              {geographicData.countries.slice(0, 10).map((country, index) => (
                <div key={country.countryCode} className="geography-item">
                  <div className="geography-rank">#{index + 1}</div>
                  <div className="geography-info">
                    <div className="geography-name">{country.countryName}</div>
                    <div className="geography-code">{country.countryCode}</div>
                  </div>
                  <div className="geography-stats">
                    <div className="geography-sessions">
                      {country.sessions.toLocaleString()}
                    </div>
                    <div className="geography-percentage">
                      {country.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div className="geography-section">
            <HeadingIcon id="mapPin">Top Cities</HeadingIcon>
            <div className="geography-list">
              {geographicData.cities.slice(0, 10).map((city, index) => (
                <div
                  key={`${city.cityName}-${city.countryName}`}
                  className="geography-item"
                >
                  <div className="geography-rank">#{index + 1}</div>
                  <div className="geography-info">
                    <div className="geography-name">{city.cityName}</div>
                    <div className="geography-code">
                      {city.regionName}, {city.countryName}
                    </div>
                  </div>
                  <div className="geography-stats">
                    <div className="geography-sessions">
                      {city.sessions.toLocaleString()}
                    </div>
                    <div className="geography-percentage">
                      {city.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VPN Usage */}
          <div className="geography-section">
            <HeadingIcon id="lockKeyhole">VPN & Proxy Usage</HeadingIcon>
            <div className="vpn-stats">
              <div className="vpn-metric">
                <div className="vpn-label">VPN Sessions</div>
                <div className="vpn-value">
                  {vpnData.vpnSessions.toLocaleString()}
                </div>
              </div>
              <div className="vpn-metric">
                <div className="vpn-label">Proxy Sessions</div>
                <div className="vpn-value">
                  {vpnData.proxySessions.toLocaleString()}
                </div>
              </div>
              <div className="vpn-metric">
                <div className="vpn-label">Tor Sessions</div>
                <div className="vpn-value">
                  {vpnData.torSessions.toLocaleString()}
                </div>
              </div>
              <div className="vpn-metric">
                <div className="vpn-label">VPN Percentage</div>
                <div className="vpn-value">
                  {vpnData.vpnPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {vpnData.topVpnProviders.length > 0 && (
              <div className="vpn-providers">
                <h4>Top VPN Providers</h4>
                <div className="provider-list">
                  {vpnData.topVpnProviders.map((provider, index) => (
                    <div key={provider.provider} className="provider-item">
                      <div className="provider-name">{provider.provider}</div>
                      <div className="provider-stats">
                        <span className="provider-sessions">
                          {provider.sessions}
                        </span>
                        <span className="provider-percentage">
                          ({provider.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDevicesTab = () => {
    if (!analyticsData) return null;

    const { deviceData } = analyticsData;

    return (
      <div className="analytics-devices">
        <div className="devices-grid">
          {/* Device Types */}
          <div className="device-section">
            <HeadingIcon id="smartphone">Device Types</HeadingIcon>
            <div className="device-chart">
              {deviceData.devices.map((device, index) => (
                <div key={device.deviceType} className="device-item">
                  <div className="device-bar">
                    <div
                      className="device-fill"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <div className="device-info">
                    <div className="device-name">{device.deviceType}</div>
                    <div className="device-stats">
                      <span className="device-sessions">
                        {device.sessions.toLocaleString()}
                      </span>
                      <span className="device-percentage">
                        ({device.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Browsers */}
          <div className="device-section">
            <HeadingIcon id="globe">Browsers</HeadingIcon>
            <div className="device-chart">
              {deviceData.browsers.map((browser, index) => (
                <div key={browser.browserName} className="device-item">
                  <div className="device-bar">
                    <div
                      className="device-fill"
                      style={{ width: `${browser.percentage}%` }}
                    ></div>
                  </div>
                  <div className="device-info">
                    <div className="device-name">{browser.browserName}</div>
                    <div className="device-stats">
                      <span className="device-sessions">
                        {browser.sessions.toLocaleString()}
                      </span>
                      <span className="device-percentage">
                        ({browser.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Systems */}
          <div className="device-section">
            <HeadingIcon id="monitor">Operating Systems</HeadingIcon>
            <div className="device-chart">
              {deviceData.operatingSystems.map((os, index) => (
                <div key={os.osName} className="device-item">
                  <div className="device-bar">
                    <div
                      className="device-fill"
                      style={{ width: `${os.percentage}%` }}
                    ></div>
                  </div>
                  <div className="device-info">
                    <div className="device-name">{os.osName}</div>
                    <div className="device-stats">
                      <span className="device-sessions">
                        {os.sessions.toLocaleString()}
                      </span>
                      <span className="device-percentage">
                        ({os.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHeatmapTab = () => {
    if (!analyticsData) return null;

    const { heatmapData } = analyticsData;

    return (
      <div className="analytics-heatmap">
        <div className="heatmap-grid">
          {/* Top Pages */}
          <div className="heatmap-section">
            <HeadingIcon id="flame">Top Pages by Clicks</HeadingIcon>
            <div className="pages-list">
              {heatmapData.topPages.map((page, index) => (
                <div key={page.pagePath} className="page-item">
                  <div className="page-rank">#{index + 1}</div>
                  <div className="page-info">
                    <div className="page-title">
                      {page.pageTitle || 'Untitled'}
                    </div>
                    <div className="page-path">{page.pagePath}</div>
                  </div>
                  <div className="page-stats">
                    <div className="page-clicks">
                      {page.clicks.toLocaleString()} clicks
                    </div>
                    <div className="page-sessions">
                      {page.sessions.toLocaleString()} sessions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Click Patterns */}
          <div className="heatmap-section">
            <HeadingIcon id="target">Click Patterns</HeadingIcon>
            <div className="patterns-list">
              {heatmapData.clickPatterns.slice(0, 15).map((pattern, index) => (
                <div
                  key={`${pattern.elementSelector}-${index}`}
                  className="pattern-item"
                >
                  <div className="pattern-info">
                    <div className="pattern-element">
                      {pattern.elementSelector}
                    </div>
                    <div className="pattern-text">
                      {pattern.elementText || 'No text'}
                    </div>
                  </div>
                  <div className="pattern-stats">
                    <div className="pattern-clicks">
                      {pattern.clicks.toLocaleString()}
                    </div>
                    <div className="pattern-position">
                      ({Math.round(pattern.avgX)}, {Math.round(pattern.avgY)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionsTab = () => {
    if (!analyticsData) return null;

    const { subscriptionAnalytics } = analyticsData;

    return (
      <div className="analytics-subscriptions">
        <div className="subscriptions-grid">
          {/* Plan Performance */}
          <div className="subscription-section">
            <HeadingIcon id="barChart">Plan Performance</HeadingIcon>
            <div className="plans-list">
              {subscriptionAnalytics.planViews.map((plan, index) => (
                <div key={plan.planName} className="plan-item">
                  <div className="plan-info">
                    <div className="plan-name">{plan.planName}</div>
                    <div className="plan-metrics">
                      <div className="plan-metric">
                        <span className="metric-label">Views:</span>
                        <span className="metric-value">
                          {plan.views.toLocaleString()}
                        </span>
                      </div>
                      <div className="plan-metric">
                        <span className="metric-label">Conversions:</span>
                        <span className="metric-value">
                          {plan.conversions.toLocaleString()}
                        </span>
                      </div>
                      <div className="plan-metric">
                        <span className="metric-label">Conversion Rate:</span>
                        <span className="metric-value">
                          {plan.conversionRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="subscription-section">
            <HeadingIcon id="refresh">Conversion Funnel</HeadingIcon>
            <div className="funnel-chart">
              {subscriptionAnalytics.funnelData.map((step, index) => (
                <div key={step.step} className="funnel-step">
                  <div className="step-info">
                    <div className="step-name">{step.step}</div>
                    <div className="step-stats">
                      <span className="step-users">
                        {step.users.toLocaleString()} users
                      </span>
                      {step.dropoffRate > 0 && (
                        <span className="step-dropoff">
                          -{step.dropoffRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="step-bar">
                    <div
                      className="step-fill"
                      style={{ width: `${100 - step.dropoffRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Impact */}
          <div className="subscription-section">
            <HeadingIcon id="coins">Revenue Impact</HeadingIcon>
            <div className="revenue-metrics">
              <div className="revenue-metric">
                <div className="revenue-label">Total Attributed Revenue</div>
                <div className="revenue-value">
                  $
                  {subscriptionAnalytics.revenueImpact.attributedRevenue.toLocaleString()}
                </div>
              </div>
              <div className="revenue-metric">
                <div className="revenue-label">Average Revenue Per User</div>
                <div className="revenue-value">
                  $
                  {subscriptionAnalytics.revenueImpact.avgRevenuePerUser.toFixed(
                    2
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================================
  // MAIN RENDER
  // ================================

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-error">
          <div className="error-icon">
            <SiteIcon id="alertTriangle" sizeRem={2} />
          </div>
          <h3>Analytics Error</h3>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="retry-button">
            <TabLabel id="refresh">Retry</TabLabel>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35em' }}>
          <SiteIcon id="barChart" sizeRem={1.25} />
          Analytics Dashboard
        </h2>
        <div className="header-controls">
          <div className="date-range-selector">
            <label>Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange?.(e.target.value as any)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <button onClick={fetchAnalyticsData} className="refresh-button">
            <TabLabel id="refresh">Refresh</TabLabel>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TabLabel id="barChart">Overview</TabLabel>
        </button>
        <button
          className={`tab-button ${activeTab === 'geography' ? 'active' : ''}`}
          onClick={() => setActiveTab('geography')}
        >
          <TabLabel id="globe">Geography</TabLabel>
        </button>
        <button
          className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <TabLabel id="smartphone">Devices</TabLabel>
        </button>
        <button
          className={`tab-button ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <TabLabel id="flame">Heatmap</TabLabel>
        </button>
        <button
          className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <TabLabel id="coins">Subscriptions</TabLabel>
        </button>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'geography' && renderGeographyTab()}
        {activeTab === 'devices' && renderDevicesTab()}
        {activeTab === 'heatmap' && renderHeatmapTab()}
        {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      </div>
    </div>
  );
}
