import React from 'react';
import './URLPill.css';

interface ImageEmbedProps {
  src: string;
  alt?: string;
  width?: 'small' | 'medium' | 'large' | 'full';
  mode?: 'embed' | 'link';
  className?: string;
  isTemporary?: boolean;
  onRemove?: () => void;
  onWidthChange?: (newWidth: 'small' | 'medium' | 'large' | 'full') => void;
  onModeChange?: (newMode: 'embed' | 'link') => void;
  isEditMode?: boolean;
}

export function ImageEmbed({
  src,
  alt = 'Image',
  width = 'medium',
  mode = 'embed',
  className = '',
  isTemporary = false,
  onRemove,
  onWidthChange,
  onModeChange,
  isEditMode
}: ImageEmbedProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Detect if this is a video file
  const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src);

  const handleMediaLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleMediaError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Handle temporary images specially
  let imageSrc = src;
  if (src.startsWith('data:temp-image;')) {
    // Extract the actual data URL from the temp format
    const dataURLMatch = src.match(
      /;(data:image\/[^;]*;base64,[A-Za-z0-9+/=]+)/
    );
    if (dataURLMatch) {
      imageSrc = dataURLMatch[1];
    }
  }

  // Map width to CSS class - use single letter for CSS classes
  const widthMap = {
    small: 's',
    medium: 'm',
    large: 'l',
    full: 'f'
  };
  const widthClass = `image-embed--${widthMap[width]}`;

  return (
    <div className={`image-embed ${widthClass} ${className}`}>
      <div
        className={`image-embed__image-container ${isTemporary ? 'image-embed__image-container--temp' : ''}`}
      >
        {/* Interactive controls - similar to YouTube embeds */}
        {(isEditMode && (onWidthChange || onModeChange)) || onRemove ? (
          <div className="image-embed__controls">
            {/* Remove button */}
            {onRemove && (
              <div className="image-embed__remove-section">
                <button
                  className="image-embed__remove-button-inline"
                  onClick={onRemove}
                  type="button"
                  aria-label="Remove image"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}

            {onModeChange && (
              <div className="image-embed__mode-section">
                <span className="image-embed__controls-label">Mode:</span>
                <button
                  className={`image-embed__mode-button ${mode === 'embed' ? 'image-embed__mode-button--active' : ''}`}
                  onClick={() => onModeChange('embed')}
                  title="Embed mode - show image inline"
                  type="button"
                >
                  EMB
                </button>
                <button
                  className={`image-embed__mode-button ${mode === 'link' ? 'image-embed__mode-button--active' : ''}`}
                  onClick={() => onModeChange('link')}
                  title="Link mode - show as clickable link"
                  type="button"
                >
                  LNK
                </button>
              </div>
            )}

            {onWidthChange && (
              <div className="image-embed__width-section">
                <span className="image-embed__controls-label">Size:</span>
                <button
                  className={`image-embed__width-button ${width === 'small' ? 'image-embed__width-button--active' : ''}`}
                  onClick={() => onWidthChange('small')}
                  title="Small (400px)"
                  type="button"
                >
                  S
                </button>
                <button
                  className={`image-embed__width-button ${width === 'medium' ? 'image-embed__width-button--active' : ''}`}
                  onClick={() => onWidthChange('medium')}
                  title="Medium (600px)"
                  type="button"
                >
                  M
                </button>
                <button
                  className={`image-embed__width-button ${width === 'large' ? 'image-embed__width-button--active' : ''}`}
                  onClick={() => onWidthChange('large')}
                  title="Large (800px)"
                  type="button"
                >
                  L
                </button>
                <button
                  className={`image-embed__width-button ${width === 'full' ? 'image-embed__width-button--active' : ''}`}
                  onClick={() => onWidthChange('full')}
                  title="Full width"
                  type="button"
                >
                  F
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Temporary indicator is handled by CSS ::after pseudo-element */}

        {hasError ? (
          <div className="image-embed__error">
            <div className="image-embed__error-content">
              <div className="image-embed__error-icon">
                {isVideo ? '🎥' : '🖼️'}
              </div>
              <div className="image-embed__error-text">
                Failed to load {isVideo ? 'video' : 'image'}
              </div>
              <div className="image-embed__error-url">{src}</div>
            </div>
          </div>
        ) : isVideo ? (
          <video
            src={imageSrc}
            className={`image-embed__video ${isLoaded ? 'image-embed__video--loaded' : ''}`}
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
            controls
            loop
            muted
            playsInline
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={imageSrc}
            alt={alt}
            className={`image-embed__image ${isLoaded ? 'image-embed__image--loaded' : ''}`}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}
