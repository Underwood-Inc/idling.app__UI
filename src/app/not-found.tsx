/**
 * 404 Not Found Page
 *
 * This page is shown when a route doesn't exist.
 * Uses the App Router not-found convention.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '4rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, var(--brand-primary, #edae49), var(--brand-primary-light, #f9df74))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: 'var(--text-primary, #f9f9f9)',
        }}
      >
        🧙‍♂️ Page Not Found
      </h2>
      <p
        style={{
          fontSize: '1rem',
          marginBottom: '2rem',
          color: 'var(--text-secondary, #b8b8b8)',
          maxWidth: '500px',
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Perhaps the wizard teleported it elsewhere?
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          backgroundColor: 'var(--brand-primary, #edae49)',
          color: 'var(--dark-bg-primary, #1a1611)',
          border: 'none',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Return Home
      </Link>
    </div>
  );
}

