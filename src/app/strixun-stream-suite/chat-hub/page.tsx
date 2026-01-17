
import FadeIn from '../../components/fade-in/FadeIn';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import '../product-detail.css';

export default function ChatHubPage() {
  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
          {/* Hero */}
          <div className="product-hero">
            <img 
              src="/red_panda/Hearts.png" 
              alt="Red Panda with Hearts" 
              className="product-hero__mascot"
              width={256}
              height={256}
            />
            <h1 className="product-hero__title">Chat Hub</h1>
            <p className="product-hero__tagline">P2P Encrypted Chat</p>
            <div className="product-hero__actions">
              <a
                href="https://chat.idling.app"
                target="_blank"
                rel="noopener noreferrer"
                className="product-hero__cta product-hero__cta--primary"
              >
                Launch Chat Hub →
              </a>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/chat-hub"
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

          {/* Beta Notice */}
          
            <div className="product-section">
              <h2 className="product-section__title">🚧 Active Development</h2>
              <p className="product-section__description">
                Chat Hub is currently in active development. The backend signaling server is complete,
                but the frontend is still being refined. Features and UI may change as development
                continues.
              </p>
            </div>
          

          {/* Overview */}
          
            <div className="product-section">
              <h2 className="product-section__title">What is Chat Hub?</h2>
              <p className="product-section__description">
                P2P encrypted chat with blockchain-style persistence. Messages are encrypted end-to-end,
                cryptographically linked in tamper-evident chains, and stored across a distributed network
                of peers. No central server, no data mining, just pure peer-to-peer communication.
              </p>
            </div>
          

          {/* Key Features */}
          
            <div className="product-section">
              <h2 className="product-section__title">Key Features</h2>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">⛓️</div>
                  <h3 className="product-feature__title">Blockchain-Style Storage</h3>
                  <p className="product-feature__description">
                    Each message is cryptographically linked to the previous, forming a tamper-evident chain
                    of history. Every message has a blockHash, previousHash, and blockNumber.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔐</div>
                  <h3 className="product-feature__title">End-to-End Encryption</h3>
                  <p className="product-feature__description">
                    AES-256-GCM encryption with room keys that only participants have. PBKDF2 with 100k
                    iterations for key derivation. Messages encrypted before storage.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">✓</div>
                  <h3 className="product-feature__title">Integrity Verification</h3>
                  <p className="product-feature__description">
                    HMAC-SHA256 signatures ensure message authenticity. Merkle trees verify chunk integrity.
                    Peer consensus for confirmation tracking.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🌐</div>
                  <h3 className="product-feature__title">True P2P Network</h3>
                  <p className="product-feature__description">
                    No central server stores messages. Data lives on participant devices and syncs directly
                    between peers via WebRTC data channels.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">📊</div>
                  <h3 className="product-feature__title">Gap Detection</h3>
                  <p className="product-feature__description">
                    Know exactly when and why messages might be missing. Clear UX for incomplete history
                    with sync status indicators.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">💾</div>
                  <h3 className="product-feature__title">Flexible Storage</h3>
                  <p className="product-feature__description">
                    Store in IndexedDB, local filesystem, or custom location. Messages stored in chunks
                    of 100 with Merkle roots for verification.
                  </p>
                </div>
              </div>
            </div>
          

          {/* Architecture */}
          
            <div className="product-section">
              <h2 className="product-section__title">Blockchain-Style P2P Architecture</h2>
              <p className="product-section__description">
                Chat Hub uses blockchain-inspired message chains with distributed storage and cryptographic verification:
              </p>
              <div className="product-features">
                <div className="product-feature">
                  <div className="product-feature__icon">🔗</div>
                  <h3 className="product-feature__title">Message Hash Chains</h3>
                  <p className="product-feature__description">
                    Each message links to the previous via hash, creating an immutable chain. Tampering
                    with any message breaks the chain and is immediately detected.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🌳</div>
                  <h3 className="product-feature__title">Merkle Tree Verification</h3>
                  <p className="product-feature__description">
                    Messages stored in chunks of 100 with Merkle tree roots. Quick integrity verification
                    without downloading entire history.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">🔄</div>
                  <h3 className="product-feature__title">Sync Protocol</h3>
                  <p className="product-feature__description">
                    Bidirectional sync with block verification. Peers share history, verify signatures and
                    hash chains, detect gaps, and resolve conflicts.
                  </p>
                </div>
                <div className="product-feature">
                  <div className="product-feature__icon">✅</div>
                  <h3 className="product-feature__title">Peer Consensus</h3>
                  <p className="product-feature__description">
                    Optimistic messaging with eventual consistency. Confirmations accumulate as peers
                    verify. Integrity score reflects peer coverage.
                  </p>
                </div>
              </div>
            </div>
          

          {/* Tech Stack */}
          
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <div className="product-tech">
                <span className="product-tech__tag">React 18</span>
                <span className="product-tech__tag">WebRTC</span>
                <span className="product-tech__tag">Zustand</span>
                <span className="product-tech__tag">TypeScript</span>
                <span className="product-tech__tag">@strixun/chat</span>
                <span className="product-tech__tag">@strixun/auth-store</span>
                <span className="product-tech__tag">Cloudflare Workers</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}
