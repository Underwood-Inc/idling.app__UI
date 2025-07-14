import {
  AspectRatioConfig,
  GenerationLimits,
  QuoteAPIConfig,
  WatermarkConfig
} from './types';

export const ASPECT_RATIOS: Record<string, AspectRatioConfig> = {
  // Default OG image ratio
  default: {
    name: 'Open Graph (Default)',
    width: 1200,
    height: 630,
    description: 'Standard social media sharing',
    textMaxWidth: 900,
    textStartY: 420,
    avatarX: 350,
    avatarY: 20,
    avatarSize: 500
  },
  // Square ratio for Instagram, Facebook posts
  square: {
    name: 'Square (1:1)',
    width: 1080,
    height: 1080,
    description: 'Instagram posts, Facebook posts',
    textMaxWidth: 950,
    textStartY: 750,
    avatarX: 240,
    avatarY: 140,
    avatarSize: 550
  },
  // 4:3 ratio for presentations, some social platforms
  '4-3': {
    name: 'Standard (4:3)',
    width: 1200,
    height: 900,
    description: 'Presentations, classic displays',
    textMaxWidth: 1000,
    textStartY: 680,
    avatarX: 350,
    avatarY: 80,
    avatarSize: 520
  },
  // YouTube thumbnail ratio
  youtube: {
    name: 'YouTube Thumbnail (16:9)',
    width: 1280,
    height: 720,
    description: 'YouTube thumbnails, video content',
    textMaxWidth: 1100,
    textStartY: 520,
    avatarX: 390,
    avatarY: 60,
    avatarSize: 450
  },
  // Facebook cover photo
  'facebook-cover': {
    name: 'Facebook Cover',
    width: 1702,
    height: 630,
    description: 'Facebook cover photos',
    textMaxWidth: 1000,
    textStartY: 450,
    avatarX: 650,
    avatarY: 40,
    avatarSize: 500
  },
  // LinkedIn banner - very wide and short format
  'linkedin-banner': {
    name: 'LinkedIn Banner',
    width: 1584,
    height: 396,
    description: 'LinkedIn profile banners',
    textMaxWidth: 1300,
    textStartY: 280,
    avatarX: 792,
    avatarY: 40,
    avatarSize: 160
  },
  // Twitter header - wide format
  'twitter-header': {
    name: 'Twitter Header',
    width: 1500,
    height: 500,
    description: 'Twitter profile headers',
    textMaxWidth: 1200,
    textStartY: 380,
    avatarX: 350,
    avatarY: 70,
    avatarSize: 400
  }
};

export const QUOTE_APIS: QuoteAPIConfig[] = [
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

export const FALLBACK_QUOTES = [
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

// Watermark configuration for guest/free users
export const WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  text: 'https://idling.app/card-generator',
  fontSize: 24,
  opacity: 0.15,
  color: '#ffffff',
  position: 'repeated',
  margin: 40,
  rotation: -25, // Default rotation for repeated pattern
  fontFamily:
    'FiraCode, "Fira Code", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  pattern: 'diagonal', // Repeated diagonal pattern
  spacing: 200 // Space between repeated watermarks
};

// Rate limiting configuration
export const GENERATION_LIMITS: GenerationLimits = {
  perMinute: 10, // 10 generations per minute
  perHour: 100, // 100 generations per hour
  perDay: 1 // 1 generation per day (reduced for quota management)
};

// Custom dimension limits
export const DIMENSION_LIMITS = {
  minWidth: 400,
  maxWidth: 2400,
  minHeight: 300,
  maxHeight: 1800,
  minShapeCount: 3,
  maxShapeCount: 15
};
