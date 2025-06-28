'use client';

import React, { useEffect, useState } from 'react';
import './SkeletonLoader.css';

interface SimpleSkeletonWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
  expectedItemCount?: number;
  fallbackMinHeight?: string;
  delayMs?: number; // Delay before showing skeleton to prevent flicker
}

const SubmissionSkeleton: React.FC = () => (
  <div className="skeleton-item-fallback">
    <div
      className="skeleton skeleton--box"
      style={{
        width: '100%',
        height: '120px',
        marginBottom: '1rem',
        borderRadius: '8px'
      }}
    />
    <div
      className="skeleton skeleton--text"
      style={{ width: '85%', height: '20px', marginBottom: '0.5rem' }}
    />
    <div
      className="skeleton skeleton--text"
      style={{ width: '70%', height: '16px', marginBottom: '0.5rem' }}
    />
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <div
        className="skeleton skeleton--text"
        style={{ width: '60px', height: '24px', borderRadius: '12px' }}
      />
      <div
        className="skeleton skeleton--text"
        style={{ width: '80px', height: '24px', borderRadius: '12px' }}
      />
      <div
        className="skeleton skeleton--text"
        style={{ width: '70px', height: '24px', borderRadius: '12px' }}
      />
    </div>
  </div>
);

export const SimpleSkeletonWrapper: React.FC<SimpleSkeletonWrapperProps> = ({
  children,
  isLoading,
  className = '',
  expectedItemCount = 5,
  fallbackMinHeight = '400px',
  delayMs = 50 // Reduced delay for better responsiveness
}) => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delayMs);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading, delayMs]);

  if (isLoading && showSkeleton) {
    return (
      <div
        className={`skeleton-container--simple ${className}`}
        style={{ minHeight: fallbackMinHeight }}
        aria-label="Loading content..."
        role="status"
      >
        {Array.from({ length: expectedItemCount }, (_, i) => (
          <SubmissionSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

export default SimpleSkeletonWrapper;
