'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from '../../../lib/context/OverlayContext';
import './OverlayRenderer.css';

// Draggable/Resizable Widget Component
const DraggableWidget: React.FC<{
  id: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isDraggable?: boolean;
  isResizable?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onClose?: () => void;
}> = ({
  id,
  children,
  position,
  size,
  isDraggable = true,
  isResizable = true,
  onPositionChange,
  onSizeChange,
  onClose
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentSize, setCurrentSize] = useState(size);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      !isDraggable ||
      (e.target as HTMLElement).classList.contains('widget-resize-handle')
    )
      return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && isDraggable) {
      const newPosition = {
        x: Math.max(
          0,
          Math.min(
            window.innerWidth - currentSize.width,
            e.clientX - dragOffset.x
          )
        ),
        y: Math.max(
          0,
          Math.min(
            window.innerHeight - currentSize.height,
            e.clientY - dragOffset.y
          )
        )
      };
      setCurrentPosition(newPosition);
      onPositionChange?.(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Handle resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResize = (e: MouseEvent) => {
    if (isResizing && isResizable) {
      const rect = widgetRef.current?.getBoundingClientRect();
      if (rect) {
        const newSize = {
          width: Math.max(200, e.clientX - rect.left),
          height: Math.max(150, e.clientY - rect.top)
        };
        setCurrentSize(newSize);
        onSizeChange?.(newSize);
      }
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener(
        'mousemove',
        isDragging ? handleMouseMove : handleResize
      );
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener(
          'mousemove',
          isDragging ? handleMouseMove : handleResize
        );
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, currentPosition, currentSize]);

  return (
    <div
      ref={widgetRef}
      className={`overlay-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        position: 'fixed',
        left: currentPosition.x,
        top: currentPosition.y,
        width: currentSize.width,
        height: currentSize.height,
        zIndex: 1000,
        cursor: isDraggable ? 'move' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="widget-header">
        <div className="widget-title">Widget {id}</div>
        <button className="widget-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="widget-content">{children}</div>
      {isResizable && (
        <div className="widget-resize-handle" onMouseDown={handleResizeStart} />
      )}
    </div>
  );
};

// Modal Component
const Modal: React.FC<{
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}> = ({ children, onClose, className = '' }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={`overlay-modal ${className}`}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

// Main Overlay Renderer
export const OverlayRenderer: React.FC = () => {
  const { overlays, closeOverlay, updateOverlay } = useOverlay();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    // Create or get the portal container
    let container = document.getElementById('overlay-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'overlay-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    return () => {
      // Clean up portal container if no overlays exist
      if (overlays.length === 0 && container?.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [overlays.length]);

  if (!portalContainer || overlays.length === 0) {
    return null;
  }

  return createPortal(
    <>
      {overlays.map((overlay) => {
        const { id, config } = overlay;
        const Component = config.component;

        if (config.type === 'modal') {
          return (
            <Modal
              key={id}
              onClose={() => closeOverlay(id)}
              className={config.props?.className}
            >
              <Component {...(config.props || {})} />
            </Modal>
          );
        }

        if (config.type === 'widget') {
          return (
            <DraggableWidget
              key={id}
              id={id}
              position={config.position || { x: 100, y: 100 }}
              size={config.size || { width: 300, height: 200 }}
              isDraggable={config.isDraggable}
              isResizable={config.isResizable}
              onPositionChange={(position) => updateOverlay(id, { position })}
              onSizeChange={(size) => updateOverlay(id, { size })}
              onClose={() => closeOverlay(id)}
            >
              <Component {...(config.props || {})} />
            </DraggableWidget>
          );
        }

        // Default popup rendering
        return (
          <div
            key={id}
            className="overlay-popup"
            style={{ zIndex: config.zIndex }}
          >
            <Component {...(config.props || {})} />
          </div>
        );
      })}
    </>,
    portalContainer
  );
};
