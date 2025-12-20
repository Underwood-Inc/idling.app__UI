'use client';

import styles from './FeatureShowcase.module.css';

export function FeatureShowcase() {
  const features = [
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
  ];

  return (
    <div className={styles.showcase}>
      <div className={styles.showcase__header}>
        <h2 className={styles.showcase__title}>✨ Core Features</h2>
        <p className={styles.showcase__subtitle}>
          Everything you need to create professional, polished streams
        </p>
      </div>

      <div className={styles.feature__grid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.feature__card}>
            <div className={styles.feature__icon}>{feature.icon}</div>
            <h3 className={styles.feature__title}>{feature.title}</h3>
            <p className={styles.feature__description}>{feature.description}</p>
            <ul className={styles.feature__highlights}>
              {feature.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.showcase__footer}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.stat__value}>0</span>
            <span className={styles.stat__label}>External Dependencies</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.stat__value}>60</span>
            <span className={styles.stat__label}>FPS Animations</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.stat__value}>100%</span>
            <span className={styles.stat__label}>Open Source</span>
          </div>
        </div>
      </div>
    </div>
  );
}

