'use client';

import { useEffect, useState } from 'react';
import { FaTwitch, FaYoutube } from 'react-icons/fa';
import './LiveStreamEmbed.css';

type Platform = 'twitch' | 'youtube';

interface StreamStatus {
  isLive: boolean;
  title?: string;
  viewers?: number;
}

interface LiveStreamEmbedProps {
  twitchChannel?: string;
  youtubeChannel?: string;
  defaultPlatform?: Platform;
  checkInterval?: number; // How often to check live status (ms)
}

export function LiveStreamEmbed({
  twitchChannel = 'strixun',
  youtubeChannel = '@strixun',
  defaultPlatform = 'twitch',
  checkInterval = 60000 // Check every minute
}: LiveStreamEmbedProps) {
  const [selectedPlatform, setSelectedPlatform] =
    useState<Platform>(defaultPlatform);
  const [isLoading, setIsLoading] = useState(true);
  const [twitchStatus, setTwitchStatus] = useState<StreamStatus>({
    isLive: false
  });
  const [youtubeStatus, setYoutubeStatus] = useState<StreamStatus>({
    isLive: false
  });

  // Check if stream is live
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const response = await fetch(
          `/api/streams/live-status?twitch=${twitchChannel}&youtube=${youtubeChannel}`,
          {
            headers: { 'X-Background-Request': 'true' } // Don't trigger loader
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTwitchStatus(data.twitch);
          setYoutubeStatus(data.youtube);

          // Auto-switch logic:
          // - Prefer Twitch when both are live
          // - Only switch if current platform is offline and other is live
          if (data.twitch.isLive && data.youtube.isLive) {
            // Both live: prefer Twitch
            if (selectedPlatform !== 'twitch') {
              setSelectedPlatform('twitch');
            }
          } else if (
            selectedPlatform === 'twitch' &&
            !data.twitch.isLive &&
            data.youtube.isLive
          ) {
            // Twitch offline, YouTube live: switch to YouTube
            setSelectedPlatform('youtube');
          } else if (
            selectedPlatform === 'youtube' &&
            !data.youtube.isLive &&
            data.twitch.isLive
          ) {
            // YouTube offline, Twitch live: switch to Twitch
            setSelectedPlatform('twitch');
          }
        }
      } catch (error) {
        console.error('Failed to check stream status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately
    checkLiveStatus();

    // Check periodically
    const interval = setInterval(checkLiveStatus, checkInterval);

    return () => clearInterval(interval);
  }, [twitchChannel, youtubeChannel, checkInterval, selectedPlatform]);

  const getTwitchEmbedUrl = () => {
    return `https://player.twitch.tv/?channel=${twitchChannel}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&muted=false`;
  };

  const getYouTubeEmbedUrl = () => {
    // YouTube channel live embed URL
    // This will show the latest live stream or a "channel is offline" message
    const channelHandle = youtubeChannel.replace('@', '');
    // Use channel handle format for latest live stream
    return `https://www.youtube.com/embed/${channelHandle}/live`;
  };

  const getPlatformUrl = () => {
    if (selectedPlatform === 'twitch') {
      return `https://www.twitch.tv/${twitchChannel}`;
    }
    return `https://www.youtube.com/${youtubeChannel}`;
  };

  // Check if ANY stream is live
  const isAnyStreamLive = twitchStatus.isLive || youtubeStatus.isLive;

  // Don't render if no streams are live
  if (!isLoading && !isAnyStreamLive) {
    return null;
  }

  // Show loading state in a card
  if (isLoading) {
    return (
      <div className="live-stream-embed live-stream-embed--loading">
        <div className="live-stream-embed__loading">
          <div className="live-stream-embed__loading-spinner"></div>
          <p>Checking stream status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-stream-embed" style={{ width: '100%' }}>
      <div className="live-stream-embed__header">
        <h3 className="live-stream-embed__title">
          📺 Live Streams
          {isAnyStreamLive && (
            <span className="live-stream-embed__live-badge">
              <span className="live-stream-embed__live-dot">●</span> LIVE
            </span>
          )}
        </h3>
        <p className="live-stream-embed__subtitle">
          Watch live gameplay, development, and creative content
        </p>
      </div>

      <div className="live-stream-embed__controls">
        <div className="live-stream-embed__platform-toggle">
          {twitchStatus.isLive && (
            <button
              onClick={() => setSelectedPlatform('twitch')}
              className={`live-stream-embed__platform-button ${
                selectedPlatform === 'twitch'
                  ? 'live-stream-embed__platform-button--active'
                  : ''
              }`}
              aria-label="Switch to Twitch"
            >
              <FaTwitch className="live-stream-embed__platform-icon" />
              <span>Twitch</span>
              {twitchStatus.viewers && (
                <span className="live-stream-embed__viewer-count">
                  {twitchStatus.viewers.toLocaleString()}
                </span>
              )}
            </button>
          )}
          {youtubeStatus.isLive && (
            <button
              onClick={() => setSelectedPlatform('youtube')}
              className={`live-stream-embed__platform-button ${
                selectedPlatform === 'youtube'
                  ? 'live-stream-embed__platform-button--active'
                  : ''
              }`}
              aria-label="Switch to YouTube"
            >
              <FaYoutube className="live-stream-embed__platform-icon" />
              <span>YouTube</span>
            </button>
          )}
        </div>

        <a
          href={getPlatformUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="live-stream-embed__external-link"
        >
          Open in {selectedPlatform === 'twitch' ? 'Twitch' : 'YouTube'} →
        </a>
      </div>

      {
        <div className="live-stream-embed__player">
          <div className="live-stream-embed__aspect-ratio">
            {selectedPlatform === 'twitch' ? (
              <iframe
                src={getTwitchEmbedUrl()}
                height="100%"
                width="100%"
                allowFullScreen
                title="Twitch Stream"
                className="live-stream-embed__iframe"
              />
            ) : (
              <iframe
                src={getYouTubeEmbedUrl()}
                height="100%"
                width="100%"
                allowFullScreen
                title="YouTube Stream"
                className="live-stream-embed__iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        </div>
      }

      <div className="live-stream-embed__info">
        <div className="live-stream-embed__channels">
          <div className="live-stream-embed__channel">
            <FaTwitch className="live-stream-embed__channel-icon live-stream-embed__channel-icon--twitch" />
            <a
              href={`https://www.twitch.tv/${twitchChannel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="live-stream-embed__channel-link"
            >
              twitch.tv/{twitchChannel}
            </a>
          </div>
          <div className="live-stream-embed__channel">
            <FaYoutube className="live-stream-embed__channel-icon live-stream-embed__channel-icon--youtube" />
            <a
              href={`https://www.youtube.com/${youtubeChannel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="live-stream-embed__channel-link"
            >
              youtube.com/{youtubeChannel}
            </a>
          </div>
        </div>
        <p className="live-stream-embed__schedule">
          Stream schedule varies - follow on your preferred platform for
          notifications!
        </p>
      </div>
    </div>
  );
}
