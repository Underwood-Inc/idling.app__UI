'use client';

/**
 * App Router Error Boundary
 *
 * This component handles errors that occur within route segments.
 * It provides a fallback UI and recovery options.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('🧙‍♂️ Error boundary caught:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'var(--dark-bg-primary, #1a1611)',
        color: 'var(--text-primary, #f9f9f9)',
      }}
    >
      <h2
        style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: 'var(--brand-primary, #edae49)',
        }}
      >
        🧙‍♂️ Oops! Something went wrong
      </h2>
      <p
        style={{
          fontSize: '1rem',
          marginBottom: '1.5rem',
          color: 'var(--text-secondary, #b8b8b8)',
          maxWidth: '500px',
        }}
      >
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      {error.digest && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted, #888)',
            marginBottom: '1rem',
          }}
        >
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          backgroundColor: 'var(--brand-primary, #edae49)',
          color: 'var(--dark-bg-primary, #1a1611)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(237, 174, 73, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Try Again
      </button>
    </div>
  );
}

