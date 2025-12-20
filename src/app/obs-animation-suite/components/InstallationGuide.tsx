'use client';

import styles from './InstallationGuide.module.css';

export function InstallationGuide() {
  return (
    <div className={styles.guide}>
      <div className={styles.guide__header}>
        <h2 className={styles.guide__title}>📚 Installation & Setup Guide</h2>
        <p className={styles.guide__subtitle}>
          Get up and running in minutes with these simple steps
        </p>
      </div>

      {/* Basic Installation */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>
          <span className={styles.step__number}>1</span>
          Download & Install
        </h3>
        <div className={styles.section__content}>
          <ol className={styles.step__list}>
            <li>
              <strong>Download the latest release</strong> from GitHub
              <br />
              <a 
                href="https://github.com/Underwood-Inc/strixun-stream-suite/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                → Get Latest Release
              </a>
            </li>
            <li>
              <strong>Extract all files</strong> to a folder on your computer
            </li>
            <li>
              In OBS Studio, go to <code>Tools → Scripts</code>
            </li>
            <li>
              Click the <code>+</code> button and add each <code>.lua</code> file:
              <ul className={styles.file__list}>
                <li><code>source_animations.lua</code></li>
                <li><code>source_swap.lua</code></li>
                <li><code>text_cycler.lua</code></li>
                <li><code>quick_controls.lua</code></li>
              </ul>
            </li>
            <li>
              Configure each script as needed in the Scripts panel
            </li>
          </ol>
        </div>
      </section>

      {/* WebSocket Setup */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>
          <span className={styles.step__number}>2</span>
          Enable WebSocket (Optional)
        </h3>
        <div className={styles.section__content}>
          <p className={styles.section__note}>
            Required only if you want to use the web control panel
          </p>
          <ol className={styles.step__list}>
            <li>
              In OBS, go to <code>Tools → WebSocket Server Settings</code>
            </li>
            <li>
              Check <strong>"Enable WebSocket server"</strong>
            </li>
            <li>
              Note the port number (default: <code>4455</code>)
            </li>
            <li>
              (Optional) Set a password for security
            </li>
            <li>
              Click <strong>Apply</strong>
            </li>
          </ol>
        </div>
      </section>

      {/* Control Panel Setup */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>
          <span className={styles.step__number}>3</span>
          Setup Control Panel
        </h3>
        <div className={styles.section__content}>
          <p className={styles.section__note}>
            Choose one of these methods to use the control panel:
          </p>
          
          <div className={styles.method__grid}>
            <div className={styles.method__card}>
              <h4 className={styles.method__title}>🌐 Browser Method</h4>
              <ol className={styles.step__list}>
                <li>Open <code>control_panel.html</code> in any modern browser</li>
                <li>Enter your OBS WebSocket connection details</li>
                <li>Click <strong>Connect</strong></li>
              </ol>
            </div>

            <div className={styles.method__card}>
              <h4 className={styles.method__title}>🔲 OBS Dock Method</h4>
              <ol className={styles.step__list}>
                <li>In OBS, go to <code>View → Docks → Custom Browser Docks</code></li>
                <li>Click the <code>+</code> button</li>
                <li>Give it a name (e.g., "Animation Suite")</li>
                <li>Paste the full file path to <code>control_panel.html</code></li>
                <li>Click <strong>Apply</strong></li>
              </ol>
              <div className={styles.method__tip}>
                💡 Tip: Use <code>file:///C:/path/to/control_panel.html</code> format
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Tips */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>
          <span className={styles.step__number}>4</span>
          Configure & Customize
        </h3>
        <div className={styles.section__content}>
          <div className={styles.tips}>
            <div className={styles.tip__card}>
              <h4 className={styles.tip__title}>🎨 Source Animations</h4>
              <ul className={styles.tip__list}>
                <li>Set default animation type in script settings</li>
                <li>Add per-source overrides for specific sources</li>
                <li>Adjust duration (100-2000ms recommended)</li>
                <li>First visibility toggle caches state, second triggers animation</li>
              </ul>
            </div>

            <div className={styles.tip__card}>
              <h4 className={styles.tip__title}>🔄 Source Swap</h4>
              <ul className={styles.tip__list}>
                <li>Create swap configs with descriptive names</li>
                <li>Assign hotkeys in <code>Settings → Hotkeys</code></li>
                <li>Both sources must be in the current scene</li>
                <li>Use aspect override for different size sources</li>
              </ul>
            </div>

            <div className={styles.tip__card}>
              <h4 className={styles.tip__title}>📝 Text Cycler</h4>
              <ul className={styles.tip__list}>
                <li>Works with any text source (GDI+ or FreeType)</li>
                <li>Enter one text line per line</li>
                <li>Adjust cycle duration for timing</li>
                <li>Try different transitions for various effects</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className={`${styles.section} ${styles['section--troubleshoot']}`}>
        <h3 className={styles.section__title}>
          🛠️ Troubleshooting
        </h3>
        <div className={styles.section__content}>
          <div className={styles.troubleshoot__grid}>
            <div className={styles.troubleshoot__item}>
              <h4>Animations not playing?</h4>
              <ul>
                <li>First toggle caches state, second triggers animation</li>
                <li>Check "Animate on SHOW/HIDE" is enabled</li>
                <li>Click "Refresh Sources" in script settings</li>
              </ul>
            </div>

            <div className={styles.troubleshoot__item}>
              <h4>Swap not working?</h4>
              <ul>
                <li>Both sources must be in the current scene</li>
                <li>Source names are case-sensitive</li>
                <li>Check script log for errors</li>
              </ul>
            </div>

            <div className={styles.troubleshoot__item}>
              <h4>Control panel won't connect?</h4>
              <ul>
                <li>Enable WebSocket in OBS settings</li>
                <li>Check port and password match</li>
                <li>Requires OBS Studio 28 or newer</li>
              </ul>
            </div>

            <div className={styles.troubleshoot__item}>
              <h4>Performance issues?</h4>
              <ul>
                <li>Reduce animation duration for faster animations</li>
                <li>Use fewer simultaneous animations</li>
                <li>Simplify easing functions (try "linear")</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

