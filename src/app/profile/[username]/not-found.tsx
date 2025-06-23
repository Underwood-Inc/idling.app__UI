import Link from 'next/link';
import { Card } from '../../components/card/Card';
import FadeIn from '../../components/fade-in/FadeIn';
import { PageAside } from '../../components/page-aside/PageAside';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';

export default function UserNotFound() {
  return (
    <PageContainer>
      <PageContent>
        <article className="profile-page">
          <FadeIn className="profile-page__fade">
            <Card width="full" className="profile-page__main-card">
              <div className="user-not-found">
                <div className="user-not-found__icon">
                  <span role="img" aria-label="User not found">
                    👤❓
                  </span>
                </div>

                <h1 className="user-not-found__title">User Not Found</h1>

                <p className="user-not-found__message">
                  Sorry, we couldn't find the user profile you're looking for.
                  This could happen if:
                </p>

                <ul className="user-not-found__reasons">
                  <li>The username doesn't exist</li>
                  <li>The user has deleted their account</li>
                  <li>The profile URL is incorrect</li>
                  <li>The user's profile is set to private</li>
                </ul>

                <div className="user-not-found__actions">
                  <Link
                    href="/posts"
                    className="user-not-found__action user-not-found__action--primary"
                  >
                    Browse Posts
                  </Link>

                  <Link
                    href="/"
                    className="user-not-found__action user-not-found__action--secondary"
                  >
                    Go Home
                  </Link>
                </div>

                <div className="user-not-found__suggestion">
                  <p>
                    <strong>Looking for someone specific?</strong> Try searching
                    for them using the search functionality in the navigation.
                  </p>
                </div>
              </div>
            </Card>
          </FadeIn>
        </article>
      </PageContent>

      <PageAside className="profile-page__aside" bottomMargin={10}>
        <FadeIn>
          <Card width="full">
            <h3 className="profile-page__aside-title">Help</h3>
            <div className="user-not-found__help">
              <div className="user-not-found__help-item">
                <span className="user-not-found__help-icon">🔍</span>
                <div className="user-not-found__help-content">
                  <span className="user-not-found__help-label">Search</span>
                  <span className="user-not-found__help-description">
                    Use the search bar to find users
                  </span>
                </div>
              </div>

              <div className="user-not-found__help-item">
                <span className="user-not-found__help-icon">📝</span>
                <div className="user-not-found__help-content">
                  <span className="user-not-found__help-label">
                    Browse Posts
                  </span>
                  <span className="user-not-found__help-description">
                    Discover users through their posts
                  </span>
                </div>
              </div>

              <div className="user-not-found__help-item">
                <span className="user-not-found__help-icon">👥</span>
                <div className="user-not-found__help-content">
                  <span className="user-not-found__help-label">Community</span>
                  <span className="user-not-found__help-description">
                    Join discussions to meet users
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </FadeIn>
      </PageAside>
    </PageContainer>
  );
}
