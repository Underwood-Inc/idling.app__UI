import { BackgroundPatternResult } from '../../types';
import { seededRandom } from '../../utils';
import { LinePatternGenerator } from './LinePatternGenerator';
import { OrganicPatternGenerator } from './OrganicPatternGenerator';
import { ShapePatternGenerator } from './ShapePatternGenerator';


export class BasePatternGenerator {
  private shapeGenerator = new ShapePatternGenerator();
  private lineGenerator = new LinePatternGenerator();
  private organicGenerator = new OrganicPatternGenerator();

  /**
   * Generate completely random procedural patterns
   */
  generateBackgroundPattern(
    seed: string,
    width: number = 1200,
    height: number = 630,
    shapeCount?: number
  ): BackgroundPatternResult {
    // eslint-disable-next-line no-console
    console.log(`🎨 Pattern Generation Started - Seed: ${seed}`);

    const random = seededRandom(seed);
    const patterns: string[] = [];

    // Use brighter, more contrasting colors against dark background
    const colorOptions = [
      '#ff6b35', // Orange (brand)
      '#118ab2', // Blue (brand)
      '#06d6a0', // Green
      '#f72585', // Pink
      '#7209b7', // Purple
      '#ffd60a', // Yellow
      '#f77f00', // Amber
      '#d00000' // Red
    ];

    const primaryColor = colorOptions[Math.floor(random() * colorOptions.length)];
    let secondaryColor = colorOptions[Math.floor(random() * colorOptions.length)];
    // Ensure secondary is different from primary
    while (secondaryColor === primaryColor) {
      secondaryColor = colorOptions[Math.floor(random() * colorOptions.length)];
    }

    // Higher base opacity for better visibility against dark background
    const baseOpacity = 0.4 + random() * 0.4; // 0.4-0.8 for much better visibility

    // Track color usage to determine predominant color
    const colorUsage = { [primaryColor]: 0, [secondaryColor]: 0 };

    // Add subtle gradient base
    patterns.push(this.createGradientBase(primaryColor, secondaryColor, width, height));

    // Generate pattern layers with configurable shape count
    const defaultLayers = Math.floor(5 + random() * 4); // 5-8 layers default
    const numLayers = shapeCount ? Math.max(3, Math.min(15, shapeCount)) : defaultLayers;

    for (let layer = 0; layer < numLayers; layer++) {
      const layerType = random();
      const layerColor = random() > 0.5 ? primaryColor : secondaryColor;
      colorUsage[layerColor]++;
      const layerOpacity = baseOpacity * (0.3 + random() * 0.7);

      this.generateLayerPatterns(
        layerType,
        layerColor,
        layerOpacity,
        random,
        width,
        height,
        patterns,
        colorUsage
      );
    }

    // Fallback: ensure we always have at least some visible patterns
    if (patterns.length < 10) {
      // eslint-disable-next-line no-console
      console.log(
        `⚠️ Too few patterns (${patterns.length}), adding fallback elements`
      );
      this.addFallbackPatterns(random, width, height, primaryColor, secondaryColor, patterns, colorUsage);
    }

    // Determine predominant color
    const predominantColor =
      colorUsage[primaryColor] >= colorUsage[secondaryColor]
        ? primaryColor
        : secondaryColor;

    const result = patterns.join('\n  ');

    return {
      patterns: result,
      predominantColor: predominantColor
    };
  }

  private createGradientBase(
    primaryColor: string,
    secondaryColor: string,
    width: number,
    height: number
  ): string {
    return `
          <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.08" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.04" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="12" ry="12" fill="url(#bgGrad)"/>
  `;
  }

  private generateLayerPatterns(
    layerType: number,
    layerColor: string,
    layerOpacity: number,
    random: () => number,
    width: number,
    height: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    if (layerType < 0.4) {
      // Shape patterns (circles, hexagons, stars, triangles, ellipses, crosses, arcs)
      this.shapeGenerator.generateShapePattern(
        layerType,
        layerColor,
        layerOpacity,
        random,
        width,
        height,
        patterns,
        colorUsage
      );
    } else if (layerType < 0.8) {
      // Line patterns (lines, spirals, zigzags, dots/dashes)
      this.lineGenerator.generateLinePattern(
        layerType,
        layerColor,
        layerOpacity,
        random,
        width,
        height,
        patterns,
        colorUsage
      );
    } else {
      // Organic patterns (polygons, grids, blobs, waves)
      this.organicGenerator.generateOrganicPattern(
        layerType,
        layerColor,
        layerOpacity,
        random,
        width,
        height,
        patterns,
        colorUsage
      );
    }
  }

  private addFallbackPatterns(
    random: () => number,
    width: number,
    height: number,
    primaryColor: string,
    secondaryColor: string,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    // Add guaranteed visible elements
    for (let i = 0; i < 30; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 5 + random() * 15;
      const color = random() > 0.5 ? primaryColor : secondaryColor;
      colorUsage[color]++;
      patterns.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.5"/>`
      );
    }

    // Add some guaranteed lines
    for (let i = 0; i < 15; i++) {
      const x1 = random() * width;
      const y1 = random() * height;
      const x2 = random() * width;
      const y2 = random() * height;
      const color = random() > 0.5 ? primaryColor : secondaryColor;
      colorUsage[color]++;
      patterns.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="0.4"/>`
      );
    }
  }
} 