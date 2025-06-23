export default function UserNotFound() {
  return (
    <div className="user-not-found-page">
      <div className="user-not-found-container">
        <main className="user-not-found-main">
          <div className="user-not-found">
            <div className="user-not-found__icon">
              <span role="img" aria-label="User not found">
                👤❓
              </span>
            </div>

            <h1 className="user-not-found__title">User Not Found</h1>

            <p className="user-not-found__message">
              Sorry, we couldn't find the user profile you're looking for. This
              could happen if:
            </p>

            <ul className="user-not-found__reasons">
              <li>The username doesn't exist</li>
              <li>The user has deleted their account</li>
              <li>The profile URL is incorrect</li>
              <li>The user's profile is set to private</li>
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

            <div className="user-not-found__suggestion">
              <p>
                <strong>Looking for someone specific?</strong> Try searching for
                them using the search functionality in the navigation.
              </p>
            </div>
          </div>
        </main>

        <aside className="user-not-found-aside">
          <div className="user-not-found-help-card">
            <h3 className="user-not-found-help-title">Help</h3>
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
          </div>
        </aside>
      </div>
    </div>
  );
}
