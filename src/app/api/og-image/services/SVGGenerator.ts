import {
  AspectRatioConfig,
  AvatarPositioning,
  QuoteData,
  TextPositioning,
  WatermarkConfig
} from '../types';
import { escapeXml, wrapTextForSVG } from '../utils';
import { BasePatternGenerator } from './patterns/BasePatternGenerator';

export class SVGGenerator {
  private patternGenerator = new BasePatternGenerator();

  generateSVG(
    avatarSvg: string,
    quote: QuoteData,
    patternSeed: string,
    config: AspectRatioConfig,
    aspectRatio: string,
    avatarPositioning: AvatarPositioning,
    shapeCount?: number,
    allCustomOptions?: {
      // Visual styling (7)
      fontSize?: number;
      borderColor?: string;
      borderOpacity?: number;
      patternSeed?: string;
      textPadding?: number;
      lineHeight?: number;
      glassBackground?: boolean;

      // Positioning overrides (5)
      avatarX?: number;
      avatarY?: number;
      avatarSize?: number;
      textMaxWidth?: number;
      textStartY?: number;

      // Pro watermark controls
      watermarkEnabled?: boolean;
      watermarkText?: string;
      watermarkOpacity?: number;
      watermarkSize?: number;
      watermarkPosition?:
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right'
        | 'center'
        | 'repeated';
      watermarkRotation?: number;
    },
    defaultWatermarkConfig?: WatermarkConfig // Default watermark for non-Pro users
  ): {
    svg: string;
    actualValues: {
      // All actual values used during generation
      shapeCount: number;
      avatarX: number;
      avatarY: number;
      avatarSize: number;
      textMaxWidth: number;
      textStartY: number;
      fontSize: number;
      borderColor: string;
      borderOpacity: number;
      patternSeed: string;
      textPadding: number;
      lineHeight: number;
      glassBackground: boolean;
    };
  } {
    const { width, height } = config;

    // Use custom positioning overrides if provided
    const finalAvatarX = allCustomOptions?.avatarX ?? avatarPositioning.x;
    const finalAvatarY = allCustomOptions?.avatarY ?? avatarPositioning.y;
    const finalAvatarSize =
      allCustomOptions?.avatarSize ?? avatarPositioning.size;
    const finalTextMaxWidth =
      allCustomOptions?.textMaxWidth ?? config.textMaxWidth;
    const finalTextStartY = allCustomOptions?.textStartY ?? config.textStartY;
    const finalShapeCount = shapeCount ?? 8;

    // Generate background patterns and get predominant color for border
    const backgroundResult = this.patternGenerator.generateBackgroundPattern(
      patternSeed,
      width,
      height,
      finalShapeCount
    );
    const finalBorderColor =
      allCustomOptions?.borderColor ?? backgroundResult.predominantColor;
    const finalBorderOpacity = allCustomOptions?.borderOpacity ?? 0.7;
    const finalGlassBackground = allCustomOptions?.glassBackground ?? true;

    // Calculate text positioning with custom styles
    const finalFontSize = allCustomOptions?.fontSize;
    const finalLineHeight = allCustomOptions?.lineHeight;
    const textPositioning = this.calculateTextPositioning(
      quote,
      {
        ...config,
        textMaxWidth: finalTextMaxWidth,
        textStartY: finalTextStartY
      },
      aspectRatio,
      finalFontSize,
      finalLineHeight
    );

    // Calculate glass background for text with custom padding
    const finalTextPadding = allCustomOptions?.textPadding ?? 30;
    const glassBackground = this.calculateGlassBackground(
      textPositioning,
      width,
      height,
      finalTextMaxWidth,
      finalTextPadding,
      aspectRatio
    );

    // Calculate watermark positioning if watermark is enabled
    const watermarkConfig = allCustomOptions?.watermarkEnabled
      ? ({
          enabled: true,
          text:
            allCustomOptions.watermarkText ||
            'https://idling.app/card-generator',
          fontSize: allCustomOptions.watermarkSize || 16, // Pro default: 16
          opacity: allCustomOptions.watermarkOpacity || 0.15,
          rotation:
            allCustomOptions.watermarkRotation !== undefined
              ? allCustomOptions.watermarkRotation
              : 0, // Pro default: 0 rotation
          color: '#ffffff',
          fontFamily:
            'FiraCode, "Fira Code", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          spacing: 200,
          margin: 40,
          pattern: 'single', // Pro default: single watermark
          position: allCustomOptions.watermarkPosition || 'bottom-right' // Pro default: bottom-right
        } as WatermarkConfig)
      : defaultWatermarkConfig;

    const watermarkPositioning = watermarkConfig?.enabled
      ? this.calculateWatermarkPositioning(watermarkConfig, width, height)
      : undefined;

    const svg = this.buildSVG(
      width,
      height,
      finalBorderColor,
      finalBorderOpacity,
      backgroundResult.patterns,
      avatarSvg,
      { x: finalAvatarX, y: finalAvatarY, size: finalAvatarSize },
      quote,
      textPositioning,
      finalGlassBackground ? glassBackground : null,
      aspectRatio,
      watermarkPositioning, // Pass watermark positioning
      watermarkConfig // Pass watermark config
    );

    return {
      svg,
      actualValues: {
        fontSize: textPositioning.fontSize,
        borderColor: finalBorderColor,
        borderOpacity: finalBorderOpacity,
        patternSeed: patternSeed,
        textPadding: finalTextPadding,
        lineHeight: finalLineHeight ?? 1.4,
        glassBackground: finalGlassBackground,
        avatarX: finalAvatarX,
        avatarY: finalAvatarY,
        avatarSize: finalAvatarSize,
        textMaxWidth: finalTextMaxWidth,
        textStartY: finalTextStartY,
        shapeCount: finalShapeCount
      }
    };
  }

  getPatternResult(
    seed: string,
    width: number,
    height: number,
    shapeCount?: number
  ) {
    return this.patternGenerator.generateBackgroundPattern(
      seed,
      width,
      height,
      shapeCount
    );
  }

  private calculateTextPositioning(
    quote: QuoteData,
    config: AspectRatioConfig,
    aspectRatio: string,
    customFontSize?: number,
    customLineHeight?: number
  ): TextPositioning {
    const { width, height, textMaxWidth, textStartY } = config;

    // Dynamic font sizing based on aspect ratio and quote length
    let fontSize = customFontSize || 36;
    if (!customFontSize) {
      const aspectRatioFactor = Math.min(width / 1200, height / 630);
      fontSize = Math.floor(fontSize * aspectRatioFactor);

      // Apply aspect ratio specific font adjustments
      switch (aspectRatio) {
        case 'square':
          fontSize = Math.floor(fontSize * 1.15); // 15% larger for square format
          break;
        case '4-3':
          fontSize = Math.floor(fontSize * 1.1); // 10% larger for 4:3 format
          break;
        case 'youtube':
          fontSize = Math.floor(fontSize * 1.05); // 5% larger for YouTube format
          break;
        case 'facebook-cover':
          fontSize = Math.floor(fontSize * 1.08); // 8% larger for Facebook cover
          break;
        case 'twitter-header':
          fontSize = Math.floor(fontSize * 1.12); // 12% larger for Twitter header
          break;
        case 'linkedin-banner':
          fontSize = Math.floor(fontSize * 1.4); // 40% larger for LinkedIn banner (wide format needs bigger text)
          break;
        default:
          // No adjustment for default and other formats
          break;
      }

      if (quote.text.length > 100) fontSize = Math.floor(fontSize * 0.9);
      else if (quote.text.length > 150) fontSize = Math.floor(fontSize * 0.8);
      else if (quote.text.length > 200) fontSize = Math.floor(fontSize * 0.7);

      // Ensure minimum readable font size
      fontSize = Math.max(fontSize, 20); // Increased minimum from 18 to 20
    }

    // Wrap text - conditionally include author attribution
    const quoteText = quote.author
      ? `"${quote.text}" — ${quote.author}`
      : `"${quote.text}"`;
    const maxCharsPerLine = Math.floor(textMaxWidth / (fontSize * 0.6));
    const lines = wrapTextForSVG(quoteText, maxCharsPerLine);

    // Calculate text positioning - optimized for all aspect ratios
    const lineHeight = (customLineHeight || 1.4) * fontSize;
    const totalTextHeight = lines.length * lineHeight;

    let adjustedTextStartY;

    // Handle narrow formats first (height-based check)
    if (height < 500 && aspectRatio !== 'linkedin-banner') {
      // For other very narrow formats (Twitter header, etc.)
      adjustedTextStartY = height * 0.75;
    } else {
      // Handle specific aspect ratios
      switch (aspectRatio) {
        case 'square':
          // For square format, position text for centralized composition
          adjustedTextStartY = Math.max(textStartY, height * 0.7);
          break;
        case '4-3':
          // For 4:3 format, use more vertical space effectively
          adjustedTextStartY = Math.max(textStartY, height * 0.75);
          break;
        case 'youtube':
          // For YouTube 16:9 format, optimize for wider canvas
          adjustedTextStartY = Math.max(textStartY, height * 0.72);
          break;
        case 'facebook-cover':
          // For Facebook cover, similar to default but slightly optimized
          adjustedTextStartY = Math.max(textStartY, height * 0.71);
          break;
        case 'twitter-header':
          // For Twitter header, wide format optimization
          adjustedTextStartY = Math.max(textStartY, height * 0.76);
          break;
        case 'linkedin-banner':
          // For LinkedIn banner, wide format optimization
          adjustedTextStartY = Math.max(textStartY, height * 0.71);
          break;
        default:
          // For other formats, use height-based logic
          if (height < 700) {
            adjustedTextStartY = textStartY + (height - 630) * 0.2;
          } else {
            adjustedTextStartY = textStartY + (height - 630) * 0.1;
          }
          break;
      }
    }

    const finalTextStartY = adjustedTextStartY - totalTextHeight / 2;

    return {
      startY: finalTextStartY,
      maxWidth: textMaxWidth,
      fontSize,
      lines
    };
  }

  private calculateGlassBackground(
    textPositioning: TextPositioning,
    width: number,
    height: number,
    textMaxWidth: number,
    customPadding?: number,
    aspectRatio?: string
  ): { x: number; y: number; width: number; height: number } {
    const padding = customPadding || 30;
    const longestLine = textPositioning.lines.reduce(
      (max, line) => (line.length > max.length ? line : max),
      ''
    );
    const approxCharWidth = textPositioning.fontSize * 0.45;
    const textWidth = Math.min(
      longestLine.length * approxCharWidth + padding * 2,
      textMaxWidth
    );
    const lineHeight = textPositioning.fontSize * 1.4;
    const totalTextHeight = textPositioning.lines.length * lineHeight;
    const textHeight = totalTextHeight + padding * 0.8;

    // Calculate glass background position
    let glassX = (width - textWidth) / 2; // Default: center horizontally

    // For LinkedIn banner, center glass background like other variants
    if (aspectRatio === 'linkedin-banner') {
      // Center glass background like other variants
      glassX = (width - textWidth) / 2;
    }

    const glassY =
      textPositioning.startY - 27 - (textHeight - totalTextHeight) / 2;

    return {
      x: glassX,
      y: glassY,
      width: textWidth,
      height: textHeight
    };
  }

  private calculateWatermarkPositioning(
    watermarkConfig: WatermarkConfig,
    width: number,
    height: number
  ):
    | Array<{ x: number; y: number; width: number; height: number }>
    | undefined {
    const {
      enabled,
      text,
      fontSize,
      pattern,
      spacing = 200,
      position
    } = watermarkConfig;

    if (!enabled) {
      return undefined;
    }

    const textWidth = text.length * (fontSize * 0.6);
    const textHeight = fontSize * 1.4;
    const positions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    if (position === 'repeated') {
      // Create a diagonal repeated pattern covering the entire image
      const stepX = spacing;
      const stepY = spacing;

      // Calculate how many watermarks we need to cover the area
      const numCols = Math.ceil(width / stepX) + 2;
      const numRows = Math.ceil(height / stepY) + 2;

      for (let row = -1; row < numRows; row++) {
        for (let col = -1; col < numCols; col++) {
          const x = col * stepX;
          const y = row * stepY;

          // Only add if within canvas bounds (with some padding)
          if (
            x >= -textWidth &&
            x <= width &&
            y >= -textHeight &&
            y <= height
          ) {
            positions.push({
              x: x,
              y: y + textHeight, // Adjust for text baseline
              width: textWidth,
              height: textHeight
            });
          }
        }
      }
    } else {
      // Single watermark positioning (existing logic)
      let watermarkX = (width - textWidth) / 2;
      let watermarkY = height - textHeight - 20;

      switch (position) {
        case 'top-left':
          watermarkX = 20;
          watermarkY = textHeight + 20;
          break;
        case 'top-right':
          watermarkX = width - textWidth - 20;
          watermarkY = textHeight + 20;
          break;
        case 'bottom-left':
          watermarkX = 20;
          watermarkY = height - 20;
          break;
        case 'bottom-right':
          watermarkX = width - textWidth - 20;
          watermarkY = height - 20;
          break;
        case 'center':
          watermarkX = (width - textWidth) / 2;
          watermarkY = (height + textHeight) / 2;
          break;
      }

      positions.push({
        x: watermarkX,
        y: watermarkY,
        width: textWidth,
        height: textHeight
      });
    }

    return positions;
  }

  private buildSVG(
    width: number,
    height: number,
    borderColor: string,
    borderOpacity: number,
    backgroundPatterns: string,
    avatarSvg: string,
    avatarPositioning: AvatarPositioning,
    quote: QuoteData,
    textPositioning: TextPositioning,
    glassBackground: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null,
    aspectRatio?: string,
    watermarkPositioning?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>,
    watermarkConfig?: WatermarkConfig
  ): string {
    const lineHeight = textPositioning.fontSize * 1.4;

    // Calculate text X position - special handling for LinkedIn banner
    let textX = width / 2; // Default: center horizontally
    let textAnchor = 'middle'; // Default: center-anchored text

    // For LinkedIn banner, center text like other variants
    if (aspectRatio === 'linkedin-banner') {
      textX = width / 2; // Center horizontally like other variants
      textAnchor = 'middle'; // Center-anchored text
    }

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Radial gradient mask for avatar fade effect -->
    <radialGradient id="avatarFade" cx="50%" cy="50%" r="35%">
      <stop offset="0%" style="stop-color:white;stop-opacity:1" />
      <stop offset="60%" style="stop-color:white;stop-opacity:1" />
      <stop offset="75%" style="stop-color:white;stop-opacity:0.9" />
      <stop offset="85%" style="stop-color:white;stop-opacity:0.6" />
      <stop offset="95%" style="stop-color:white;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:white;stop-opacity:0" />
    </radialGradient>
    
    <!-- Mask using the radial gradient -->
    <mask id="avatarMask">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#avatarFade)"/>
    </mask>
    
    <!-- Clipping path for rounded corners -->
    <clipPath id="roundedClip">
      <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="12" ry="12"/>
    </clipPath>
    
    <!-- Glass filter for text background -->
    <filter id="glassFilter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"/>
    </filter>
    
    <!-- Backdrop blur effect -->
    <filter id="backdropBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8"/>
    </filter>

  </defs>
  
  <!-- Outer border with procedural color -->
  <rect width="${width}" height="${height}" rx="20" ry="20" fill="${borderColor}" opacity="${borderOpacity}"/>
  
  <!-- Inner background with rounded corners -->
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="12" ry="12" fill="#0a0a0a"/>
  
  <!-- Dynamic Pattern Background with clipping -->
  <g clip-path="url(#roundedClip)">
    ${backgroundPatterns}
  </g>
  
  <!-- Avatar with fade effect -->
  <g mask="url(#avatarMask)">
    <image href="data:image/svg+xml;base64,${Buffer.from(avatarSvg).toString('base64')}" 
           x="${avatarPositioning.x}" y="${avatarPositioning.y}" width="${avatarPositioning.size}" height="${avatarPositioning.size}"/>
  </g>
  
  <!-- Glass background for text -->
  ${
    glassBackground
      ? `<rect x="${glassBackground.x}" y="${glassBackground.y}" width="${glassBackground.width}" height="${glassBackground.height}" 
        rx="16" ry="16" 
        fill="rgba(0, 0, 0, 0.6)" 
        stroke="rgba(255, 255, 255, 0.1)" 
        stroke-width="1"
        filter="url(#glassFilter)"/>`
      : ''
  }
  
  <!-- Watermark -->
  ${
    watermarkPositioning && watermarkConfig?.text
      ? watermarkPositioning
          .map((pos, index) => {
            // Ensure valid numbers for positioning and rotation
            const safeX = isNaN(pos.x) ? 0 : pos.x;
            const safeY = isNaN(pos.y) ? 0 : pos.y;
            const safeWidth = isNaN(pos.width) ? 0 : pos.width;
            const safeHeight = isNaN(pos.height) ? 0 : pos.height;
            const safeRotation = isNaN(watermarkConfig?.rotation ?? 0)
              ? 0
              : (watermarkConfig?.rotation ?? 0);
            const safeFontSize = isNaN(watermarkConfig?.fontSize || 24)
              ? 24
              : watermarkConfig?.fontSize || 24;
            const safeOpacity = isNaN(watermarkConfig?.opacity || 0.15)
              ? 0.15
              : watermarkConfig?.opacity || 0.15;

            // Use a simple, safe font-family without complex quotes
            const safeFontFamily = 'FiraCode, Monaco, Consolas, monospace';

            return `
        <text x="${safeX}" y="${safeY}" 
           text-anchor="start" 
           fill="${watermarkConfig?.color || '#ffffff'}" 
           font-family="${safeFontFamily}" 
           font-size="${safeFontSize}px"
           opacity="${safeOpacity}"
           transform="rotate(${safeRotation} ${safeX + safeWidth / 2} ${safeY - safeHeight / 2})"
           style="font-size: ${safeFontSize}px !important; font-weight: 600; letter-spacing: 0.05em;">${escapeXml(watermarkConfig?.text || '')}</text>
      `;
          })
          .join('\n  ')
      : ''
  }
  
  <!-- Text -->
  ${textPositioning.lines
    .map(
      (line, index) =>
        `<text x="${textX}" y="${textPositioning.startY + index * lineHeight}" 
           text-anchor="${textAnchor}" 
           fill="white" 
           font-family="system-ui, -apple-system, sans-serif" 
           font-size="${textPositioning.fontSize}px"
           style="font-size: ${textPositioning.fontSize}px !important; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${escapeXml(line)}</text>`
    )
    .join('\n  ')}
</svg>`;
  }
}
