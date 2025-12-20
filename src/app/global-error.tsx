'use client';

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
              fontSize: '3rem',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #edae49, #f9df74)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🧙‍♂️ Critical Error
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              marginBottom: '1.5rem',
              color: '#b8b8b8',
              maxWidth: '600px',
            }}
          >
            A critical error occurred while loading the application.
          </p>
          <p
            style={{
              fontSize: '1rem',
              marginBottom: '1.5rem',
              color: '#888',
              maxWidth: '500px',
            }}
          >
            {error.message || 'Unknown error'}
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#666',
                marginBottom: '1.5rem',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: '#edae49',
                color: '#1a1611',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: '#edae49',
                border: '2px solid #edae49',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

