import { notFound } from 'next/navigation';
import { getUserProfile } from '../../../lib/actions/profile.actions';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import PageHeader from '../../components/page-header/PageHeader';
import { UserProfile } from '../../components/user-profile/UserProfile';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;

  // Decode username in case it contains special characters
  const decodedUsername = decodeURIComponent(username);

  const userProfile = await getUserProfile(decodedUsername);

  if (!userProfile) {
    notFound();
  }

  const displayName =
    userProfile.username || userProfile.name || 'Anonymous User';

  return (
    <PageContainer>
      <PageHeader>
        <h1>Profile: {displayName}</h1>
      </PageHeader>

      <PageContent>
        <div className="profile-page">
          <UserProfile
            user={userProfile}
            variant="full"
            className="profile-page__user-card"
          />

          {/* Future: Add user's posts, activity, etc. */}
          <div className="profile-page__content">
            <h2>Recent Activity</h2>
            <p className="text-muted">
              User activity and posts will be displayed here in future updates.
            </p>
          </div>
        </div>
      </PageContent>
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
    title: `${displayName} - User Profile`,
    description: userProfile.bio
      ? `${userProfile.bio.substring(0, 160)}${userProfile.bio.length > 160 ? '...' : ''}`
      : `View ${displayName}'s profile and activity.`,
    openGraph: {
      title: `${displayName} - Profile`,
      description:
        userProfile.bio || `View ${displayName}'s profile and activity.`,
      type: 'profile'
    }
  };
}
