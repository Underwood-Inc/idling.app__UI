import { AspectRatioConfig, AvatarPositioning, QuoteData, TextPositioning } from '../types';
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
    }
  ): {
    svg: string;
    actualValues: {
      // All actual values used during generation
      fontSize: number;
      borderColor: string;
      borderOpacity: number;
      patternSeed: string;
      textPadding: number;
      lineHeight: number;
      glassBackground: boolean;
      avatarX: number;
      avatarY: number;
      avatarSize: number;
      textMaxWidth: number;
      textStartY: number;
      shapeCount: number;
    };
  } {
    const { width, height } = config;

    // Use custom positioning overrides if provided
    const finalAvatarX = allCustomOptions?.avatarX ?? avatarPositioning.x;
    const finalAvatarY = allCustomOptions?.avatarY ?? avatarPositioning.y;
    const finalAvatarSize = allCustomOptions?.avatarSize ?? avatarPositioning.size;
    const finalTextMaxWidth = allCustomOptions?.textMaxWidth ?? config.textMaxWidth;
    const finalTextStartY = allCustomOptions?.textStartY ?? config.textStartY;
    const finalShapeCount = shapeCount ?? 8;

    // Generate background patterns and get predominant color for border
    const backgroundResult = this.patternGenerator.generateBackgroundPattern(
      patternSeed,
      width,
      height,
      finalShapeCount
    );
    const finalBorderColor = allCustomOptions?.borderColor ?? backgroundResult.predominantColor;
    const finalBorderOpacity = allCustomOptions?.borderOpacity ?? 0.7;
    const finalGlassBackground = allCustomOptions?.glassBackground ?? false;

    // Calculate text positioning with custom styles
    const finalFontSize = allCustomOptions?.fontSize;
    const finalLineHeight = allCustomOptions?.lineHeight;
    const textPositioning = this.calculateTextPositioning(
      quote, 
      { ...config, textMaxWidth: finalTextMaxWidth, textStartY: finalTextStartY }, 
      aspectRatio, 
      finalFontSize,
      finalLineHeight
    );

    // Calculate glass background for text with custom padding
    const finalTextPadding = allCustomOptions?.textPadding ?? 30;
    const glassBackground = this.calculateGlassBackground(
      textPositioning,
      width,
      finalTextMaxWidth,
      finalTextPadding
    );

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
      finalGlassBackground ? glassBackground : null
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

  getPatternResult(seed: string, width: number, height: number, shapeCount?: number) {
    return this.patternGenerator.generateBackgroundPattern(seed, width, height, shapeCount);
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

      if (quote.text.length > 100) fontSize = Math.floor(fontSize * 0.9);
      else if (quote.text.length > 150) fontSize = Math.floor(fontSize * 0.8);
      else if (quote.text.length > 200) fontSize = Math.floor(fontSize * 0.7);

      // Ensure minimum readable font size
      fontSize = Math.max(fontSize, 18);
    }

    // Wrap text
    const quoteText = `"${quote.text}" — ${quote.author}`;
    const maxCharsPerLine = Math.floor(textMaxWidth / (fontSize * 0.6));
    const lines = wrapTextForSVG(quoteText, maxCharsPerLine);

    // Calculate text positioning - better logic for narrow formats
    const lineHeight = (customLineHeight || 1.4) * fontSize;
    const totalTextHeight = lines.length * lineHeight;

    let adjustedTextStartY;
    if (height < 500) {
      // For very narrow formats like LinkedIn/Twitter banners
      adjustedTextStartY = height * 0.7;
    } else if (height < 700) {
      // For medium height formats like YouTube
      adjustedTextStartY = textStartY + (height - 630) * 0.2;
    } else {
      // For other tall formats like 4:3
      adjustedTextStartY = textStartY + (height - 630) * 0.1;
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
    textMaxWidth: number,
    customPadding?: number
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
    const glassX = (width - textWidth) / 2;
    const glassY = textPositioning.startY - 27 - (textHeight - totalTextHeight) / 2;

    return {
      x: glassX,
      y: glassY,
      width: textWidth,
      height: textHeight
    };
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
    glassBackground: { x: number; y: number; width: number; height: number } | null
  ): string {
    const lineHeight = textPositioning.fontSize * 1.4;

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
  ${glassBackground ? `<rect x="${glassBackground.x}" y="${glassBackground.y}" width="${glassBackground.width}" height="${glassBackground.height}" 
        rx="16" ry="16" 
        fill="rgba(0, 0, 0, 0.6)" 
        stroke="rgba(255, 255, 255, 0.1)" 
        stroke-width="1"
        filter="url(#glassFilter)"/>` : ''}
  
  <!-- Text -->
  ${textPositioning.lines
    .map(
      (line, index) =>
        `<text x="${width / 2}" y="${textPositioning.startY + index * lineHeight}" 
           text-anchor="middle" 
           fill="white" 
           font-family="system-ui, -apple-system, sans-serif" 
           font-size="${textPositioning.fontSize}px"
           style="font-size: ${textPositioning.fontSize}px !important; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${escapeXml(line)}</text>`
    )
    .join('\n  ')}
</svg>`;
  }
} 