'use client';

/**
 * App Router Error Boundary
 *
 * This component handles errors that occur within route segments.
 * It provides a fallback UI and recovery options.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { ERRORS_EN } from '$i18n-source/errors.en';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useEffect } from 'react';
import { useIdlingLocale } from './components/locale/IdlingLocaleProvider';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { ll } = useIdlingLocale();
  const errors = resolveCatalogFromLl(ERRORS_EN, ll.errors as Record<string, unknown>);
  const copy = errors.routeError;

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
          marginBottom: '1rem',
          color: 'var(--brand-primary, #edae49)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <SiteIcon id="wand" sizeRem={1.5} />
        {copy.title}
      </h2>
      <p
        style={{
          marginBottom: '1.5rem',
          color: 'var(--text-secondary, #b8b8b8)',
          maxWidth: '500px',
        }}
      >
        {error.message || copy.fallbackMessage}
      </p>
      {error.digest && (
        <p
          style={{
            color: 'var(--text-muted, #888)',
            marginBottom: '1rem',
          }}
        >
          {copy.errorIdLabel}: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.5rem',
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
        {copy.tryAgain}
      </button>
    </div>
  );
}

