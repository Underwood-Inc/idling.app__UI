'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ControlPanelMock.module.css';

// Types for swap and animation demos
type EasingType = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'bounce' | 'elastic';

interface SwapConfig {
  id: string;
  name: string;
  sourceA: string;
  sourceB: string;
}

interface SourceConfig {
  name: string;
  icon: string;
  type: string;
  visible: boolean;
  animation: string;
}

const DEFAULT_SWAP_CONFIGS: SwapConfig[] = [
  { id: '1', name: 'Camera ↔ Gameplay', sourceA: 'Camera', sourceB: 'Gameplay' },
  { id: '2', name: 'Overlay ↔ Alert', sourceA: 'Overlay', sourceB: 'Alert' },
];

const DEFAULT_SOURCES: SourceConfig[] = [
  { name: 'Gameplay', icon: '🎮', type: 'browser_source', visible: true, animation: 'fade' },
  { name: 'Camera', icon: '📷', type: 'ffmpeg_source', visible: true, animation: 'slide_left' },
  { name: 'Overlay', icon: '🎨', type: 'image_source', visible: false, animation: 'zoom' },
  { name: 'Alert', icon: '🔔', type: 'browser_source', visible: false, animation: 'pop' },
];

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'text' | 'clips' | 'swaps' | 'scripts' | 'install' | 'setup'>('sources');
  
  // Visibility Animation state (Sources tab)
  const [visAnimType, setVisAnimType] = useState('fade');
  const [visAnimDuration, setVisAnimDuration] = useState(300);
  const [visAnimEasing, setVisAnimEasing] = useState('ease');
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
  const [swapConfigs, setSwapConfigs] = useState<SwapConfig[]>(DEFAULT_SWAP_CONFIGS);
  const [selectedSwapConfig, setSelectedSwapConfig] = useState<string>('1');
  const [swapStyle, setSwapStyle] = useState<string>('slide');
  const [swapEasing, setSwapEasing] = useState<string>('ease');
  const [swapDuration, setSwapDuration] = useState(400);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapProgress, setSwapProgress] = useState(0);
  const [swapPositions, setSwapPositions] = useState({ aX: 30, aY: 25, bX: 220, bY: 25 });
  const [swapOpacity, setSwapOpacity] = useState({ a: 1, b: 1 });
  const [swapScale, setSwapScale] = useState({ a: 1, b: 1 });
  
  // New swap settings (matching control_panel.html)
  const [preserveAspect, setPreserveAspect] = useState(true);
  const [tempOverride, setTempOverride] = useState('off');
  const [debugLogging, setDebugLogging] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newSourceA, setNewSourceA] = useState('');
  const [newSourceB, setNewSourceB] = useState('');

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

  // Apply easing function to progress
  const applyEasing = useCallback((t: number, easing: string): number => {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - Math.pow(1 - t, 2);
      case 'back': {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      }
      case 'ease':
      default:
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
  }, []);

  // Execute animated source swap with different animation styles
  const executeSwap = useCallback(() => {
    if (isSwapping) return;
    
    const startPositions = { ...swapPositions };
    const targetPositions = {
      aX: startPositions.bX,
      aY: startPositions.bY,
      bX: startPositions.aX,
      bY: startPositions.aY,
    };
    
    // Teleport is instant - no animation
    if (swapStyle === 'teleport') {
      setSwapPositions(targetPositions);
      addLog('Teleport swap complete!', 'success');
      return;
    }
    
    setIsSwapping(true);
    setSwapProgress(0);
    addLog(`Swapping sources (${swapStyle}) with ${swapEasing} easing (${swapDuration}ms)`, 'info');
    
    const startTime = performance.now();
    const centerY = 25;
    const arcHeight = 30;
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const rawProgress = Math.min(elapsed / swapDuration, 1);
      
      // Apply selected easing function
      const progress = applyEasing(rawProgress, swapEasing);
      
      let newPositions = { aX: 0, aY: 0, bX: 0, bY: 0 };
      
      switch (swapStyle) {
        case 'slide':
          // Simple smooth slide
          newPositions = {
            aX: startPositions.aX + (targetPositions.aX - startPositions.aX) * progress,
            aY: startPositions.aY,
            bX: startPositions.bX + (targetPositions.bX - startPositions.bX) * progress,
            bY: startPositions.bY,
          };
          break;
          
        case 'scale':
          // Scale - shrink to 0.3 at midpoint, then grow back
          const scaleAmt = rawProgress < 0.5 
            ? 1 - (rawProgress * 2 * 0.7) // Shrink to 0.3
            : 0.3 + ((rawProgress - 0.5) * 2 * 0.7); // Grow back to 1
          setSwapScale({ a: scaleAmt, b: scaleAmt });
          // Position jumps at midpoint
          const posProgress = rawProgress < 0.5 ? 0 : 1;
          newPositions = {
            aX: startPositions.aX + (targetPositions.aX - startPositions.aX) * posProgress,
            aY: startPositions.aY,
            bX: startPositions.bX + (targetPositions.bX - startPositions.bX) * posProgress,
            bY: startPositions.bY,
          };
          break;
          
        case 'bounce': {
          // Bounce easing
          let bounceProgress = rawProgress;
          const n1 = 7.5625;
          const d1 = 2.75;
          if (rawProgress < 1 / d1) {
            bounceProgress = n1 * rawProgress * rawProgress;
          } else if (rawProgress < 2 / d1) {
            bounceProgress = n1 * (rawProgress - 1.5 / d1) * (rawProgress - 1.5 / d1) + 0.75;
          } else if (rawProgress < 2.5 / d1) {
            bounceProgress = n1 * (rawProgress - 2.25 / d1) * (rawProgress - 2.25 / d1) + 0.9375;
          } else {
            bounceProgress = n1 * (rawProgress - 2.625 / d1) * (rawProgress - 2.625 / d1) + 0.984375;
          }
          newPositions = {
            aX: startPositions.aX + (targetPositions.aX - startPositions.aX) * bounceProgress,
            aY: startPositions.aY,
            bX: startPositions.bX + (targetPositions.bX - startPositions.bX) * bounceProgress,
            bY: startPositions.bY,
          };
          break;
        }
          
        case 'elastic': {
          // Elastic/springy effect
          let elasticProgress = rawProgress;
          if (rawProgress !== 0 && rawProgress !== 1) {
            elasticProgress = Math.pow(2, -10 * rawProgress) * Math.sin((rawProgress * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
          }
          newPositions = {
            aX: startPositions.aX + (targetPositions.aX - startPositions.aX) * elasticProgress,
            aY: startPositions.aY,
            bX: startPositions.bX + (targetPositions.bX - startPositions.bX) * elasticProgress,
            bY: startPositions.bY,
          };
          break;
        }
          
        case 'arc': {
          // Arc - curved path, sources go up and down
          const arcAmt = Math.sin(rawProgress * Math.PI);
          newPositions = {
            aX: startPositions.aX + (targetPositions.aX - startPositions.aX) * progress,
            aY: centerY - arcHeight * arcAmt,
            bX: startPositions.bX + (targetPositions.bX - startPositions.bX) * progress,
            bY: centerY + arcHeight * arcAmt,
          };
          break;
        }
          
        default:
          newPositions = {
            aX: startPositions.aX + (targetPositions.aX - startPositions.aX) * progress,
            aY: startPositions.aY,
            bX: startPositions.bX + (targetPositions.bX - startPositions.bX) * progress,
            bY: startPositions.bY,
          };
      }
      
      setSwapProgress(rawProgress);
      setSwapPositions(newPositions);
      
      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSwapping(false);
        setSwapProgress(0);
        setSwapOpacity({ a: 1, b: 1 });
        setSwapScale({ a: 1, b: 1 });
        addLog('Swap complete!', 'success');
      }
    };
    
    requestAnimationFrame(animate);
  }, [isSwapping, swapPositions, swapDuration, swapStyle, swapEasing, applyEasing, addLog]);

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
          title="Dashboard"
        >
          🏠
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sources' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('sources')}
          title="Sources"
        >
          📦
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'text' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('text')}
          title="Text Cycler"
        >
          📝
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'clips' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('clips')}
          title="Clips Player"
        >
          🎬
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'swaps' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('swaps')}
          title="Swaps"
        >
          🔄
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scripts' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('scripts')}
          title="Script Manager"
        >
          📜
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'install' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('install')}
          title="Installer"
        >
          📥
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'setup' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('setup')}
          title="Setup"
        >
          ⚙️
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

        {activeTab === 'sources' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>Visibility Animation</h3>
              <div className={styles.form__group}>
              <label className={styles.label}>Animation Type</label>
                <select 
                  className={styles.select}
                  value={visAnimType}
                  onChange={(e) => setVisAnimType(e.target.value)}
                >
                  <option value="none">None (instant)</option>
                  <option value="fade">Fade</option>
                  <option value="slide_left">Slide Left</option>
                  <option value="slide_right">Slide Right</option>
                  <option value="slide_up">Slide Up</option>
                  <option value="slide_down">Slide Down</option>
                  <option value="zoom">Zoom</option>
                  <option value="pop">Pop (overshoot)</option>
              </select>
              </div>
              <div className={styles.row}>
                <div className={styles.form__group}>
              <label className={styles.label}>Duration (ms)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={visAnimDuration}
                    onChange={(e) => setVisAnimDuration(Number(e.target.value))}
                    min={50}
                    max={2000}
                    step={50}
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Easing</label>
                  <select 
                    className={styles.select}
                    value={visAnimEasing}
                    onChange={(e) => setVisAnimEasing(e.target.value)}
                  >
                    <option value="linear">Linear</option>
                    <option value="easeIn">Ease In</option>
                    <option value="easeOut">Ease Out</option>
                    <option value="ease">Ease In-Out</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Animation Preview Demo */}
            <div className={styles.card}>
              <h3 className={styles.card__title}>🎬 Animation Preview</h3>
              <p className={styles.info__text}>Hover over each card to see the animation effect</p>
              <div className={styles.anim__grid}>
                <div className={`${styles.anim__card} ${styles['anim__card--none']}`}>
                  <span className={styles.anim__icon}>⚡</span>
                  <span className={styles.anim__label}>None</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--fade']}`}>
                  <span className={styles.anim__icon}>🌫️</span>
                  <span className={styles.anim__label}>Fade</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--slideleft']}`}>
                  <span className={styles.anim__icon}>⬅️</span>
                  <span className={styles.anim__label}>Slide Left</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--slideright']}`}>
                  <span className={styles.anim__icon}>➡️</span>
                  <span className={styles.anim__label}>Slide Right</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--slideup']}`}>
                  <span className={styles.anim__icon}>⬆️</span>
                  <span className={styles.anim__label}>Slide Up</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--slidedown']}`}>
                  <span className={styles.anim__icon}>⬇️</span>
                  <span className={styles.anim__label}>Slide Down</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--zoom']}`}>
                  <span className={styles.anim__icon}>🔍</span>
                  <span className={styles.anim__label}>Zoom</span>
                </div>
                <div className={`${styles.anim__card} ${styles['anim__card--pop']}`}>
                  <span className={styles.anim__icon}>💥</span>
                  <span className={styles.anim__label}>Pop</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>Scene Sources</h3>
              <button className={`${styles.btn} ${styles['btn--block']}`} style={{ marginBottom: '0.75rem' }}>
                🔄 Refresh
                  </button>
              <div className={styles.source__list}>
                {sources.map(source => (
                  <div key={source.name} className={styles.source__item}>
                    <div className={styles.source__info}>
                      <div className={styles.source__name}>{source.name}</div>
                      <div className={styles.source__type}>{source.type}</div>
                    </div>
                    <div 
                      className={`${styles.toggle} ${source.visible ? styles['toggle--on'] : ''}`}
                      onClick={() => {
                        setSources(prev => prev.map(s => 
                          s.name === source.name ? { ...s, visible: !s.visible } : s
                        ));
                        addLog(`${source.visible ? 'Hiding' : 'Showing'} ${source.name} with ${visAnimType} animation`, 'info');
                      }}
                    />
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

        {activeTab === 'swaps' && (
          <div className={styles.page}>
            {/* Quick Swap + Animation Preview (Compact) */}
            <div className={styles.card}>
              <h3 className={styles.card__title}>Quick Swap</h3>
              <div className={styles.row}>
                <div className={styles.form__group}>
                  <label className={styles.label}>Source A</label>
                  <select className={styles.select} defaultValue="Gameplay">
                    <option value="Gameplay">🎮 Gameplay</option>
                    <option value="Camera">📷 Camera</option>
                    <option value="Chat">💬 Chat</option>
                    <option value="Alerts">🔔 Alerts</option>
                  </select>
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Source B</label>
                  <select className={styles.select} defaultValue="Camera">
                    <option value="Gameplay">🎮 Gameplay</option>
                    <option value="Camera">📷 Camera</option>
                    <option value="Chat">💬 Chat</option>
                    <option value="Alerts">🔔 Alerts</option>
                  </select>
                </div>
              </div>
              <button 
                className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--block']}`}
                onClick={executeSwap}
                disabled={isSwapping}
              >
                🔄 Swap Now
              </button>
              
              {/* Animated Canvas */}
              <div className={styles.swap__canvas}>
                <div 
                  className={styles.swap__source}
                  style={{
                    left: `${swapPositions.aX}px`,
                    top: `${swapPositions.aY}px`,
                    opacity: swapOpacity.a,
                    transform: `scale(${swapScale.a})`,
                  }}
                >
                  <span className={styles.swap__icon}>🎮</span>
                  <span className={styles.swap__label}>Gameplay</span>
                </div>
                <div 
                  className={`${styles.swap__source} ${styles['swap__source--alt']}`}
                  style={{
                    left: `${swapPositions.bX}px`,
                    top: `${swapPositions.bY}px`,
                    opacity: swapOpacity.b,
                    transform: `scale(${swapScale.b})`,
                  }}
                >
                  <span className={styles.swap__icon}>📷</span>
                  <span className={styles.swap__label}>Camera</span>
                </div>
                {isSwapping && (
                  <div className={styles.swap__progress}>
                    <div 
                      className={styles['swap__progress-bar']} 
                      style={{ width: `${swapProgress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Animation Settings (Compact) */}
            <div className={styles.card}>
              <h3 className={styles.card__title}>Animation</h3>
              <div className={styles.row}>
                <div className={styles.form__group}>
                  <label className={styles.label}>Style</label>
                  <select 
                    className={styles.select}
                    value={swapStyle}
                    onChange={(e) => setSwapStyle(e.target.value)}
                  >
                    <option value="slide">Slide</option>
                    <option value="teleport">Teleport</option>
                    <option value="scale">Scale</option>
                    <option value="bounce">Bounce</option>
                    <option value="elastic">Elastic</option>
                    <option value="arc">Arc</option>
                  </select>
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Duration</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={swapDuration}
                    onChange={(e) => setSwapDuration(Number(e.target.value))}
                    min={0}
                    max={3000}
                    step={50}
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Easing</label>
                  <select 
                    className={styles.select}
                    value={swapEasing}
                    onChange={(e) => setSwapEasing(e.target.value)}
                  >
                    <option value="linear">Linear</option>
                    <option value="easeIn">Ease In</option>
                    <option value="easeOut">Ease Out</option>
                    <option value="ease">Ease In-Out</option>
                    <option value="back">Back</option>
                  </select>
                </div>
              </div>
              
              {/* Checkboxes + Override in a compact row */}
              <div className={styles.swap__options}>
                <label className={styles.checkbox__label}>
                  <input 
                    type="checkbox" 
                    checked={preserveAspect} 
                    onChange={(e) => setPreserveAspect(e.target.checked)}
                  />
                  <span>Preserve Aspect</span>
                </label>
                <label className={styles.checkbox__label}>
                  <input 
                    type="checkbox" 
                    checked={debugLogging} 
                    onChange={(e) => setDebugLogging(e.target.checked)}
                  />
                  <span>Debug Log</span>
                </label>
                <select 
                  className={styles.select__inline}
                  value={tempOverride}
                  onChange={(e) => setTempOverride(e.target.value)}
                  title="Temporary Override"
                >
                  <option value="off">Override: Off</option>
                  <option value="preserve">Preserve</option>
                  <option value="stretch">Stretch</option>
                </select>
              </div>
            </div>

            {/* Add Config + Saved Configs (Merged) */}
            <div className={styles.card}>
              <h3 className={styles.card__title}>Swap Configs</h3>
              <div className={styles.row}>
                <div className={styles.form__group} style={{ flex: 2 }}>
                  <label className={styles.label}>Config Name</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    placeholder="e.g. Camera ↔ Gameplay"
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Source A</label>
                  <select 
                    className={styles.select}
                    value={newSourceA}
                    onChange={(e) => setNewSourceA(e.target.value)}
                  >
                    <option value="">--</option>
                    <option value="Gameplay">Gameplay</option>
                    <option value="Camera">Camera</option>
                    <option value="Chat">Chat</option>
                    <option value="Alerts">Alerts</option>
                  </select>
                </div>
                <div className={styles.form__group}>
                  <label className={styles.label}>Source B</label>
                  <select 
                    className={styles.select}
                    value={newSourceB}
                    onChange={(e) => setNewSourceB(e.target.value)}
                  >
                    <option value="">--</option>
                    <option value="Gameplay">Gameplay</option>
                    <option value="Camera">Camera</option>
                    <option value="Chat">Chat</option>
                    <option value="Alerts">Alerts</option>
                  </select>
                </div>
              </div>
              <button 
                className={`${styles.btn} ${styles['btn--primary']}`}
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  if (!newConfigName || !newSourceA || !newSourceB) {
                    addLog('Fill in all fields', 'error');
                    return;
                  }
                  if (newSourceA === newSourceB) {
                    addLog('Select different sources', 'error');
                    return;
                  }
                  const newId = String(Date.now());
                  setSwapConfigs(prev => [...prev, { id: newId, name: newConfigName, sourceA: newSourceA, sourceB: newSourceB }]);
                  setNewConfigName('');
                  setNewSourceA('');
                  setNewSourceB('');
                  addLog(`Added config: ${newConfigName}`, 'success');
                }}
              >
                ➕ Add Config
              </button>
              
              {/* Saved configs list */}
              <div className={styles.configs__list}>
                {swapConfigs.map(config => (
                  <div key={config.id} className={styles.config__item}>
                    <span className={styles.config__name}>{config.name}</span>
                    <div className={styles.config__actions}>
                      <button 
                        className={styles.config__btn}
                        onClick={() => {
                          addLog(`Loading: ${config.name}`, 'info');
                          executeSwap();
                        }}
                        title="Execute"
                      >
                        ▶️
                      </button>
                      <button 
                        className={styles.config__btn}
                        onClick={() => {
                          setSwapConfigs(prev => prev.filter(c => c.id !== config.id));
                          addLog(`Deleted: ${config.name}`, 'info');
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.row} style={{ marginTop: '0.5rem' }}>
                <button className={styles.btn}>🔄 Refresh</button>
                <button className={styles.btn}>📤 Export</button>
                <button className={styles.btn}>📥 Import</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clips' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>🎬 Twitch Clips Player</h3>
              <p className={styles.info__text}>
                Automatically plays random Twitch clips from your channel during breaks.
              </p>
              <div className={styles.form__group}>
                <label className={styles.label}>Channel Name</label>
                <input type="text" className={styles.input} placeholder="your_channel" />
              </div>
              <div className={styles.form__group}>
                <label className={styles.label}>Clips Source</label>
                <select className={styles.select}>
                  <option value="own">Own Channel Clips</option>
                  <option value="game">Game Category</option>
                  <option value="followed">Followed Channels</option>
                </select>
              </div>
              <div className={styles.row}>
                <button className={`${styles.btn} ${styles['btn--primary']}`}>▶️ Play Clip</button>
                <button className={styles.btn}>⏭️ Next</button>
                <button className={styles.btn}>⏹️ Stop</button>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.card__title}>Settings</h3>
              <div className={styles.form__group}>
                <label className={styles.label}>Theme</label>
                <select className={styles.select}>
                  <option value="0">None</option>
                  <option value="1">Slide in fancy skewed</option>
                  <option value="2">Slide in basic</option>
                  <option value="3">Outside the box</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>📜 OBS Animation Suite Scripts</h3>
              <p className={styles.info__text}>
                Lua scripts that run inside OBS Studio. Install via the Installer tab.
              </p>
              <div className={styles.source__list}>
                <div className={styles.source__item}>
                  <div className={styles.source__info}>
                    <div className={styles.source__name}>source_animations.lua</div>
                    <div className={styles.source__type}>Visibility & position animations</div>
                  </div>
                  <span style={{ color: 'var(--brand-success)' }}>✓ Loaded</span>
                </div>
                <div className={styles.source__item}>
                  <div className={styles.source__info}>
                    <div className={styles.source__name}>source_swapper.lua</div>
                    <div className={styles.source__type}>Source position swapping</div>
                  </div>
                  <span style={{ color: 'var(--brand-success)' }}>✓ Loaded</span>
                </div>
                <div className={styles.source__item}>
                  <div className={styles.source__info}>
                    <div className={styles.source__name}>text_cycler.lua</div>
                    <div className={styles.source__type}>Text cycling with animations</div>
                  </div>
                  <span style={{ color: 'var(--brand-success)' }}>✓ Loaded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'install' && (
          <div className={styles.page}>
            <div className={styles.card}>
              <h3 className={styles.card__title}>📥 Installation Wizard</h3>
              <p className={styles.info__text}>
                Install the OBS Animation Suite scripts to your OBS Studio installation.
              </p>
              <div className={styles.setup__steps}>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>1</span>
                  <span>Download or copy script files</span>
                </div>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>2</span>
                  <span>In OBS: <strong>Tools → Scripts</strong></span>
                </div>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>3</span>
                  <span>Click <strong>+</strong> and add each .lua file</span>
                </div>
                <div className={styles.setup__step}>
                  <span className={styles.step__number}>4</span>
                  <span>Add control_panel.html as a Custom Browser Dock</span>
                </div>
              </div>
              <div className={styles.row} style={{ marginTop: '0.75rem' }}>
                <button className={`${styles.btn} ${styles['btn--primary']}`}>📋 Copy Script</button>
                <button className={styles.btn}>💾 Download</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'setup' && (
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
