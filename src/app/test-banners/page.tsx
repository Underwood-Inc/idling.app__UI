'use client';

/**
 * Test Banner System Page
 *
 * Demonstrates the enhanced banner system with various test scenarios.
 */

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { useState } from 'react';

interface TestResultEntry {
  timestamp: string;
  iconId: SiteIconId;
  message: string;
}

interface FeatureListItemProps {
  iconId: SiteIconId;
  children: string;
}

function FeatureListItem({ iconId, children }: FeatureListItemProps) {
  return (
    <li className="flex items-center gap-2">
      <SiteIcon id={iconId} sizeRem={1} />
      {children}
    </li>
  );
}

export default function TestBannersPage() {
  const [testResults, setTestResults] = useState<TestResultEntry[]>([]);

  const addResult = (iconId: SiteIconId, message: string) => {
    setTestResults((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        iconId,
        message
      }
    ]);
  };

  const testRateLimit = async () => {
    try {
      addResult('flask', 'Testing rate limit notification...');

      const response = await fetch('/api/admin/test-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'normal' })
      });

      if (response.status === 429) {
        addResult('check', 'Rate limit test successful - banner should appear');
      } else if (response.status === 401) {
        addResult('alertTriangle', 'Authentication required for rate limit test');
      } else {
        addResult('circleX', `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      addResult('circleX', `Rate limit test failed: ${error}`);
    }
  };

  const testAttackAlert = async () => {
    try {
      addResult('siren', 'Testing security attack notification...');

      const response = await fetch('/api/admin/test-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'attack' })
      });

      if (response.status === 429) {
        addResult('check', 'Attack alert test successful - red banner should appear');
      } else if (response.status === 401) {
        addResult('alertTriangle', 'Authentication required for attack alert test');
      } else {
        addResult('circleX', `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      addResult('circleX', `Attack alert test failed: ${error}`);
    }
  };

  const testDatabaseAlerts = async () => {
    try {
      addResult('hardDrive', 'Testing database alerts...');

      const response = await fetch('/api/alerts/active');

      if (response.ok) {
        const alerts = await response.json();
        addResult('check', `Found ${alerts.length} active database alerts`);
        alerts.forEach((alert: { title: string; alert_type: string }, index: number) => {
          addResult('info', `  ${index + 1}. "${alert.title}" (${alert.alert_type})`);
        });
      } else if (response.status === 401) {
        addResult('alertTriangle', 'Authentication required for database alerts');
      } else {
        addResult('circleX', `Database alerts test failed: ${response.status}`);
      }
    } catch (error) {
      addResult('circleX', `Database alerts test failed: ${error}`);
    }
  };

  const triggerRefresh = () => {
    addResult('refresh', 'Triggering manual banner refresh...');
    window.dispatchEvent(new CustomEvent('refresh-alerts'));
    addResult('check', 'Refresh event sent');
  };

  const injectTestBanner = () => {
    addResult('flask', 'Injecting test banner manually...');

    const testRateLimit = {
      retryAfter: 30,
      error: 'Test rate limit banner - manually injected',
      quotaType: 'test',
      penaltyLevel: 1
    };

    sessionStorage.setItem('rate-limit-info', JSON.stringify(testRateLimit));
    window.dispatchEvent(new CustomEvent('refresh-alerts'));

    addResult('check', 'Test banner injected! Should appear in 5 seconds or less');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 inline-flex items-center gap-2">
            <SiteIcon id="wand" sizeRem={1.25} />
            Enhanced Banner System Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the enhanced banner system with database alerts, rate limits,
            and real-time updates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <button
              onClick={testRateLimit}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <SiteIcon id="zap" sizeRem={1} />
              Test Rate Limit
            </button>

            <button
              onClick={testAttackAlert}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <SiteIcon id="siren" sizeRem={1} />
              Test Attack Alert
            </button>

            <button
              onClick={testDatabaseAlerts}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <SiteIcon id="hardDrive" sizeRem={1} />
              Test DB Alerts
            </button>

            <button
              onClick={triggerRefresh}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <SiteIcon id="refresh" sizeRem={1} />
              Refresh Banners
            </button>

            <button
              onClick={injectTestBanner}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <SiteIcon id="flask" sizeRem={1} />
              Inject Test Banner
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
              <SiteIcon id="barChart" sizeRem={1.125} />
              System Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Polling Interval:</strong> 5 seconds
              </div>
              <div>
                <strong>Banner Position:</strong> Full width, top-stacked
              </div>
              <div>
                <strong>Data Sources:</strong> Database alerts, Rate limits,
                Timeouts
              </div>
              <div>
                <strong>Animation:</strong> Slide-in with staggered timing
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                <SiteIcon id="fileText" sizeRem={1.125} />
                Test Results
              </h2>
              <button
                onClick={clearResults}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
              >
                Clear
              </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">
                  No tests run yet. Click a test button above to start.
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="break-words flex items-start gap-2">
                    <span className="text-gray-500 shrink-0">{result.timestamp}:</span>
                    <SiteIcon id={result.iconId} sizeRem={0.875} className="shrink-0 mt-0.5" />
                    <span>{result.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 inline-flex items-center gap-2">
              <SiteIcon id="clipboard" sizeRem={1.125} />
              How to Use
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>
                <strong>Inject Test Banner:</strong> Creates a fake rate limit
                banner immediately (best for testing)
              </li>
              <li>
                <strong>Rate Limit Test:</strong> Triggers a rate limit
                notification (requires authentication)
              </li>
              <li>
                <strong>Attack Alert Test:</strong> Triggers a security alert
                banner (requires authentication)
              </li>
              <li>
                <strong>Database Alerts:</strong> Fetches and displays active
                alerts from the database
              </li>
              <li>
                <strong>Refresh Banners:</strong> Manually triggers a banner
                system refresh
              </li>
              <li>
                <strong>Watch the top of the page</strong> for banners to appear
                with animations
              </li>
            </ol>
          </div>

          <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2 inline-flex items-center gap-2">
              <SiteIcon id="sparkles" sizeRem={1.125} />
              Enhanced Features
            </h3>
            <ul className="list-disc list-inside space-y-1 text-green-800">
              <FeatureListItem iconId="palette">
                Beautiful gradients and animations
              </FeatureListItem>
              <FeatureListItem iconId="clock">
                Live countdown timers for rate limits
              </FeatureListItem>
              <FeatureListItem iconId="barChart">
                Progress bars showing time remaining
              </FeatureListItem>
              <FeatureListItem iconId="target">
                Priority-based stacking
              </FeatureListItem>
              <FeatureListItem iconId="refresh">
                Real-time polling (5-second intervals)
              </FeatureListItem>
              <FeatureListItem iconId="hardDrive">
                Database alert integration
              </FeatureListItem>
              <FeatureListItem iconId="smartphone">
                Fully responsive design
              </FeatureListItem>
              <FeatureListItem iconId="theater">
                Custom icons and colors per alert type
              </FeatureListItem>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
