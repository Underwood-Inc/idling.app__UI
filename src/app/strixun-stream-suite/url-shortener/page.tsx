
import FadeIn from '../../components/fade-in/FadeIn';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import '../product-detail.css';

export default function URLShortenerPage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
          {/* Hero */}
          <div className="product-hero">
            <img 
              src="/red_panda/img22.png" 
              alt="Red Panda with Sunglasses" 
              className="product-hero__mascot"
              width={256}
              height={256}
            />
            <h1 className="product-hero__title">URL Shortener</h1>
            <p className="product-hero__tagline">Short Links with Analytics</p>
            <div className="product-hero__actions">
              <a
                href="https://s.idling.app"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--primary"
              >
                Launch URL Shortener →
              </a>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/url-shortener"
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
              <h2 className="product-section__title">What is URL Shortener?</h2>
              <p className="product-section__description">
                A Cloudflare Worker-based URL shortening service with OTP authentication via shared
                Strixun OTP component, click analytics tracking (IP, user agent, referrer, geographic
                data), and standalone React web interface. Uses Cloudflare KV for sub-millisecond URL
                lookups and automatic TTL-based expiration with encrypted API responses.
              </p>
            </div>
          

          {/* Key Features */}
          
            <div className="product-section">
              <h2 className="product-section__title">Key Features</h2>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">✂️</div>
                  <h3 className="product-feature__title">Create & Manage Short URLs</h3>
                  <p className="product-feature__description">
                    Generate short links with custom codes or auto-generated slugs. Full CRUD
                    operations for managing your URL collection.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📊</div>
                  <h3 className="product-feature__title">Click Analytics</h3>
                  <p className="product-feature__description">
                    Track clicks, referrers, and geographic data. Real-time analytics stored in
                    Cloudflare KV for instant insights.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🎨</div>
                  <h3 className="product-feature__title">Custom URL Codes</h3>
                  <p className="product-feature__description">
                    Choose your own short codes for memorable, brand-friendly links. Automatic
                    validation prevents collisions.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">⏰</div>
                  <h3 className="product-feature__title">Automatic Expiration</h3>
                  <p className="product-feature__description">
                    Set expiration dates for temporary links. Automatic cleanup keeps your URL
                    collection fresh and relevant.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🌐</div>
                  <h3 className="product-feature__title">Standalone Web Interface</h3>
                  <p className="product-feature__description">
                    Beautiful React-based web interface with SSS branding. Manage all your short
                    links from one place.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔐</div>
                  <h3 className="product-feature__title">OTP Authentication</h3>
                  <p className="product-feature__description">
                    Integrated with Auth Service for secure, passwordless authentication. SSO with
                    all SSS applications.
                  </p>
                </div>
              </div>
            </div>
          

          {/* Tech Stack */}
          
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <div className="product-tech">
                <span className="product-tech__tag">Cloudflare Workers</span>
                <span className="product-tech__tag">React</span>
                <span className="product-tech__tag">TypeScript</span>
                <span className="product-tech__tag">KV Storage</span>
                <span className="product-tech__tag">@strixun/api-framework</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}
