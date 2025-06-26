'use client';

import { useEffect, useState } from 'react';
import './TwitchChat.css';

export interface TwitchChatProps {
  username: string;
  height?: string;
  width?: string;
  theme?: 'light' | 'dark';
  className?: string;
  minimal?: boolean;
  hideHeader?: boolean;
}

export const TwitchChat: React.FC<TwitchChatProps> = ({
  username,
  height = '400px',
  width = '100%',
  theme = 'dark',
  className = '',
  minimal = false,
  hideHeader = false
}) => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`twitch-chat twitch-chat--loading ${className}`}
        style={{ height, width }}
      >
        <div className="twitch-chat__placeholder">Loading Twitch chat...</div>
      </div>
    );
  }

  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const darkMode = theme === 'dark' ? '&darkpopout' : '';

  // Build minimal chat URL with reduced UI elements
  let chatUrl = `https://www.twitch.tv/embed/${username}/chat?parent=${hostname}${darkMode}`;

  if (minimal) {
    // Add parameters for minimal chat experience
    chatUrl += '&migration=true'; // Use newer chat interface
  }

  // Calculate iframe height based on header visibility and size
  const headerHeight = hideHeader ? 0 : isMobile ? 50 : 60;
  const iframeHeight = `calc(100% - ${headerHeight}px)`;

  return (
    <div className={`twitch-chat ${className}`} style={{ height, width }}>
      {!hideHeader && (
        <div className="twitch-chat__header">
          <span className="twitch-chat__title">{username} Chat</span>
          <a
            href={`https://www.twitch.tv/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="twitch-chat__link"
          >
            View on Twitch
          </a>
        </div>
      )}
      <iframe
        src={chatUrl}
        height={iframeHeight}
        width="100%"
        title={`${username} Twitch Chat`}
        className="twitch-chat__iframe"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
      />
    </div>
  );
};
