'use client';

import { useCallback, useEffect, useState } from 'react';
import Pagination from './Pagination';
import './StickyPagination.css';

interface StickyPaginationProps {
  id: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  containerSelector?: string; // CSS selector for the container to monitor
}

export function StickyPagination({
  id,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  containerSelector = '.posts-manager__controls'
}: StickyPaginationProps) {
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [isVisible, setIsVisible] = useState(false);

  const updatePosition = useCallback(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Show sticky pagination when original pagination is not visible in viewport
    const isContainerOffScreen =
      containerRect.bottom < 0 || containerRect.top > viewportHeight;

    setIsVisible(isContainerOffScreen && totalPages > 1);

    // Position based on scroll position - show at top when scrolled down, bottom when at top
    if (containerRect.top < -50) {
      // Original pagination is above viewport, show sticky at top
      setPosition('top');
    } else if (containerRect.bottom > viewportHeight + 50) {
      // Original pagination is below viewport, show sticky at bottom
      setPosition('bottom');
    }
  }, [containerSelector, totalPages]);

  useEffect(() => {
    // Initial check
    updatePosition();

    // Add scroll listener
    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updatePosition]);

  if (!isVisible || totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`sticky-pagination sticky-pagination--${position}`}
      data-position={position}
    >
      <div className="sticky-pagination__content">
        <div className="sticky-pagination__label">
          Page {currentPage} of {totalPages}
        </div>
        <Pagination
          id={`${id}-sticky`}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
