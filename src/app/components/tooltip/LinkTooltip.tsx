'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTooltipCache } from '../../hooks/useTooltipCache';
import { useTooltipHandlers } from '../../hooks/useTooltipHandlers';
import { useTooltipPosition } from '../../hooks/useTooltipPosition';
import { useTooltipState } from '../../hooks/useTooltipState';
import './LinkTooltip.css';
import { TooltipContent } from './TooltipContent';
import { TooltipModal } from './TooltipModal';

interface LinkTooltipProps {
  url: string;
  children: React.ReactNode;
  enableExtendedPreview?: boolean;
  enableCtrlClick?: boolean;
  cacheDuration?: number;
  isInsideParagraph?: boolean;
  className?: string;
}

export const LinkTooltip: React.FC<LinkTooltipProps> = ({
  url,
  children,
  enableExtendedPreview = false,
  enableCtrlClick = false,
  cacheDuration,
  isInsideParagraph = false,
  className
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const state = useTooltipState();
  const cache = useTooltipCache(url, cacheDuration);
  const { position, updatePosition } = useTooltipPosition(
    tooltipRef,
    tooltipContentRef
  );

  const fetchPreview = useCallback(async () => {
    if (!state.shouldFetchRef.current) return;
    state.shouldFetchRef.current = false;

    state.setLoading(true);
    state.setError(null);

    const cached = cache.getCachedData(url);
    if (cached) {
      state.setTooltipData(cached.data);
      cache.setIsCached(true);
      cache.setLastUpdated(new Date(cached.timestamp));
      state.setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      state.setTooltipData(data);
      cache.setCachedData(url, data);
      cache.setIsCached(false);
      cache.setLastUpdated(new Date());
    } catch (err) {
      state.setError(
        err instanceof Error ? err.message : 'Failed to load preview'
      );
    } finally {
      state.setLoading(false);
    }
  }, [url, cache, state]);

  const handleRefresh = useCallback(async () => {
    state.setLoading(true);
    state.setError(null);
    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      state.setTooltipData(data);
      cache.setCachedData(url, data);
    } catch (err) {
      state.setError(
        err instanceof Error ? err.message : 'Failed to load preview'
      );
    } finally {
      state.setLoading(false);
    }
  }, [url, cache, state]);

  const handlers = useTooltipHandlers({
    showTooltip: state.showTooltip,
    setShowTooltip: state.setShowTooltip,
    setShowModal: state.setShowModal,
    setIsFullscreen: state.setIsFullscreen,
    setShowControls: state.setShowControls,
    isFullscreen: state.isFullscreen,
    showControls: state.showControls,
    hideTimeoutRef: state.hideTimeoutRef,
    isHoveringRef: state.isHoveringRef,
    shouldFetchRef: state.shouldFetchRef,
    updatePosition,
    fetchPreview,
    url,
    enableCtrlClick
  });

  useEffect(() => {
    state.setMounted(true);
  }, [state]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        state.showTooltip &&
        tooltipContentRef.current &&
        !tooltipContentRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        state.setShowTooltip(false);
        state.shouldFetchRef.current = true;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.showTooltip, state]);

  useEffect(() => {
    if (state.showTooltip) {
      fetchPreview();
    }
  }, [state.showTooltip, fetchPreview]);

  useEffect(() => {
    if (state.showTooltip) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [state.showTooltip, updatePosition]);

  useEffect(() => {
    if (state.showModal) {
      document.body.classList.add('modal-open');
      state.setShowTooltip(false);
      state.shouldFetchRef.current = true;
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [state.showModal, state]);

  const Wrapper = isInsideParagraph ? 'span' : 'div';

  // Handle mobile click behavior on the wrapper
  const handleWrapperClick = (e: React.MouseEvent) => {
    const isMobile = window.matchMedia(
      '(hover: none) and (pointer: coarse)'
    ).matches;

    if (isMobile) {
      // On mobile, prevent any default link behavior from child elements
      e.preventDefault();
      e.stopPropagation();
    }

    // Call the tooltip handler
    handlers.handleClick(e);
  };

  return (
    <>
      <Wrapper
        ref={tooltipRef}
        onMouseEnter={handlers.handleMouseEnter}
        onMouseLeave={handlers.handleMouseLeave}
        onClick={handleWrapperClick}
        className={`${className} ${isInsideParagraph ? 'inline-block' : ''}`}
      >
        {children}
      </Wrapper>
      {state.mounted &&
        state.showTooltip &&
        createPortal(
          <div
            ref={tooltipContentRef}
            className={`link-tooltip ${enableExtendedPreview ? 'large' : ''} ${state.showTooltip ? 'visible' : ''}`}
            onMouseEnter={handlers.handleTooltipMouseEnter}
            onMouseLeave={handlers.handleTooltipMouseLeave}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              padding: 'var(--spacing-cozy)',
              zIndex: 10000
            }}
            data-testid="link-tooltip"
          >
            {enableCtrlClick && (
              <div className="link-tooltip-ctrl-message">
                Hold Ctrl and click to open in modal
              </div>
            )}
            <TooltipContent
              loading={state.loading}
              error={state.error}
              tooltipData={state.tooltipData}
              enableExtendedPreview={enableExtendedPreview}
              isCached={cache.isCached}
              lastUpdated={cache.lastUpdated}
              url={url}
              onRefresh={handleRefresh}
              onClick={handlers.handleClick}
            />
          </div>,
          document.body
        )}
      <TooltipModal
        showModal={state.showModal}
        enableCtrlClick={enableCtrlClick}
        isFullscreen={state.isFullscreen}
        showControls={state.showControls}
        url={url}
        modalContentRef={modalContentRef}
        onModalClose={handlers.handleModalClose}
        onModalContentClick={handlers.handleModalContentClick}
        onFullscreenToggle={handlers.handleFullscreenToggle}
        onControlsToggle={handlers.handleControlsToggle}
      />
    </>
  );
};
