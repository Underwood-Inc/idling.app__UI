// URL Pills Configuration
// This file defines supported domains and their behaviors for URL pills

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

// YouTube URL behaviors
const youtubeBehaviors: URLPillBehavior[] = [
  {
    id: 'modal',
    name: 'Modal Iframe',
    description: 'Open in styled modal overlay',
    icon: '🔳',
    requiresModal: true,
    enabled: true
  },
  {
    id: 'link',
    name: 'External Link',
    description: 'Open in new tab',
    icon: '🔗',
    requiresModal: false,
    enabled: true
  },
  {
    id: 'embed',
    name: 'Rich Embed',
    description: 'Embed directly in post',
    icon: '📺',
    requiresModal: false,
    enabled: true
  }
];

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

// Domain whitelist configuration
export const URL_PILL_DOMAINS: URLPillDomain[] = [
  {
    domain: 'youtube.com',
    name: 'YouTube',
    shortName: 'YT',
    icon: '📺',
    enabled: true,
    behaviors: youtubeBehaviors,
    defaultBehavior: 'modal',
    regex:
      /(?:https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*/i,
    extractId: extractYouTubeId
  },
  {
    domain: 'youtu.be',
    name: 'YouTube',
    shortName: 'YT',
    icon: '📺',
    enabled: true,
    behaviors: youtubeBehaviors,
    defaultBehavior: 'modal',
    regex:
      /(?:https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*/i,
    extractId: extractYouTubeId
  }
];

// Helper functions
export const findDomainConfig = (url: string): URLPillDomain | null => {
  for (const domain of URL_PILL_DOMAINS) {
    if (domain.enabled && domain.regex.test(url)) {
      return domain;
    }
  }
  return null;
};

export const isWhitelistedURL = (url: string): boolean => {
  return findDomainConfig(url) !== null;
};

export const parseURLs = (
  text: string
): Array<{
  url: string;
  domain: URLPillDomain;
  start: number;
  end: number;
}> => {
  const urls: Array<{
    url: string;
    domain: URLPillDomain;
    start: number;
    end: number;
  }> = [];

  // Enhanced URL regex to catch most common URL formats
  const urlRegex = new RegExp(
    '(?:https?:\\/\\/)?' + // optional protocol
      '(?:www\\.)?' + // optional www
      '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' + // domain start
      '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)' + // domain parts
      '*(?::[0-9]{1,5})?' + // optional port
      "(?:\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*)?", // optional path
    'g'
  );

  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const domain = findDomainConfig(url);

    if (domain) {
      urls.push({
        url,
        domain,
        start: match.index,
        end: match.index + url.length
      });
    }
  }

  return urls;
};

// URL pill format: ![behavior](url) or ![behavior|customId](url)
export const URL_PILL_REGEX = /!\[([^\]]+)\]\(([^)]+)\)/g;

export const parseURLPill = (
  pillText: string
): { behavior: string; url: string; customId?: string } | null => {
  const match = pillText.match(/^!\[([^\]]+)\]\(([^)]+)\)$/);
  if (!match) return null;

  const [, behaviorPart, url] = match;
  const [behavior, customId] = behaviorPart.split('|');

  return {
    behavior: behavior.trim(),
    url: url.trim(),
    customId: customId?.trim()
  };
};

export const createURLPill = (
  url: string,
  behavior: string,
  customId?: string
): string => {
  const behaviorPart = customId ? `${behavior}|${customId}` : behavior;
  return `![${behaviorPart}](${url})`;
};

// Auto-detection and conversion functionality
export const detectURLsInText = (
  text: string
): Array<{
  url: string;
  domain: URLPillDomain;
  start: number;
  end: number;
  replacementPill: string;
}> => {
  const detectedUrls: Array<{
    url: string;
    domain: URLPillDomain;
    start: number;
    end: number;
    replacementPill: string;
  }> = [];

  // First, find all existing structured pills to exclude their URLs
  const structuredPillRegex = /!\[[^\]]+\]\([^)]+\)/g;
  const excludedRanges: Array<{ start: number; end: number }> = [];
  let pillMatch;

  while ((pillMatch = structuredPillRegex.exec(text)) !== null) {
    excludedRanges.push({
      start: pillMatch.index,
      end: pillMatch.index + pillMatch[0].length
    });
  }

  // Robust URL regex that handles various URL formats
  // This regex looks for URLs followed by whitespace or end of string
  const urlRegex = new RegExp(
    '(?:(?:https?:\\/\\/)|(?:www\\.))?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
      '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?::[0-9]{1,5})?' +
      "(?:\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*)?(?=\\s|$)",
    'g'
  );

  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const urlStart = match.index;
    const urlEnd = match.index + match[0].length;

    // Check if this URL is inside a structured pill - if so, skip it
    const isInsideStructuredPill = excludedRanges.some(
      (range) => urlStart >= range.start && urlEnd <= range.end
    );

    if (isInsideStructuredPill) {
      continue; // Skip URLs that are part of structured pills
    }

    let url = match[0];

    // Normalize URL - add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else {
        // For domain-only URLs like youtube.com, add https://
        url = 'https://' + url;
      }
    }

    const domain = findDomainConfig(url);

    if (domain) {
      // Create pill with default behavior
      const pillFormat = `![${domain.defaultBehavior}](${url})`;

      detectedUrls.push({
        url,
        domain,
        start: match.index,
        end: match.index + match[0].length,
        replacementPill: pillFormat
      });
    }
  }

  return detectedUrls;
};

export const convertURLsToPills = (text: string): string => {
  const urls = detectURLsInText(text);

  // Process URLs from end to start to maintain correct indices
  const sortedUrls = urls.sort((a, b) => b.start - a.start);

  let convertedText = text;
  for (const urlData of sortedUrls) {
    convertedText =
      convertedText.slice(0, urlData.start) +
      urlData.replacementPill +
      convertedText.slice(urlData.end);
  }

  return convertedText;
};

// Check if text contains URLs that should be converted
export const hasConvertibleURLs = (text: string): boolean => {
  return detectURLsInText(text).length > 0;
};
