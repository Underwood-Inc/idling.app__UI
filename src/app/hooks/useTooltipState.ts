import { useRef, useState } from 'react';

export const useTooltipState = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('');

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHoveringRef = useRef(false);
  const shouldFetchRef = useRef(true);

  return {
    showTooltip,
    setShowTooltip,
    showModal,
    setShowModal,
    isFullscreen,
    setIsFullscreen,
    showControls,
    setShowControls,
    mounted,
    setMounted,
    tooltipData,
    setTooltipData,
    loading,
    setLoading,
    error,
    setError,
    timeAgo,
    setTimeAgo,
    hideTimeoutRef,
    timerRef,
    isHoveringRef,
    shouldFetchRef
  };
};
