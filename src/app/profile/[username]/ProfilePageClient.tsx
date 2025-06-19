'use client';

import { useState, useTransition } from 'react';
import { updateBioAction } from '../../../lib/actions/profile.actions';
import {
  UserProfile,
  UserProfileData
} from '../../components/user-profile/UserProfile';

interface ProfilePageClientProps {
  userProfile: UserProfileData;
  isOwnProfile: boolean;
}

export function ProfilePageClient({
  userProfile,
  isOwnProfile
}: ProfilePageClientProps) {
  const [currentProfile, setCurrentProfile] = useState(userProfile);
  const [isPending, startTransition] = useTransition();

  const handleBioUpdate = async (newBio: string) => {
    if (!isOwnProfile) {
      throw new Error('You can only edit your own profile');
    }

    startTransition(async () => {
      try {
        const result = await updateBioAction(
          newBio,
          userProfile.username || userProfile.name || ''
        );

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
