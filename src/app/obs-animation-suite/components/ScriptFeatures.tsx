'use client';

import { useState } from 'react';
import styles from './ScriptFeatures.module.css';

export function ScriptFeatures() {
  const [expandedScript, setExpandedScript] = useState<string | null>(null);

  const scripts = [
    {
      id: 'source_animations',
      name: 'Source Animations',
      version: 'v2.7',
      file: 'source_animations.lua',
      description: 'Automatically animate sources when their visibility is toggled.',
      features: [
        'Fade - Smooth opacity transitions',
        'Slide - Move from any direction (left, right, up, down)',
        'Zoom - Scale in/out with precision',
        'Pop - Bouncy overshoot effect'
      ],
      config: [
        'Set default animation type and duration',
        'Configure per-source overrides',
        'Adjust easing functions',
        'Control animation direction and offset'
      ]
    },
    {
      id: 'source_swap',
      name: 'Source Swap',
      version: 'v3.1',
      file: 'source_swap.lua',
      description: 'Swap position and size between two sources with smooth animations.',
      features: [
        'Slide - Smooth position transitions',
        'Teleport - Instant swaps',
        'Crossfade - Opacity-based transitions',
        'Scale - Shrink and grow effect',
        'Bounce - Spring-loaded animations',
        'Elastic - Springy overshoot',
        'Arc - Curved path movement'
      ],
      config: [
        'Create unlimited swap configurations',
        'Assign custom hotkeys',
        'Temporary aspect ratio overrides',
        'Works with grouped sources'
      ]
    },
    {
      id: 'text_cycler',
      name: 'Text Cycler',
      version: 'v1.0',
      file: 'text_cycler.lua',
      description: 'Cycle through text strings with animated transitions.',
      features: [
        'None - Instant text changes',
        'Obfuscate - Minecraft enchantment table style',
        'Typewriter - Character-by-character typing',
        'Glitch - Random glitch characters that settle',
        'Scramble - Full scramble then snap',
        'Wave - Characters appear in a wave pattern'
      ],
      config: [
        'Select any text source',
        'Enter multiple text lines',
        'Set duration per text',
        'Choose transition type and speed'
      ]
    },
    {
      id: 'quick_controls',
      name: 'Quick Controls',
      version: 'v1.0',
      file: 'quick_controls.lua',
      description: 'Provides hotkey shortcuts for quick actions.',
      features: [
        'Cycle aspect override mode',
        'Off → Preserve → Stretch',
        'Assign custom hotkeys in OBS settings'
      ],
      config: [
        'Assign hotkeys in Settings → Hotkeys',
        'Works with all swap configurations'
      ]
    },
    {
      id: 'control_panel',
      name: 'Control Panel',
      version: 'Web UI',
      file: 'control_panel.html',
      description: 'Web-based interface to control everything via WebSocket.',
      features: [
        'Dashboard with script status',
        'Trigger swap configs remotely',
        'Toggle aspect override',
        'Activity logging',
        'Keyboard shortcuts (1-9, Space)',
        'Connection management',
        'PIN-encrypted password storage'
      ],
      config: [
        'Enable WebSocket in OBS',
        'Open HTML file in browser',
        'Connect using host, port, and password',
        'Add as OBS Custom Dock for integration'
      ]
    }
  ];

  const toggleScript = (scriptId: string) => {
    setExpandedScript(expandedScript === scriptId ? null : scriptId);
  };

  return (
    <div className={styles.scripts}>
      <div className={styles.scripts__header}>
        <h2 className={styles.scripts__title}>📦 Scripts & Components</h2>
        <p className={styles.scripts__subtitle}>
          Detailed breakdown of each script and its capabilities
        </p>
      </div>

      <div className={styles.scripts__list}>
        {scripts.map((script) => (
          <div key={script.id} className={styles.script__card}>
            <button
              className={styles.script__header}
              onClick={() => toggleScript(script.id)}
              aria-expanded={expandedScript === script.id}
            >
              <div className={styles.script__title_row}>
                <h3 className={styles.script__name}>{script.name}</h3>
                <span className={styles.script__version}>{script.version}</span>
              </div>
              <p className={styles.script__file}>{script.file}</p>
              <p className={styles.script__description}>{script.description}</p>
              <span className={styles.script__toggle}>
                {expandedScript === script.id ? '▼' : '▶'}
              </span>
            </button>

            {expandedScript === script.id && (
              <div className={styles.script__content}>
                <div className={styles.script__section}>
                  <h4 className={styles.section__title}>Features</h4>
                  <ul className={styles.section__list}>
                    {script.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.script__section}>
                  <h4 className={styles.section__title}>Configuration</h4>
                  <ul className={styles.section__list}>
                    {script.config.map((config, i) => (
                      <li key={i}>{config}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

