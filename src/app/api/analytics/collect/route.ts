/**
 * Analytics Data Collection API
 * Handles client-side analytics data collection for comprehensive user tracking
 * 
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import { auth } from '@lib/auth';
import sql from '@lib/db';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

// ================================
// TYPES & SCHEMAS
// ================================

const SessionDataSchema = z.object({
  sessionToken: z.string(),
  deviceType: z.string().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
  viewportWidth: z.number().optional(),
  viewportHeight: z.number().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  firstPageUrl: z.string().optional(),
  referrerUrl: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
});

const PageViewSchema = z.object({
  sessionId: z.string(), // Accept any string, not just UUIDs
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
  pagePath: z.string(),
  pageQueryParams: z.string().optional(),
  pageHash: z.string().optional(),
  referrerUrl: z.string().optional(),
  referrerDomain: z.string().optional(),
  pageLoadTime: z.number().optional(),
  domReadyTime: z.number().optional(),
  firstContentfulPaint: z.number().optional(),
  largestContentfulPaint: z.number().optional(),
});

const ClickEventSchema = z.object({
  sessionId: z.string(), // Accept any string, not just UUIDs
  pageViewId: z.string().optional(), // Make optional and accept any string
  clickX: z.number(),
  clickY: z.number(),
  viewportWidth: z.number().optional(),
  viewportHeight: z.number().optional(),
  elementTag: z.string().optional(),
  elementId: z.string().optional(),
  elementClass: z.string().optional(),
  elementText: z.string().optional(),
  elementHref: z.string().optional(),
  elementSelector: z.string().optional(),
  clickType: z.string().optional(),
  modifierKeys: z.string().optional(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  elementCategory: z.string().optional(),
  actionType: z.string().optional(),
  isRageClick: z.boolean().optional(),
});

const BehaviorEventSchema = z.object({
  sessionId: z.string(), // Accept any string, not just UUIDs
  behaviorType: z.string(),
  behaviorCategory: z.string().optional(),
  behaviorAction: z.string(),
  behaviorLabel: z.string().optional(),
  behaviorValue: z.number().optional(),
  pageUrl: z.string(),
  elementSelector: z.string().optional(),
  additionalData: z.record(z.any()).optional(),
});

const FormInteractionSchema = z.object({
  sessionId: z.string(),
  pageViewId: z.string().optional(),
  formId: z.string().optional(),
  formName: z.string().optional(),
  formAction: z.string().optional(),
  formMethod: z.string().optional(),
  fieldId: z.string().optional(),
  fieldName: z.string().optional(),
  fieldType: z.string().optional(),
  fieldLabel: z.string().optional(),
  interactionType: z.string(), // 'focus', 'blur', 'change', 'submit', 'error', 'validation_error'
  fieldValue: z.string().optional(),
  validationError: z.string().optional(),
  timeToComplete: z.number().optional(),
  pageUrl: z.string(),
});

const HoverEventSchema = z.object({
  sessionId: z.string(),
  pageViewId: z.string().optional(),
  elementSelector: z.string(),
  elementText: z.string().optional(),
  elementTag: z.string().optional(),
  elementId: z.string().optional(),
  elementClass: z.string().optional(),
  hoverDuration: z.number(),
  pageUrl: z.string(),
  hoverStartedAt: z.number().optional(),
});

const ErrorEventSchema = z.object({
  sessionId: z.string(), // Accept any string, not just UUIDs
  pageViewId: z.string().optional(),
  errorType: z.string(),
  errorMessage: z.string(),
  errorStack: z.string().optional(),
  errorUrl: z.string().optional(),
  errorLine: z.number().optional(),
  errorColumn: z.number().optional(),
  pageUrl: z.string(),
});

const SubscriptionEventSchema = z.object({
  sessionId: z.string(), // Accept any string, not just UUIDs
  eventType: z.string(),
  eventCategory: z.string().optional(),
  eventAction: z.string(),
  eventLabel: z.string().optional(),
  eventValue: z.number().optional(),
  subscriptionPlanId: z.number().optional(),
  planName: z.string().optional(),
  planPrice: z.number().optional(),
  billingCycle: z.string().optional(),
  funnelStep: z.string().optional(),
  funnelPosition: z.number().optional(),
  pageUrl: z.string().optional(),
  referrerUrl: z.string().optional(),
  additionalData: z.record(z.any()).optional(),
});

// Schema for single event
const AnalyticsRequestSchema = z.object({
  type: z.enum(['session', 'pageview', 'click', 'behavior', 'form_interaction', 'hover', 'subscription', 'error']),
  data: z.union([
    SessionDataSchema,
    PageViewSchema,
    ClickEventSchema,
    BehaviorEventSchema,
    FormInteractionSchema,
    HoverEventSchema,
    SubscriptionEventSchema,
    ErrorEventSchema
  ]),
});

// Schema for batched events (what the tracker actually sends)
const BatchedAnalyticsRequestSchema = z.object({
  events: z.array(z.object({
    type: z.enum(['session', 'pageview', 'click', 'behavior', 'form_interaction', 'hover', 'subscription', 'error']),
    data: z.union([
      SessionDataSchema,
      PageViewSchema,
      ClickEventSchema,
      BehaviorEventSchema,
      FormInteractionSchema,
      HoverEventSchema,
      SubscriptionEventSchema,
      ErrorEventSchema
    ]),
    timestamp: z.number().optional(),
  }))
});

// ================================
// SERVER-SIDE DEVICE DETECTION
// ================================

function parseDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

function parseBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  
  return 'Unknown';
}

function parseBrowserVersion(userAgent: string): string {
  const match = userAgent.match(/(firefox|chrome|safari|edge|opera)\/(\d+)/i);
  return match ? match[2] : 'Unknown';
}

function parseOSName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('x11')) return 'UNIX';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios')) return 'iOS';
  
  return 'Unknown';
}

function parseOSVersion(userAgent: string): string {
  // Windows
  if (userAgent.includes('Windows NT 10.0')) return '10/11';
  if (userAgent.includes('Windows NT 6.3')) return '8.1';
  if (userAgent.includes('Windows NT 6.2')) return '8';
  if (userAgent.includes('Windows NT 6.1')) return '7';
  
  // macOS
  const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+)/);
  if (macMatch) return macMatch[1].replace('_', '.');
  
  // Android
  const androidMatch = userAgent.match(/Android (\d+[._]\d+)/);
  if (androidMatch) return androidMatch[1].replace('_', '.');
  
  // iOS
  const iOSMatch = userAgent.match(/OS (\d+[._]\d+)/);
  if (iOSMatch) return iOSMatch[1].replace('_', '.');
  
  return 'Unknown';
}

// ================================
// HELPER FUNCTIONS
// ================================

async function getClientIpAddress(request: NextRequest): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return request.ip || '127.0.0.1';
}

async function getGeolocationData(ipAddress: string) {
  try {
    // In production, you'd use a real geolocation service like MaxMind, IP2Location, or ipapi.co
    // For development/demo purposes, we'll use a mock implementation
    if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return {
        countryCode: 'US',
        countryName: 'United States',
        regionName: 'California',
        cityName: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
      };
    }
    
    // Mock geolocation data - replace with real service
    const mockData = {
      countryCode: 'US',
      countryName: 'United States',
      regionName: 'California',
      cityName: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
    };
    
    return mockData;
  } catch (error) {
    console.error('Error getting geolocation data:', error);
    return null;
  }
}

async function detectVpnProxy(ipAddress: string) {
  // In production, you'd use a VPN detection service
  // For demo purposes, return mock data
  return {
    isVpn: false,
    isProxy: false,
    isTor: false,
    vpnProvider: null,
    proxyType: null,
  };
}

async function createOrUpdateSession(sessionData: z.infer<typeof SessionDataSchema>, ipAddress: string, userAgent: string, userId?: number) {
  try {
    // Get geolocation and VPN detection data
    const [geoData, vpnData] = await Promise.all([
      getGeolocationData(ipAddress),
      detectVpnProxy(ipAddress)
    ]);
    
    // Check if session exists
    const existingSession = await sql`
      SELECT id FROM analytics_sessions 
      WHERE session_token = ${sessionData.sessionToken}
      LIMIT 1
    `;
    
    if (existingSession.length > 0) {
      // Update existing session
      await sql`
        UPDATE analytics_sessions 
        SET 
          last_activity_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE session_token = ${sessionData.sessionToken}
      `;
      return existingSession[0].id;
    }
    
    // Create new session
    const newSession = await sql`
        INSERT INTO analytics_sessions (
          user_id,
          session_token,
          ip_address,
          user_agent,
          device_type,
          browser_name,
          browser_version,
          os_name,
          os_version,
          screen_width,
          screen_height,
          viewport_width,
          viewport_height,
          timezone,
          language,
          country_code,
          country_name,
          region_name,
          city_name,
          latitude,
          longitude,
          is_vpn,
          is_proxy,
          is_tor,
          vpn_provider,
          proxy_type,
          first_page_url,
          referrer_url,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content
        ) VALUES (
          ${userId || null},
          ${sessionData.sessionToken},
          ${ipAddress},
          ${userAgent},
          ${sessionData.deviceType || null},
          ${sessionData.browserName || null},
          ${sessionData.browserVersion || null},
          ${sessionData.osName || null},
          ${sessionData.osVersion || null},
          ${sessionData.screenWidth || null},
          ${sessionData.screenHeight || null},
          ${sessionData.viewportWidth || null},
          ${sessionData.viewportHeight || null},
          ${sessionData.timezone || null},
          ${sessionData.language || null},
          ${geoData?.countryCode || null},
          ${geoData?.countryName || null},
          ${geoData?.regionName || null},
          ${geoData?.cityName || null},
          ${geoData?.latitude || null},
          ${geoData?.longitude || null},
          ${vpnData.isVpn},
          ${vpnData.isProxy},
          ${vpnData.isTor},
          ${vpnData.vpnProvider || null},
          ${vpnData.proxyType || null},
          ${sessionData.firstPageUrl || null},
          ${sessionData.referrerUrl || null},
          ${sessionData.utmSource || null},
          ${sessionData.utmMedium || null},
          ${sessionData.utmCampaign || null},
          ${sessionData.utmTerm || null},
          ${sessionData.utmContent || null}
        )
        RETURNING id
      `;
      
      return newSession[0].id;
  } catch (error) {
    console.error('Error creating/updating session:', error);
    throw error;
  }
}

// ================================
// EVENT PROCESSING FUNCTIONS
// ================================

async function ensureSessionExists(sessionToken: string, ipAddress: string, userAgent: string, userId?: number) {
  // Check if session exists and return the actual UUID
  const existingSession = await sql`
    SELECT id FROM analytics_sessions 
    WHERE session_token = ${sessionToken}
    LIMIT 1
  `;
  
  if (existingSession.length > 0) {
    return existingSession[0].id; // Return the UUID
  }
  
  // Create minimal session if it doesn't exist
  const [geoData, vpnData] = await Promise.all([
    getGeolocationData(ipAddress),
    detectVpnProxy(ipAddress)
  ]);
  
  const newSession = await sql`
    INSERT INTO analytics_sessions (
      user_id,
      session_token,
      ip_address,
      user_agent,
      device_type,
      browser_name,
      browser_version,
      os_name,
      os_version,
      screen_width,
      screen_height,
      viewport_width,
      viewport_height,
      timezone,
      language,
      country_code,
      country_name,
      region_name,
      city_name,
      latitude,
      longitude,
      is_vpn,
      is_proxy,
      is_tor,
      vpn_provider,
      proxy_type,
      first_page_url,
      referrer_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content
    ) VALUES (
      ${userId || null},
      ${sessionToken},
      ${ipAddress},
      ${userAgent},
      ${parseDeviceType(userAgent)},
      ${parseBrowserName(userAgent)},
      ${parseBrowserVersion(userAgent)},
      ${parseOSName(userAgent)},
      ${parseOSVersion(userAgent)},
      null,
      null,
      null,
      null,
      null,
      null,
      ${geoData?.countryCode || null},
      ${geoData?.countryName || null},
      ${geoData?.regionName || null},
      ${geoData?.cityName || null},
      ${geoData?.latitude || null},
      ${geoData?.longitude || null},
      ${vpnData.isVpn},
      ${vpnData.isProxy},
      ${vpnData.isTor},
      ${vpnData.vpnProvider || null},
      ${vpnData.proxyType || null},
      null,
      null,
      null,
      null,
      null,
      null,
      null
    )
    RETURNING id
  `;
  
  return newSession[0].id; // Return the UUID
}

async function processEvent(event: any, ipAddress: string, userAgent: string, userId?: number) {
  const { type, data } = event;
  
  try {
    switch (type) {
      case 'session': {
        const sessionData = SessionDataSchema.parse(data);
        const sessionId = await createOrUpdateSession(sessionData, ipAddress, userAgent, userId);
        return { success: true, sessionId };
      }
      
      case 'pageview': {
        const pageViewData = PageViewSchema.parse(data);
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(pageViewData.sessionId, ipAddress, userAgent, userId);
        
        const pageView = await sql`
          INSERT INTO analytics_page_views (
            session_id,
            user_id,
            page_url,
            page_title,
            page_path,
            page_query_params,
            page_hash,
            referrer_url,
            referrer_domain,
            page_load_time_ms,
            dom_ready_time_ms,
            first_contentful_paint_ms,
            largest_contentful_paint_ms
          ) VALUES (
            ${sessionUuid},
            ${userId || null},
            ${pageViewData.pageUrl || 'unknown'},
            ${pageViewData.pageTitle || null},
            ${pageViewData.pagePath},
            ${pageViewData.pageQueryParams || null},
            ${pageViewData.pageHash || null},
            ${pageViewData.referrerUrl || null},
            ${pageViewData.referrerDomain || null},
            ${pageViewData.pageLoadTime || null},
            ${pageViewData.domReadyTime || null},
            ${pageViewData.firstContentfulPaint || null},
            ${pageViewData.largestContentfulPaint || null}
          )
          RETURNING id
        `;
        return { success: true, pageViewId: pageView[0].id };
      }
      
      case 'click': {
        const clickData = ClickEventSchema.parse(data);
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(clickData.sessionId, ipAddress, userAgent, userId);
        
        // Get or create a page_view_id since database requires it
        let pageViewUuid = null;
        
        if (clickData.pageViewId) {
          // Try to use provided page view ID
          const pageViewResult = await sql`
            SELECT id FROM analytics_page_views 
            WHERE id = ${clickData.pageViewId}
            LIMIT 1
          `;
          if (pageViewResult.length > 0) {
            pageViewUuid = pageViewResult[0].id;
          }
        }
        
        // If no valid page view found, get the most recent one for this session or create one
        if (!pageViewUuid) {
          const recentPageView = await sql`
            SELECT id FROM analytics_page_views 
            WHERE session_id = ${sessionUuid}
            ORDER BY viewed_at DESC
            LIMIT 1
          `;
          
          if (recentPageView.length > 0) {
            pageViewUuid = recentPageView[0].id;
          } else {
            // Create a minimal page view for this click
            const newPageView = await sql`
              INSERT INTO analytics_page_views (
                session_id,
                user_id,
                page_url,
                page_title,
                page_path
              ) VALUES (
                ${sessionUuid},
                ${userId || null},
                ${clickData.pageUrl},
                ${clickData.pageTitle || 'Unknown'},
                ${new URL(clickData.pageUrl).pathname}
              )
              RETURNING id
            `;
            pageViewUuid = newPageView[0].id;
          }
        }
        
        await sql`
          INSERT INTO analytics_clicks (
            session_id,
            page_view_id,
            user_id,
            click_x,
            click_y,
            viewport_width,
            viewport_height,
            element_tag,
            element_id,
            element_class,
            element_text,
            element_href,
            element_selector,
            click_type,
            modifier_keys,
            page_url,
            page_title
          ) VALUES (
            ${sessionUuid},
            ${pageViewUuid},
            ${userId || null},
            ${clickData.clickX},
            ${clickData.clickY},
            ${clickData.viewportWidth || null},
            ${clickData.viewportHeight || null},
            ${clickData.elementTag || null},
            ${clickData.elementId || null},
            ${clickData.elementClass || null},
            ${clickData.elementText || null},
            ${clickData.elementHref || null},
            ${clickData.elementSelector || null},
            ${clickData.clickType || 'click'},
            ${clickData.modifierKeys || null},
            ${clickData.pageUrl},
            ${clickData.pageTitle || null}
          )
        `;
        return { success: true };
      }
      
      case 'behavior': {
        const behaviorData = BehaviorEventSchema.parse(data);
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(behaviorData.sessionId, ipAddress, userAgent, userId);
        
        const behavior = await sql`
          INSERT INTO analytics_user_behavior (
            session_id,
            user_id,
            behavior_type,
            behavior_category,
            behavior_action,
            behavior_label,
            behavior_value,
            page_url,
            element_selector,
            additional_data
          ) VALUES (
            ${sessionUuid},
            ${userId || null},
            ${behaviorData.behaviorType},
            ${behaviorData.behaviorCategory || null},
            ${behaviorData.behaviorAction},
            ${behaviorData.behaviorLabel || null},
            ${behaviorData.behaviorValue || null},
            ${behaviorData.pageUrl},
            ${behaviorData.elementSelector || null},
            ${behaviorData.additionalData ? JSON.stringify(behaviorData.additionalData) : null}
          )
          RETURNING id
        `;
        return { success: true, behaviorId: behavior[0].id };
      }
      
      case 'form_interaction': {
        const formData = data as any; // Type assertion since we need to handle form_interaction
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(formData.sessionId, ipAddress, userAgent, userId);
        
        const formInteraction = await sql`
          INSERT INTO analytics_form_interactions (
            session_id,
            page_view_id,
            user_id,
            form_id,
            form_name,
            form_action,
            form_method,
            field_id,
            field_name,
            field_type,
            field_label,
            interaction_type,
            field_value,
            validation_error,
            time_to_complete,
            page_url
          ) VALUES (
            ${sessionUuid},
            ${formData.pageViewId || null},
            ${userId || null},
            ${formData.formId || null},
            ${formData.formName || null},
            ${formData.formAction || null},
            ${formData.formMethod || null},
            ${formData.fieldId || null},
            ${formData.fieldName || null},
            ${formData.fieldType || null},
            ${formData.fieldLabel || null},
            ${formData.interactionType},
            ${formData.fieldValue || null},
            ${formData.validationError || null},
            ${formData.timeToComplete || null},
            ${formData.pageUrl}
          )
          RETURNING id
        `;
        return { success: true, formInteractionId: formInteraction[0].id };
      }
      
      case 'hover': {
        const hoverData = data as any; // Type assertion since we need to handle hover
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(hoverData.sessionId, ipAddress, userAgent, userId);
        
        const hoverEvent = await sql`
          INSERT INTO analytics_hover_events (
            session_id,
            page_view_id,
            user_id,
            element_selector,
            element_text,
            element_tag,
            element_id,
            element_class,
            hover_duration,
            page_url,
            hover_started_at,
            hover_ended_at
          ) VALUES (
            ${sessionUuid},
            ${hoverData.pageViewId || null},
            ${userId || null},
            ${hoverData.elementSelector},
            ${hoverData.elementText || null},
            ${hoverData.elementTag || null},
            ${hoverData.elementId || null},
            ${hoverData.elementClass || null},
            ${hoverData.hoverDuration},
            ${hoverData.pageUrl},
            ${hoverData.hoverStartedAt ? new Date(hoverData.hoverStartedAt) : null},
            CURRENT_TIMESTAMP
          )
          RETURNING id
        `;
        return { success: true, hoverEventId: hoverEvent[0].id };
      }

      case 'error': {
        const errorData = ErrorEventSchema.parse(data);
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(errorData.sessionId, ipAddress, userAgent, userId);
        
        await sql`
          INSERT INTO analytics_errors (
            session_id,
            page_view_id,
            user_id,
            error_type,
            error_message,
            error_stack,
            error_url,
            error_line,
            error_column,
            page_url
          ) VALUES (
            ${sessionUuid},
            ${errorData.pageViewId || null},
            ${userId || null},
            ${errorData.errorType},
            ${errorData.errorMessage},
            ${errorData.errorStack || null},
            ${errorData.errorUrl || null},
            ${errorData.errorLine || null},
            ${errorData.errorColumn || null},
            ${errorData.pageUrl}
          )
        `;
        return { success: true };
      }
      
      case 'subscription': {
        const subscriptionData = SubscriptionEventSchema.parse(data);
        
        // Get the actual session UUID from the session token
        const sessionUuid = await ensureSessionExists(subscriptionData.sessionId, ipAddress, userAgent, userId);
        
        await sql`
          INSERT INTO analytics_subscription_events (
            session_id,
            user_id,
            event_type,
            event_category,
            event_action,
            event_label,
            event_value,
            subscription_plan_id,
            plan_name,
            plan_price_cents,
            billing_cycle,
            funnel_step,
            funnel_position,
            page_url,
            referrer_url,
            additional_data
          ) VALUES (
            ${sessionUuid},
            ${userId || null},
            ${subscriptionData.eventType},
            ${subscriptionData.eventCategory || 'subscription'},
            ${subscriptionData.eventAction},
            ${subscriptionData.eventLabel || null},
            ${subscriptionData.eventValue || null},
            ${subscriptionData.subscriptionPlanId || null},
            ${subscriptionData.planName || null},
            ${subscriptionData.planPrice || null},
            ${subscriptionData.billingCycle || null},
            ${subscriptionData.funnelStep || null},
            ${subscriptionData.funnelPosition || null},
            ${subscriptionData.pageUrl || null},
            ${subscriptionData.referrerUrl || null},
            ${subscriptionData.additionalData ? JSON.stringify(subscriptionData.additionalData) : null}
          )
        `;
        return { success: true };
      }
      
      default:
        throw new Error(`Invalid analytics type: ${type}`);
    }
  } catch (error) {
    console.error(`Error processing ${type} event:`, error);
    throw error;
  }
}

// ================================
// MAIN POST HANDLER
// ================================

async function postHandler(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
    
    const body = await request.json();
    const ipAddress = await getClientIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    // Check if this is a batched request (what the tracker sends) or single event
    if (body.events && Array.isArray(body.events)) {
      // Batched events from the analytics tracker
      const { events } = BatchedAnalyticsRequestSchema.parse(body);
      
      const results = [];
      for (const event of events) {
        try {
          const result = await processEvent(event, ipAddress, userAgent, userId);
          results.push(result);
        } catch (error) {
          console.error('Error processing event:', error);
          results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        processed: results.length,
        results 
      });
    } else {
      // Single event (backwards compatibility)
      const singleEvent = AnalyticsRequestSchema.parse(body);
      const result = await processEvent(singleEvent, ipAddress, userAgent, userId);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error processing analytics data:', error);
    return NextResponse.json({ 
      error: 'Failed to process analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ================================
// EXPORT HANDLERS
// ================================

export const POST = withRateLimit(postHandler); 