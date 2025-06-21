import React from 'react';
import './URLPill.css';

interface YouTubeEmbedProps {
  url: string;
  width?: 'S' | 'M' | 'L' | 'F';
  className?: string;
  title?: string;
}

export function YouTubeEmbed({
  url,
  width = 'F',
  className = '',
  title = 'YouTube video'
}: YouTubeEmbedProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Extract video ID from URL
  const extractVideoId = (youtubeUrl: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = youtubeUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = extractVideoId(url);

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

  if (!videoId) {
    return (
      <div className={`youtube-embed-error ${className}`}>
        <div className="youtube-embed-error__content">
          <div className="youtube-embed-error__icon">📺</div>
          <div className="youtube-embed-error__text">Invalid YouTube URL</div>
          <div className="youtube-embed-error__url">{url}</div>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&modestbranding=1`;
  const widthClass = `youtube-embed--${width.toLowerCase()}`;

  return (
    <div
      className={`youtube-embed ${widthClass} ${className}`}
      ref={containerRef}
    >
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
}
