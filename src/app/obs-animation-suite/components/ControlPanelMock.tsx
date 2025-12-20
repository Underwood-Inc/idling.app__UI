'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ControlPanelMock.module.css';

// Character sets for effects (from actual text_cycler.lua)
const CHARS_STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CHARS_ENCHANT = 'ᔑᒷᓵ↸ᒷ⎓⊣⍑╎⋮ꖌꖎᒲリ𝙹!¡ᑑ∷ᓭℸ⚍⍊∴̇/||⨅';
const CHARS_GLITCH = '█▓▒░╔╗╚╝║═┌┐└┘│─┼▀▄▌▐■□▪▫●○◘◙◄►▲▼';

type TransitionType = 'none' | 'obfuscate' | 'typewriter' | 'glitch' | 'scramble' | 'wave';

function getRandomChar(charset: string): string {
  const chars = [...charset];
  return chars[Math.floor(Math.random() * chars.length)] || '?';
}

// Obfuscate: Minecraft enchantment table scramble then reveal left-to-right
function obfuscateText(target: string, progress: number): string {
  const chars = [...target];
  const revealed = Math.floor(progress * chars.length);
  
  return chars.map((char, i) => {
    if (i < revealed) return char;
    if (char === ' ') return ' ';
    return getRandomChar(CHARS_ENCHANT);
  }).join('');
}

// Typewriter: type out character by character
function typewriterText(target: string, progress: number): string {
  const chars = [...target];
  const show = Math.floor(progress * chars.length);
  return chars.slice(0, show).join('');
}

// Glitch: random glitch characters that settle
function glitchText(target: string, progress: number): string {
  const chars = [...target];
  const glitchChance = 1.0 - progress;
  
  return chars.map((char) => {
    if (char === ' ') return ' ';
    if (Math.random() < glitchChance * 0.7) {
      return getRandomChar(CHARS_GLITCH);
    }
    return char;
  }).join('');
}

// Scramble: all random then snap to final
function scrambleText(target: string, progress: number): string {
  if (progress >= 0.95) return target;
  
  const chars = [...target];
  return chars.map((char) => {
    if (char === ' ') return ' ';
    return getRandomChar(CHARS_ENCHANT);
  }).join('');
}

// Wave: characters appear in a wave pattern
function waveText(target: string, progress: number): string {
  const chars = [...target];
  const waveWidth = 3;
  const center = progress * (chars.length + waveWidth);
  
  return chars.map((char, i) => {
    const dist = Math.abs(i - center);
    if (dist < waveWidth && char !== ' ') {
      return getRandomChar(CHARS_ENCHANT);
    }
    if (i < center - waveWidth) {
      return char;
    }
    return ' ';
  }).join('');
}

function applyTransition(target: string, progress: number, type: TransitionType): string {
  switch (type) {
    case 'obfuscate': return obfuscateText(target, progress);
    case 'typewriter': return typewriterText(target, progress);
    case 'glitch': return glitchText(target, progress);
    case 'scramble': return scrambleText(target, progress);
    case 'wave': return waveText(target, progress);
    default: return target;
  }
}

const DEFAULT_TEXT_LINES = [
  'Welcome to the Stream!',
  'Don\'t forget to Subscribe!',
  'Follow for more content',
  'Thanks for watching!'
];

export function ControlPanelMock() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'swap' | 'text' | 'connection'>('text');
  const [uptime, setUptime] = useState('00:00:00');
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([
    { time: new Date().toLocaleTimeString(), message: 'Demo mode initialized', type: 'info' },
  ]);

  // Text cycler state
  const [textLines, setTextLines] = useState<string[]>(DEFAULT_TEXT_LINES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState(DEFAULT_TEXT_LINES[0]);
  const [transitionType, setTransitionType] = useState<TransitionType>('obfuscate');
  const [cycleDuration, setCycleDuration] = useState(3000);
  const [transDuration, setTransDuration] = useState(500);
  const [isRunning, setIsRunning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Text styling state
  const [textStyles, setTextStyles] = useState({
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '48px',
    fontWeight: '700',
    fontStyle: 'normal',
    color: '#ffffff',
    letterSpacing: 'normal',
    lineHeight: '1.2',
    textTransform: 'none' as 'none' | 'uppercase' | 'lowercase' | 'capitalize',
    shadow: '2px 2px 4px rgba(0,0,0,0.5)',
    strokeWidth: '0',
    strokeColor: '#000000',
  });

  // Source swap state
  const [swapConfigs] = useState<SwapConfig[]>(DEFAULT_SWAP_CONFIGS);
  const [selectedSwapConfig, setSelectedSwapConfig] = useState<string>('1');
  const [swapEasing, setSwapEasing] = useState<EasingType>('ease_in_out');
  const [swapDuration, setSwapDuration] = useState(400);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapProgress, setSwapProgress] = useState(0);
  const [swapPositions, setSwapPositions] = useState({ aX: 0, aY: 0, bX: 200, bY: 0 });

  // Source animations state
  const [sources, setSources] = useState<SourceConfig[]>(DEFAULT_SOURCES);
  const [selectedSource, setSelectedSource] = useState<string>('Gameplay');
  const [animatingSource, setAnimatingSource] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const cycleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const transitionStartRef = useRef<number>(0);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'success') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, message, type }, ...prev.slice(0, 49)]);
  }, []);

  // Uptime counter
  useEffect(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Transition animation loop
  const runTransition = useCallback((targetText: string, onComplete: () => void) => {
    if (transitionType === 'none') {
      setDisplayText(targetText);
      onComplete();
      return;
    }

    setIsTransitioning(true);
    transitionStartRef.current = performance.now();

    const animate = () => {
      const elapsed = performance.now() - transitionStartRef.current;
      const progress = Math.min(elapsed / transDuration, 1);
      
      const animated = applyTransition(targetText, progress, transitionType);
      setDisplayText(animated);

      if (progress < 1) {
        transitionFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(targetText);
        setIsTransitioning(false);
        onComplete();
      }
    };

    transitionFrameRef.current = requestAnimationFrame(animate);
  }, [transitionType, transDuration]);

  // Cycle to next text
  const cycleNext = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = (prev + 1) % textLines.length;
      const nextText = textLines[nextIndex];
      addLog(`Cycling to: "${nextText.substring(0, 20)}${nextText.length > 20 ? '...' : ''}"`, 'info');
      runTransition(nextText, () => {});
      return nextIndex;
    });
  }, [textLines, runTransition, addLog]);

  // Start cycling
  const startCycling = useCallback(() => {
    if (textLines.length === 0) {
      addLog('No text lines to cycle', 'error');
      return;
    }

    setIsRunning(true);
    addLog(`Started cycling ${textLines.length} texts (${transitionType})`, 'success');
    
    // Show first text with transition
    runTransition(textLines[0], () => {});
    setCurrentIndex(0);

    // Start interval
    cycleIntervalRef.current = setInterval(cycleNext, cycleDuration);
  }, [textLines, transitionType, cycleDuration, runTransition, cycleNext, addLog]);

  // Stop cycling
  const stopCycling = useCallback(() => {
    setIsRunning(false);
    
    if (cycleIntervalRef.current) {
      clearInterval(cycleIntervalRef.current);
      cycleIntervalRef.current = null;
    }
    
    if (transitionFrameRef.current) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }
    
    setIsTransitioning(false);
    addLog('Stopped cycling', 'info');
  }, [addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
      if (transitionFrameRef.current) cancelAnimationFrame(transitionFrameRef.current);
    };
  }, []);

  // Preview single transition
  const previewTransition = useCallback(() => {
    if (textLines.length === 0) return;
    const text = textLines[currentIndex] || textLines[0];
    addLog(`Previewing ${transitionType} effect`, 'info');
    runTransition(text, () => {});
  }, [textLines, currentIndex, transitionType, runTransition, addLog]);

  const handleTextLinesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n').filter(l => l.trim());
    setTextLines(lines.length > 0 ? lines : DEFAULT_TEXT_LINES);
  };

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1 className={styles.header__title}>
          <span className={`${styles.status__dot} ${styles['status__dot--demo']}`}></span>
          <span>OBS Animation Suite</span>
        </h1>
        <span className={styles.demo__badge}>Live Demo</span>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'dashboard' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'text' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('text')}
        >
          📝 Text Cycler
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'swap' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('swap')}
        >
          🔄 Source Swap
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'connection' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          🔌 Setup
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'dashboard' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>System Status</h3>
              <div className={styles.status__grid}>
                <div className={styles.status__card}>
                  <h4>Mode</h4>
                  <div className={styles.status__value}>Demo</div>
                </div>
                <div className={styles.status__card}>
                  <h4>Scripts</h4>
                  <div className={styles.status__value}>4 Loaded</div>
                </div>
                <div className={styles.status__card}>
                  <h4>Configs</h4>
                  <div className={styles.status__value}>8 Saved</div>
                </div>
                <div className={styles.status__card}>
                  <h4>Uptime</h4>
                  <div className={styles.status__value}>{uptime}</div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>Activity Log</h3>
              <div className={styles.log}>
                {logs.map((log, i) => (
                  <div key={i} className={`${styles.log__entry} ${styles[`log__entry--${log.type}`]}`}>
                    [{log.time}] {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className={styles.page}>
            {/* LIVE PREVIEW - The main attraction! */}
            <div className={styles.card}>
              <h3 className={styles.card__title}>🎬 Live Preview</h3>
              <div
                className={`${styles.text__preview} ${isTransitioning ? styles['text__preview--animating'] : ''}`}
                style={{
                  fontFamily: textStyles.fontFamily,
                  fontSize: textStyles.fontSize,
                  fontWeight: textStyles.fontWeight,
                  fontStyle: textStyles.fontStyle,
                  color: textStyles.color,
                  letterSpacing: textStyles.letterSpacing === 'normal' ? undefined : textStyles.letterSpacing,
                  lineHeight: textStyles.lineHeight,
                  textTransform: textStyles.textTransform,
                  textShadow: textStyles.shadow,
                  WebkitTextStroke: textStyles.strokeWidth !== '0' && textStyles.strokeWidth !== '0px'
                    ? `${textStyles.strokeWidth} ${textStyles.strokeColor}`
                    : undefined,
                }}
              >
                {displayText || 'Enter text below...'}
              </div>
              <div className={styles.preview__info}>
                {isRunning ? (
                  <span className={styles.preview__status}>
                    ● Cycling ({currentIndex + 1}/{textLines.length})
                  </span>
                ) : (
                  <span className={styles.preview__status}>○ Stopped</span>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>Text Lines</h3>
              <textarea
                className={styles.textarea}
                placeholder="Enter text lines (one per line)&#10;Line 1&#10;Line 2&#10;Line 3"
                rows={4}
                defaultValue={DEFAULT_TEXT_LINES.join('\n')}
                onChange={handleTextLinesChange}
              />
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>Transition Effect</h3>
              <select
                className={styles.select}
                value={transitionType}
                onChange={(e) => setTransitionType(e.target.value as TransitionType)}
              >
                <option value="none">None (instant)</option>
                <option value="obfuscate">Obfuscate (Minecraft enchant)</option>
                <option value="typewriter">Typewriter</option>
                <option value="glitch">Glitch</option>
                <option value="scramble">Scramble → Snap</option>
                <option value="wave">Wave Reveal</option>
              </select>
              <p className={styles.effect__description}>
                {transitionType === 'none' && 'Instant text change'}
                {transitionType === 'obfuscate' && 'Scramble with enchanting table characters, reveal left-to-right'}
                {transitionType === 'typewriter' && 'Type out one character at a time'}
                {transitionType === 'glitch' && 'Random glitch characters that settle into final text'}
                {transitionType === 'scramble' && 'Full scramble, then snap to final text'}
                {transitionType === 'wave' && 'Characters appear in a wave pattern'}
              </p>

              <div className={styles.row}>
                <div>
                  <label className={styles.label}>Transition (ms)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={transDuration}
                    onChange={(e) => setTransDuration(Number(e.target.value))}
                    min={100}
                    max={3000}
                    step={100}
                  />
                </div>
                <div>
                  <label className={styles.label}>Cycle (ms)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={cycleDuration}
                    onChange={(e) => setCycleDuration(Number(e.target.value))}
                    min={500}
                    max={10000}
                    step={500}
                  />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>🎨 Text Styling</h3>

              <div className={styles.form__group}>
                <label className={styles.label}>Font Family</label>
                <select
                  className={styles.select}
                  value={textStyles.fontFamily}
                  onChange={(e) => setTextStyles(prev => ({ ...prev, fontFamily: e.target.value }))}
                >
                  <option value="'Segoe UI', system-ui, sans-serif">Segoe UI</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Impact, sans-serif">Impact</option>
                </select>
              </div>

              <div className={styles.row}>
                <div className={styles.form__group}>
                  <label className={styles.label}>Size</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={textStyles.fontSize}
                    onChange={(e) => setTextStyles(prev => ({ ...prev, fontSize: e.target.value }))}
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Weight</label>
                  <select
                    className={styles.select}
                    value={textStyles.fontWeight}
                    onChange={(e) => setTextStyles(prev => ({ ...prev, fontWeight: e.target.value }))}
                  >
                    <option value="400">Normal</option>
                    <option value="600">Semi-Bold</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.form__group}>
                  <label className={styles.label}>Color</label>
                  <div className={styles.color__input}>
                    <input
                      type="color"
                      value={textStyles.color}
                      onChange={(e) => setTextStyles(prev => ({ ...prev, color: e.target.value }))}
                      className={styles.color__picker}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={textStyles.color}
                      onChange={(e) => setTextStyles(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Transform</label>
                  <select
                    className={styles.select}
                    value={textStyles.textTransform}
                    onChange={(e) => setTextStyles(prev => ({ ...prev, textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize' }))}
                  >
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>
              </div>

              <div className={styles.form__group}>
                <label className={styles.label}>Text Shadow</label>
                <input
                  type="text"
                  className={styles.input}
                  value={textStyles.shadow}
                  onChange={(e) => setTextStyles(prev => ({ ...prev, shadow: e.target.value }))}
                  placeholder="2px 2px 4px rgba(0,0,0,0.5)"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.form__group}>
                  <label className={styles.label}>Stroke Width</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={textStyles.strokeWidth}
                    onChange={(e) => setTextStyles(prev => ({ ...prev, strokeWidth: e.target.value }))}
                    placeholder="0, 1px, 2px"
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Stroke Color</label>
                  <div className={styles.color__input}>
                    <input
                      type="color"
                      value={textStyles.strokeColor}
                      onChange={(e) => setTextStyles(prev => ({ ...prev, strokeColor: e.target.value }))}
                      className={styles.color__picker}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={textStyles.strokeColor}
                      onChange={(e) => setTextStyles(prev => ({ ...prev, strokeColor: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.controls}>
              <button
                className={`${styles.btn} ${styles['btn--preview']}`}
                onClick={previewTransition}
                disabled={isRunning}
              >
                👁️ Preview
              </button>
              {!isRunning ? (
                <button
                  className={`${styles.btn} ${styles['btn--success']} ${styles['btn--lg']}`}
                  onClick={startCycling}
                >
                  ▶ Start Cycling
                </button>
              ) : (
                <button
                  className={`${styles.btn} ${styles['btn--danger']} ${styles['btn--lg']}`}
                  onClick={stopCycling}
                >
                  ■ Stop
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'swap' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>Source Swap Demo</h3>
              <p className={styles.info__text}>
                In the real control panel, this swaps positions of two OBS sources with smooth animations.
              </p>
              
              <div className={styles.swap__demo}>
                <div className={styles.swap__source} data-label="Source A">
                  🎮 Gameplay
                </div>
                <div className={styles.swap__arrow}>⟷</div>
                <div className={styles.swap__source} data-label="Source B">
                  📹 Camera
                </div>
              </div>

              <label className={styles.label}>Animation Style</label>
              <select className={styles.select}>
                <option>Slide (smooth move)</option>
                <option>Teleport (instant)</option>
                <option>Crossfade (opacity)</option>
                <option>Scale (shrink/grow)</option>
                <option>Bounce (overshoot)</option>
                <option>Elastic (springy)</option>
                <option>Arc (curved path)</option>
              </select>

              <button 
                className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--block']}`}
                onClick={() => addLog('Swap executed (demo)', 'success')}
              >
                🔄 Execute Swap
              </button>
            </div>
          </div>
        )}

        {activeTab === 'connection' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>🔌 OBS WebSocket Setup</h3>
              <p className={styles.info__text}>
                The real control panel connects to OBS Studio via WebSocket for live control.
              </p>
              
              <div className={styles.setup__steps}>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>1</span>
                  <span>In OBS: <strong>Tools → WebSocket Server Settings</strong></span>
                </div>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>2</span>
                  <span>Enable WebSocket server</span>
                </div>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>3</span>
                  <span>Note port (default: 4455) and password</span>
                </div>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>4</span>
                  <span>Connect from control panel</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>🔐 Security</h3>
              <p className={styles.info__text}>
                Passwords are encrypted with AES-256-GCM using a PIN you create. 
                The PIN is stored in session only - never saved to disk.
              </p>
              <div className={styles.security__features}>
                <div className={styles.security__feature}>
                  <span className={styles.security__icon}>✓</span>
                  <span>PIN-based encryption key derivation (PBKDF2)</span>
                </div>
                <div className={styles.security__feature}>
                  <span className={styles.security__icon}>✓</span>
                  <span>AES-256-GCM authenticated encryption</span>
                </div>
                <div className={styles.security__feature}>
                  <span className={styles.security__icon}>✓</span>
                  <span>PIN never stored - session memory only</span>
                </div>
              </div>
              <button
                className={`${styles.btn} ${styles['btn--danger']} ${styles['btn--sm']}`}
                onClick={() => addLog('Demo: Credentials cleared', 'info')}
                style={{ marginTop: '0.75rem' }}
              >
                Clear Saved Credentials
              </button>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>📊 Demo Status</h3>
              <div className={styles.connection__status}>
                <div className={styles.status__indicator}>
                  <span className={styles.connection__dot} />
                  <span>Demo Mode Active</span>
                </div>
                <p className={styles.info__text} style={{ margin: 0 }}>
                  This is an interactive demo. In the real control panel, you&apos;ll connect to OBS for live control.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
