import { notFound } from 'next/navigation';
import { getUserProfileByDatabaseId } from '../../../lib/actions/profile.actions';
import { auth } from '../../../lib/auth';
import { cleanContentForSocialSharing } from '../../../lib/utils/social-sharing';
import { Card } from '../../components/card/Card';
import FadeIn from '../../components/fade-in/FadeIn';
import { PageAside } from '../../components/page-aside/PageAside';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import { ProfilePageClient } from './ProfilePageClient';
import './profile-page.css';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;

  // Decode username in case it contains special characters
  const decodedUsername = decodeURIComponent(username);

  try {
    // ✅ CRITICAL: Only database ID-based URLs supported after migration 0010
    // Username-based URLs are no longer supported for maximum reliability
    if (!/^\d+$/.test(decodedUsername)) {
      // Not a database ID - return 404 instead of trying username lookup
      notFound();
    }

    // Direct database ID lookup - only supported method
    const userProfile = await getUserProfileByDatabaseId(decodedUsername);
    const session = await auth();

    if (!userProfile) {
      notFound();
    }

    // Check if this is the user's own profile
    // Convert both IDs to strings for proper comparison
    const isOwnProfile =
      session?.user?.id?.toString() === userProfile.id?.toString();

    const joinDate = userProfile.created_at
      ? new Date(userProfile.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    const lastActivity = userProfile.last_activity
      ? new Date(userProfile.last_activity).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : null;

    return (
      <PageContainer>
        <PageContent>
          <article className="profile-page">
            <FadeIn className="profile-page__fade">
              <Card width="full" className="profile-page__main-card">
                <ProfilePageClient
                  userProfile={userProfile}
                  isOwnProfile={isOwnProfile}
                />
              </Card>
            </FadeIn>
          </article>
        </PageContent>

        <PageAside className="profile-page__aside" bottomMargin={10}>
          <FadeIn>
            <Card width="full">
              <h3 className="profile-page__aside-title">Profile Info</h3>
              <div className="profile-page__info-grid">
                {joinDate && (
                  <div className="profile-page__info-item">
                    <span className="profile-page__info-icon">📅</span>
                    <div className="profile-page__info-content">
                      <span className="profile-page__info-label">Joined</span>
                      <span className="profile-page__info-value">
                        {joinDate}
                      </span>
                    </div>
                  </div>
                )}

                {lastActivity && (
                  <div className="profile-page__info-item">
                    <span className="profile-page__info-icon">🔥</span>
                    <div className="profile-page__info-content">
                      <span className="profile-page__info-label">
                        Last Active
                      </span>
                      <span className="profile-page__info-value">
                        {lastActivity}
                      </span>
                    </div>
                  </div>
                )}

                <div className="profile-page__info-item">
                  <span className="profile-page__info-icon">📊</span>
                  <div className="profile-page__info-content">
                    <span className="profile-page__info-label">
                      Total Posts
                    </span>
                    <span className="profile-page__info-value">
                      {userProfile.total_submissions || 0}
                    </span>
                  </div>
                </div>

                <div className="profile-page__info-item">
                  <span className="profile-page__info-icon">💬</span>
                  <div className="profile-page__info-content">
                    <span className="profile-page__info-label">Replies</span>
                    <span className="profile-page__info-value">
                      {userProfile.replies_count || 0}
                    </span>
                  </div>
                </div>

                <div className="profile-page__info-item">
                  <span className="profile-page__info-icon">🌟</span>
                  <div className="profile-page__info-content">
                    <span className="profile-page__info-label">Profile</span>
                    <span className="profile-page__info-value">
                      {userProfile.profile_public !== false
                        ? 'Public'
                        : 'Private'}
                    </span>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <div className="profile-page__owner-actions">
                  <div className="profile-page__owner-note">
                    <span className="profile-page__owner-icon">ℹ️</span>
                    <p>
                      This is your profile. You can edit your bio in the main
                      section.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </FadeIn>
        </PageAside>
      </PageContainer>
    );
  } catch (error) {
    console.error('Error loading profile page:', error);

    // If it's a database connection error or other server error,
    // show the not found page rather than crashing
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = params;
  const decodedUsername = decodeURIComponent(username);

  try {
    // ✅ Only database ID-based URLs supported after migration 0010
    if (!/^\d+$/.test(decodedUsername)) {
      return {
        title: 'Invalid Profile URL | Idling.app',
        description: 'Profile URLs must use database IDs only.',
        robots: 'noindex, nofollow'
      };
    }

    // Direct database ID lookup
    const userProfile = await getUserProfileByDatabaseId(decodedUsername);

    if (!userProfile) {
      return {
        title: 'User Not Found | Idling.app',
        description: 'The requested user profile could not be found.',
        robots: 'noindex, nofollow' // Don't index not found pages
      };
    }

    const displayName =
      userProfile.username || userProfile.name || 'Anonymous User';

    // Clean bio content for social media sharing
    // Convert embed pills like ![embed](https://youtube.com/watch?v=abc) to clean URLs
    const cleanBioForSocial = userProfile.bio
      ? cleanContentForSocialSharing(userProfile.bio, {
          convertEmbedsToUrls: true, // Convert ![embed](url) to just url
          maxLength: 160
        })
      : null;

    const fallbackDescription = `View ${displayName}'s profile, activity stats, and contributions on Idling.app.`;

    return {
      title: `${displayName} - User Profile | Idling.app`,
      description: cleanBioForSocial || fallbackDescription,
      openGraph: {
        title: `${displayName} - Profile`,
        description:
          cleanBioForSocial ||
          `View ${displayName}'s profile and activity on Idling.app.`,
        type: 'profile'
      },
      twitter: {
        card: 'summary',
        title: `${displayName} - Profile`,
        description:
          cleanBioForSocial ||
          `View ${displayName}'s profile and activity on Idling.app.`
      }
    };
  } catch (error) {
    console.error('Error generating metadata for profile page:', error);

    // Fallback metadata for error cases
    return {
      title: 'Profile | Idling.app',
      description: 'User profile page on Idling.app',
      robots: 'noindex, nofollow' // Don't index error pages
    };
  }
}
