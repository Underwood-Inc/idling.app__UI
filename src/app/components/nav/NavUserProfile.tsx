'use client';

import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

interface NavUserProfileProps {
  initialSession?: Session;
}

export function NavUserProfile({ initialSession }: NavUserProfileProps) {
  const { data: session, status } = useSession();

  // Use initialSession during hydration to prevent layout shift
  const currentSession = session || initialSession;

  // Show loading placeholder only if we have no session data at all
  if (status === 'loading' && !currentSession) {
    return (
      <h3 className="header__user-name" style={{ opacity: 0.6 }}>
        Loading...
      </h3>
    );
  }

  // Don't render anything if not authenticated
  if (!currentSession?.user) {
    return null;
  }

  return <h3 className="header__user-name">{currentSession.user.name}</h3>;
}
