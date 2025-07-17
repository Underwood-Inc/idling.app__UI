import { checkGuestQuota, recordGuestUsage } from '@lib/actions/quota.actions';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { EnhancedQuotaService } from '@lib/services/EnhancedQuotaService';
import { formatRetryAfter } from '@lib/utils/timeFormatting';
import { NextRequest } from 'next/server';
import {
  ASPECT_RATIOS,
  WATERMARK_CONFIG,
  WATERMARK_CONFIG_FREE_TIER
} from '../config';
import type { WatermarkConfig } from '../types';
import { AvatarService } from './AvatarService';
import { DatabaseService } from './DatabaseService';
import { QuoteService } from './QuoteService';
import { SVGGenerator } from './SVGGenerator';

// Server actions handle all quota operations

interface GenerationConfig {
  // Direct user controls (8)
  seed: string;
  avatarSeed: string;
  quote?: string;
  author?: string;
  aspectRatio: string;
  customWidth?: number;
  customHeight?: number;
  shapeCount?: number;

  // Positioning controls (5)
  avatarX?: number;
  avatarY?: number;
  avatarSize?: number;
  textMaxWidth?: number;
  textStartY?: number;

  // Visual controls (7)
  fontSize?: number;
  borderColor?: string;
  borderOpacity?: number;
  patternSeed?: string;
  textPadding?: number;
  lineHeight?: number;
  glassBackground?: boolean;

  // Pro watermark controls
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkSize?: number;
  watermarkPosition?: string;
  watermarkRotation?: number;
}

interface GenerationResponse {
  svg: string;
  seed: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  generationOptions: GenerationConfig;
  remainingGenerations: number;
  quotaLimit?: number;
  resetDate?: Date | null;
  generationId?: string;
  id?: string;
}

/**
 * OGImageService handles secure image generation with proper authentication and authorization.
 *
 * SECURITY FEATURES:
 * - Server-side validation of all Pro-only parameters
 * - Permission checks before applying advanced features
 * - Sanitization of configuration to prevent privilege escalation
 * - Logging of potential tampering attempts
 * - Database-backed subscription verification
 *
 * PROTECTED FEATURES (Pro-only):
 * - Custom positioning (avatarX, avatarY, avatarSize, textMaxWidth, textStartY)
 * - Visual controls (fontSize, borderColor, borderOpacity, patternSeed, textPadding, lineHeight, glassBackground)
 * - Watermark customization (watermarkEnabled, watermarkText, watermarkOpacity, watermarkSize, watermarkPosition, watermarkRotation)
 *
 * FREE FEATURES (Always allowed):
 * - Basic generation parameters (seed, avatarSeed, quote, author, aspectRatio, customWidth, customHeight)
 */
export class OGImageService {
  private quoteService = new QuoteService();
  private avatarService = new AvatarService();
  private svgGenerator = new SVGGenerator();
  private databaseService = DatabaseService.getInstance();

  constructor() {
    // Initialize services
  }

  async generateImage(request: NextRequest): Promise<GenerationResponse> {
    const { searchParams } = new URL(request.url);
    const isDryRun = searchParams.get('dry-run') === 'true';

    // Get client IP and machine fingerprint for enhanced quota tracking
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const machineFingerprint = this.generateMachineFingerprint(request);

    // Check if user is authenticated
    const session = await auth();
    const userId = session?.user?.id;

    let quotaCheck: any;

    if (userId) {
      // Authenticated user - use EnhancedQuotaService
      quotaCheck = await EnhancedQuotaService.checkUserQuota(
        parseInt(userId),
        'og_generator',
        'daily_generations'
      );
    } else {
      // Anonymous guest - use global guest quota system
      quotaCheck = await checkGuestQuota(
        {
          client_ip: clientIP,
          machine_fingerprint: machineFingerprint,
          user_agent_hash: this.hashUserAgent(userAgent)
        },
        'og_generator',
        'daily_generations'
      );
    }

    // Check quota limits
    if (!isDryRun && !quotaCheck.allowed) {
      const resetTime =
        quotaCheck.reset_date || new Date(Date.now() + 86400000);
      const retryAfterSeconds = Math.ceil(
        (resetTime.getTime() - Date.now()) / 1000
      );
      const humanTime = formatRetryAfter(retryAfterSeconds);

      const quotaMessage = quotaCheck.is_unlimited
        ? 'Unlimited generations available'
        : `${quotaCheck.current_usage}/${quotaCheck.quota_limit} generations used (${quotaCheck.quota_source})`;

      throw new Error(
        `Daily generation limit exceeded. ${quotaMessage}. Try again in ${humanTime} or upgrade to Pro for unlimited generations.`
      );
    }

    // If dry run, just return quota info
    if (isDryRun) {
      return {
        svg: '',
        seed: '',
        dimensions: { width: 0, height: 0 },
        aspectRatio: 'default',
        generationOptions: this.buildGenerationConfig(searchParams),
        remainingGenerations:
          quotaCheck.remaining === -1 ? 999999 : quotaCheck.remaining,
        quotaLimit:
          quotaCheck.quota_limit === -1 ? 999999 : quotaCheck.quota_limit,
        resetDate: quotaCheck.reset_date,
        generationId: '',
        id: ''
      };
    }

    // Build complete generation config
    const config = this.buildGenerationConfig(searchParams);

    // Generate the image with actual values
    const result = await this.callGenerationAPI(config, !!userId);

    // Record usage in the appropriate quota system and get updated quota info
    let updatedQuotaCheck: any;
    if (userId) {
      // Record for authenticated user using EnhancedQuotaService
      const usageRecord = await EnhancedQuotaService.recordUserUsage(
        parseInt(userId),
        'og_generator',
        'daily_generations',
        1,
        {
          ip_address: clientIP,
          user_agent: userAgent,
          machine_fingerprint: machineFingerprint,
          generation_config: config
        }
      );
      // Get updated quota info after recording usage
      updatedQuotaCheck = await EnhancedQuotaService.checkUserQuota(
        parseInt(userId),
        'og_generator',
        'daily_generations'
      );
    } else {
      // Record for guest user
      const usageRecord = await recordGuestUsage(
        {
          client_ip: clientIP,
          machine_fingerprint: machineFingerprint,
          user_agent_hash: this.hashUserAgent(userAgent)
        },
        'og_generator',
        'daily_generations',
        1,
        {
          generation_config: config,
          user_agent: userAgent
        }
      );
      // Get updated quota info after recording usage
      updatedQuotaCheck = await checkGuestQuota(
        {
          client_ip: clientIP,
          machine_fingerprint: machineFingerprint,
          user_agent_hash: this.hashUserAgent(userAgent)
        },
        'og_generator',
        'daily_generations'
      );
    }

    // Record generation in database (for historical tracking)
    let generationId: string | undefined;
    try {
      generationId = await this.databaseService.recordGeneration({
        seed: result.actualSeed,
        aspectRatio: config.aspectRatio,
        quoteText: result.actualQuote?.text || undefined,
        quoteAuthor: result.actualQuote?.author || undefined,
        customWidth: config.customWidth,
        customHeight: config.customHeight,
        shapeCount: config.shapeCount,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || '',
        svgContent: result.svg,
        width: result.dimensions.width,
        height: result.dimensions.height,
        generationOptions: config
      });
    } catch (error) {
      // Database recording failed, continue without ID
      console.error('Failed to record generation:', error);
    }

    // Build the actual generation options with ALL the values that were used
    const actualGenerationOptions: GenerationConfig = {
      // Direct user controls (8) - actual values used
      seed: result.actualSeed,
      avatarSeed: result.actualAvatarSeed,
      quote: result.actualQuote?.text || undefined,
      author: result.actualQuote?.author || undefined,
      aspectRatio: config.aspectRatio,
      customWidth: result.dimensions.width,
      customHeight: result.dimensions.height,
      shapeCount: result.actualShapeCount,

      // Positioning controls (5) - actual values used
      avatarX: result.actualAvatarPositioning?.x,
      avatarY: result.actualAvatarPositioning?.y,
      avatarSize: result.actualAvatarPositioning?.size,
      textMaxWidth: result.actualTextMaxWidth,
      textStartY: result.actualTextStartY,

      // Visual controls (7) - actual values used
      fontSize: result.actualFontSize,
      borderColor: result.actualBorderColor,
      borderOpacity: result.actualBorderOpacity,
      patternSeed: result.actualPatternSeed,
      textPadding: result.actualTextPadding,
      lineHeight: result.actualLineHeight,
      glassBackground: result.actualGlassBackground || false
    };

    return {
      ...result,
      generationOptions: actualGenerationOptions,
      remainingGenerations:
        updatedQuotaCheck.remaining === -1
          ? 999999
          : updatedQuotaCheck.remaining,
      quotaLimit:
        updatedQuotaCheck.quota_limit === -1
          ? 999999
          : updatedQuotaCheck.quota_limit,
      resetDate: updatedQuotaCheck.reset_date,
      generationId: generationId || undefined,
      id: generationId || undefined // For compatibility
    };
  }

  private buildGenerationConfig(
    searchParams: URLSearchParams
  ): GenerationConfig {
    // Extract all parameters from URL
    const customSeed = searchParams.get('seed');
    const avatarSeed = searchParams.get('avatarSeed');
    const customQuote = searchParams.get('quote');
    const customAuthor = searchParams.get('author');
    const aspectRatio =
      searchParams.get('variant') ||
      searchParams.get('ratio') ||
      searchParams.get('aspect') ||
      'default';

    const customWidth = searchParams.get('width')
      ? parseInt(searchParams.get('width')!)
      : undefined;
    const customHeight = searchParams.get('height')
      ? parseInt(searchParams.get('height')!)
      : undefined;
    const shapeCount = searchParams.get('shapes')
      ? parseInt(searchParams.get('shapes')!)
      : undefined;

    // Advanced positioning controls
    const avatarX = searchParams.get('avatarX')
      ? parseFloat(searchParams.get('avatarX')!)
      : undefined;
    const avatarY = searchParams.get('avatarY')
      ? parseFloat(searchParams.get('avatarY')!)
      : undefined;
    const avatarSize = searchParams.get('avatarSize')
      ? parseFloat(searchParams.get('avatarSize')!)
      : undefined;
    const textMaxWidth = searchParams.get('textMaxWidth')
      ? parseFloat(searchParams.get('textMaxWidth')!)
      : undefined;
    const textStartY = searchParams.get('textStartY')
      ? parseFloat(searchParams.get('textStartY')!)
      : undefined;
    const fontSize = searchParams.get('fontSize')
      ? parseFloat(searchParams.get('fontSize')!)
      : undefined;

    // Visual styling controls
    const borderColor = searchParams.get('borderColor') || undefined;
    const borderOpacity = searchParams.get('borderOpacity')
      ? parseFloat(searchParams.get('borderOpacity')!)
      : undefined;
    const patternSeed = searchParams.get('patternSeed') || undefined;
    const textPadding = searchParams.get('textPadding')
      ? parseFloat(searchParams.get('textPadding')!)
      : undefined;
    const lineHeight = searchParams.get('lineHeight')
      ? parseFloat(searchParams.get('lineHeight')!)
      : undefined;
    const glassBackground = searchParams.get('glassBackground') === 'true';

    // Pro watermark controls
    const watermarkEnabled = searchParams.get('watermarkEnabled') === 'true';
    const watermarkText = searchParams.get('watermarkText') || undefined;
    const watermarkOpacity = searchParams.get('watermarkOpacity')
      ? parseFloat(searchParams.get('watermarkOpacity')!)
      : undefined;
    const watermarkSize = searchParams.get('watermarkSize')
      ? parseFloat(searchParams.get('watermarkSize')!)
      : undefined;
    const watermarkPosition =
      searchParams.get('watermarkPosition') || undefined;
    const watermarkRotation = searchParams.get('watermarkRotation')
      ? parseFloat(searchParams.get('watermarkRotation')!)
      : undefined;

    return {
      seed: customSeed || '',
      avatarSeed: avatarSeed || '',
      quote: customQuote || undefined,
      author: customAuthor || undefined,
      aspectRatio,
      customWidth,
      customHeight,
      shapeCount,
      avatarX,
      avatarY,
      avatarSize,
      textMaxWidth,
      textStartY,
      fontSize,
      borderColor,
      borderOpacity,
      patternSeed,
      textPadding,
      lineHeight,
      glassBackground,
      watermarkEnabled,
      watermarkText,
      watermarkOpacity,
      watermarkSize,
      watermarkPosition,
      watermarkRotation
    };
  }

  private async callGenerationAPI(
    config: GenerationConfig,
    isAuthenticated: boolean = false
  ): Promise<{
    svg: string;
    seed: string;
    dimensions: { width: number; height: number };
    aspectRatio: string;
    // Actual values used during generation
    actualSeed: string;
    actualAvatarSeed: string;
    actualQuote: { text: string; author?: string };
    actualShapeCount: number;
    actualAvatarPositioning: { x: number; y: number; size: number };
    actualTextMaxWidth: number;
    actualTextStartY: number;
    actualFontSize: number;
    actualBorderColor: string;
    actualBorderOpacity: number;
    actualPatternSeed: string;
    actualTextPadding: number;
    actualLineHeight: number;
    actualGlassBackground: boolean;
  }> {
    try {
      // SECURITY: Validate user permissions and sanitize config
      const validatedConfig = await this.validateAndSanitizeConfig(
        config,
        isAuthenticated
      );

      // Use the actual seed or generate a random one
      const actualSeed =
        validatedConfig.seed || Math.random().toString(36).substring(2, 15);
      const actualAvatarSeed = validatedConfig.avatarSeed || actualSeed;

      // Get aspect ratio configuration
      const aspectConfig =
        ASPECT_RATIOS[validatedConfig.aspectRatio] || ASPECT_RATIOS['default'];

      // Apply custom dimensions if provided
      const finalConfig = {
        ...aspectConfig,
        width: validatedConfig.customWidth || aspectConfig.width,
        height: validatedConfig.customHeight || aspectConfig.height,
        // Override positioning if custom values provided
        avatarX:
          validatedConfig.avatarX !== undefined
            ? validatedConfig.avatarX
            : aspectConfig.avatarX,
        avatarY:
          validatedConfig.avatarY !== undefined
            ? validatedConfig.avatarY
            : aspectConfig.avatarY,
        avatarSize:
          validatedConfig.avatarSize !== undefined
            ? validatedConfig.avatarSize
            : aspectConfig.avatarSize
      };

      // Get quote (custom or random)
      let actualQuote;
      if (validatedConfig.quote || validatedConfig.author) {
        // For custom quotes, use the QuoteService to handle author attribution properly
        actualQuote = await this.quoteService.getQuote(
          validatedConfig.quote,
          validatedConfig.author
        );
      } else {
        actualQuote = await this.quoteService.fetchRandomQuote();
      }

      // Generate avatar
      const avatarSvg = this.avatarService.generateAvatar(actualAvatarSeed);

      // Calculate avatar positioning
      const actualAvatarPositioning =
        this.avatarService.calculateAvatarPositioning(
          finalConfig,
          validatedConfig.aspectRatio
        );

      // Generate pattern seed if not provided
      const actualPatternSeed = validatedConfig.patternSeed || actualSeed;

      // Determine actual shape count
      const actualShapeCount = validatedConfig.shapeCount || 8; // Default from config

      // Determine watermark configuration based on user type and subscription status
      let watermarkConfig: WatermarkConfig | undefined;

      if (!isAuthenticated) {
        // Guest users get repeated watermarks
        watermarkConfig = WATERMARK_CONFIG;
      } else {
        // For authenticated users, check subscription status
        try {
          // Get user session to check subscription
          const session = await auth();
          if (session?.user?.id) {
            const userId = parseInt(session.user.id);

            // Check subscription status using existing database query
            const subscriptions = await sql<
              Array<{
                plan_name: string;
                plan_type: string;
                status: string;
              }>
            >`
              SELECT sp.name as plan_name, sp.plan_type, us.status
              FROM user_subscriptions us
              JOIN subscription_plans sp ON us.plan_id = sp.id
              WHERE us.user_id = ${userId}
                AND us.status IN ('active', 'trialing')
                AND (us.expires_at IS NULL OR us.expires_at > NOW())
                AND sp.is_active = true
              ORDER BY us.created_at DESC
              LIMIT 1
            `;

            // Check if user has Pro subscription
            const isPro =
              subscriptions.length > 0 &&
              subscriptions[0].plan_type === 'tier' &&
              (subscriptions[0].plan_name.toLowerCase().includes('pro') ||
                subscriptions[0].plan_name
                  .toLowerCase()
                  .includes('enterprise'));

            if (!isPro) {
              // Authenticated free tier users get top-left watermark
              watermarkConfig = WATERMARK_CONFIG_FREE_TIER;
            } else if (validatedConfig.watermarkEnabled) {
              // Pro users can enable custom watermarks with smart defaults
              const proPosition =
                (validatedConfig.watermarkPosition as any) || 'repeated';
              const defaultRotation = proPosition === 'repeated' ? -25 : 0;
              watermarkConfig = {
                enabled: true,
                text:
                  validatedConfig.watermarkText ||
                  'https://idling.app/card-generator',
                opacity: validatedConfig.watermarkOpacity || 0.15,
                fontSize: validatedConfig.watermarkSize || 16,
                position: proPosition,
                rotation:
                  validatedConfig.watermarkRotation !== undefined
                    ? validatedConfig.watermarkRotation
                    : defaultRotation, // -25° for repeated, 0° for single positions
                color: '#ffffff',
                fontFamily:
                  'FiraCode, "Fira Code", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                margin: 40,
                pattern: 'single',
                spacing: 200
              };
            }
            // Pro users without watermark enabled get no watermark (watermarkConfig remains undefined)
          } else {
            // No valid session - apply guest watermark as fallback
            watermarkConfig = WATERMARK_CONFIG;
          }
        } catch (error) {
          console.warn(
            'Failed to check subscription status, applying guest watermark as fallback:',
            error
          );
          watermarkConfig = WATERMARK_CONFIG;
        }
      }

      // Generate SVG using the SVGGenerator with ALL options
      const svgResult = this.svgGenerator.generateSVG(
        avatarSvg,
        actualQuote,
        actualPatternSeed,
        finalConfig,
        validatedConfig.aspectRatio,
        actualAvatarPositioning,
        actualShapeCount,
        {
          // Visual styling options
          fontSize: validatedConfig.fontSize,
          borderColor: validatedConfig.borderColor,
          borderOpacity: validatedConfig.borderOpacity,
          patternSeed: validatedConfig.patternSeed,
          textPadding: validatedConfig.textPadding,
          lineHeight: validatedConfig.lineHeight,
          glassBackground: validatedConfig.glassBackground,

          // Positioning overrides
          avatarX: validatedConfig.avatarX,
          avatarY: validatedConfig.avatarY,
          avatarSize: validatedConfig.avatarSize,
          textMaxWidth: validatedConfig.textMaxWidth,
          textStartY: validatedConfig.textStartY
        },
        watermarkConfig // Pass watermark config for guest users
      );

      return {
        svg: svgResult.svg,
        seed: actualSeed,
        dimensions: {
          width: finalConfig.width,
          height: finalConfig.height
        },
        aspectRatio: validatedConfig.aspectRatio,
        // Return all actual values used from SVGGenerator
        actualSeed,
        actualAvatarSeed,
        actualQuote,
        actualShapeCount: svgResult.actualValues.shapeCount,
        actualAvatarPositioning: {
          x: svgResult.actualValues.avatarX,
          y: svgResult.actualValues.avatarY,
          size: svgResult.actualValues.avatarSize
        },
        actualTextMaxWidth: svgResult.actualValues.textMaxWidth,
        actualTextStartY: svgResult.actualValues.textStartY,
        actualFontSize: svgResult.actualValues.fontSize,
        actualBorderColor: svgResult.actualValues.borderColor,
        actualBorderOpacity: svgResult.actualValues.borderOpacity,
        actualPatternSeed: svgResult.actualValues.patternSeed,
        actualTextPadding: svgResult.actualValues.textPadding,
        actualLineHeight: svgResult.actualValues.lineHeight,
        actualGlassBackground: svgResult.actualValues.glassBackground
      };
    } catch (error) {
      console.error('Direct generation failed:', error);

      // Return fallback image on error
      const aspectConfig =
        ASPECT_RATIOS[config.aspectRatio] || ASPECT_RATIOS['default'];
      const fallbackSvg = this.generateFallbackImage(config.aspectRatio);
      const fallbackSeed = config.seed || 'fallback';

      return {
        svg: fallbackSvg,
        seed: fallbackSeed,
        dimensions: {
          width: aspectConfig.width,
          height: aspectConfig.height
        },
        aspectRatio: config.aspectRatio,
        // Fallback actual values
        actualSeed: fallbackSeed,
        actualAvatarSeed: fallbackSeed,
        actualQuote: { text: 'Idling.app', author: 'Wisdom & Community' },
        actualShapeCount: 0,
        actualAvatarPositioning: {
          x: aspectConfig.width / 2,
          y: aspectConfig.height * 0.3,
          size: 100
        },
        actualTextMaxWidth: aspectConfig.width * 0.8,
        actualTextStartY: aspectConfig.height * 0.6,
        actualFontSize: 42,
        actualBorderColor: '#ffffff',
        actualBorderOpacity: 0.7,
        actualPatternSeed: fallbackSeed,
        actualTextPadding: 30,
        actualLineHeight: 1.4,
        actualGlassBackground: false
      };
    }
  }

  /**
   * SECURITY: Validates user permissions and sanitizes config to prevent privilege escalation
   */
  private async validateAndSanitizeConfig(
    config: GenerationConfig,
    isAuthenticated: boolean
  ): Promise<GenerationConfig> {
    // Start with a clean base config with only free parameters
    const sanitizedConfig: GenerationConfig = {
      // Free parameters - always allowed
      seed: config.seed,
      avatarSeed: config.avatarSeed,
      quote: config.quote,
      author: config.author,
      aspectRatio: config.aspectRatio,
      customWidth: config.customWidth,
      customHeight: config.customHeight,

      // Pro parameters - default to undefined (will be validated)
      shapeCount: undefined,
      avatarX: undefined,
      avatarY: undefined,
      avatarSize: undefined,
      textMaxWidth: undefined,
      textStartY: undefined,
      fontSize: undefined,
      borderColor: undefined,
      borderOpacity: undefined,
      patternSeed: undefined,
      textPadding: undefined,
      lineHeight: undefined,
      glassBackground: undefined,

      // Pro watermark controls - default to undefined
      watermarkEnabled: undefined,
      watermarkText: undefined,
      watermarkOpacity: undefined,
      watermarkSize: undefined,
      watermarkPosition: undefined,
      watermarkRotation: undefined
    };

    // Check if Pro-only parameters were attempted
    const proOnlyParams = [
      'shapeCount',
      'avatarX',
      'avatarY',
      'avatarSize',
      'textMaxWidth',
      'textStartY',
      'fontSize',
      'borderColor',
      'borderOpacity',
      'patternSeed',
      'textPadding',
      'lineHeight',
      'glassBackground',
      'watermarkEnabled',
      'watermarkText',
      'watermarkOpacity',
      'watermarkSize',
      'watermarkPosition',
      'watermarkRotation'
    ];

    const attemptedProParams = proOnlyParams.filter(
      (param) => config[param as keyof GenerationConfig] !== undefined
    );

    // If user is not authenticated, return only free parameters
    if (!isAuthenticated) {
      if (attemptedProParams.length > 0) {
        console.warn(
          'SECURITY: Guest user attempted to access Pro-only parameters:',
          attemptedProParams
        );
      }
      return sanitizedConfig;
    }

    // For authenticated users, check Pro status
    try {
      const session = await auth();
      if (session?.user?.id) {
        const userId = parseInt(session.user.id);

        // Check subscription status
        const subscriptions = await sql<
          Array<{
            plan_name: string;
            plan_type: string;
            status: string;
          }>
        >`
          SELECT sp.name as plan_name, sp.plan_type, us.status
          FROM user_subscriptions us
          JOIN subscription_plans sp ON us.plan_id = sp.id
          WHERE us.user_id = ${userId}
            AND us.status IN ('active', 'trialing')
            AND (us.expires_at IS NULL OR us.expires_at > NOW())
            AND sp.is_active = true
          ORDER BY us.created_at DESC
          LIMIT 1
        `;

        // Check if user has Pro subscription
        const isPro =
          subscriptions.length > 0 &&
          subscriptions[0].plan_type === 'tier' &&
          (subscriptions[0].plan_name.toLowerCase().includes('pro') ||
            subscriptions[0].plan_name.toLowerCase().includes('enterprise'));

        if (isPro) {
          // Pro users can use all parameters
          return {
            ...sanitizedConfig,
            // Pro positioning controls
            shapeCount: config.shapeCount,
            avatarX: config.avatarX,
            avatarY: config.avatarY,
            avatarSize: config.avatarSize,
            textMaxWidth: config.textMaxWidth,
            textStartY: config.textStartY,

            // Pro visual controls
            fontSize: config.fontSize,
            borderColor: config.borderColor,
            borderOpacity: config.borderOpacity,
            patternSeed: config.patternSeed,
            textPadding: config.textPadding,
            lineHeight: config.lineHeight,
            glassBackground: config.glassBackground,

            // Pro watermark controls
            watermarkEnabled: config.watermarkEnabled,
            watermarkText: config.watermarkText,
            watermarkOpacity: config.watermarkOpacity,
            watermarkSize: config.watermarkSize,
            watermarkPosition: config.watermarkPosition,
            watermarkRotation: config.watermarkRotation
          };
        } else {
          // Non-Pro authenticated user attempted Pro features
          if (attemptedProParams.length > 0) {
            console.warn(
              `SECURITY: Non-Pro user ${userId} attempted to access Pro-only parameters:`,
              attemptedProParams
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        'Failed to validate Pro status during config sanitization:',
        error
      );
    }

    // Non-Pro authenticated users get only free parameters
    return sanitizedConfig;
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  generateFallbackImage(aspectRatio: string = 'default'): string {
    const config = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['default'];
    const { width, height } = config;

    const centerX = width / 2;
    const centerY1 = height * 0.4;
    const centerY2 = height * 0.52;
    const centerY3 = height * 0.62;
    const viewBox = `0 0 ${width} ${height}`;

    return `<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7931e;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  
  <!-- Decorative elements -->
  <circle cx="${width * 0.15}" cy="${height * 0.2}" r="40" fill="rgba(255,107,53,0.1)"/>
  <circle cx="${width * 0.85}" cy="${height * 0.8}" r="60" fill="rgba(247,147,30,0.1)"/>
  <circle cx="${width * 0.9}" cy="${height * 0.15}" r="25" fill="rgba(255,255,255,0.05)"/>
  
  <!-- Main title -->
  <text x="${centerX}" y="${centerY1}" text-anchor="middle" fill="url(#titleGrad)" 
        font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700"
        style="font-size: 72px !important; letter-spacing: -2px;">Idling.app</text>
  
  <!-- Subtitle -->
  <text x="${centerX}" y="${centerY2}" text-anchor="middle" fill="rgba(255,255,255,0.9)" 
        font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400"
        style="font-size: 28px !important;">Wisdom &amp; Community</text>
  
  <!-- Description -->
  <text x="${centerX}" y="${centerY3}" text-anchor="middle" fill="rgba(255,255,255,0.7)" 
        font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="300"
        style="font-size: 20px !important;">Revisit often to see the latest changes and play!</text>
</svg>`;
  }

  private generateMachineFingerprint(request: NextRequest): string {
    // Simple machine fingerprinting based on headers
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';

    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;

    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36).substring(0, 32);
  }

  private hashUserAgent(userAgent: string): string {
    // Simple hash for user agent
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 64);
  }
}
