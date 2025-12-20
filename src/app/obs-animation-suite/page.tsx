'use client';

import { useState } from 'react';
import { Card } from '../components/card/Card';
import FadeIn from '../components/fade-in/FadeIn';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { ControlPanelDemo } from './components/ControlPanelDemo';
import { FeatureShowcase } from './components/FeatureShowcase';
// FileBrowser removed - no external dependencies
import { InstallationGuide } from './components/InstallationGuide';
import { ScriptFeatures } from './components/ScriptFeatures';
import styles from './page.module.css';

export default function ObsAnimationSuite() {
  const [activeTab, setActiveTab] = useState<'overview' | 'demo' | 'guide'>('overview');

  return (
    <PageContainer>
      <div className={styles.obs__layout}>
        <PageContent>
          <FadeIn>
            {/* Hero Section */}
            <div className={styles.obs__hero}>
              <div className={styles.hero__badge}>
                <span className={styles.badge__icon}>🎬</span>
                <span className={styles.badge__text}>OBS Studio Plugin</span>
              </div>
              <h1 className={styles.hero__title}>OBS Animation Suite</h1>
              <p className={styles.hero__subtitle}>
                Transform your OBS streams with buttery-smooth animations, powerful source swapping, 
                and dynamic text effects. No external plugins required—pure Lua magic.
              </p>
              
              <div className={styles.hero__actions}>
                <a 
                  href="https://github.com/Underwood-Inc/strixun-stream-suite/releases/latest" 
                  className={`${styles.btn} ${styles['btn--primary']}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.btn__icon}>⬇️</span>
                  Download Latest Release
                </a>
                <a 
                  href="https://github.com/Underwood-Inc/strixun-stream-suite" 
                  className={`${styles.btn} ${styles['btn--secondary']}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.btn__icon}>⭐</span>
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'overview' ? styles['tab--active'] : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <span className={styles.tab__icon}>📖</span>
                Overview
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'demo' ? styles['tab--active'] : ''}`}
                onClick={() => setActiveTab('demo')}
              >
                <span className={styles.tab__icon}>🎮</span>
                Live Demo
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'guide' ? styles['tab--active'] : ''}`}
                onClick={() => setActiveTab('guide')}
              >
                <span className={styles.tab__icon}>📚</span>
                Installation
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tab__content}>
              {activeTab === 'overview' && (
                <div className={styles.overview}>
                  <Card width="full">
                    <FeatureShowcase />
                  </Card>
                  
                  <Card width="full">
                    <ScriptFeatures />
                  </Card>
                </div>
              )}

              {activeTab === 'demo' && (
                <>
                  <Card width="full">
                    <ControlPanelDemo />
                  </Card>
                  <Card width="full">
                    <div className={styles.github__section}>
                      <h2 className={styles.section__title}>📁 Source Code</h2>
                      <p className={styles.section__subtitle}>
                        All source files are available on GitHub for review, modification, and contribution.
                      </p>
                      <div className={styles.github__actions}>
                        <a 
                          href="https://github.com/Underwood-Inc/strixun-stream-suite" 
                          className={`${styles.btn} ${styles['btn--primary']}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className={styles.btn__icon}>🔗</span>
                          View on GitHub
                        </a>
                        <a 
                          href="https://github.com/Underwood-Inc/strixun-stream-suite/archive/refs/heads/master.zip" 
                          className={`${styles.btn} ${styles['btn--secondary']}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className={styles.btn__icon}>⬇️</span>
                          Download ZIP
                        </a>
                      </div>
                    </div>
                  </Card>
                </>
              )}

              {activeTab === 'guide' && (
                <Card width="full">
                  <InstallationGuide />
                </Card>
              )}
            </div>

            {/* Version Info */}
            <div className={styles.version__info}>
              <div className={styles.version__item}>
                <span className={styles.version__label}>Current Version:</span>
                <span className={styles.version__value}>v2.7.0</span>
              </div>
              <div className={styles.version__item}>
                <span className={styles.version__label}>OBS Required:</span>
                <span className={styles.version__value}>28.0+</span>
              </div>
              <div className={styles.version__item}>
                <span className={styles.version__label}>License:</span>
                <span className={styles.version__value}>MIT</span>
              </div>
            </div>
          </FadeIn>
        </PageContent>

        {/* Sidebar */}
        <PageAside className={styles.obs__aside}>
          <div className={styles.sidebar}>
            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>⚡ Quick Facts</h3>
              <ul className={styles.fact__list}>
                <li>✅ Zero external dependencies</li>
                <li>✅ WebSocket-powered control panel</li>
                <li>✅ 60 FPS smooth animations</li>
                <li>✅ Lightweight & performant</li>
                <li>✅ Open source & customizable</li>
              </ul>
            </div>

            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>🎨 Animation Types</h3>
              <div className={styles.animation__grid}>
                <div className={`${styles.animation__card} ${styles['animation__card--fade']}`}>
                  <span className={styles.animation__icon}>✨</span>
                  <span className={styles.animation__name}>Fade</span>
                </div>
                <div className={`${styles.animation__card} ${styles['animation__card--slide']}`}>
                  <span className={styles.animation__icon}>➡️</span>
                  <span className={styles.animation__name}>Slide</span>
                </div>
                <div className={`${styles.animation__card} ${styles['animation__card--zoom']}`}>
                  <span className={styles.animation__icon}>🔍</span>
                  <span className={styles.animation__name}>Zoom</span>
                </div>
                <div className={`${styles.animation__card} ${styles['animation__card--pop']}`}>
                  <span className={styles.animation__icon}>💥</span>
                  <span className={styles.animation__name}>Pop</span>
                </div>
              </div>
            </div>

            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>🔧 Requirements</h3>
              <div className={styles.requirement__list}>
                <div className={styles.requirement__item}>
                  <span className={styles.requirement__icon}>📺</span>
                  <div>
                    <strong>OBS Studio 28+</strong>
                    <small>Includes WebSocket support</small>
                  </div>
                </div>
                <div className={styles.requirement__item}>
                  <span className={styles.requirement__icon}>🌐</span>
                  <div>
                    <strong>Modern Browser</strong>
                    <small>For control panel (optional)</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>💬 Community</h3>
              <p className={styles.community__text}>
                Join our Discord for support, share your setups, and get the latest updates!
              </p>
              <a 
                href="https://discord.gg/mpThbx67J7" 
                className={`${styles.btn} ${styles['btn--discord']}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.btn__icon}>💬</span>
                Join Discord
              </a>
            </div>

            <div className={styles.sidebar__section}>
              <h3 className={styles.sidebar__title}>🐛 Found a Bug?</h3>
              <a 
                href="https://github.com/Underwood-Inc/strixun-stream-suite/issues" 
                className={`${styles.btn} ${styles['btn--issue']}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.btn__icon}>🐛</span>
                Report Issue
              </a>
            </div>
          </div>
        </PageAside>
      </div>
    </PageContainer>
  );
}

