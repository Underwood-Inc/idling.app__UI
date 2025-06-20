'use client';

import React, { useState } from 'react';
import { findDomainConfig, parseURLPill } from '../../../lib/config/url-pills';
import { useOverlay } from '../../../lib/context/OverlayContext';
import './URLPill.css';

interface URLPillProps {
  content: string; // The full pill text: ![behavior](url)
  onURLClick?: (url: string, behavior: string) => void;
  onRemove?: () => void;
  isEditMode?: boolean;
  contextId: string;
  className?: string;
}

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
      // Note: In a real implementation, this would update the pill content
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
          // Rich embed is handled by the component display itself
          // No action needed for inline embeds
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
        <button
          className={`url-pill__behavior-toggle url-pill__behavior-toggle--${displayBehavior}`}
          onClick={handleBehaviorToggle}
          title={`Switch behavior (current: ${behaviorConfig?.name})`}
        >
          {behaviorConfig?.name?.substring(0, 3).toUpperCase() ||
            displayBehavior.substring(0, 3).toUpperCase()}
        </button>
      )}
    </span>
  );
};
