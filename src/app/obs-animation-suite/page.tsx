import { Card } from '../components/card/Card';
import FadeIn from '../components/fade-in/FadeIn';
import { ProductMarketingTemplate } from '../components/marketing/ProductMarketingTemplate';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { InstallationGuide } from './components/InstallationGuide';
import { ScriptFeatures } from './components/ScriptFeatures';
import styles from './page.module.css';

export default function ObsAnimationSuite() {
  return (
    <PageContainer>
      <div className={styles.layout}>
        <PageContent>
          <FadeIn>
            <Card width="full">
              <ProductMarketingTemplate
                title="OBS Animation Suite"
                tagline="Professional Streaming Tools"
                description="Powerful Lua scripts for OBS Studio featuring smooth animations, source swapping, text cycling, and a web control panel. Zero dependencies, 60 FPS performance, and fully open source."
                heroIcon="📹"
                features={[
                  {
                    icon: '✨',
                    title: 'Source Animations',
                    description: 'Fade, slide, zoom, and pop effects triggered automatically when sources are shown or hidden.',
                    highlights: ['4 animation types', 'Customizable easing', 'Per-source configuration']
                  },
                  {
                    icon: '🔄',
                    title: 'Source Swapping',
                    description: 'Smoothly swap positions and sizes between any two sources with beautiful animated transitions.',
                    highlights: ['7 swap styles', 'Hotkey support', 'Save configurations']
                  },
                  {
                    icon: '📝',
                    title: 'Text Cycler',
                    description: 'Cycle through text with animated transitions like typewriter, glitch, and scramble effects.',
                    highlights: ['6 transition types', 'Customizable timing', 'Real-time updates']
                  },
                  {
                    icon: '🎮',
                    title: 'Web Control Panel',
                    description: 'Browser-based interface to control all features via WebSocket connection.',
                    highlights: ['Real-time control', 'Activity logging', 'Keyboard shortcuts']
                  }
                ]}
                links={[
                  {
                    label: 'View on GitHub',
                    url: 'https://github.com/Underwood-Inc/strixun-stream-suite',
                    variant: 'github',
                    icon: '📦'
                  },
                  {
                    label: 'Download Latest',
                    url: 'https://github.com/Underwood-Inc/strixun-stream-suite/releases',
                    variant: 'primary',
                    icon: '📥'
                  },
                  {
                    label: 'Documentation',
                    url: 'https://github.com/Underwood-Inc/strixun-stream-suite#readme',
                    variant: 'secondary',
                    icon: '📖'
                  }
                ]}
                techStack={['Lua', 'JavaScript', 'WebSocket', 'OBS Studio 28+']}
                stats={[
                  { label: 'FPS Performance', value: '60', icon: '⚡' },
                  { label: 'Dependencies', value: '0', icon: '📦' },
                  { label: 'Animation Types', value: '17+', icon: '✨' }
                ]}
              >
                {/* Installation Guide */}
                <Card width="full">
                  <InstallationGuide />
                </Card>

                {/* Script Features */}
                <Card width="full">
                  <ScriptFeatures />
                </Card>
              </ProductMarketingTemplate>
            </Card>
          </FadeIn>
        </PageContent>

        <PageAside>
          <Card width="full">
            <div className={styles.quick__links}>
              <h3 className={styles.quick__links__title}>Quick Links</h3>
              <div className={styles.quick__links__list}>
                <a 
                  href="https://github.com/Underwood-Inc/strixun-stream-suite" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.quick__link}
                >
                  <span className={styles.quick__link__icon}>📦</span>
                  GitHub Repository
                </a>
                <a 
                  href="https://github.com/Underwood-Inc/strixun-stream-suite/releases" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.quick__link}
                >
                  <span className={styles.quick__link__icon}>📥</span>
                  Download Latest
                </a>
                <a 
                  href="https://github.com/Underwood-Inc/strixun-stream-suite/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.quick__link}
                >
                  <span className={styles.quick__link__icon}>🐛</span>
                  Report Issues
                </a>
                <a 
                  href="https://github.com/Underwood-Inc/strixun-stream-suite/blob/main/CONTRIBUTING.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.quick__link}
                >
                  <span className={styles.quick__link__icon}>🤝</span>
                  Contributing Guide
                </a>
              </div>
            </div>
          </Card>

          <Card width="full">
            <div className={styles.requirements}>
              <h3 className={styles.requirements__title}>Requirements</h3>
              <ul className={styles.requirements__list}>
                <li>OBS Studio 28.0+</li>
                <li>WebSocket plugin enabled</li>
                <li>Modern web browser</li>
                <li>No external dependencies</li>
              </ul>
            </div>
          </Card>

          <Card width="full">
            <div className={styles.license}>
              <h3 className={styles.license__title}>License</h3>
              <p className={styles.license__text}>
                MIT License - Free for personal and commercial use
              </p>
            </div>
          </Card>
        </PageAside>
      </div>
    </PageContainer>
  );
}
