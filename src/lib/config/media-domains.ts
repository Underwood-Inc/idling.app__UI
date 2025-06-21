/**
 * Centralized configuration for supported media domains and file types
 */

// YouTube domains that support embed functionality
export const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com'
] as const;

// Multi-media hosting domains (support both images and videos)
export const MULTI_MEDIA_DOMAINS = [
  'imgur.com',
  'i.imgur.com',
  'giphy.com',
  'media.giphy.com',
  'media0.giphy.com',
  'media1.giphy.com',
  'media2.giphy.com',
  'media3.giphy.com',
  'media4.giphy.com',
  'github.com',
  'raw.githubusercontent.com',
  'user-images.githubusercontent.com'
] as const;

// Image-only hosting domains
export const IMAGE_ONLY_DOMAINS = [
  'images.unsplash.com',
  'unsplash.com'
] as const;

// All image hosting domains (for backward compatibility)
export const IMAGE_DOMAINS = [
  ...MULTI_MEDIA_DOMAINS,
  ...IMAGE_ONLY_DOMAINS
] as const;

// Generic image file extensions
export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'bmp',
  'ico',
  'avif',
  'tiff',
  'tif'
] as const;

// Video file extensions for direct video embedding
export const VIDEO_EXTENSIONS = [
  'mp4',
  'webm',
  'ogg',
  'avi',
  'mov',
  'wmv',
  'flv',
  'm4v',
  'mkv',
  '3gp',
  'ogv'
] as const;

// Audio file extensions for direct audio embedding
export const AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'ogg',
  'aac',
  'flac',
  'm4a',
  'wma',
  'opus'
] as const;

// All supported media extensions
export const ALL_MEDIA_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS
] as const;

// Media type configuration for upload limits and processing
export interface MediaTypeConfig {
  maxSize: number; // in bytes
  quality?: number; // for compression (0-1)
  maxWidth?: number; // for image resizing
  maxHeight?: number; // for image resizing
  allowedMimeTypes: string[];
}

export const MEDIA_TYPE_CONFIGS: Record<string, MediaTypeConfig> = {
  // Image configurations
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    quality: 0.85,
    maxWidth: 1920,
    maxHeight: 1080,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/avif',
      'image/tiff'
    ]
  },

  // Video configurations
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-flv',
      'video/3gpp'
    ]
  },

  // Audio configurations
  audio: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/x-m4a',
      'audio/opus'
    ]
  }
};

// Helper functions
export function isYouTubeDomain(hostname: string): boolean {
  return YOUTUBE_DOMAINS.includes(hostname as any);
}

export function isImageDomain(hostname: string): boolean {
  return IMAGE_DOMAINS.includes(hostname as any);
}

export function isMultiMediaDomain(hostname: string): boolean {
  return MULTI_MEDIA_DOMAINS.includes(hostname as any);
}

/**
 * Extract file extension from URL, handling query parameters and fragments
 */
export function getFileExtension(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot === -1) return null;

    const extension = pathname.slice(lastDot + 1).toLowerCase();
    // Validate it's actually an extension (not too long, contains only alphanumeric)
    if (extension.length > 10 || !/^[a-z0-9]+$/.test(extension)) {
      return null;
    }

    return extension;
  } catch {
    // Fallback for non-URL strings
    const lastDot = url.lastIndexOf('.');
    if (lastDot === -1) return null;

    const extension = url.slice(lastDot + 1).toLowerCase();
    // Remove query params and fragments
    const cleanExtension = extension.split(/[?#]/)[0];

    if (cleanExtension.length > 10 || !/^[a-z0-9]+$/.test(cleanExtension)) {
      return null;
    }

    return cleanExtension;
  }
}

export function hasImageExtension(url: string): boolean {
  const extension = getFileExtension(url);
  return extension ? IMAGE_EXTENSIONS.includes(extension as any) : false;
}

export function hasVideoExtension(url: string): boolean {
  const extension = getFileExtension(url);
  return extension ? VIDEO_EXTENSIONS.includes(extension as any) : false;
}

export function hasAudioExtension(url: string): boolean {
  const extension = getFileExtension(url);
  return extension ? AUDIO_EXTENSIONS.includes(extension as any) : false;
}

/**
 * Smart media type detection that prioritizes file extensions over domains
 * This handles cases like imgur.com/video.mp4 correctly
 */
export function getMediaType(
  url: string
): 'youtube' | 'image' | 'video' | 'audio' | 'unknown' {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check YouTube first (special case)
    if (isYouTubeDomain(hostname)) {
      return 'youtube';
    }

    // Priority 1: File extension (most reliable)
    if (hasVideoExtension(url)) {
      return 'video';
    }

    if (hasImageExtension(url)) {
      return 'image';
    }

    if (hasAudioExtension(url)) {
      return 'audio';
    }

    // Priority 2: Domain-based detection (for URLs without clear extensions)
    // This handles cases like imgur.com/gallery/abc123
    if (isMultiMediaDomain(hostname)) {
      // For multi-media domains without extension, default to image
      // (most common case, and ImageEmbed can handle videos too)
      return 'image';
    }

    if (IMAGE_ONLY_DOMAINS.includes(hostname as any)) {
      return 'image';
    }

    // Priority 3: Special domain patterns
    // Giphy URLs often don't have clear extensions
    if (hostname.includes('giphy.com')) {
      return 'image'; // GIFs are handled as images in our system
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getMediaConfig(
  mediaType: 'image' | 'video' | 'audio'
): MediaTypeConfig {
  return MEDIA_TYPE_CONFIGS[mediaType];
}

export function validateFileSize(
  file: File,
  mediaType: 'image' | 'video' | 'audio'
): boolean {
  const config = getMediaConfig(mediaType);
  return file.size <= config.maxSize;
}

export function validateMimeType(
  file: File,
  mediaType: 'image' | 'video' | 'audio'
): boolean {
  const config = getMediaConfig(mediaType);
  return config.allowedMimeTypes.includes(file.type);
}

// Legacy function names for backward compatibility
export const GENERIC_IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
