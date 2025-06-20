'use client';

import React, { useState } from 'react';
import {
  findDomainConfig,
  parseURLPill,
  URLPillBehavior
} from '../../../lib/config/url-pills';
import { useOverlay } from '../../../lib/context/OverlayContext';
import './URLPill.css';

interface URLPillProps {
  content: string; // The full pill text: ![behavior](url)
  onURLClick?: (url: string, behavior: string) => void;
  onRemove?: () => void;
  onBehaviorChange?: (newContent: string) => void; // Callback when behavior changes
  isEditMode?: boolean;
  contextId: string;
  className?: string;
}

// YouTube Embed Component for inline rich embeds
const YouTubeEmbed: React.FC<{
  videoId: string;
  title?: string;
  width?: 'small' | 'medium' | 'large' | 'full';
  isEditMode?: boolean;
  onWidthChange?: (newWidth: 'small' | 'medium' | 'large' | 'full') => void;
  onModeChange?: (newMode: string) => void;
  currentMode?: string;
  availableModes?: URLPillBehavior[];
}> = ({
  videoId,
  title = 'YouTube video',
  width = 'full',
  isEditMode = false,
  onWidthChange,
  onModeChange,
  currentMode,
  availableModes = []
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          // Once loaded, we can disconnect the observer
          observer.disconnect();
        }
      },
      {
        // Start loading when the element is 100px away from being visible
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&modestbranding=1`;

  const handleWidthChange = (
    newWidth: 'small' | 'medium' | 'large' | 'full'
  ) => {
    if (onWidthChange) {
      onWidthChange(newWidth);
    }
  };

  const widthOptions = [
    { id: 'small', label: 'S', description: '400px max width' },
    { id: 'medium', label: 'M', description: '600px max width' },
    { id: 'large', label: 'L', description: '800px max width' },
    { id: 'full', label: 'F', description: 'Full available width' }
  ] as const;

  return (
    <div className={`youtube-embed youtube-embed--${width}`} ref={containerRef}>
      {/* Mode and width controls in edit mode */}
      {isEditMode && (
        <div className="youtube-embed__controls">
          {/* Mode controls */}
          {availableModes.length > 1 && onModeChange && (
            <div className="youtube-embed__mode-section">
              <span className="youtube-embed__controls-label">Mode:</span>
              {availableModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`youtube-embed__mode-button ${
                    currentMode === mode.id
                      ? 'youtube-embed__mode-button--active'
                      : ''
                  }`}
                  onClick={() => onModeChange(mode.id)}
                  title={mode.description}
                >
                  {mode.id === 'modal'
                    ? 'MOD'
                    : mode.id === 'link'
                      ? 'LIN'
                      : mode.id === 'embed'
                        ? 'EMB'
                        : mode.id.substring(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Width controls */}
          <div className="youtube-embed__width-section">
            <span className="youtube-embed__controls-label">Width:</span>
            {widthOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`youtube-embed__width-button ${
                  width === option.id
                    ? 'youtube-embed__width-button--active'
                    : ''
                }`}
                onClick={() => handleWidthChange(option.id)}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="youtube-embed__video-container">
        {isVisible ? (
          <iframe
            src={embedUrl}
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
            className="youtube-embed__iframe"
          />
        ) : (
          <div className="youtube-embed__placeholder">
            <div className="youtube-embed__placeholder-content">
              <div className="youtube-embed__placeholder-icon">📺</div>
              <div className="youtube-embed__placeholder-text">
                YouTube video will load when visible
              </div>
              <div className="youtube-embed__placeholder-title">{title}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// YouTube Modal Component
const YouTubeModal: React.FC<{
  videoId: string;
  onClose: () => void;
}> = ({ videoId, onClose }) => {
  const [videoTitle, setVideoTitle] = React.useState<string>('Loading...');
  const [aspectRatio, setAspectRatio] = React.useState<number>(16 / 9); // Default 16:9
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch video metadata
  React.useEffect(() => {
    const fetchVideoData = async () => {
      try {
        // Use YouTube oEmbed API to get video title without requiring API key
        const oEmbedResponse = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (oEmbedResponse.ok) {
          const oEmbedData = await oEmbedResponse.json();
          setVideoTitle(oEmbedData.title || 'YouTube Video');

          // Calculate aspect ratio from oEmbed dimensions
          if (oEmbedData.width && oEmbedData.height) {
            setAspectRatio(oEmbedData.width / oEmbedData.height);
          }
        } else {
          setVideoTitle('YouTube Video');
        }
      } catch (error) {
        console.warn('Failed to fetch YouTube video metadata:', error);
        setVideoTitle('YouTube Video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  // Calculate iframe dimensions based on aspect ratio
  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;

  // Account for modal chrome: 40px total padding + ~60px header + 20px margins
  const availableWidth = Math.min(viewportWidth - 60, 1200);
  const headerHeight = 60; // Approximate header height
  const availableHeight = viewportHeight - headerHeight - 40; // 40px for margins

  // Start with a good base width for 16:9 videos
  let iframeWidth = Math.min(availableWidth * 0.85, 800);
  let iframeHeight = iframeWidth / aspectRatio;

  // If the calculated height is too tall, scale down proportionally
  if (iframeHeight > availableHeight * 0.8) {
    iframeHeight = availableHeight * 0.8;
    iframeWidth = iframeHeight * aspectRatio;
  }

  // Ensure we don't exceed available space
  if (iframeWidth > availableWidth) {
    iframeWidth = availableWidth;
    iframeHeight = iframeWidth / aspectRatio;
  }

  // Set reasonable minimums
  iframeWidth = Math.max(400, iframeWidth);
  iframeHeight = Math.max(225, iframeHeight); // 225 is 400/16*9 for 16:9

  // Final safety check - ensure we don't exceed viewport
  iframeWidth = Math.min(iframeWidth, availableWidth);
  iframeHeight = Math.min(iframeHeight, availableHeight * 0.8);

  // Embed URL with parameters to hide title and related videos
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&modestbranding=1`;

  return (
    <div className="youtube-modal" style={{ width: iframeWidth }}>
      <div className="youtube-modal__header">
        <h3 className="youtube-modal__title" title={videoTitle}>
          {isLoading ? 'Loading...' : videoTitle}
        </h3>
        <button
          className="youtube-modal__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
      <div className="youtube-modal__content" style={{ height: iframeHeight }}>
        <iframe
          src={embedUrl}
          width={iframeWidth}
          height={iframeHeight}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={videoTitle}
        />
      </div>
    </div>
  );
};

export const URLPill: React.FC<URLPillProps> = ({
  content,
  onURLClick,
  onRemove,
  onBehaviorChange,
  isEditMode = false,
  contextId,
  className = ''
}) => {
  const { openOverlay, closeOverlay } = useOverlay();
  const [currentBehavior, setCurrentBehavior] = useState<string>('');

  // Parse the pill content
  const pillData = parseURLPill(content);
  const { behavior, url } = pillData || { behavior: '', url: '' };
  const domain = findDomainConfig(url);

  // Initialize behavior if needed (must be before early returns)
  React.useEffect(() => {
    if (!currentBehavior && domain) {
      setCurrentBehavior(behavior || domain.defaultBehavior);
    }
  }, [behavior, domain?.defaultBehavior, currentBehavior, domain]);

  // Early returns after hooks
  if (!pillData) {
    return <span className="url-pill url-pill--invalid">{content}</span>;
  }

  if (!domain) {
    return <span className="url-pill url-pill--unsupported">{content}</span>;
  }

  const handleBehaviorToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent form

    if (!domain || !isEditMode) return;

    const enabledBehaviors = domain.behaviors.filter((b) => b.enabled);
    const currentIndex = enabledBehaviors.findIndex(
      (b) => b.id === currentBehavior
    );
    const nextIndex = (currentIndex + 1) % enabledBehaviors.length;
    const nextBehavior = enabledBehaviors[nextIndex];

    if (nextBehavior) {
      setCurrentBehavior(nextBehavior.id);

      // Create updated pill content and notify parent
      if (onBehaviorChange && pillData) {
        const updatedContent = `![${nextBehavior.id}](${pillData.url})`;
        onBehaviorChange(updatedContent);
      }
    }
  };

  const handleURLClick = () => {
    if (isEditMode) {
      // In edit mode, don't trigger URL action
      return;
    }

    if (onURLClick) {
      onURLClick(url, currentBehavior);
    } else {
      // Default behavior - open URL based on behavior type
      switch (currentBehavior) {
        case 'modal':
          if (domain.domain === 'youtube.com' || domain.domain === 'youtu.be') {
            const videoId = domain.extractId ? domain.extractId(url) : null;
            if (videoId) {
              const modalId = `youtube-modal-${videoId}`;
              openOverlay({
                id: modalId,
                type: 'modal',
                component: YouTubeModal,
                props: {
                  videoId,
                  onClose: () => closeOverlay(modalId)
                }
              });
              return;
            }
          }
          // Fallback for other domains or if video ID extraction fails
          window.open(url, '_blank', 'noopener,noreferrer');
          break;
        case 'link':
          window.open(url, '_blank', 'noopener,noreferrer');
          break;
        case 'embed':
          // For embed behavior, we don't need to do anything on click
          // The embed is rendered inline below
          break;
        default:
          window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const displayBehavior = currentBehavior || behavior || domain.defaultBehavior;
  const behaviorConfig = domain.behaviors.find((b) => b.id === displayBehavior);

  const pillClasses = `url-pill url-pill--${domain.domain.replace('.', '-')} url-pill--${displayBehavior} ${className} ${
    isEditMode ? 'url-pill--edit-mode' : ''
  }`;

  // Create a comprehensive title with all the info
  const pillTitle = `${domain.name}: ${behaviorConfig?.name || displayBehavior} - ${url}`;

  // For embed behavior, render the embed content instead of just a pill
  if (displayBehavior === 'embed') {
    const videoId = domain.extractId ? domain.extractId(url) : null;
    if (
      videoId &&
      (domain.domain === 'youtube.com' || domain.domain === 'youtu.be')
    ) {
      // Parse width from customId if available (format: ![embed|width](url))
      const width =
        (pillData?.customId as 'small' | 'medium' | 'large' | 'full') || 'full';

      return (
        <div className="url-pill-embed-container">
          <YouTubeEmbed
            videoId={videoId}
            title={`YouTube video from ${domain.name}`}
            width={width}
            isEditMode={isEditMode}
            onWidthChange={(newWidth) => {
              if (onBehaviorChange && pillData) {
                // Update the pill content with new width, preserving current mode
                const updatedContent = `![${displayBehavior}|${newWidth}](${pillData.url})`;
                onBehaviorChange(updatedContent);
              }
            }}
            onModeChange={(newMode) => {
              if (onBehaviorChange && pillData) {
                // Update local state immediately
                setCurrentBehavior(newMode);

                // Preserve width if it exists
                const currentWidth = pillData.customId;
                const updatedContent = currentWidth
                  ? `![${newMode}|${currentWidth}](${pillData.url})`
                  : `![${newMode}](${pillData.url})`;
                onBehaviorChange(updatedContent);
              }
            }}
            currentMode={displayBehavior}
            availableModes={domain.behaviors.filter((b) => b.enabled)}
          />
        </div>
      );
    }
  }

  return (
    <span className={pillClasses} title={pillTitle}>
      {/* Main pill content as anchor for proper semantics */}
      <a
        href={isEditMode ? undefined : url} // Don't set href in edit mode
        target={isEditMode ? undefined : '_blank'}
        rel={isEditMode ? undefined : 'noopener noreferrer'}
        onClick={(e) => {
          e.preventDefault(); // Always prevent default anchor behavior
          if (!isEditMode) {
            handleURLClick(); // Only trigger URL action when not in edit mode
          }
        }}
        className="url-pill__link"
      >
        <span className="url-pill__icon">{domain.icon}</span>
        <span className="url-pill__domain">
          {domain.shortName || domain.name.substring(0, 2).toUpperCase()}
        </span>
        <span
          className="url-pill__behavior-icon"
          title={behaviorConfig?.description}
        >
          {behaviorConfig?.icon || '🔗'}
        </span>
      </a>

      {/* Compact behavior toggle in edit mode - like mention filter toggles */}
      {isEditMode && domain.behaviors.filter((b) => b.enabled).length > 1 && (
        <div className="url-pill__behavior-toggles">
          {domain.behaviors
            .filter((b) => b.enabled)
            .map((behaviorOption) => (
              <button
                key={behaviorOption.id}
                className={`url-pill__behavior-toggle url-pill__behavior-toggle--${behaviorOption.id} ${
                  displayBehavior === behaviorOption.id
                    ? 'url-pill__behavior-toggle--active'
                    : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onBehaviorChange && pillData) {
                    // Update local state immediately
                    setCurrentBehavior(behaviorOption.id);

                    // Preserve width if it exists
                    const currentWidth = pillData.customId;
                    const updatedContent = currentWidth
                      ? `![${behaviorOption.id}|${currentWidth}](${pillData.url})`
                      : `![${behaviorOption.id}](${pillData.url})`;
                    onBehaviorChange(updatedContent);
                  }
                }}
                title={behaviorOption.description}
                type="button"
              >
                {behaviorOption.id === 'modal'
                  ? 'MOD'
                  : behaviorOption.id === 'link'
                    ? 'LIN'
                    : behaviorOption.id === 'embed'
                      ? 'EMB'
                      : behaviorOption.id.substring(0, 3).toUpperCase()}
              </button>
            ))}
        </div>
      )}
    </span>
  );
};
