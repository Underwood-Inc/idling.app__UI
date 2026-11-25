'use client';

import { ERRORS_EN } from '$i18n-source/errors.en';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import Link from 'next/link';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';

export function NotFoundContent() {
  const { ll } = useIdlingLocale();
  const errors = resolveCatalogFromLl(ERRORS_EN, ll.errors as Record<string, unknown>);
  const copy = errors.notFound;

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
          fontSize: 'var(--font-size-5xl)',
          marginBottom: '0.5rem',
          background:
            'linear-gradient(135deg, var(--brand-primary, #edae49), var(--brand-primary-light, #f9df74))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {copy.code}
      </h1>
      <h2
        style={{
          fontSize: 'var(--font-size-xl)',
          marginBottom: '1rem',
          color: 'var(--text-primary, #f9f9f9)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <SiteIcon id="wand" sizeRem={1.25} />
        {copy.title}
      </h2>
      <p
        style={{
          fontSize: 'var(--font-size-base)',
          marginBottom: '2rem',
          color: 'var(--text-secondary, #b8b8b8)',
          maxWidth: '500px',
        }}
      >
        {copy.message}
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          backgroundColor: 'var(--brand-primary, #edae49)',
          color: 'var(--dark-bg-primary, #1a1611)',
          border: 'none',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        {copy.returnHome}
      </Link>
    </div>
  );
}