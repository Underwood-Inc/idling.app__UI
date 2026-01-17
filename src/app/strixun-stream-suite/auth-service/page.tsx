
import FadeIn from '../../components/fade-in/FadeIn';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import '../product-detail.css';

export default function AuthServicePage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
          {/* Hero */}
          <div className="product-hero">
            <img 
              src="/red_panda/img6.png" 
              alt="Red Panda Thumbs Up" 
              className="product-hero__mascot"
              width={256}
              height={256}
            />
            <h1 className="product-hero__title">Auth Service</h1>
            <p className="product-hero__tagline">Multi-Tenant OTP Authentication</p>
            <div className="product-hero__actions">
              <a
                href="https://auth.idling.app"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--primary"
              >
                Launch Auth Service →
              </a>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/otp-auth-service"
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
              <h2 className="product-section__title">What is Auth Service?</h2>
              <p className="product-section__description">
                A multi-tenant OTP authentication service built on Cloudflare Workers with email-based
                passwordless authentication via Resend API. Features include developer dashboard built
                with Svelte 5, multi-tenant API key management, OpenAPI 3.1.0 specification with Swagger
                UI, and audit logging. Single sign-on across all *.idling.app domains with HttpOnly
                cookies.
              </p>
            </div>
          

          {/* Key Features */}
          
            <div className="product-section">
              <h2 className="product-section__title">Key Features</h2>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">🔑</div>
                  <h3 className="product-feature__title">Passwordless OTP</h3>
                  <p className="product-feature__description">
                    Email-based one-time password authentication with no password storage. Secure,
                    user-friendly, and reduces attack surface.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🎫</div>
                  <h3 className="product-feature__title">JWT Token Management</h3>
                  <p className="product-feature__description">
                    Industry-standard JWT tokens with HttpOnly cookies for maximum security. Automatic
                    refresh and expiration handling.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔧</div>
                  <h3 className="product-feature__title">API Key Management</h3>
                  <p className="product-feature__description">
                    Multi-tenant API key system with granular permissions. Create, rotate, and revoke
                    API keys from the developer dashboard.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📊</div>
                  <h3 className="product-feature__title">Analytics Dashboard</h3>
                  <p className="product-feature__description">
                    Built with Svelte 5, track authentication events, monitor usage, and analyze
                    patterns with real-time analytics.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📖</div>
                  <h3 className="product-feature__title">OpenAPI 3.1.0 Spec</h3>
                  <p className="product-feature__description">
                    Complete OpenAPI specification with Swagger UI integration. Interactive API
                    documentation for easy integration.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔗</div>
                  <h3 className="product-feature__title">Single Sign-On</h3>
                  <p className="product-feature__description">
                    SSO across all *.idling.app domains with HttpOnly cookies. Login once on any
                    service, authenticated everywhere.
                  </p>
                </div>
              </div>
            </div>
          

          {/* For Developers */}
          
            <div className="product-section">
              <h2 className="product-section__title">Developer-First Design</h2>
              <p className="product-section__description">
                Auth Service provides everything developers need to integrate secure authentication
                into their applications:
              </p>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">🎨</div>
                  <h3 className="product-feature__title">Embeddable UI Components</h3>
                  <p className="product-feature__description">
                    Drop-in authentication components for React, Svelte, and vanilla JavaScript. No
                    UI work required.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📚</div>
                  <h3 className="product-feature__title">Comprehensive Docs</h3>
                  <p className="product-feature__description">
                    300+ pages of documentation in PANDA_CORE covering integration guides, API
                    reference, and security best practices.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🧪</div>
                  <h3 className="product-feature__title">Full Test Coverage</h3>
                  <p className="product-feature__description">
                    E2E integration tests with Playwright, unit tests with Vitest, and CI/CD
                    workflows for confidence.
                  </p>
                </div>
              </div>
            </div>
          

          {/* Tech Stack */}
          
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <div className="product-tech">
                <span className="product-tech__tag">Cloudflare Workers</span>
                <span className="product-tech__tag">Svelte 5</span>
                <span className="product-tech__tag">TypeScript</span>
                <span className="product-tech__tag">KV Storage</span>
                <span className="product-tech__tag">Resend API</span>
                <span className="product-tech__tag">JWT</span>
                <span className="product-tech__tag">OpenAPI 3.1.0</span>
                <span className="product-tech__tag">Swagger UI</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}
