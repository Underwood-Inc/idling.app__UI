import { MutableRefObject, useCallback } from 'react';

interface UseTooltipHandlersProps {
  showTooltip: boolean;
  setShowTooltip: (show: boolean) => void;
  setShowModal: (show: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setShowControls: (show: boolean) => void;
  isFullscreen: boolean;
  showControls: boolean;
  hideTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  isHoveringRef: MutableRefObject<boolean>;
  shouldFetchRef: MutableRefObject<boolean>;
  updatePosition: () => void;
  fetchPreview: () => void;
  url: string;
  enableCtrlClick: boolean;
}

// Utility function to detect mobile devices
const isMobileDevice = () => {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
};

export const useTooltipHandlers = ({
  showTooltip,
  setShowTooltip,
  setShowModal,
  setIsFullscreen,
  setShowControls,
  isFullscreen,
  showControls,
  hideTimeoutRef,
  isHoveringRef,
  shouldFetchRef,
  updatePosition,
  fetchPreview,
  url,
  enableCtrlClick
}: UseTooltipHandlersProps) => {
  const handleMouseEnter = useCallback(() => {
    // Don't trigger hover events on mobile devices
    if (isMobileDevice()) return;

    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const timeout = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(updatePosition, 0);
      fetchPreview();
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    setShowTooltip,
    updatePosition,
    fetchPreview,
    hideTimeoutRef,
    isHoveringRef
  ]);

  const handleMouseLeave = useCallback(() => {
    // Don't trigger hover events on mobile devices
    if (isMobileDevice()) return;

    isHoveringRef.current = false;
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowTooltip(false);
        shouldFetchRef.current = true;
      }
    }, 300);
  }, [setShowTooltip, hideTimeoutRef, isHoveringRef, shouldFetchRef]);

  const handleTooltipMouseEnter = useCallback(() => {
    // Don't trigger hover events on mobile devices
    if (isMobileDevice()) return;

    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, [hideTimeoutRef, isHoveringRef]);

  const handleTooltipMouseLeave = useCallback(() => {
    // Don't trigger hover events on mobile devices
    if (isMobileDevice()) return;

    isHoveringRef.current = false;
    handleMouseLeave();
  }, [handleMouseLeave, isHoveringRef]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const isMobile = isMobileDevice();

      if (isMobile) {
        // On mobile: prevent default link behavior and show tooltip instead
        e.preventDefault();
        e.stopPropagation();

        if (!showTooltip) {
          // Show tooltip
          setShowTooltip(true);
          setTimeout(updatePosition, 0);
          fetchPreview();
        } else {
          // Hide tooltip if already showing
          setShowTooltip(false);
          shouldFetchRef.current = true;
        }
        return;
      }

      // Desktop behavior
      if ((e.ctrlKey || e.metaKey) && enableCtrlClick) {
        e.preventDefault();
        setShowTooltip(false);
        setShowModal(true);
      } else {
        // Regular click - open link in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [
      url,
      enableCtrlClick,
      setShowTooltip,
      setShowModal,
      showTooltip,
      updatePosition,
      fetchPreview,
      shouldFetchRef
    ]
  );

  const handleModalClose = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setShowModal(false);
      document.body.classList.remove('modal-open');
    },
    [setShowModal]
  );

  const handleModalContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleFullscreenToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    },
    [isFullscreen, setIsFullscreen]
  );

  const handleControlsToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setShowControls(!showControls);
    },
    [showControls, setShowControls]
  );

  return {
    handleMouseEnter,
    handleMouseLeave,
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
    handleClick,
    handleModalClose,
    handleModalContentClick,
    handleFullscreenToggle,
    handleControlsToggle
  };
};
