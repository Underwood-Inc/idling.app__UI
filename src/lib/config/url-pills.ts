// URL Pills Configuration
// This file defines supported domains and their behaviors for URL pills

import {
  hasImageExtension,
  IMAGE_DOMAINS,
  isImageDomain,
  isYouTubeDomain,
  YOUTUBE_DOMAINS
} from './media-domains';

export interface URLPillDomain {
  domain: string;
  name: string;
  shortName?: string; // Short name for compact display (2-3 chars)
  icon?: string;
  enabled: boolean;
  behaviors: URLPillBehavior[];
  defaultBehavior: string;
  regex: RegExp;
  extractId?: (url: string) => string | null;
}

export interface URLPillBehavior {
  id: string;
  name: string;
  description: string;
  icon?: string;
  requiresModal?: boolean;
  enabled: boolean;
}

// YouTube behaviors
const youtubeBehaviors: URLPillBehavior[] = [
  {
    id: 'embed',
    name: 'Embed',
    description: 'Show video player inline',
    icon: '▶️',
    enabled: true
  },
  {
    id: 'link',
    name: 'Link',
    description: 'Show as clickable link',
    icon: '🔗',
    enabled: true
  }
];

// Image behaviors
const imageBehaviors: URLPillBehavior[] = [
  {
    id: 'embed',
    name: 'Embed',
    description: 'Show image inline',
    icon: '🖼️',
    enabled: true
  },
  {
    id: 'link',
    name: 'Link',
    description: 'Show as clickable link',
    icon: '🔗',
    enabled: true
  }
];

// Helper functions for extracting IDs
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractImageInfo = (url: string): string | null => {
  // For images, we'll use the filename as the ID
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1];
  return filename || null;
};

// Build YouTube domains configuration
const youtubeDomainsConfig: URLPillDomain[] = YOUTUBE_DOMAINS.map((domain) => ({
  domain,
  name: 'YouTube',
  shortName: 'YT',
  icon: '📺',
  enabled: true,
  behaviors: youtubeBehaviors,
  defaultBehavior: 'embed',
  regex: new RegExp(
    '(?:https?:\\/\\/)?(?:www\\.)?(youtube\\.com|youtu\\.be)\\/' +
      "[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*",
    'i'
  ),
  extractId: extractYouTubeId
}));

// Build image domains configuration
const imageDomainsConfig: URLPillDomain[] = [
  // Imgur - direct media URLs with extensions (images and videos)
  {
    domain: 'i.imgur.com',
    name: 'Imgur',
    shortName: 'IMG',
    icon: '🖼️',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      "(?:https?:\\/\\/)?i\\.imgur\\.com\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*\\." +
        '(jpg|jpeg|png|gif|webp|svg|bmp|ico|mp4|webm|ogg|avi|mov)',
      'i'
    ),
    extractId: extractImageInfo
  },

  // Imgur - gallery and direct links without extensions
  {
    domain: 'imgur.com',
    name: 'Imgur',
    shortName: 'IMG',
    icon: '🖼️',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex:
      /(?:https?:\/\/)?(?:www\.)?imgur\.com\/(?:a\/|gallery\/)?[\w\-._~]+/i,
    extractId: (url: string) => {
      const match = url.match(/imgur\.com\/(?:a\/|gallery\/)?([\w\-._~]+)/);
      return match ? match[1] : null;
    }
  },

  // Giphy - GIFs and videos
  {
    domain: 'giphy.com',
    name: 'Giphy',
    shortName: 'GIF',
    icon: '🎬',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      '(?:https?:\\/\\/)?(?:media\\d*\\.)?giphy\\.com\\/' +
        "[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*",
      'i'
    ),
    extractId: (url: string) => {
      const match = url.match(
        /giphy\.com\/(?:media\/)?(?:v1\.Y2lkPTc5MGI3NjEx[\w\-._~]*\/)?(?:gifs\/)?([^/?#]+)/
      );
      return match ? match[1] : null;
    }
  },

  // GitHub - raw content and user images (images and videos)
  {
    domain: 'github.com',
    name: 'GitHub',
    shortName: 'GH',
    icon: '🖼️',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      '(?:https?:\\/\\/)?(?:raw\\.githubusercontent\\.com|' +
        'user-images\\.githubusercontent\\.com|github\\.com)\\/' +
        "[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*\\." +
        '(jpg|jpeg|png|gif|webp|svg|bmp|ico|mp4|webm|ogg|avi|mov)',
      'i'
    ),
    extractId: extractImageInfo
  },

  // Unsplash - images only
  {
    domain: 'unsplash.com',
    name: 'Unsplash',
    shortName: 'UN',
    icon: '🖼️',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      '(?:https?:\\/\\/)?(?:images\\.)?unsplash\\.com\\/' +
        "[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*",
      'i'
    ),
    extractId: (url: string) => {
      const match = url.match(/unsplash\.com\/(?:photo-)?([^/?#]+)/);
      return match ? match[1] : null;
    }
  },

  // Temporary data URL images (pasted but not yet uploaded)
  {
    domain: 'temp-image',
    name: 'Temp Image',
    shortName: 'TMP',
    icon: '🖼️',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      'data:temp-image;name=[^;]*;data:image\\/[^;]*;base64,[A-Za-z0-9+/=]+',
      'i'
    ),
    extractId: (url: string) => {
      const match = url.match(/name=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : 'temp-image';
    }
  },

  // Local uploaded images
  {
    domain: 'local-upload',
    name: 'Uploaded',
    shortName: 'UP',
    icon: '🖼️',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      '^\\/uploads\\/images\\/[\\w\\-._]+\\.' +
        '(jpg|jpeg|png|gif|webp|svg|bmp|ico|mp4|webm|ogg|avi|mov)$',
      'i'
    ),
    extractId: extractImageInfo
  },

  // Generic media URL pattern - matches any URL ending with common media extensions
  {
    domain: 'generic-media',
    name: 'Media',
    shortName: 'MED',
    icon: '🎬',
    enabled: true,
    behaviors: imageBehaviors,
    defaultBehavior: 'embed',
    regex: new RegExp(
      "(?:https?:\\/\\/)?[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*\\." +
        '(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff|tif|' +
        'mp4|webm|ogg|avi|mov|wmv|flv|m4v|mkv|3gp|ogv)$',
      'i'
    ),
    extractId: extractImageInfo
  }
];

// All supported domains
export const ALL_DOMAINS: URLPillDomain[] = [
  ...youtubeDomainsConfig,
  ...imageDomainsConfig
];

// Find domain configuration for a URL
export const findDomainConfig = (url: string): URLPillDomain | null => {
  return ALL_DOMAINS.find((domain) => domain.regex.test(url)) || null;
};

// Check if URL is whitelisted
export const isWhitelistedURL = (url: string): boolean => {
  return findDomainConfig(url) !== null;
};

// Parse URLs in text and return matches with domain info
export const parseURLs = (
  text: string
): Array<{
  url: string;
  domain: URLPillDomain;
  start: number;
  end: number;
}> => {
  const results: Array<{
    url: string;
    domain: URLPillDomain;
    start: number;
    end: number;
  }> = [];

  // Basic URL regex - matches http/https URLs
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[1];
    const domain = findDomainConfig(url);

    if (domain) {
      results.push({
        url,
        domain,
        start: match.index,
        end: match.index + url.length
      });
    }
  }

  return results;
};

// Parse URL pill format: ![behavior](url) or ![behavior|width](url)
export const parseURLPill = (
  pillText: string
): { behavior: string; url: string; customId?: string } | null => {
  const match = pillText.match(/^!\[([^|\]]+)(?:\|([^|\]]+))?\]\(([^)]+)\)$/);
  if (!match) return null;

  return {
    behavior: match[1],
    url: match[3],
    customId: match[2] // Width or other custom ID
  };
};

// Create URL pill format
export const createURLPill = (
  url: string,
  behavior: string,
  customId?: string
): string => {
  return customId
    ? `![${behavior}|${customId}](${url})`
    : `![${behavior}](${url})`;
};

// Detect URLs in text and suggest pill replacements
export const detectURLsInText = (
  text: string
): Array<{
  url: string;
  domain: URLPillDomain;
  start: number;
  end: number;
  replacementPill: string;
}> => {
  const urlMatches = parseURLs(text);

  return urlMatches.map((match) => ({
    ...match,
    replacementPill: createURLPill(match.url, match.domain.defaultBehavior)
  }));
};

// Convert URLs to pills automatically
export const convertURLsToPills = (text: string): string => {
  const matches = detectURLsInText(text);

  // Sort by start position in reverse order to replace from end to beginning
  matches.sort((a, b) => b.start - a.start);

  let result = text;
  for (const match of matches) {
    result =
      result.substring(0, match.start) +
      match.replacementPill +
      result.substring(match.end);
  }

  return result;
};

// Check if text has convertible URLs
export const hasConvertibleURLs = (text: string): boolean => {
  return detectURLsInText(text).length > 0;
};

/**
 * Configuration for URL pills - determines which URLs get special treatment
 */
export interface URLPillConfig {
  domains: readonly string[];
  behavior: 'embed' | 'link';
  className?: string;
}

export const URL_PILL_CONFIGS: Record<string, URLPillConfig> = {
  youtube: {
    domains: YOUTUBE_DOMAINS,
    behavior: 'embed',
    className: 'youtube-pill'
  },
  image: {
    domains: IMAGE_DOMAINS,
    behavior: 'embed',
    className: 'image-pill'
  }
};

/**
 * Determines if a URL should be rendered as a pill
 * @param url The URL to check
 * @returns The pill type or null if no pill should be rendered
 */
export function getURLPillType(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check YouTube domains
    if (isYouTubeDomain(hostname)) {
      return 'youtube';
    }

    // Check image domains or image extensions
    if (isImageDomain(hostname) || hasImageExtension(url)) {
      return 'image';
    }

    // No pill type found
    return null;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Gets the configuration for a specific pill type
 */
export function getPillConfig(pillType: string): URLPillConfig | null {
  return URL_PILL_CONFIGS[pillType] || null;
}

/**
 * Determines if a URL should be embedded vs linked
 */
export function shouldEmbedURL(url: string): boolean {
  const pillType = getURLPillType(url);
  if (!pillType) return false;

  const config = getPillConfig(pillType);
  return config?.behavior === 'embed';
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getURLPillType instead
 */
export function isEmbeddableURL(url: string): boolean {
  return getURLPillType(url) !== null;
}
