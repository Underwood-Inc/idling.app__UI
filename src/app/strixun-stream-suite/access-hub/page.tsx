
import FadeIn from '../../components/fade-in/FadeIn';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import '../product-detail.css';

export default function AccessHubPage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
          {/* Hero */}
          <div className="product-hero">
            <img 
              src="/red_panda/img7.png" 
              alt="Red Panda Confident" 
              className="product-hero__mascot"
              width={256}
              height={256}
            />
            <h1 className="product-hero__title">Access Hub</h1>
            <p className="product-hero__tagline">Access Control Dashboard</p>
            <div className="product-hero__actions">
              <a
                href="https://access.idling.app"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--primary"
              >
                Launch Access Hub →
              </a>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/access-hub"
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
              <h2 className="product-section__title">What is Access Hub?</h2>
              <p className="product-section__description">
                A minimal frontend UI for the Strixun Access Control System deployed on Cloudflare Pages.
                View all available roles and permissions with a clean, simple interface. Backend API
                handles RBAC (role-based access control), permission management, quota enforcement, and
                auto-provisioning - all service-agnostic and deployed on Cloudflare Workers.
              </p>
            </div>
          

          {/* Key Features */}
          
            <div className="product-section">
              <h2 className="product-section__title">Key Features</h2>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">👥</div>
                  <h3 className="product-feature__title">Role-Based Access Control</h3>
                  <p className="product-feature__description">
                    Define and manage roles with granular permissions. Assign users to roles for
                    scalable access management across services.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">✅</div>
                  <h3 className="product-feature__title">Permission Management</h3>
                  <p className="product-feature__description">
                    View all available permissions and their assignments. Fine-grained control over
                    what users can and cannot do.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📝</div>
                  <h3 className="product-feature__title">User Access Auditing</h3>
                  <p className="product-feature__description">
                    Track who has access to what and when. Complete audit trail for compliance and
                    security monitoring.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔧</div>
                  <h3 className="product-feature__title">Service-Agnostic Design</h3>
                  <p className="product-feature__description">
                    Works with any service in the SSS ecosystem. Unified access control across all
                    applications and APIs.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📊</div>
                  <h3 className="product-feature__title">Quota Management</h3>
                  <p className="product-feature__description">
                    Monitor and manage usage quotas per user or role. Prevent abuse and ensure fair
                    resource allocation.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🎯</div>
                  <h3 className="product-feature__title">Simple, Clean UI</h3>
                  <p className="product-feature__description">
                    Intuitive interface that gets out of your way. Direct API integration with
                    Access Service backend.
                  </p>
                </div>
              </div>
            </div>
          

          {/* Architecture */}
          
            <div className="product-section">
              <h2 className="product-section__title">Architecture Pattern</h2>
              <p className="product-section__description">
                Access Hub follows the same proven pattern as Mods Hub:
              </p>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">🌐</div>
                  <h3 className="product-feature__title">Frontend @ access.idling.app</h3>
                  <p className="product-feature__description">
                    React 18 frontend deployed on Cloudflare Pages with automatic builds via GitHub
                    Actions.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">⚙️</div>
                  <h3 className="product-feature__title">Backend @ access-api.idling.app</h3>
                  <p className="product-feature__description">
                    Cloudflare Worker API handling all access control logic, storage, and
                    permissions enforcement.
                  </p>
                </div>
              </div>
            </div>
          

          {/* Tech Stack */}
          
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <div className="product-tech">
                <span className="product-tech__tag">React 18</span>
                <span className="product-tech__tag">TypeScript</span>
                <span className="product-tech__tag">Vite</span>
                <span className="product-tech__tag">Cloudflare Workers</span>
                <span className="product-tech__tag">Cloudflare Pages</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}
