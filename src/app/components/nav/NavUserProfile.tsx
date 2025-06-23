'use client';

import { useSession } from 'next-auth/react';

export function NavUserProfile() {
  const { data: session } = useSession();

  // Don't render anything if not authenticated
  if (!session?.user) {
    return null;
  }

  return <h3 className="header__user-name">{session.user.name}</h3>;
}
