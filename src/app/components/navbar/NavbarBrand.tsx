'use client';

import { useSession } from 'next-auth/react';
import { AuthAvatar } from '../auth-avatar';

export function NavbarBrand() {
  const { data: session, status } = useSession();

  // Show placeholder during loading to prevent layout shift
  if (status === 'loading') {
    return (
      <div
        className="navbar-brand__avatar navbar-brand__avatar--placeholder"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--brand-tertiary)',
          opacity: 0.4,
          flexShrink: 0,
          border: '2px solid var(--brand-tertiary--light)',
          animation: 'pulse 2s infinite'
        }}
        aria-label="Loading avatar"
      />
    );
  }

  // Show default avatar for unauthenticated users
  if (!session?.user) {
    return (
      <div
        className="navbar-brand__avatar navbar-brand__avatar--default"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--brand-primary)',
          border: '2px solid var(--brand-primary--light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          color: 'white',
          flexShrink: 0,
          transition: 'all 0.2s ease'
        }}
        aria-label="Default user avatar"
        title="Welcome to Idling.app"
      >
        👤
      </div>
    );
  }

  // Show user avatar for authenticated users
  return <AuthAvatar size="sm" className="navbar-brand__avatar" />;
}
