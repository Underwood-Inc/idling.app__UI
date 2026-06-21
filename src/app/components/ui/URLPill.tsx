'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { getMediaType } from '@lib/config/media-domains';
import { getURLPillType, shouldEmbedURL } from '@lib/config/url-pills';
import { useOverlay } from '@lib/context/OverlayContext';
import { ImageEmbed } from './ImageEmbed';
import './URLPill.css';
import { YouTubeEmbed } from './YouTubeEmbed';
import { YouTubeModal } from './YouTubeModal';

function UrlPillIcon({
  id,
  className = 'url-pill__icon',
  sizeRem = 1,
}: {
  id: SiteIconId;
  className?: string;
  sizeRem?: number;
}) {
  return <SiteIcon id={id} className={className} sizeRem={sizeRem} />;
}

interface URLPillProps {
  url: string;
  behavior?: 'embed' | 'link' | 'modal';
  width?: 'small' | 'medium' | 'large' | 'full';
  customId?: string;
  className?: string;
  isEditMode?: boolean;
  onWidthChange?: (newWidth: 'small' | 'medium' | 'large' | 'full') => void;
  onModeChange?: (newMode: 'embed' | 'link' | 'modal') => void;
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
  const { openOverlay, closeOverlay } = useOverlay();

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

  // Handle different behaviors
  if (behavior === 'modal' && mediaType === 'youtube') {
    // Modal behavior for YouTube - render as clickable link that opens modal
    const domain = new URL(url).hostname.replace('www.', '');

    const handleModalClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const modalId = `youtube-modal-${url}`;

      openOverlay({
        id: modalId,
        type: 'modal',
        component: YouTubeModal,
        props: {
          url,
          title: customId || 'YouTube Video',
          onClose: () => closeOverlay(modalId)
        }
      });
    };

    return (
      <div
        className={`url-pill url-pill--modal ${className} url-pill--youtube-com`}
      >
        <a href="#" className="url-pill__link" onClick={handleModalClick}>
          <SiteIcon id="tv" className="url-pill__icon" sizeRem={1} />
          <span className="url-pill__domain">{domain}</span>
          <UrlPillIcon id="maximize" className="url-pill__behavior-icon" sizeRem={0.875} />
        </a>

        {isEditMode && (onModeChange || onWidthChange) && (
          <div className="url-pill__behavior-toggles">
            {onModeChange && (
              <>
                <button
                  type="button"
                  className="url-pill__behavior-toggle url-pill__behavior-toggle--embed"
                  onClick={() => onModeChange('embed')}
                  title="Show as embed"
                >
                  <UrlPillIcon id="tv" className="url-pill__toggle-icon" sizeRem={0.875} /> Embed
                </button>
                <button
                  type="button"
                  className="url-pill__behavior-toggle url-pill__behavior-toggle--link"
                  onClick={() => onModeChange('link')}
                  title="Show as link"
                >
                  <UrlPillIcon id="link" className="url-pill__toggle-icon" sizeRem={0.875} /> Link
                </button>
                <button
                  type="button"
                  className="url-pill__behavior-toggle url-pill__behavior-toggle--modal url-pill__behavior-toggle--active"
                  onClick={() => onModeChange('modal')}
                  title="Show in modal"
                >
                  <UrlPillIcon id="maximize" className="url-pill__toggle-icon" sizeRem={0.875} /> Modal
                </button>
              </>
            )}

            {onWidthChange && (
              <div className="url-pill__width-note">
                Width controls available in embed mode
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (behavior === 'embed' || (behavior === undefined && shouldEmbedURL(url))) {
    // Embed behavior
    switch (mediaType) {
      case 'youtube':
        if (isEditMode && (onModeChange || onWidthChange)) {
          // In edit mode, wrap YouTube embed with controls
          return (
            <div className={`url-pill youtube-pill-wrapper ${className}`}>
              <YouTubeEmbed
                url={url}
                width={
                  width === 'small'
                    ? 'S'
                    : width === 'medium'
                      ? 'M'
                      : width === 'large'
                        ? 'L'
                        : width === 'full'
                          ? 'F'
                          : 'M'
                }
                className="url-pill youtube-pill"
                title={customId || 'YouTube video'}
              />
              <div className="url-pill__behavior-toggles">
                {onModeChange && (
                  <>
                    <button
                      type="button"
                      className={`url-pill__behavior-toggle url-pill__behavior-toggle--embed ${
                        behavior === 'embed' || behavior === undefined
                          ? 'url-pill__behavior-toggle--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onModeChange('embed');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Embed video player"
                    >
                      <UrlPillIcon id="tv" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                    <button
                      type="button"
                      className="url-pill__behavior-toggle url-pill__behavior-toggle--link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onModeChange('link');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Show as clickable link"
                    >
                      <UrlPillIcon id="link" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                    <button
                      type="button"
                      className="url-pill__behavior-toggle url-pill__behavior-toggle--modal"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onModeChange('modal');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Open in modal popup"
                    >
                      <UrlPillIcon id="maximize" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                  </>
                )}

                {onWidthChange && (
                  <div className="url-pill__width-controls">
                    <button
                      type="button"
                      className={`url-pill__behavior-toggle ${
                        width === 'small'
                          ? 'url-pill__behavior-toggle--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onWidthChange('small');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Small size (320px)"
                    >
                      <UrlPillIcon id="smartphone" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                    <button
                      type="button"
                      className={`url-pill__behavior-toggle ${
                        width === 'medium'
                          ? 'url-pill__behavior-toggle--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onWidthChange('medium');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Medium size (560px)"
                    >
                      <UrlPillIcon id="monitor" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                    <button
                      type="button"
                      className={`url-pill__behavior-toggle ${
                        width === 'large'
                          ? 'url-pill__behavior-toggle--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onWidthChange('large');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Large size (800px)"
                    >
                      <UrlPillIcon id="monitorPlay" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                    <button
                      type="button"
                      className={`url-pill__behavior-toggle ${
                        width === 'full'
                          ? 'url-pill__behavior-toggle--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onWidthChange('full');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Full width (100%)"
                    >
                      <UrlPillIcon id="tv" className="url-pill__toggle-icon" sizeRem={0.875} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          // Normal mode, just render the embed
          return (
            <YouTubeEmbed
              url={url}
              width={
                width === 'small'
                  ? 'S'
                  : width === 'medium'
                    ? 'M'
                    : width === 'large'
                      ? 'L'
                      : width === 'full'
                        ? 'F'
                        : 'M'
              }
              className={`url-pill youtube-pill ${className}`}
              title={customId || 'YouTube video'}
            />
          );
        }

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
        // Unknown media type - render as enhanced link pill with controls
        return (
          <div className={`url-pill url-pill--unknown ${className}`}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="url-pill__link"
            >
              <UrlPillIcon id="link" />
              <span className="url-pill__domain">
                {new URL(url).hostname.replace('www.', '')}
              </span>
            </a>

            {isEditMode && (onModeChange || onWidthChange) && (
              <div className="url-pill__behavior-toggles">
                {onModeChange && (
                  <>
                    <button
                      type="button"
                      className={`url-pill__behavior-toggle url-pill__behavior-toggle--embed ${
                        behavior === 'embed' || behavior === undefined
                          ? 'url-pill__behavior-toggle--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onModeChange('embed');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Show as embed"
                    >
                      E
                    </button>
                    <button
                      type="button"
                      className="url-pill__behavior-toggle url-pill__behavior-toggle--link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onModeChange('link');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Show as link"
                    >
                      L
                    </button>
                    <button
                      type="button"
                      className="url-pill__behavior-toggle url-pill__behavior-toggle--modal"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onModeChange('modal');
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      title="Show in modal"
                    >
                      M
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
    }
  }

  // Render as enhanced link pill with domain info (for 'link', 'modal', or other behaviors)
  const domain = new URL(url).hostname.replace('www.', '');
  const isYouTube = domain.includes('youtube') || domain.includes('youtu.be');
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff|tif)$/i.test(
    url
  );
  const isVideo = /\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v|mkv|3gp|ogv)$/i.test(
    url
  );

  // Handle link click - open modal for modal behavior, otherwise normal link
  const handleLinkClick = (e: React.MouseEvent) => {
    if (behavior === 'modal' && isYouTube) {
      e.preventDefault();
      e.stopPropagation();

      const modalId = `youtube-modal-${url}`;

      openOverlay({
        id: modalId,
        type: 'modal',
        component: YouTubeModal,
        props: {
          url,
          title: customId || 'YouTube Video',
          onClose: () => closeOverlay(modalId)
        }
      });
    }
    // For non-modal behavior, let the link work normally
  };

  return (
    <div
      className={`url-pill url-pill--link ${className} ${
        isYouTube ? 'url-pill--youtube-com' : ''
      }`}
    >
      <a
        href={behavior === 'modal' ? '#' : url}
        target={behavior === 'modal' ? undefined : '_blank'}
        rel={behavior === 'modal' ? undefined : 'noopener noreferrer'}
        className="url-pill__link"
        onClick={handleLinkClick}
      >
        <UrlPillIcon
          id={isYouTube ? 'tv' : isImage ? 'image' : isVideo ? 'video' : 'link'}
        />
        <span className="url-pill__domain">{domain}</span>
        {behavior && (
          <UrlPillIcon
            id={behavior === 'modal' ? 'maximize' : 'arrowUpRight'}
            className="url-pill__behavior-icon"
            sizeRem={0.875}
          />
        )}
      </a>

      {isEditMode && (onModeChange || onWidthChange) && (
        <div className="url-pill__behavior-toggles">
          {onModeChange && (
            <>
              <button
                type="button"
                className={`url-pill__behavior-toggle url-pill__behavior-toggle--embed`}
                onClick={() => onModeChange('embed')}
                title="Show as embed"
              >
                <UrlPillIcon id="tv" className="url-pill__toggle-icon" sizeRem={0.875} /> Embed
              </button>
              <button
                type="button"
                className={`url-pill__behavior-toggle url-pill__behavior-toggle--link ${
                  behavior === 'link' ? 'url-pill__behavior-toggle--active' : ''
                }`}
                onClick={() => onModeChange('link')}
                title="Show as link"
              >
                <UrlPillIcon id="link" className="url-pill__toggle-icon" sizeRem={0.875} /> Link
              </button>
              {isYouTube && (
                <button
                  type="button"
                  className={`url-pill__behavior-toggle url-pill__behavior-toggle--modal ${
                    behavior === 'modal'
                      ? 'url-pill__behavior-toggle--active'
                      : ''
                  }`}
                  onClick={() => onModeChange('modal')}
                  title="Show in modal"
                >
                  <UrlPillIcon id="maximize" className="url-pill__toggle-icon" sizeRem={0.875} /> Modal
                </button>
              )}
            </>
          )}

          {onWidthChange && (
            <div className="url-pill__width-note">
              Width controls available in embed mode
            </div>
          )}
        </div>
      )}
    </div>
  );
}
