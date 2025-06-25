'use client';

import { useSession } from 'next-auth/react';
import { useState, useTransition } from 'react';
import { updateBioAction } from '../../../lib/actions/profile.actions';
import {
  UserProfile,
  UserProfileData
} from '../../components/user-profile/UserProfile';

interface ProfilePageClientProps {
  userProfile: UserProfileData;
  isOwnProfile: boolean; // Server-side calculation as fallback
}

export function ProfilePageClient({
  userProfile,
  isOwnProfile: serverIsOwnProfile
}: ProfilePageClientProps) {
  const [currentProfile, setCurrentProfile] = useState(userProfile);
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  // Client-side authorization check (more reliable for hydration)
  const clientIsOwnProfile =
    session?.user?.id?.toString() === userProfile.id?.toString();

  // Use client-side check if session is available, otherwise fall back to server-side
  const isOwnProfile = session ? clientIsOwnProfile : serverIsOwnProfile;

  const handleBioUpdate = async (newBio: string) => {
    if (!isOwnProfile) {
      throw new Error('You can only edit your own profile');
    }

    startTransition(async () => {
      try {
        // ✅ CRITICAL: Use database ID for bio updates
        // This ensures bio updates work reliably even if usernames change from OAuth providers
        const identifier = userProfile.id; // Always use database ID

        const result = await updateBioAction(newBio, identifier);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update bio');
        }

        if (result.profile) {
          setCurrentProfile(result.profile);
        }
      } catch (error) {
        console.error('Error updating bio:', error);
        throw error;
      }
    });
  };

  return (
    <UserProfile
      user={currentProfile}
      variant="full"
      isOwnProfile={isOwnProfile}
      onBioUpdate={isOwnProfile ? handleBioUpdate : undefined}
      isPending={isPending}
    />
  );
}
