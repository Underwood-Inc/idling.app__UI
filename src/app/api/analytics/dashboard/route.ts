/**
 * Analytics Dashboard API
 * Provides comprehensive analytics data for the subscription management dashboard
 *
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import { checkUserPermission } from '@lib/actions/permissions.actions';
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

// ================================
// TYPES & SCHEMAS
// ================================

const DashboardQuerySchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  metrics: z
    .array(
      z.enum([
        'sessions',
        'pageviews',
        'clicks',
        'conversions',
        'geography',
        'devices',
        'vpn'
      ])
    )
    .optional(),
  granularity: z
    .enum(['hour', 'day', 'week', 'month'])
    .optional()
    .default('day'),
  timezone: z.string().optional().default('UTC')
});

export interface AnalyticsDashboardResponse {
  overview: {
    totalSessions: number;
    totalPageViews: number;
    totalClicks: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    bounceRate: number;
    vpnPercentage: number;
    conversionRate: number;
  };
  timeSeriesData: {
    labels: string[];
    sessions: number[];
    pageViews: number[];
    clicks: number[];
    conversions: number[];
  };
  geographicData: {
    countries: Array<{
      countryCode: string;
      countryName: string;
      sessions: number;
      percentage: number;
    }>;
    cities: Array<{
      cityName: string;
      regionName: string;
      countryName: string;
      sessions: number;
      percentage: number;
    }>;
  };
  deviceData: {
    devices: Array<{
      deviceType: string;
      sessions: number;
      percentage: number;
    }>;
    browsers: Array<{
      browserName: string;
      sessions: number;
      percentage: number;
    }>;
    operatingSystems: Array<{
      osName: string;
      sessions: number;
      percentage: number;
    }>;
  };
  vpnData: {
    vpnSessions: number;
    proxySessions: number;
    torSessions: number;
    vpnPercentage: number;
    topVpnProviders: Array<{
      provider: string;
      sessions: number;
      percentage: number;
    }>;
  };
  heatmapData: {
    topPages: Array<{
      pagePath: string;
      pageTitle: string;
      clicks: number;
      sessions: number;
    }>;
    clickPatterns: Array<{
      elementSelector: string;
      elementText: string;
      clicks: number;
      avgX: number;
      avgY: number;
    }>;
  };
  subscriptionAnalytics: {
    planViews: Array<{
      planName: string;
      views: number;
      conversions: number;
      conversionRate: number;
    }>;
    funnelData: Array<{
      step: string;
      users: number;
      dropoffRate: number;
    }>;
    revenueImpact: {
      attributedRevenue: number;
      avgRevenuePerUser: number;
    };
  };
}

// ================================
// HELPER FUNCTIONS
// ================================

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();

  let startDate: Date;
  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate: startDate.toISOString(), endDate };
}

function getTimeGrouping(granularity: string, timezone: string): string {
  const timezoneClause = timezone !== 'UTC' ? `AT TIME ZONE '${timezone}'` : '';

  switch (granularity) {
    case 'hour':
      return `DATE_TRUNC('hour', session_start_at ${timezoneClause})`;
    case 'day':
      return `DATE_TRUNC('day', session_start_at ${timezoneClause})`;
    case 'week':
      return `DATE_TRUNC('week', session_start_at ${timezoneClause})`;
    case 'month':
      return `DATE_TRUNC('month', session_start_at ${timezoneClause})`;
    default:
      return `DATE_TRUNC('day', session_start_at ${timezoneClause})`;
  }
}

// ================================
// DATA FETCHING FUNCTIONS
// ================================

async function getOverviewMetrics(startDate: string, endDate: string) {
  const overview = await sql`
    SELECT 
      COUNT(DISTINCT s.id) as total_sessions,
      COUNT(DISTINCT pv.id) as total_page_views,
      COUNT(DISTINCT c.id) as total_clicks,
      COUNT(DISTINCT s.user_id) as unique_users,
      AVG(s.total_session_duration_seconds) as avg_session_duration,
      AVG(CASE WHEN s.total_page_views = 1 THEN 1 ELSE 0 END) * 100 as bounce_rate,
      AVG(CASE WHEN s.is_vpn = TRUE THEN 1 ELSE 0 END) * 100 as vpn_percentage,
      COALESCE(COUNT(DISTINCT se.id) * 100.0 / NULLIF(COUNT(DISTINCT s.id), 0), 0) as conversion_rate
    FROM analytics_sessions s
    LEFT JOIN analytics_page_views pv ON s.id = pv.session_id
    LEFT JOIN analytics_clicks c ON s.id = c.session_id
    LEFT JOIN analytics_subscription_events se ON s.id = se.session_id AND se.event_type = 'payment_success'
    WHERE s.session_start_at >= ${startDate} AND s.session_start_at <= ${endDate}
  `;

  return overview[0] || {};
}

async function getTimeSeriesData(
  startDate: string,
  endDate: string,
  granularity: string,
  timezone: string
) {
  const timeGrouping = getTimeGrouping(granularity, timezone);

  const timeSeries = await sql`
    SELECT 
      ${sql.unsafe(timeGrouping)} as period,
      COUNT(DISTINCT s.id) as sessions,
      COUNT(DISTINCT pv.id) as page_views,
      COUNT(DISTINCT c.id) as clicks,
      COUNT(DISTINCT se.id) as conversions
    FROM analytics_sessions s
    LEFT JOIN analytics_page_views pv ON s.id = pv.session_id
    LEFT JOIN analytics_clicks c ON s.id = c.session_id
    LEFT JOIN analytics_subscription_events se ON s.id = se.session_id AND se.event_type = 'payment_success'
    WHERE s.session_start_at >= ${startDate} AND s.session_start_at <= ${endDate}
    GROUP BY ${sql.unsafe(timeGrouping)}
    ORDER BY period ASC
  `;

  return {
    labels: timeSeries.map((row) => row.period),
    sessions: timeSeries.map((row) => parseInt(row.sessions)),
    pageViews: timeSeries.map((row) => parseInt(row.page_views)),
    clicks: timeSeries.map((row) => parseInt(row.clicks)),
    conversions: timeSeries.map((row) => parseInt(row.conversions))
  };
}

async function getGeographicData(startDate: string, endDate: string) {
  const [countries, cities] = await Promise.all([
    sql`
      SELECT 
        country_code,
        country_name,
        COUNT(DISTINCT id) as sessions,
        COALESCE(
          COUNT(DISTINCT id) * 100.0 / NULLIF(
            (SELECT COUNT(DISTINCT id) FROM analytics_sessions 
             WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}), 0
          ), 0
        ) as percentage
      FROM analytics_sessions
      WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
        AND country_code IS NOT NULL
      GROUP BY country_code, country_name
      ORDER BY sessions DESC
      LIMIT 20
    `,
    sql`
      SELECT 
        city_name,
        region_name,
        country_name,
        COUNT(DISTINCT id) as sessions,
        COALESCE(
          COUNT(DISTINCT id) * 100.0 / NULLIF(
            (SELECT COUNT(DISTINCT id) FROM analytics_sessions 
             WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}), 0
          ), 0
        ) as percentage
      FROM analytics_sessions
      WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
        AND city_name IS NOT NULL
      GROUP BY city_name, region_name, country_name
      ORDER BY sessions DESC
      LIMIT 20
    `
  ]);

  return {
    countries: countries.map((row) => ({
      countryCode: row.country_code,
      countryName: row.country_name,
      sessions: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    })),
    cities: cities.map((row) => ({
      cityName: row.city_name,
      regionName: row.region_name,
      countryName: row.country_name,
      sessions: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    }))
  };
}

async function getDeviceData(startDate: string, endDate: string) {
  const [devices, browsers, operatingSystems] = await Promise.all([
    sql`
      SELECT 
        device_type,
        COUNT(DISTINCT id) as sessions,
        COALESCE(
          COUNT(DISTINCT id) * 100.0 / NULLIF(
            (SELECT COUNT(DISTINCT id) FROM analytics_sessions 
             WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}), 0
          ), 0
        ) as percentage
      FROM analytics_sessions
      WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
        AND device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY sessions DESC
    `,
    sql`
      SELECT 
        browser_name,
        COUNT(DISTINCT id) as sessions,
        COALESCE(
          COUNT(DISTINCT id) * 100.0 / NULLIF(
            (SELECT COUNT(DISTINCT id) FROM analytics_sessions 
             WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}), 0
          ), 0
        ) as percentage
      FROM analytics_sessions
      WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
        AND browser_name IS NOT NULL
      GROUP BY browser_name
      ORDER BY sessions DESC
      LIMIT 10
    `,
    sql`
      SELECT 
        os_name,
        COUNT(DISTINCT id) as sessions,
        COALESCE(
          COUNT(DISTINCT id) * 100.0 / NULLIF(
            (SELECT COUNT(DISTINCT id) FROM analytics_sessions 
             WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}), 0
          ), 0
        ) as percentage
      FROM analytics_sessions
      WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
        AND os_name IS NOT NULL
      GROUP BY os_name
      ORDER BY sessions DESC
      LIMIT 10
    `
  ]);

  return {
    devices: devices.map((row) => ({
      deviceType: row.device_type,
      sessions: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    })),
    browsers: browsers.map((row) => ({
      browserName: row.browser_name,
      sessions: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    })),
    operatingSystems: operatingSystems.map((row) => ({
      osName: row.os_name,
      sessions: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    }))
  };
}

async function getVpnData(startDate: string, endDate: string) {
  const vpnStats = await sql`
    SELECT 
      COUNT(DISTINCT CASE WHEN is_vpn = TRUE THEN id END) as vpn_sessions,
      COUNT(DISTINCT CASE WHEN is_proxy = TRUE THEN id END) as proxy_sessions,
      COUNT(DISTINCT CASE WHEN is_tor = TRUE THEN id END) as tor_sessions,
      COALESCE(
        COUNT(DISTINCT CASE WHEN is_vpn = TRUE THEN id END) * 100.0 / NULLIF(COUNT(DISTINCT id), 0), 0
      ) as vpn_percentage
    FROM analytics_sessions
    WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
  `;

  const vpnProviders = await sql`
    SELECT 
      vpn_provider,
      COUNT(DISTINCT id) as sessions,
      COALESCE(
        COUNT(DISTINCT id) * 100.0 / NULLIF(
          (SELECT COUNT(DISTINCT id) FROM analytics_sessions 
           WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate} AND is_vpn = TRUE), 0
        ), 0
      ) as percentage
    FROM analytics_sessions
    WHERE session_start_at >= ${startDate} AND session_start_at <= ${endDate}
      AND is_vpn = TRUE AND vpn_provider IS NOT NULL
    GROUP BY vpn_provider
    ORDER BY sessions DESC
    LIMIT 10
  `;

  return {
    vpnSessions: parseInt(vpnStats[0]?.vpn_sessions || 0),
    proxySessions: parseInt(vpnStats[0]?.proxy_sessions || 0),
    torSessions: parseInt(vpnStats[0]?.tor_sessions || 0),
    vpnPercentage: parseFloat(vpnStats[0]?.vpn_percentage || 0),
    topVpnProviders: vpnProviders.map((row) => ({
      provider: row.vpn_provider,
      sessions: parseInt(row.sessions),
      percentage: parseFloat(row.percentage)
    }))
  };
}

async function getHeatmapData(startDate: string, endDate: string) {
  const [topPages, clickPatterns] = await Promise.all([
    sql`
      SELECT 
        pv.page_path,
        pv.page_title,
        COUNT(DISTINCT c.id) as clicks,
        COUNT(DISTINCT pv.session_id) as sessions
      FROM analytics_page_views pv
      LEFT JOIN analytics_clicks c ON pv.id = c.page_view_id
      WHERE pv.viewed_at >= ${startDate} AND pv.viewed_at <= ${endDate}
      GROUP BY pv.page_path, pv.page_title
      ORDER BY clicks DESC
      LIMIT 20
    `,
    sql`
      SELECT 
        element_selector,
        element_text,
        COUNT(*) as clicks,
        AVG(click_x) as avg_x,
        AVG(click_y) as avg_y
      FROM analytics_clicks
      WHERE clicked_at >= ${startDate} AND clicked_at <= ${endDate}
        AND element_selector IS NOT NULL
      GROUP BY element_selector, element_text
      ORDER BY clicks DESC
      LIMIT 50
    `
  ]);

  return {
    topPages: topPages.map((row) => ({
      pagePath: row.page_path,
      pageTitle: row.page_title,
      clicks: parseInt(row.clicks),
      sessions: parseInt(row.sessions)
    })),
    clickPatterns: clickPatterns.map((row) => ({
      elementSelector: row.element_selector,
      elementText: row.element_text,
      clicks: parseInt(row.clicks),
      avgX: parseFloat(row.avg_x),
      avgY: parseFloat(row.avg_y)
    }))
  };
}

async function getSubscriptionAnalytics(startDate: string, endDate: string) {
  const [planViews, funnelData, revenueImpact] = await Promise.all([
    sql`
      SELECT 
        plan_name,
        COUNT(DISTINCT CASE WHEN event_type = 'subscription_view' THEN session_id END) as views,
        COUNT(DISTINCT CASE WHEN event_type = 'payment_success' THEN session_id END) as conversions,
        COUNT(DISTINCT CASE WHEN event_type = 'payment_success' THEN session_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'subscription_view' THEN session_id END), 0) as conversion_rate
      FROM analytics_subscription_events
      WHERE occurred_at >= ${startDate} AND occurred_at <= ${endDate}
        AND plan_name IS NOT NULL
      GROUP BY plan_name
      ORDER BY views DESC
    `,
    sql`
      SELECT 
        funnel_step,
        COUNT(DISTINCT session_id) as users,
        LAG(COUNT(DISTINCT session_id)) OVER (ORDER BY MIN(funnel_position)) as prev_users
      FROM analytics_subscription_events
      WHERE occurred_at >= ${startDate} AND occurred_at <= ${endDate}
        AND funnel_step IS NOT NULL
      GROUP BY funnel_step
      ORDER BY MIN(funnel_position)
    `,
    sql`
      SELECT 
        SUM(event_value) as attributed_revenue,
        AVG(event_value) as avg_revenue_per_user
      FROM analytics_subscription_events
      WHERE occurred_at >= ${startDate} AND occurred_at <= ${endDate}
        AND event_type = 'payment_success'
        AND event_value IS NOT NULL
    `
  ]);

  return {
    planViews: planViews.map((row) => ({
      planName: row.plan_name,
      views: parseInt(row.views),
      conversions: parseInt(row.conversions),
      conversionRate: parseFloat(row.conversion_rate || 0)
    })),
    funnelData: funnelData.map((row) => ({
      step: row.funnel_step,
      users: parseInt(row.users),
      dropoffRate:
        row.prev_users && parseInt(row.prev_users) > 0
          ? (1 - parseInt(row.users) / parseInt(row.prev_users)) * 100
          : 0
    })),
    revenueImpact: {
      attributedRevenue: parseFloat(revenueImpact[0]?.attributed_revenue || 0),
      avgRevenuePerUser: parseFloat(revenueImpact[0]?.avg_revenue_per_user || 0)
    }
  };
}

// ================================
// MAIN GET HANDLER
// ================================

async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.ACCESS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = DashboardQuerySchema.parse(Object.fromEntries(searchParams));

    const { startDate, endDate } = getDateRange(params.dateRange);

    // Fetch all analytics data in parallel
    const [
      overview,
      timeSeriesData,
      geographicData,
      deviceData,
      vpnData,
      heatmapData,
      subscriptionAnalytics
    ] = await Promise.all([
      getOverviewMetrics(startDate, endDate),
      getTimeSeriesData(
        startDate,
        endDate,
        params.granularity,
        params.timezone
      ),
      getGeographicData(startDate, endDate),
      getDeviceData(startDate, endDate),
      getVpnData(startDate, endDate),
      getHeatmapData(startDate, endDate),
      getSubscriptionAnalytics(startDate, endDate)
    ]);

    const response: AnalyticsDashboardResponse = {
      overview: {
        totalSessions: parseInt(overview.total_sessions || 0),
        totalPageViews: parseInt(overview.total_page_views || 0),
        totalClicks: parseInt(overview.total_clicks || 0),
        uniqueUsers: parseInt(overview.unique_users || 0),
        avgSessionDuration: parseFloat(overview.avg_session_duration || 0),
        bounceRate: parseFloat(overview.bounce_rate || 0),
        vpnPercentage: parseFloat(overview.vpn_percentage || 0),
        conversionRate: parseFloat(overview.conversion_rate || 0)
      },
      timeSeriesData,
      geographicData,
      deviceData,
      vpnData,
      heatmapData,
      subscriptionAnalytics
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// ================================
// EXPORT HANDLERS
// ================================

export const GET = withUniversalEnhancements(getHandler);
