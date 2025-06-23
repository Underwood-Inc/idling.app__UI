'use client';

import { useSession } from 'next-auth/react';
import { AuthAvatar } from '../auth-avatar/AuthAvatar';

export function NavUserProfile() {
  const { data: session, status } = useSession();

  // Show placeholder during loading to prevent layout shift
  if (status === 'loading') {
    return (
      <>
        {/* Placeholder avatar with same dimensions */}
        <div
          className="nav__user-avatar nav__user-avatar--placeholder"
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-tertiary)',
            opacity: 0.3,
            flexShrink: 0
          }}
        />
        {/* Placeholder username */}
        <div
          className="header__user-name header__user-name--placeholder"
          style={{
            width: '80px',
            height: '1.2em',
            backgroundColor: 'var(--brand-tertiary)',
            opacity: 0.3,
            borderRadius: '0.25rem'
          }}
        />
      </>
    );
  }

  // Don't render anything if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <AuthAvatar size="sm" className="nav__user-avatar" />
      <h3 className="header__user-name">{session.user.name}</h3>
    </>
  );
}
