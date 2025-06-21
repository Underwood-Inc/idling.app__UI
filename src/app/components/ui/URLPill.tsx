'use client';

import { getMediaType } from '../../../lib/config/media-domains';
import { getURLPillType, shouldEmbedURL } from '../../../lib/config/url-pills';
import { ImageEmbed } from './ImageEmbed';
import './URLPill.css';

interface URLPillProps {
  url: string;
  behavior?: 'embed' | 'link';
  width?: 'small' | 'medium' | 'large' | 'full';
  customId?: string;
  className?: string;
  isEditMode?: boolean;
  onWidthChange?: (newWidth: 'small' | 'medium' | 'large' | 'full') => void;
  onModeChange?: (newMode: 'embed' | 'link') => void;
  onBehaviorChange?: (oldContent: string, newContent: string) => void;
  onRemove?: () => void;
}

export function URLPill({
  url,
  behavior,
  width = 'medium',
  customId,
  className = '',
  isEditMode,
  onWidthChange,
  onModeChange,
  onBehaviorChange,
  onRemove
}: URLPillProps) {
  // Validate URL prop
  if (!url || typeof url !== 'string') {
    console.warn('URLPill: Invalid or missing URL prop:', url);
    return (
      <span className={`url-pill url-pill--invalid ${className}`}>
        Invalid URL
      </span>
    );
  }

  // Determine the media type and behavior
  const mediaType = getMediaType(url);
  const pillType = getURLPillType(url);
  const shouldEmbed =
    behavior === 'embed' || (behavior === undefined && shouldEmbedURL(url));

  // Handle temporary images specially
  if (url.startsWith('data:temp-image;')) {
    return (
      <ImageEmbed
        src={url}
        width={width}
        mode="embed"
        className={`url-pill temp-image-pill ${className}`}
        isTemporary={true}
        isEditMode={isEditMode}
        onWidthChange={onWidthChange}
        onModeChange={onModeChange}
        onRemove={onRemove}
      />
    );
  }

  // Handle different media types
  if (shouldEmbed) {
    switch (mediaType) {
      case 'youtube':
        // Temporarily render as link until YouTubeEmbed is fixed
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`url-pill youtube-pill ${className}`}
          >
            📺 {customId || url}
          </a>
        );

      case 'image':
        return (
          <ImageEmbed
            src={url}
            width={width}
            mode="embed"
            className={`url-pill image-pill ${className}`}
            isEditMode={isEditMode}
            onWidthChange={onWidthChange}
            onModeChange={onModeChange}
            onRemove={onRemove}
          />
        );

      default:
        // Unknown media type - render as link
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`url-pill link-pill ${className}`}
          >
            {customId || url}
          </a>
        );
    }
  }

  // Render as link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`url-pill link-pill ${className}`}
    >
      {customId || url}
    </a>
  );
}
