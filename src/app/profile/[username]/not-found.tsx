import React from 'react';
import { Card } from '../../components/card/Card';
import FadeIn from '../../components/fade-in/FadeIn';
import { PageAside } from '../../components/page-aside/PageAside';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import { UserSearch } from '../../components/user-search/UserSearch';

export default function UserNotFound() {
  return (
    <PageContainer>
      <PageContent>
        <FadeIn>
          <Card width="full" className="user-not-found-main">
            <div className="user-not-found">
              <div className="user-not-found__icon">
                <span role="img" aria-label="User not found">
                  👤❓
                </span>
              </div>

              <h1 className="user-not-found__title">User Not Found</h1>

              <p className="user-not-found__message">
                Sorry, we couldn&apos;t find the user profile you&apos;re
                looking for. This could happen if:
              </p>

              <ul className="user-not-found__reasons">
                <li>The username doesn&apos;t exist</li>
                <li>The user has deleted their account</li>
                <li>The profile URL is incorrect</li>
                <li>The user&apos;s profile is set to private</li>
              </ul>

              <div className="user-not-found__actions">
                <a
                  href="/posts"
                  className="user-not-found__action user-not-found__action--primary"
                >
                  Browse Posts
                </a>

                <a
                  href="/"
                  className="user-not-found__action user-not-found__action--secondary"
                >
                  Go Home
                </a>
              </div>

              <div className="user-not-found__search-section">
                <h3 className="user-not-found__search-title">
                  🔍 Search for Users
                </h3>
                <p className="user-not-found__search-description">
                  Try searching for the user you&apos;re looking for:
                </p>
                <UserSearch
                  placeholder="Search users by name or email..."
                  className="user-not-found__search"
                />
              </div>
            </div>
          </Card>
        </FadeIn>
      </PageContent>

      <PageAside>
        <FadeIn>
          <Card width="full" className="user-not-found-aside">
            <h3 className="user-not-found-help-title">Help</h3>
            <div className="user-not-found__help">
              <div className="user-not-found__help-item">
                <span className="user-not-found__help-icon">🔍</span>
                <div className="user-not-found__help-content">
                  <span className="user-not-found__help-label">Search</span>
                  <span className="user-not-found__help-description">
                    Use the search above to find users by name or email
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
