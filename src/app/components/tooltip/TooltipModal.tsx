import React, { RefObject } from 'react';
import ReactDOM from 'react-dom';
import './TooltipModal.css';

interface TooltipModalProps {
  showModal: boolean;
  enableCtrlClick: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  url: string;
  modalContentRef: RefObject<HTMLDivElement>;
  onModalClose: (e: React.MouseEvent) => void;
  onModalContentClick: (e: React.MouseEvent) => void;
  onFullscreenToggle: (e: React.MouseEvent) => void;
  onControlsToggle: (e: React.MouseEvent) => void;
}

export const TooltipModal: React.FC<TooltipModalProps> = ({
  showModal,
  enableCtrlClick,
  isFullscreen,
  showControls,
  url,
  modalContentRef,
  onModalClose,
  onModalContentClick,
  onFullscreenToggle,
  onControlsToggle
}) => {
  if (!showModal || !enableCtrlClick) return null;

  return ReactDOM.createPortal(
    <div
      className="link-preview-modal"
      data-testid="link-preview-modal"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onModalClose}
    >
      <div
        ref={modalContentRef}
        className={`link-preview-modal-content ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={onModalContentClick}
      >
        <div
          className={`modal-controls ${showControls ? 'visible' : 'hidden'}`}
        >
          <div className="modal-controls-buttons">
            <button
              className="modal-control-button fullscreen-toggle"
              onClick={onFullscreenToggle}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>
            <button
              className="modal-control-button close-button"
              onClick={onModalClose}
              aria-label="Close modal"
            >
              ×
            </button>
            <button
              className="modal-control-button toggle-button"
              onClick={onControlsToggle}
              aria-label="Hide controls"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
        </div>
        {!showControls && (
          <button
            className="modal-control-button toggle-button restore-button"
            onClick={onControlsToggle}
            aria-label="Show controls"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        )}
        <iframe
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>,
    document.getElementById('overlay-portal')!
  );
};
