import FadeIn from '../../components/fade-in/FadeIn';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import '../product-detail.css';

export default function StreamSuitePage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
          {/* Hero */}
          <div className="product-hero">
            <img 
              src="/red_panda/img4.png" 
              alt="Red Panda Developer" 
              className="product-hero__mascot"
              width={256}
              height={256}
            />
            <h1 className="product-hero__title">Stream Suite</h1>
            <p className="product-hero__tagline">Professional OBS Studio Control Panel</p>
            <div className="product-hero__actions">
              <a
                href="https://streamkit.idling.app"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--primary"
              >
                Launch Stream Suite →
              </a>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite"
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
              <h2 className="product-section__title">What is Stream Suite?</h2>
              <p className="product-section__description">
                Stream Suite is a comprehensive OBS Studio control panel that brings professional-grade
                animations and automation to your streaming workflow. Built with Svelte 5 and designed
                as a Progressive Web App, it provides seamless control over your OBS scenes with
                beautiful, customizable animations.
              </p>
            </div>

            {/* Key Features */}
            <div className="product-section">
              <h2 className="product-section__title">Key Features</h2>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">✨</div>
                  <h3 className="product-feature__title">Source Animations</h3>
                  <p className="product-feature__description">
                    Animate source visibility with fade, slide, zoom, and pop effects. 60 FPS performance
                    with sub-50ms latency via WebSocket. No OBS lag - all animations are buttery smooth.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔄</div>
                  <h3 className="product-feature__title">Source Swaps</h3>
                  <p className="product-feature__description">
                    Animated position and size transitions between sources. 7 different animation styles
                    with position memory for perfect swaps every time.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🎨</div>
                  <h3 className="product-feature__title">Layout Presets</h3>
                  <p className="product-feature__description">
                    Save and apply entire scene layouts with multi-source animation support. Switch between
                    streaming, recording, and custom setups instantly.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">💬</div>
                  <h3 className="product-feature__title">Text Cycler</h3>
                  <p className="product-feature__description">
                    Dynamic text effects with transitions including fade, slide, typewriter, glitch, wave,
                    and scramble. Perfect for alerts and overlays.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📱</div>
                  <h3 className="product-feature__title">Progressive Web App</h3>
                  <p className="product-feature__description">
                    Install as a PWA for offline access and native app experience. Multi-layer storage
                    system (IndexedDB + localStorage + Recovery).
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🌐</div>
                  <h3 className="product-feature__title">Unified Control Panel</h3>
                  <p className="product-feature__description">
                    One web-based dock to control everything. Real-time WebSocket communication with
                    OBS Studio for instant updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <div className="product-tech">
                <span className="product-tech__tag">Svelte 5</span>
                <span className="product-tech__tag">TypeScript</span>
                <span className="product-tech__tag">Vite</span>
                <span className="product-tech__tag">OBS WebSocket</span>
                <span className="product-tech__tag">PWA</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}
