/* eslint-disable no-console */
import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Generate a stable seed based on current date-time for rotation
function _generateDailyAvatarSeed(): string {
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const hour = now.getHours(); // Changes every hour
  const minute = Math.floor(now.getMinutes() / 15); // Changes every 15 minutes
  return `daily-og-${dateString}-${hour}-${minute}`;
}

// API configuration type
interface QuoteAPIConfig {
  name: string;
  url: string;
  weight: number;
  headers?: Record<string, string>;
  transform: (data: any) => { text: string; author: string };
}

// Define quote APIs with their configurations
const quoteAPIs: QuoteAPIConfig[] = [
  {
    name: 'DummyJSON',
    url: 'https://dummyjson.com/quotes/random',
    weight: 40, // Highest weight - very reliable, no rate limits
    transform: (data: any) => ({
      text: data.quote,
      author: data.author
    })
  },
  {
    name: 'Quotable',
    url: 'https://api.quotable.io/random',
    weight: 30, // High weight - reliable API
    transform: (data: any) => ({
      text: data.content,
      author: data.author
    })
  },
  {
    name: 'ZenQuotes',
    url: 'https://zenquotes.io/api/random',
    weight: 20, // Medium weight - some rate limits
    transform: (data: any) => {
      // ZenQuotes returns an array with one quote
      const quote = Array.isArray(data) ? data[0] : data;
      return {
        text: quote.q,
        author: quote.a
      };
    }
  },
  {
    name: 'API-Ninjas',
    url: 'https://api.api-ninjas.com/v1/quotes',
    weight: 10, // Lowest weight due to rate limiting
    headers: {
      // Required: Add API_NINJAS_API_KEY to .env.local
      // Get free API key at https://api-ninjas.com/api/quotes
      'X-Api-Key': process.env.API_NINJAS_API_KEY || ''
    },
    transform: (data: any) => {
      // API Ninjas returns an array with one quote
      const quote = Array.isArray(data) ? data[0] : data;
      return {
        text: quote.quote,
        author: quote.author
      };
    }
  }
];

// Weighted round-robin implementation
let weightedPool: number[] = [];
let currentPoolIndex = 0;

// Initialize weighted pool based on API weights
function initializeWeightedPool() {
  weightedPool = [];
  quoteAPIs.forEach((api, index) => {
    // Add the API index to the pool based on its weight
    for (let i = 0; i < api.weight; i++) {
      weightedPool.push(index);
    }
  });
  // Shuffle the pool for better distribution
  for (let i = weightedPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weightedPool[i], weightedPool[j]] = [weightedPool[j], weightedPool[i]];
  }
}

// Get next API using weighted round-robin
function getNextAPIIndex(): number {
  if (weightedPool.length === 0) {
    initializeWeightedPool();
  }

  const apiIndex = weightedPool[currentPoolIndex];
  currentPoolIndex = (currentPoolIndex + 1) % weightedPool.length;

  // Reinitialize pool when we've gone through all entries
  if (currentPoolIndex === 0) {
    initializeWeightedPool();
  }

  return apiIndex;
}

// Fetch quote using round-robin with fallback
async function fetchRandomQuote(): Promise<{
  text: string;
  author: string;
} | null> {
  const maxRetries = quoteAPIs.length; // Try all APIs if needed

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiIndex = getNextAPIIndex();
    const apiConfig = quoteAPIs[apiIndex];

    // console.log(
    //   `🔄 Weighted round-robin selected ${apiConfig.name} (weight: ${apiConfig.weight}, attempt ${attempt + 1})`
    // );

    try {
      const response = await fetch(apiConfig.url, {
        cache: 'no-cache',
        headers: {
          'User-Agent': 'Idling.app OG Image Generator',
          ...(apiConfig.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const quote = apiConfig.transform(data);

      // console.log(
      //   `✅ Successfully fetched quote from ${apiConfig.name}: "${quote.text.substring(0, 50)}..."`
      // );
      return quote;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${apiConfig.name}:`, error);
      // Continue to next API
    }
  }

  // If all APIs fail, return fallback quotes
  console.log('❌ All quote APIs failed, using fallback quotes');
  const fallbackQuotes = [
    {
      text: 'The mind is everything. What you think you become.',
      author: 'Buddha'
    },
    {
      text: 'Peace comes from within. Do not seek it without.',
      author: 'Buddha'
    },
    {
      text: 'Idling is the art of being present in the moment.',
      author: 'Idling.app'
    },
    {
      text: 'Every moment is a fresh beginning.',
      author: 'T.S. Eliot'
    },
    {
      text: 'The journey of a thousand miles begins with one step.',
      author: 'Lao Tzu'
    },
    {
      text: "Believe you can and you're halfway there.",
      author: 'Theodore Roosevelt'
    }
  ];

  const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
  return fallbackQuotes[randomIndex];
}

// Wrap text for SVG
function wrapTextForSVG(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;

    if (testLine.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Escape XML characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Simple seeded random number generator
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

// Generate completely random procedural patterns
function generateBackgroundPattern(seed: string): {
  patterns: string;
  predominantColor: string;
} {
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

  // console.log(
  //   `🎨 Colors: Primary=${primaryColor}, Secondary=${secondaryColor}, BaseOpacity=${baseOpacity}`
  // );

  // Add subtle gradient base
  patterns.push(`
          <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.08" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.04" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="1184" height="614" rx="12" ry="12" fill="url(#bgGrad)"/>
  `);

  // Generate 4-6 completely random pattern layers (ensure always visible)
  const numLayers = Math.floor(4 + random() * 3); // 4-6 layers guaranteed
  // console.log(`🎨 Generating ${numLayers} pattern layers`);

  for (let layer = 0; layer < numLayers; layer++) {
    const layerType = random();
    const layerColor = random() > 0.5 ? primaryColor : secondaryColor;
    colorUsage[layerColor]++;
    const layerOpacity = baseOpacity * (0.3 + random() * 0.7);
    const _layerRotation = random() * 360;

    // console.log(
    //   `🎨 Layer ${layer}: Type=${layerType.toFixed(3)}, Color=${layerColor}, Opacity=${layerOpacity.toFixed(3)}`
    // );

    const layerStartCount = patterns.length;

    if (layerType < 0.2) {
      // Random scattered circles
      const numCircles = Math.floor(20 + random() * 80);
      // console.log(`  🟢 Generating ${numCircles} circles`);
      for (let i = 0; i < numCircles; i++) {
        const x = random() * 1200;
        const y = random() * 630;
        const radius = 3 + random() * 20;
        const opacity = Math.max(0.3, layerOpacity * (0.6 + random() * 0.4));
        patterns.push(
          `<circle cx="${x}" cy="${y}" r="${radius}" fill="${layerColor}" opacity="${opacity}"/>`
        );
        colorUsage[layerColor]++;
      }
    } else if (layerType < 0.4) {
      // Random lines at various angles
      const numLines = Math.floor(15 + random() * 40);
      // console.log(`  📏 Generating ${numLines} lines`);
      for (let i = 0; i < numLines; i++) {
        const x1 = random() * 1200;
        const y1 = random() * 630;
        const length = 50 + random() * 200;
        const angle = random() * Math.PI * 2;
        const x2 = x1 + Math.cos(angle) * length;
        const y2 = y1 + Math.sin(angle) * length;
        const strokeWidth = 1 + random() * 4;
        const opacity = Math.max(0.25, layerOpacity * (0.5 + random() * 0.5));
        patterns.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
        );
      }
    } else if (layerType < 0.6) {
      // Random polygons
      const numPolygons = Math.floor(10 + random() * 30);
      // console.log(`  🔺 Generating ${numPolygons} polygons`);
      for (let i = 0; i < numPolygons; i++) {
        const centerX = random() * 1200;
        const centerY = random() * 630;
        const sides = Math.floor(3 + random() * 5); // 3-7 sides
        const radius = 10 + random() * 40;
        const rotation = random() * Math.PI * 2;

        const points = [];
        for (let s = 0; s < sides; s++) {
          const angle = (s / sides) * Math.PI * 2 + rotation;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          points.push(`${x},${y}`);
        }

        const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
        const filled = random() > 0.7;
        if (filled) {
          patterns.push(
            `<polygon points="${points.join(' ')}" fill="${layerColor}" opacity="${opacity}"/>`
          );
        } else {
          patterns.push(
            `<polygon points="${points.join(' ')}" fill="none" stroke="${layerColor}" stroke-width="${1 + random() * 3}" opacity="${opacity}"/>`
          );
        }
      }
    } else if (layerType < 0.8) {
      // Random grid pattern
      const spacing = 30 + random() * 80;
      const elementSize = 5 + random() * 20;
      const gridRotation = random() * 45;
      // console.log(
      //   `  🔲 Generating grid pattern: spacing=${spacing.toFixed(1)}, size=${elementSize.toFixed(1)}`
      // );

      let gridElementCount = 0;
      for (let x = 0; x < 1400; x += spacing) {
        for (let y = 0; y < 700; y += spacing) {
          if (random() > 0.3) {
            // Skip some elements for randomness
            const finalX = x + (random() - 0.5) * spacing * 0.4;
            const finalY = y + (random() - 0.5) * spacing * 0.4;
            const opacity = Math.max(
              0.3,
              layerOpacity * (0.5 + random() * 0.3)
            );

            const shapeType = random();
            if (shapeType < 0.33) {
              // Circle
              patterns.push(
                `<circle cx="${finalX}" cy="${finalY}" r="${elementSize}" fill="${layerColor}" opacity="${opacity}" transform="rotate(${gridRotation} 600 315)"/>`
              );
            } else if (shapeType < 0.66) {
              // Square
              const transform = `rotate(${gridRotation} 600 315)`;
              const rectSize = elementSize * 2;
              patterns.push(
                `<rect x="${finalX - elementSize}" y="${finalY - elementSize}" ` +
                  `width="${rectSize}" height="${rectSize}" fill="${layerColor}" ` +
                  `opacity="${opacity}" transform="${transform}"/>`
              );
            } else {
              // Diamond
              const points = `${finalX},${finalY - elementSize} ${finalX + elementSize},${finalY} ${finalX},${finalY + elementSize} ${finalX - elementSize},${finalY}`;
              patterns.push(
                `<polygon points="${points}" fill="${layerColor}" opacity="${opacity}" transform="rotate(${gridRotation} 600 315)"/>`
              );
            }
            colorUsage[layerColor]++;
            gridElementCount++;
          }
        }
      }
      // console.log(`  🔲 Grid generated ${gridElementCount} elements`);
    } else {
      // Random wave/curve patterns
      const numWaves = Math.floor(5 + random() * 15);
      // console.log(`  🌊 Generating ${numWaves} wave patterns`);
      for (let i = 0; i < numWaves; i++) {
        const startX = random() * 1200;
        const startY = random() * 630;
        const amplitude = 20 + random() * 60;
        const frequency = 0.01 + random() * 0.02;
        const length = 100 + random() * 400;
        const angle = random() * Math.PI * 2;

        let pathData = `M ${startX} ${startY}`;
        for (let t = 0; t < length; t += 5) {
          const x = startX + Math.cos(angle) * t;
          const y =
            startY + Math.sin(angle) * t + Math.sin(t * frequency) * amplitude;
          pathData += ` L ${x} ${y}`;
        }

        const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
        patterns.push(
          `<path d="${pathData}" fill="none" stroke="${layerColor}" stroke-width="${1 + random() * 3}" opacity="${opacity}"/>`
        );
      }
    }

    const layerElementsAdded = patterns.length - layerStartCount;
    // console.log(`  ✅ Layer ${layer} added ${layerElementsAdded} elements`);
  }

  // console.log(`🎨 Pre-fallback pattern count: ${patterns.length}`);

  // Fallback: ensure we always have at least some visible patterns
  if (patterns.length < 10) {
    console.log(
      `⚠️ Too few patterns (${patterns.length}), adding fallback elements`
    );
    // Add guaranteed visible elements
    for (let i = 0; i < 30; i++) {
      const x = random() * 1200;
      const y = random() * 630;
      const radius = 5 + random() * 15;
      const color = random() > 0.5 ? primaryColor : secondaryColor;
      colorUsage[color]++;
      patterns.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.5"/>`
      );
    }

    // Add some guaranteed lines
    for (let i = 0; i < 15; i++) {
      const x1 = random() * 1200;
      const y1 = random() * 630;
      const x2 = random() * 1200;
      const y2 = random() * 630;
      const color = random() > 0.5 ? primaryColor : secondaryColor;
      colorUsage[color]++;
      patterns.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="0.4"/>`
      );
    }
    // console.log(`✅ Added fallback patterns, new count: ${patterns.length}`);
  }

  // console.log(`🎨 Final pattern count: ${patterns.length}`);

  // Determine predominant color
  const predominantColor =
    colorUsage[primaryColor] >= colorUsage[secondaryColor]
      ? primaryColor
      : secondaryColor;

  // console.log(
  //   `🎨 Color usage: ${primaryColor}=${colorUsage[primaryColor]}, ${secondaryColor}=${colorUsage[secondaryColor]}`
  // );
  // console.log(`🎨 Predominant color: ${predominantColor}`);

  const result = patterns.join('\n  ');
  // console.log(
  //   `🎨 Pattern generation complete - SVG length: ${result.length} characters`
  // );

  return {
    patterns: result,
    predominantColor: predominantColor
  };
}

// Generate SVG image
function generateSVG(
  avatarSvg: string,
  quote: { text: string; author: string },
  patternSeed: string
): string {
  const width = 1200;
  const height = 630;

  // Generate background patterns and get predominant color for border
  const backgroundResult = generateBackgroundPattern(patternSeed);
  const borderColor = backgroundResult.predominantColor;
  const borderOpacity = 0.7; // Fixed opacity for cleaner look

  // Dynamic font sizing
  let fontSize = 28;
  if (quote.text.length > 100) fontSize = 24;
  else if (quote.text.length > 150) fontSize = 20;
  else if (quote.text.length > 200) fontSize = 18;

  // Wrap text
  const quoteText = `"${quote.text}" — ${quote.author}`;
  const maxCharsPerLine = Math.floor(900 / (fontSize * 0.6)); // Approximate character width
  const lines = wrapTextForSVG(quoteText, maxCharsPerLine);

  // Calculate text positioning
  const lineHeight = fontSize * 1.4;
  const totalTextHeight = lines.length * lineHeight;
  const textStartY = 420 + (210 - totalTextHeight) / 2;

  // Calculate glass background dimensions for quote - more accurate sizing
  const padding = 30;
  const longestLine = lines.reduce(
    (max, line) => (line.length > max.length ? line : max),
    ''
  );
  const approxCharWidth = fontSize * 0.45; // Reduced character width for tighter fit
  const textWidth = Math.min(
    longestLine.length * approxCharWidth + padding * 2,
    900 // Reduced max width
  );
  const textHeight = totalTextHeight + padding * 0.8; // Much tighter fit around text
  const glassX = (width - textWidth) / 2;
  // Position glass background to properly frame the text - center it around text
  const glassY = textStartY - 27 - (textHeight - totalTextHeight) / 2;

  // console.log(`📝 Text Background Debug:`);
  // console.log(`  Lines: ${lines.length}, Longest: "${longestLine}"`);
  // console.log(`  FontSize: ${fontSize}, LineHeight: ${lineHeight}`);
  // console.log(`  TextStartY: ${textStartY}, TotalHeight: ${totalTextHeight}`);
  // console.log(
  //   `  Glass: x=${glassX}, y=${glassY}, w=${textWidth}, h=${textHeight}`
  // );

  // We'll embed the full avatar SVG as a data URL

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
    ${backgroundResult.patterns}
  </g>
  
  <!-- Avatar with fade effect -->
  <g mask="url(#avatarMask)">
    <image href="data:image/svg+xml;base64,${Buffer.from(avatarSvg).toString('base64')}" 
           x="350" y="20" width="500" height="500"/>
  </g>
  
  <!-- Glass background for text -->
  <rect x="${glassX}" y="${glassY}" width="${textWidth}" height="${textHeight}" 
        rx="16" ry="16" 
        fill="rgba(0, 0, 0, 0.6)" 
        stroke="rgba(255, 255, 255, 0.1)" 
        stroke-width="1"
        filter="url(#glassFilter)"/>
  
  <!-- Text -->
  ${lines
    .map(
      (line, index) =>
        `<text x="600" y="${textStartY + index * lineHeight}" 
           text-anchor="middle" 
           fill="white" 
           font-family="system-ui, -apple-system, sans-serif" 
           font-size="${fontSize}px"
           style="text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${escapeXml(line)}</text>`
    )
    .join('\n  ')}
</svg>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters or use defaults
    const customSeed = searchParams.get('seed');
    const customQuote = searchParams.get('quote');
    const customAuthor = searchParams.get('author');
    const _randomize = searchParams.get('random') === 'true';

    // Generate seeds - random by default, unless custom seed provided
    const avatarSeed = customSeed || `random-${Date.now()}-${Math.random()}`;
    const patternSeed = `pattern-${Date.now()}-${Math.random()}`;

    // Generate avatar SVG
    const avatar = createAvatar(adventurer, { seed: avatarSeed });
    const avatarSvg = avatar.toString();

    // Fetch quote or use custom quote
    let quote = { text: '', author: '' };
    if (customQuote) {
      quote = {
        text: customQuote,
        author: customAuthor || 'Idling.app'
      };
    } else {
      const fetchedQuote = await fetchRandomQuote();
      quote = fetchedQuote || {
        text: 'Idling is the art of being present.',
        author: 'Idling.app'
      };
    }

    // Generate SVG
    const svgContent = generateSVG(avatarSvg, quote, patternSeed);

    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
  } catch {
    // Return simple fallback SVG with basic pattern
    const fallbackResult = generateBackgroundPattern('fallback-pattern');
    const fallbackSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  ${fallbackResult.patterns}
  <text x="600" y="280" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="48px">Idling.app</text>
  <text x="600" y="350" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-size="24px">Wisdom &amp; Community</text>
</svg>`;

    return new Response(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
  }
}
