import { NextRequest } from 'next/server';
import { rateLimitService } from '../../../../lib/services/RateLimitService';
import { formatRetryAfter } from '../../../../lib/utils/timeFormatting';
import { ASPECT_RATIOS } from '../config';
import { AvatarService } from './AvatarService';
import { DatabaseService } from './DatabaseService';
import { QuoteService } from './QuoteService';
import { SVGGenerator } from './SVGGenerator';

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
}

interface GenerationResponse {
  svg: string;
  seed: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  generationOptions: GenerationConfig;
  remainingGenerations: number;
  generationId?: string;
  id?: string;
}

export class OGImageService {
  private quoteService = new QuoteService();
  private avatarService = new AvatarService();
  private svgGenerator = new SVGGenerator();
  private databaseService = DatabaseService.getInstance();

  constructor() {
    // DatabaseService now uses singleton pattern
  }

  async generateImage(request: NextRequest): Promise<GenerationResponse> {
    const { searchParams } = new URL(request.url);
    const isDryRun = searchParams.get('dry-run') === 'true';
    
    // Get client IP for unified quota tracking
    const clientIP = this.getClientIP(request);
    
    // Use unified RateLimitService for all quota checking - single source of truth
    const rateLimitResult = await rateLimitService.checkRateLimit({
      identifier: clientIP,
      configType: 'og-image',
    });
    
    if (!isDryRun && !rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      const retryAfterSeconds = rateLimitResult.retryAfter || 86400;
      const humanTime = formatRetryAfter(retryAfterSeconds);
      
      throw new Error(`Daily generation limit exceeded. Try again in ${humanTime} or upgrade to Pro for unlimited generations.`);
    }

    // If dry run, just return quota info
    if (isDryRun) {
      return {
        svg: '',
        seed: '',
        dimensions: { width: 0, height: 0 },
        aspectRatio: 'default',
        generationOptions: this.buildGenerationConfig(searchParams),
        remainingGenerations: rateLimitResult.remaining,
        generationId: '',
        id: ''
      };
    }

    // Build complete generation config
    const config = this.buildGenerationConfig(searchParams);
    
    // Generate the image with actual values
    const result = await this.callGenerationAPI(config);

    // Record generation in database (this also handles quota tracking)
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

    // No need for separate rate limiting recording - database handles quota tracking

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
      remainingGenerations: Math.max(0, rateLimitResult.remaining - 1),
      generationId: generationId || undefined,
      id: generationId || undefined // For compatibility
    };
  }

  private buildGenerationConfig(searchParams: URLSearchParams): GenerationConfig {
    // Extract all parameters from URL
    const customSeed = searchParams.get('seed');
    const avatarSeed = searchParams.get('avatarSeed');
    const customQuote = searchParams.get('quote');
    const customAuthor = searchParams.get('author');
    const aspectRatio = searchParams.get('ratio') || searchParams.get('aspect') || 'default';
    
    const customWidth = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined;
    const customHeight = searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined;
    const shapeCount = searchParams.get('shapes') ? parseInt(searchParams.get('shapes')!) : undefined;
    
    // Advanced positioning controls
    const avatarX = searchParams.get('avatarX') ? parseFloat(searchParams.get('avatarX')!) : undefined;
    const avatarY = searchParams.get('avatarY') ? parseFloat(searchParams.get('avatarY')!) : undefined;
    const avatarSize = searchParams.get('avatarSize') ? parseFloat(searchParams.get('avatarSize')!) : undefined;
    const textMaxWidth = searchParams.get('textMaxWidth') ? parseFloat(searchParams.get('textMaxWidth')!) : undefined;
    const textStartY = searchParams.get('textStartY') ? parseFloat(searchParams.get('textStartY')!) : undefined;
    const fontSize = searchParams.get('fontSize') ? parseFloat(searchParams.get('fontSize')!) : undefined;
    
    // Visual styling controls
    const borderColor = searchParams.get('borderColor') || undefined;
    const borderOpacity = searchParams.get('borderOpacity') ? parseFloat(searchParams.get('borderOpacity')!) : undefined;
    const patternSeed = searchParams.get('patternSeed') || undefined;
    const textPadding = searchParams.get('textPadding') ? parseFloat(searchParams.get('textPadding')!) : undefined;
    const lineHeight = searchParams.get('lineHeight') ? parseFloat(searchParams.get('lineHeight')!) : undefined;
    const glassBackground = searchParams.get('glassBackground') === 'true';

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
      glassBackground
    };
  }

  private async callGenerationAPI(config: GenerationConfig): Promise<{ 
    svg: string; 
    seed: string; 
    dimensions: { width: number; height: number }; 
    aspectRatio: string;
    // Actual values used during generation
    actualSeed: string;
    actualAvatarSeed: string;
    actualQuote: { text: string; author: string };
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
      // Use the actual seed or generate a random one
      const actualSeed = config.seed || Math.random().toString(36).substring(2, 15);
      const actualAvatarSeed = config.avatarSeed || actualSeed;
      
      // Get aspect ratio configuration
      const aspectConfig = ASPECT_RATIOS[config.aspectRatio] || ASPECT_RATIOS['default'];
      
      // Apply custom dimensions if provided
      const finalConfig = {
        ...aspectConfig,
        width: config.customWidth || aspectConfig.width,
        height: config.customHeight || aspectConfig.height,
        // Override positioning if custom values provided
        avatarX: config.avatarX !== undefined ? config.avatarX : aspectConfig.avatarX,
        avatarY: config.avatarY !== undefined ? config.avatarY : aspectConfig.avatarY,
        avatarSize: config.avatarSize !== undefined ? config.avatarSize : aspectConfig.avatarSize
      };

      // Get quote (custom or random)
      let actualQuote;
      if (config.quote || config.author) {
        actualQuote = {
          text: config.quote || 'The journey of a thousand miles begins with one step.',
          author: config.author || 'Lao Tzu'
        };
      } else {
        actualQuote = await this.quoteService.fetchRandomQuote();
      }

      // Generate avatar
      const avatarSvg = this.avatarService.generateAvatar(actualAvatarSeed);

      // Calculate avatar positioning
      const actualAvatarPositioning = this.avatarService.calculateAvatarPositioning(
        finalConfig,
        config.aspectRatio
      );

      // Generate pattern seed if not provided
      const actualPatternSeed = config.patternSeed || actualSeed;

      // Determine actual shape count
      const actualShapeCount = config.shapeCount || 8; // Default from config

      // Generate SVG using the SVGGenerator with ALL options
      const svgResult = this.svgGenerator.generateSVG(
        avatarSvg,
        actualQuote,
        actualPatternSeed,
        finalConfig,
        config.aspectRatio,
        actualAvatarPositioning,
        actualShapeCount,
        {
          // Visual styling options
          fontSize: config.fontSize,
          borderColor: config.borderColor,
          borderOpacity: config.borderOpacity,
          patternSeed: config.patternSeed,
          textPadding: config.textPadding,
          lineHeight: config.lineHeight,
          glassBackground: config.glassBackground,
          
          // Positioning overrides
          avatarX: config.avatarX,
          avatarY: config.avatarY,
          avatarSize: config.avatarSize,
          textMaxWidth: config.textMaxWidth,
          textStartY: config.textStartY
        }
      );

      return {
        svg: svgResult.svg,
        seed: actualSeed,
        dimensions: {
          width: finalConfig.width,
          height: finalConfig.height
        },
        aspectRatio: config.aspectRatio,
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
      const aspectConfig = ASPECT_RATIOS[config.aspectRatio] || ASPECT_RATIOS['default'];
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
        actualAvatarPositioning: { x: aspectConfig.width / 2, y: aspectConfig.height * 0.3, size: 100 },
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
    const centerY1 = height * 0.45;
    const centerY2 = height * 0.55;
    const viewBox = `0 0 ${width} ${height}`;
    
    return `<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0a0a0a"/>
  <text x="${centerX}" y="${centerY1}" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" 
        font-size="60px" style="font-size: 60px !important;">Idling.app</text>
  <text x="${centerX}" y="${centerY2}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" 
        font-size="32px" style="font-size: 32px !important;">Wisdom &amp; Community</text>
</svg>`;
  }
} 