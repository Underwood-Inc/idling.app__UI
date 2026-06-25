import { detectWebglVisualizerCapability } from './detectWebglVisualizerCapability';
import {
  createWebglAudioReactiveState,
  tickWebglAudioReactive,
} from './webglAudioReactiveState';
import {
  AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
  createAudioStreamTempoState,
  tickAudioStreamTempo,
} from '../audioStreamTempo';
import { clearTransparentWebglFrame, releaseWebglContextState } from './webglGlUtils';
import {
  getWebglVisualizerPresetDefinition,
  normalizeWebglVisualizerPresetId,
  WEBGL_DEFAULT_PRESET_ID,
} from './webglVisualizerPresets';
import {
  NEON_CONSTELLATION_DEFAULT_MOTION_MODE,
  normalizeNeonConstellationMotionMode,
} from './neonConstellationMotion';
import type {
  CreateWebglVisualizerEngineOptions,
  WebglDrawFrameInput,
  WebglVisualizerEngine,
  WebglVisualizerRenderer,
  WebglVisualizerThemeUniforms,
} from './webglVisualizer.types';

function destroyRenderer(gl: WebGL2RenderingContext, renderer: WebglVisualizerRenderer): void {
  try {
    renderer.destroy();
  } catch {
    // A partially torn-down renderer should not block the next preset.
  }
  gl.finish();
  releaseWebglContextState(gl);
}

function createRendererForPreset(
  gl: WebGL2RenderingContext,
  nextPresetId: string
): { presetId: string; renderer: WebglVisualizerRenderer } {
  const normalized = normalizeWebglVisualizerPresetId(nextPresetId);

  try {
    return {
      presetId: normalized,
      renderer: getWebglVisualizerPresetDefinition(normalized).createRenderer(gl),
    };
  } catch {
    return {
      presetId: WEBGL_DEFAULT_PRESET_ID,
      renderer: getWebglVisualizerPresetDefinition(WEBGL_DEFAULT_PRESET_ID).createRenderer(gl),
    };
  }
}

export function createWebglVisualizerEngine(
  canvas: HTMLCanvasElement,
  options: CreateWebglVisualizerEngineOptions
): WebglVisualizerEngine {
  const capability = detectWebglVisualizerCapability();
  if (!capability.isSupported) {
    throw new Error(capability.reason ?? 'WebGL2 is not available');
  }

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    throw new Error('WebGL2 context could not be created');
  }

  const theme: WebglVisualizerThemeUniforms = options.theme;
  const onFatalError = options.onFatalError;
  const initialPresetId = normalizeWebglVisualizerPresetId(
    options.initialPresetId ?? WEBGL_DEFAULT_PRESET_ID
  );
  let initial = createRendererForPreset(gl, initialPresetId);
  let presetId = initial.presetId;
  let renderer: WebglVisualizerRenderer = initial.renderer;
  let pendingPresetId: string | null = null;

  let analyser: AnalyserNode | null = null;
  let frequencyBuffer = new Uint8Array(0);
  let waveformBuffer = new Uint8Array(0);
  let reactiveState = createWebglAudioReactiveState();
  let tempoState = createAudioStreamTempoState();
  let tempoUniforms = AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS;
  let lastFrameTimestamp = 0;
  let rafId = 0;
  let running = false;
  let layoutWidth = 1;
  let layoutHeight = 1;
  let pixelWidth = 1;
  let pixelHeight = 1;
  let startTime = performance.now();
  const reducedMotion = options.reducedMotion === true;
  let constellationMotion = normalizeNeonConstellationMotionMode(
    options.constellationMotion ?? NEON_CONSTELLATION_DEFAULT_MOTION_MODE
  );

  const onContextLost = (event: Event) => {
    event.preventDefault();
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    onFatalError?.('WebGL context was lost. Leave and re-open fullscreen to restore visuals.');
  };

  canvas.addEventListener('webglcontextlost', onContextLost);

  const resolvePixelSize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    pixelWidth = Math.max(1, Math.floor(layoutWidth * dpr));
    pixelHeight = Math.max(1, Math.floor(layoutHeight * dpr));
    return { pixelWidth, pixelHeight };
  };

  const applyPendingPreset = () => {
    if (!pendingPresetId || pendingPresetId === presetId) {
      pendingPresetId = null;
      return;
    }

    destroyRenderer(gl, renderer);
    const next = createRendererForPreset(gl, pendingPresetId);
    presetId = next.presetId;
    renderer = next.renderer;
    pendingPresetId = null;
    renderer.resize(pixelWidth, pixelHeight);
  };

  const releaseFrameState = () => {
    renderer.reset?.();
    releaseWebglContextState(gl);
  };

  const drawFrame = (timestamp: number) => {
    if (!running || !analyser) {
      return;
    }

    if (document.visibilityState !== 'visible') {
      rafId = requestAnimationFrame(drawFrame);
      return;
    }

    applyPendingPreset();

    analyser.getByteFrequencyData(frequencyBuffer);
    analyser.getByteTimeDomainData(waveformBuffer);

    const reactive = tickWebglAudioReactive({
      frequencyData: frequencyBuffer,
      state: reactiveState,
    });
    reactiveState = reactive.state;

    const deltaSeconds =
      lastFrameTimestamp > 0 ? Math.min(0.05, (timestamp - lastFrameTimestamp) / 1000) : 0;
    lastFrameTimestamp = timestamp;
    const tempoTick = tickAudioStreamTempo({
      frequencyData: frequencyBuffer,
      timestampMs: timestamp,
      state: tempoState,
      deltaSeconds,
    });
    tempoState = tempoTick.state;
    tempoUniforms = tempoTick.uniforms;

    const nextPixelSize = resolvePixelSize();
    if (canvas.width !== nextPixelSize.pixelWidth || canvas.height !== nextPixelSize.pixelHeight) {
      canvas.width = nextPixelSize.pixelWidth;
      canvas.height = nextPixelSize.pixelHeight;
      gl.viewport(0, 0, nextPixelSize.pixelWidth, nextPixelSize.pixelHeight);
      renderer.resize(nextPixelSize.pixelWidth, nextPixelSize.pixelHeight);
    }

    const frame: WebglDrawFrameInput = {
      frequencyData: frequencyBuffer,
      waveformData: waveformBuffer,
      reactive: reactive.uniforms,
      theme,
      time: reducedMotion ? 0 : (timestamp - startTime) * 0.001,
      width: pixelWidth,
      height: pixelHeight,
      reducedMotion,
      tempo: tempoUniforms,
      deltaSeconds: deltaSeconds || 1 / 60,
      constellationMotion,
    };

    try {
      clearTransparentWebglFrame(gl);
      renderer.draw(frame);
    } catch {
      destroyRenderer(gl, renderer);
      const fallback = createRendererForPreset(gl, WEBGL_DEFAULT_PRESET_ID);
      presetId = fallback.presetId;
      renderer = fallback.renderer;
      pendingPresetId = null;
      renderer.resize(pixelWidth, pixelHeight);
      try {
        renderer.draw(frame);
      } catch {
        running = false;
        onFatalError?.('WebGL visualizer stopped after a draw failure.');
        return;
      }
    }

    rafId = requestAnimationFrame(drawFrame);
  };

  return {
    setPreset(nextPresetId: string) {
      const normalized = normalizeWebglVisualizerPresetId(nextPresetId);
      if (normalized === presetId) {
        pendingPresetId = null;
        return;
      }
      pendingPresetId = normalized;
      if (!running) {
        applyPendingPreset();
      }
    },

    setConstellationMotion(mode) {
      constellationMotion = normalizeNeonConstellationMotionMode(mode);
    },

    resize(width: number, height: number) {
      layoutWidth = Math.max(1, width);
      layoutHeight = Math.max(1, height);
    },

    start(nextAnalyser: AnalyserNode) {
      analyser = nextAnalyser;
      frequencyBuffer = new Uint8Array(nextAnalyser.frequencyBinCount);
      waveformBuffer = new Uint8Array(nextAnalyser.fftSize);
      reactiveState = createWebglAudioReactiveState();
      tempoState = createAudioStreamTempoState();
      tempoUniforms = AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS;
      lastFrameTimestamp = 0;
      startTime = performance.now();

      if (running) {
        return;
      }

      running = true;
      rafId = requestAnimationFrame(drawFrame);
    },

    stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      releaseFrameState();
    },

    destroy() {
      this.stop();
      pendingPresetId = null;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      destroyRenderer(gl, renderer);
      analyser = null;
      frequencyBuffer = new Uint8Array(0);
      waveformBuffer = new Uint8Array(0);
    },
  };
}
