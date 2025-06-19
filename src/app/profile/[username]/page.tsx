import { notFound } from 'next/navigation';
import { getUserProfile } from '../../../lib/actions/profile.actions';
import { auth } from '../../../lib/auth';
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

  const [userProfile, session] = await Promise.all([
    getUserProfile(decodedUsername),
    auth()
  ]);

  if (!userProfile) {
    notFound();
  }

  // Check if this is the user's own profile
  const isOwnProfile = session?.user?.id === userProfile.id;

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
                isOwnProfile={!!isOwnProfile}
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
                    <span className="profile-page__info-value">{joinDate}</span>
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
                  <span className="profile-page__info-label">Total Posts</span>
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
}

// Generate metadata for the page
export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = params;
  const decodedUsername = decodeURIComponent(username);
  const userProfile = await getUserProfile(decodedUsername);

  if (!userProfile) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.'
    };
  }

  const displayName =
    userProfile.username || userProfile.name || 'Anonymous User';

  return {
    title: `${displayName} - User Profile | Idling.app`,
    description: userProfile.bio
      ? `${userProfile.bio.substring(0, 160)}${userProfile.bio.length > 160 ? '...' : ''}`
      : `View ${displayName}'s profile, activity stats, and contributions on Idling.app.`,
    openGraph: {
      title: `${displayName} - Profile`,
      description:
        userProfile.bio ||
        `View ${displayName}'s profile and activity on Idling.app.`,
      type: 'profile'
    },
    twitter: {
      card: 'summary',
      title: `${displayName} - Profile`,
      description:
        userProfile.bio ||
        `View ${displayName}'s profile and activity on Idling.app.`
    }
  };
}
