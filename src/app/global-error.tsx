'use client';

import { ERRORS_EN } from '$i18n-source/errors.en';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useMemo } from 'react';
import { IdlingLocaleProvider, useIdlingLocale } from './components/locale/IdlingLocaleProvider';

/**
 * Global Error Boundary
 *
 * This component handles errors that occur in the root layout.
 * It MUST include its own <html> and <body> tags because it replaces
 * the entire root layout when triggered.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function GlobalErrorBody({ error, reset }: GlobalErrorProps) {
  const { ll } = useIdlingLocale();
  const copy = useMemo(() => {
    const errors = resolveCatalogFromLl(ERRORS_EN, ll.errors as Record<string, unknown>);
    return errors.globalError;
  }, [ll]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-5xl)',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #edae49, #f9df74)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <SiteIcon id="wand" sizeRem={2} />
        {copy.title}
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-lg)',
          marginBottom: '1.5rem',
          color: '#b8b8b8',
          maxWidth: '600px',
        }}
      >
        {copy.criticalMessage}
      </p>
      <p
        style={{
          fontSize: 'var(--font-size-base)',
          marginBottom: '1.5rem',
          color: '#888',
          maxWidth: '500px',
        }}
      >
        {error.message || copy.unknownError}
      </p>
      {error.digest && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: '#666',
            marginBottom: '1.5rem',
          }}
        >
          {copy.errorIdLabel} {error.digest}
        </p>
      )}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            backgroundColor: '#edae49',
            color: '#1a1611',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {copy.tryAgain}
        </button>
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            backgroundColor: 'transparent',
            color: '#edae49',
            border: '2px solid #edae49',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {copy.goHome}
        </button>
      </div>
    </div>
  );
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "'Fira Code', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', Consolas, 'Courier New', monospace",
          backgroundColor: '#1a1611',
          color: '#f9f9f9',
        }}
      >
        <IdlingLocaleProvider>
          <GlobalErrorBody error={error} reset={reset} />
        </IdlingLocaleProvider>
      </body>
    </html>
  );
}