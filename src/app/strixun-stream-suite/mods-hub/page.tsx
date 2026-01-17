import FadeIn from '../../components/fade-in/FadeIn';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import '../product-detail.css';

export default function ModsHubPage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
          {/* Hero */}
          <div className="product-hero">
            <img 
              src="/red_panda/img11.png" 
              alt="Red Panda with Gift" 
              className="product-hero__mascot"
              width={256}
              height={256}
            />
            <h1 className="product-hero__title">Mods Hub</h1>
            <p className="product-hero__tagline">Modern Mod Hosting Platform</p>
            <div className="product-hero__actions">
              <a
                href="https://mods.idling.app"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--primary"
              >
                Launch Mods Hub →
              </a>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/mods-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--secondary"
              >
                View Source
              </a>
            </div>
            <div className="product-hero__scroll-indicator">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span className="sr-only">Scroll for more content</span>
            </div>
          </div>

            {/* Overview */}
            <div className="product-section">
              <h2 className="product-section__title">What is Mods Hub?</h2>
              <p className="product-section__description">
                A modern mod hosting platform similar to Modrinth/CurseForge, built with React 19 and
                Cloudflare Workers. Beautiful gold-themed UI with full semantic versioning, advanced
                search with human-friendly query parser, and R2 cloud storage with client-side encryption.
              </p>
            </div>

            {/* Key Features */}
            <div className="product-section">
              <h2 className="product-section__title">Key Features</h2>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">📤</div>
                  <h3 className="product-feature__title">Mod Upload & Management</h3>
                  <p className="product-feature__description">
                    Upload, update, and manage your mods with drag-and-drop interface. Full CRUD
                    operations with intuitive UI.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔢</div>
                  <h3 className="product-feature__title">Semantic Versioning</h3>
                  <p className="product-feature__description">
                    Full version control with semantic versioning support. Track changes, publish
                    updates, and maintain changelogs.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔍</div>
                  <h3 className="product-feature__title">Advanced Search</h3>
                  <p className="product-feature__description">
                    Powerful search with @strixun/search-query-parser supporting categories, tags,
                    quoted phrases, AND/OR logic, and wildcard prefix matching.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">⬇️</div>
                  <h3 className="product-feature__title">Direct Download Links</h3>
                  <p className="product-feature__description">
                    Share direct download links in any application. No redirects, no waiting -
                    instant downloads for users.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🎨</div>
                  <h3 className="product-feature__title">Beautiful Gold UI</h3>
                  <p className="product-feature__description">
                    Stunning gold-themed responsive interface built with styled-components. Modern,
                    accessible, and a pleasure to use.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔐</div>
                  <h3 className="product-feature__title">R2 Cloud Storage with Encryption</h3>
                  <p className="product-feature__description">
                    Cloudflare R2 storage with optional client-side encryption, default compression,
                    and direct download links.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div className="product-section">
              <h2 className="product-section__title">Three-Layer State Architecture</h2>
              <p className="product-section__description">
                Mods Hub uses a sophisticated three-layer state model for optimal performance and
                developer experience:
              </p>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">⚡</div>
                  <h3 className="product-feature__title">Signals Layer</h3>
                  <p className="product-feature__description">
                    @preact/signals-react for UI state - form fields, toggles, and filters with
                    automatic reactivity.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🌐</div>
                  <h3 className="product-feature__title">Zustand Layer</h3>
                  <p className="product-feature__description">
                    Global client state management for auth, UI state, and notifications with zero
                    boilerplate.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔄</div>
                  <h3 className="product-feature__title">TanStack Query Layer</h3>
                  <p className="product-feature__description">
                    Server state management with automatic caching, background refetching, and
                    optimistic updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <div className="product-tech">
                <span className="product-tech__tag">React 19</span>
                <span className="product-tech__tag">TypeScript</span>
                <span className="product-tech__tag">Vite</span>
                <span className="product-tech__tag">TanStack Query</span>
                <span className="product-tech__tag">Zustand</span>
                <span className="product-tech__tag">@preact/signals</span>
                <span className="product-tech__tag">styled-components</span>
                <span className="product-tech__tag">Cloudflare Workers</span>
                <span className="product-tech__tag">R2 Storage</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}
