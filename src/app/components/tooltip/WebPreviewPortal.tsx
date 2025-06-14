'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import './WebPreviewPortal.css';

interface WebPreviewPortalProps {
  url: string;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const WebPreviewPortal: React.FC<WebPreviewPortalProps> = ({
  url,
  isVisible,
  position
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isVisible && iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = url;
    }
  }, [url, isVisible]);

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div
      className="web-preview-portal"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="web-preview-header">
        <div className="web-preview-url">{url}</div>
        <div className="web-preview-controls">
          <button className="web-preview-close">×</button>
        </div>
      </div>
      {isLoading && (
        <div className="web-preview-loading">
          <div className="web-preview-spinner"></div>
          Loading preview...
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="web-preview-iframe"
        onLoad={() => setIsLoading(false)}
        sandbox="allow-same-origin allow-scripts"
      />
    </div>,
    document.body
  );
};
