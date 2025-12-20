'use client';

import { useState } from 'react';
import styles from './ControlPanelDemo.module.css';
import { ControlPanelMock } from './ControlPanelMock';

export function ControlPanelDemo() {
  const [demoMode, setDemoMode] = useState<'embedded' | 'info'>('info');

  return (
    <div className={styles.demo}>
      <div className={styles.demo__header}>
        <h2 className={styles.demo__title}>🎮 Interactive Control Panel</h2>
        <p className={styles.demo__subtitle}>
          Experience the web-based control panel right here in your browser
        </p>
      </div>

      <div className={styles.demo__modes}>
        <button
          className={`${styles.mode__btn} ${demoMode === 'info' ? styles['mode__btn--active'] : ''}`}
          onClick={() => setDemoMode('info')}
        >
          <span className={styles.mode__icon}>ℹ️</span>
          About Panel
        </button>
        <button
          className={`${styles.mode__btn} ${demoMode === 'embedded' ? styles['mode__btn--active'] : ''}`}
          onClick={() => setDemoMode('embedded')}
        >
          <span className={styles.mode__icon}>🎮</span>
          Live Demo
        </button>
      </div>

      {demoMode === 'info' && (
        <div className={styles.info__content}>
          <div className={styles.info__grid}>
            <div className={styles.info__card}>
              <h3 className={styles.info__title}>
                <span className={styles.info__icon}>🌐</span>
                WebSocket Connection
              </h3>
              <p>
                The control panel connects to OBS Studio via WebSocket protocol (OBS 28+). 
                Secure, real-time communication with PIN-encrypted credential storage using AES-256-GCM.
              </p>
            </div>

            <div className={styles.info__card}>
              <h3 className={styles.info__title}>
                <span className={styles.info__icon}>🎯</span>
                Dashboard
              </h3>
              <p>
                View current scene, trigger quick actions, access saved swap configurations, 
                and monitor activity with a real-time log of all operations.
              </p>
            </div>

            <div className={styles.info__card}>
              <h3 className={styles.info__title}>
                <span className={styles.info__icon}>📦</span>
                Sources Tab
              </h3>
              <p>
                Control visibility animations for all sources in your scene. Toggle sources 
                with smooth animations, adjust animation types, duration, and easing functions.
              </p>
            </div>

            <div className={styles.info__card}>
              <h3 className={styles.info__title}>
                <span className={styles.info__icon}>📝</span>
                Text Cycler
              </h3>
              <p>
                Select any text source and cycle through multiple text lines with animated 
                transitions. Features typewriter, glitch, scramble, and wave effects.
              </p>
            </div>

            <div className={styles.info__card}>
              <h3 className={styles.info__title}>
                <span className={styles.info__icon}>🔄</span>
                Swaps Tab
              </h3>
              <p>
                Swap positions and sizes of any two sources with multiple animation styles. 
                Save configurations, export/import settings, and trigger with hotkeys.
              </p>
            </div>

            <div className={styles.info__card}>
              <h3 className={styles.info__title}>
                <span className={styles.info__icon}>⚙️</span>
                Setup Tab
              </h3>
              <p>
                Configure WebSocket connection, view setup instructions, copy dock URL, 
                and manage saved credentials with secure encryption.
              </p>
            </div>
          </div>

          <div className={styles.features__highlight}>
            <h3 className={styles.highlight__title}>🎹 Keyboard Shortcuts</h3>
            <div className={styles.shortcut__grid}>
              <div className={styles.shortcut__item}>
                <kbd className={styles.kbd}>1-9</kbd>
                <span>Trigger saved swap configs</span>
              </div>
              <div className={styles.shortcut__item}>
                <kbd className={styles.kbd}>Space</kbd>
                <span>Start/stop text cycler</span>
              </div>
            </div>
          </div>

          <div className={styles.responsive__info}>
            <h3 className={styles.responsive__title}>📱 Responsive Design</h3>
            <p>
              The control panel is fully responsive and works beautifully on all screen sizes, 
              from ultra-wide monitors to tiny OBS docks (250px wide). Perfect for mobile devices 
              too, so you can control your stream from anywhere!
            </p>
          </div>
        </div>
      )}

      {demoMode === 'embedded' && (
        <div className={styles.demo__container}>
          <ControlPanelMock />
        </div>
      )}
    </div>
  );
}

