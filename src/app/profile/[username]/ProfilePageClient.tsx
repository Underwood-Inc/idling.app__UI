'use client';

import { PROFILE_EN } from '$i18n-source/profile.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { updateBioAction } from '@lib/actions/profile.actions';
import { OCE } from '@lib/oce';
import { useSession } from 'next-auth/react';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useIdlingLocale } from '../../components/locale/IdlingLocaleProvider';
import { UserDecorationWrapper } from '../../components/decoration/UserDecorationWrapper';
import {
  SubscriptionBadgesList,
  SubscriptionFlairToggle
} from '../../components/subscription-badges';
import { InteractiveTooltip } from '../../components/tooltip/InteractiveTooltip';
import {
  UserProfile,
  UserProfileData
} from '../../components/user-profile/UserProfile';

interface ProfilePageClientProps {
  userProfile: UserProfileData;
  isOwnProfile: boolean; // Server-side calculation as fallback
}

interface DecorationOption {
  value: string;
  label: string;
  iconId: SiteIconId;
}

const DECORATION_ICON_BY_VALUE: Record<string, SiteIconId> = {
  '': 'ban',
  'enterprise-crown': 'crown',
  'premium-galaxy': 'orbit',
  'pro-plasma': 'zap',
  'active-glow': 'sparkles',
  'trial-pulse': 'refresh',
};

export function ProfilePageClient({
  userProfile,
  isOwnProfile: serverIsOwnProfile
}: ProfilePageClientProps) {
  const { ll } = useIdlingLocale();
  const profileCopy = useMemo(
    () => resolveCatalogFromLl(PROFILE_EN, ll.profile as Record<string, unknown>),
    [ll]
  );
  const pageUi = profileCopy.pageUi;
  const decorationOptions: DecorationOption[] = useMemo(
    () =>
      pageUi.decorationOptions.map((option) => ({
        value: option.value,
        label: option.label,
        iconId: DECORATION_ICON_BY_VALUE[option.value] ?? 'ban',
      })),
    [pageUi.decorationOptions]
  );

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
        const response = await OCE.noCacheFetch('/api/test/admin-check');
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

  // Admin controls content for username decoration testing
  const adminControlsContent = (
    <div className="profile-admin-controls">
      <div className="profile-admin-controls__title">
        <SiteIcon id="theater" className="profile-admin-controls__title-icon" sizeRem={1} />
        {pageUi.adminDecorationTitle}
      </div>
      <p className="profile-admin-controls__description">
        {pageUi.adminDecorationDescription}
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
            <SiteIcon id={option.iconId} className="profile-admin-controls__option-icon" sizeRem={0.875} />
            {option.label}
          </button>
        ))}
      </div>
      <div className="profile-admin-controls__note">
        <SiteIcon id="lightbulb" className="profile-admin-controls__note-icon" sizeRem={0.875} />
        {pageUi.adminDecorationNote}
      </div>
    </div>
  );

  // Demo username with decoration for testing
  const demoUsername = (
    <UserDecorationWrapper
      userId={userProfile.id}
      forceDecoration={selectedDecoration || undefined}
    >
      <span style={{ fontWeight: 'bold' }}>
        {userProfile.username || userProfile.name || pageUi.demoUserFallback}
      </span>
    </UserDecorationWrapper>
  );

  return (
    <>
      <UserProfile
        user={currentProfile}
        variant="full"
        isOwnProfile={isOwnProfile}
        onBioUpdate={isOwnProfile ? handleBioUpdate : undefined}
        isPending={isPending}
      />

      {/* Admin Controls Panel - Only visible to admins on their own profile */}
      {isOwnProfile && hasAdminAccess && (
        <div className="profile-admin-panel">
          <div className="profile-admin-preview">
            <h4>{pageUi.previewLabel}</h4>
            {demoUsername}
          </div>
          <InteractiveTooltip
            content={adminControlsContent}
            triggerOnClick={true}
            className="profile-admin-tooltip"
          >
            <button
              className="profile-admin-toggle"
              title={pageUi.testDecorationsTitle}
            >
              <SiteIcon id="palette" className="profile-admin-toggle__icon" sizeRem={0.875} />
              {pageUi.testDecorationsButton}
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
          title={pageUi.subscriptionsTitle}
          emptyMessage={pageUi.freeTierMessage}
        />
      </div>

      {/* Flair Settings Section - Only for own profile */}
      {isOwnProfile && <SubscriptionFlairToggle userId={userProfile.id} />}
    </>
  );
}
