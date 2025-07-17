'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useTransition } from 'react';
import { updateBioAction } from '../../../lib/actions/profile.actions';
import { SubscriptionBadgesList } from '../../components/subscription-badges';
import { InteractiveTooltip } from '../../components/tooltip/InteractiveTooltip';
import {
  UserProfile,
  UserProfileData
} from '../../components/user-profile/UserProfile';

interface ProfilePageClientProps {
  userProfile: UserProfileData;
  isOwnProfile: boolean; // Server-side calculation as fallback
}

const decorationOptions = [
  { value: '', label: 'None' },
  { value: 'enterprise-crown', label: '👑 Enterprise Crown' },
  { value: 'premium-galaxy', label: '🌌 Premium Galaxy' },
  { value: 'pro-plasma', label: '⚡ Pro Plasma' },
  { value: 'active-glow', label: '✨ Active Glow' },
  { value: 'trial-pulse', label: '🔄 Trial Pulse' }
];

export function ProfilePageClient({
  userProfile,
  isOwnProfile: serverIsOwnProfile
}: ProfilePageClientProps) {
  const [currentProfile, setCurrentProfile] = useState(userProfile);
  const [isPending, startTransition] = useTransition();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [selectedDecoration, setSelectedDecoration] = useState<string>('');
  const { data: session } = useSession();

  // Client-side authorization check (more reliable for hydration)
  const clientIsOwnProfile =
    session?.user?.id?.toString() === userProfile.id?.toString();

  // Use client-side check if session is available, otherwise fall back to server-side
  const isOwnProfile = session ? clientIsOwnProfile : serverIsOwnProfile;

  // Check admin access for current user
  useEffect(() => {
    async function checkAdminAccess() {
      if (!session?.user?.id || !isOwnProfile) {
        setHasAdminAccess(false);
        return;
      }

      try {
        const response = await fetch('/api/test/admin-check');
        if (response.ok) {
          const data = await response.json();
          setHasAdminAccess(data.hasAdminAccess);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setHasAdminAccess(false);
      }
    }

    checkAdminAccess();
  }, [session, isOwnProfile]);

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

  // Admin controls content for avatar decoration testing
  const adminControlsContent = (
    <div className="profile-admin-controls">
      <div className="profile-admin-controls__title">
        🎭 Avatar Decoration Testing
      </div>
      <p className="profile-admin-controls__description">
        Test different avatar decorations on your profile page
      </p>
      <div className="profile-admin-controls__decoration-grid">
        {decorationOptions.map((option) => (
          <button
            key={option.value}
            className={`profile-admin-controls__decoration-option ${
              selectedDecoration === option.value
                ? 'profile-admin-controls__decoration-option--active'
                : ''
            }`}
            onClick={() => setSelectedDecoration(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="profile-admin-controls__note">
        💡 This is a testing feature only visible to admins on their own profile
      </div>
    </div>
  );

  return (
    <>
      <UserProfile
        user={currentProfile}
        variant="full"
        isOwnProfile={isOwnProfile}
        onBioUpdate={isOwnProfile ? handleBioUpdate : undefined}
        isPending={isPending}
        // Pass the selected decoration to control the avatar
        forceAvatarDecoration={selectedDecoration || undefined}
      />

      {/* Admin Controls Panel - Only visible to admins on their own profile */}
      {isOwnProfile && hasAdminAccess && (
        <div className="profile-admin-panel">
          <InteractiveTooltip
            content={adminControlsContent}
            triggerOnClick={true}
            className="profile-admin-tooltip"
          >
            <button
              className="profile-admin-toggle"
              title="Avatar Decoration Testing (Admin Only)"
            >
              🎨 Test Avatar Decorations
            </button>
          </InteractiveTooltip>
        </div>
      )}

      {/* Subscription Badges Section */}
      <div style={{ marginTop: '2rem' }}>
        <SubscriptionBadgesList
          userId={userProfile.id}
          variant="default"
          maxDisplay={8}
          title="🎟️ Subscriptions"
          emptyMessage="Free tier user"
        />
      </div>
    </>
  );
}
