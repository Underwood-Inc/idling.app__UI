import { createSpectrumNormalizer } from '../../spectrumNormalization';
import { compileShaderProgram, mixRgb } from '../webglGlUtils';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

export const STARRY_HORIZON_BAR_COUNT = 64;
export const STARRY_HORIZON_Y = 0.34;
export const STARRY_HORIZON_MAX_BAR_HEIGHT = 0.3;

export const STARRY_HORIZON_GOLD: [number, number, number] = [0.94, 0.76, 0.32];
export const STARRY_HORIZON_TEAL: [number, number, number] = [0.14, 0.84, 0.9];

export type StarryHorizonBarTone = 'warm' | 'cool' | 'pink';

export interface StarryHorizonStarToneColors {
  core: [number, number, number];
  glow: [number, number, number];
  flare: [number, number, number];
}

export const STARRY_HORIZON_STAR_TONES: Record<StarryHorizonBarTone, StarryHorizonStarToneColors> = {
  warm: {
    core: [1, 0.973, 0.882],
    glow: [0.984, 0.949, 0.769],
    flare: [0.929, 0.682, 0.286],
  },
  cool: {
    core: [0.863, 0.941, 1],
    glow: [0.549, 0.784, 1],
    flare: [0.392, 0.706, 1],
  },
  pink: {
    core: [1, 0.863, 0.941],
    glow: [1, 0.62, 0.824],
    flare: [1, 0.471, 0.745],
  },
};

export interface StarryHorizonBarColorInput {
  barIndex: number;
  level: number;
}

function fractStarryHorizon(value: number): number {
  return value - Math.floor(value);
}

function smoothstepStarryHorizon(edge0: number, edge1: number, value: number): number {
  const span = edge1 - edge0;
  if (span <= 0) {
    return value >= edge1 ? 1 : 0;
  }
  const t = Math.max(0, Math.min(1, (value - edge0) / span));
  return t * t * (3 - 2 * t);
}

export function resolveStarryHorizonBarTone(barIndex: number): StarryHorizonBarTone {
  const roll = fractStarryHorizon((barIndex * 0.137 + 3.1) * 17.31);
  if (roll < 0.55) {
    return 'warm';
  }
  if (roll < 0.82) {
    return 'cool';
  }
  return 'pink';
}

/**
 * EQ bar color from ambient star tones — ramps core → glow → flare as level nears peak.
 */
export function resolveStarryHorizonBarColor({
  barIndex,
  level,
}: StarryHorizonBarColorInput): [number, number, number] {
  const tone = STARRY_HORIZON_STAR_TONES[resolveStarryHorizonBarTone(barIndex)];
  const peak = Math.max(0, Math.min(1, level));
  const nearPeak = smoothstepStarryHorizon(0.45, 0.92, peak);
  const body = smoothstepStarryHorizon(0, 0.35, peak);
  const dimCore: [number, number, number] = [
    tone.core[0] * 0.32,
    tone.core[1] * 0.32,
    tone.core[2] * 0.32,
  ];

  let color = mixRgb(dimCore, tone.glow, body);
  color = mixRgb(color, tone.flare, nearPeak);
  const brightness = 0.5 + peak * 0.62;

  return [color[0] * brightness, color[1] * brightness, color[2] * brightness];
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export function buildStarryHorizonFragmentShader(barCount: number): string {
  return `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_horizon;
uniform float u_maxBarHeight;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform float u_energy;
uniform float u_beat;
uniform float u_motion;
uniform float u_barOpacity;
uniform float u_barLevel[${barCount}];

bool resolveBarCell(float normalizedX, out int barIndex, out float barFrac) {
  float barCoord = normalizedX * float(${barCount});
  barIndex = int(floor(barCoord));
  barFrac = fract(barCoord);
  return barIndex >= 0 && barIndex < ${barCount};
}

float resolveBarHeight(int barIndex) {
  return u_barLevel[barIndex] * u_maxBarHeight;
}

vec3 sampleNightSky(vec2 uv, float horizonY) {
  float height = clamp((uv.y - horizonY) / max(1.0 - horizonY, 0.001), 0.0, 1.0);
  vec3 horizonTint = vec3(0.03, 0.04, 0.07);
  vec3 zenith = vec3(0.01, 0.015, 0.035);
  vec3 sky = mix(horizonTint, zenith, pow(height, 0.75));

  vec2 nebulaA = (uv - vec2(0.22, 0.78)) * vec2(1.4, 1.0);
  vec2 nebulaB = (uv - vec2(0.82, 0.72)) * vec2(1.1, 1.1);
  float nebula =
    exp(-dot(nebulaA, nebulaA) * 5.5) * 0.07 +
    exp(-dot(nebulaB, nebulaB) * 6.5) * 0.05;
  sky += mix(u_primary, u_secondary, 0.45) * nebula;

  return sky * 0.62;
}

void ambientStarTones(float seed, out vec3 core, out vec3 glow, out vec3 flare) {
  float roll = fract(seed * 17.31);
  if (roll < 0.55) {
    core = vec3(1.0, 0.973, 0.882);
    glow = vec3(0.984, 0.949, 0.769);
    flare = vec3(0.929, 0.682, 0.286);
    return;
  }
  if (roll < 0.82) {
    core = vec3(0.863, 0.941, 1.0);
    glow = vec3(0.549, 0.784, 1.0);
    flare = vec3(0.392, 0.706, 1.0);
    return;
  }
  core = vec3(1.0, 0.863, 0.941);
  glow = vec3(1.0, 0.620, 0.824);
  flare = vec3(1.0, 0.471, 0.745);
}

vec3 resolveBarColor(int barIndex, float level) {
  float seed = float(barIndex) * 0.137 + 3.1;
  vec3 core;
  vec3 glow;
  vec3 flare;
  ambientStarTones(seed, core, glow, flare);

  float peak = clamp(level, 0.0, 1.0);
  float nearPeak = smoothstep(0.45, 0.92, peak);
  float body = smoothstep(0.0, 0.35, peak);
  vec3 color = mix(core * 0.32, glow, body);
  color = mix(color, flare, nearPeak);
  return color * (0.5 + peak * 0.62);
}

vec3 starHorizonGlow(float beat) {
  return mix(vec3(0.984, 0.949, 0.769), vec3(0.549, 0.784, 1.0), 0.42 + beat * 0.25);
}

vec3 sampleEqBars(vec2 uv, float horizonY, bool growUpward) {
  int barIndex;
  float barFrac;
  if (!resolveBarCell(uv.x, barIndex, barFrac)) {
    return vec3(0.0);
  }

  float barWidth = 0.82;
  float inset = (1.0 - barWidth) * 0.5;
  if (barFrac < inset || barFrac > 1.0 - inset) {
    return vec3(0.0);
  }

  float barHeight = resolveBarHeight(barIndex);
  float distFromHorizon = growUpward ? (uv.y - horizonY) : (horizonY - uv.y);
  if (distFromHorizon < 0.0 || distFromHorizon > barHeight) {
    return vec3(0.0);
  }

  float level = u_barLevel[barIndex];
  vec3 color = resolveBarColor(barIndex, level);
  float body = growUpward
    ? 0.7 + (distFromHorizon / max(barHeight, 0.001)) * 0.3
    : 0.55 + (1.0 - distFromHorizon / max(barHeight, 0.001)) * 0.25;
  color *= body;

  float edge = smoothstep(inset, inset + 0.05, barFrac) *
    smoothstep(1.0 - inset, 1.0 - inset - 0.05, barFrac);
  return color * edge;
}

vec3 sampleSkyScene(vec2 uv, float horizonY, float time) {
  vec3 color = sampleNightSky(uv, horizonY);
  color += sampleEqBars(uv, horizonY, true) * u_barOpacity;

  float horizonLine = exp(-abs(uv.y - horizonY) * 180.0);
  color += starHorizonGlow(u_beat) * horizonLine * (0.22 + u_beat * 0.22) * u_barOpacity;

  return color;
}

float skySceneAlpha(vec2 uv, float horizonY) {
  vec3 bars = sampleEqBars(uv, horizonY, true) * u_barOpacity;
  float barStrength = clamp(length(bars) * 2.6, 0.0, 1.0);
  return mix(0.4, 1.0, barStrength);
}

float waveHeight(vec2 uv, float time) {
  float x = uv.x * 6.28318;
  float motion = u_motion;
  return (
    sin(x * 16.0 + time * 1.15 * motion) * 0.0032 +
    sin(x * 38.0 - time * 0.82 * motion) * 0.0021 +
    sin(x * 6.5 + time * 1.65 * motion) * 0.0016 * (0.4 + u_bass) +
    sin(x * 72.0 + time * 2.1) * 0.0008
  );
}

vec2 waterSurfaceDistort(vec2 uv, float time, float strength) {
  float eps = 0.0018;
  float h = waveHeight(uv, time);
  float hx = waveHeight(uv + vec2(eps, 0.0), time);
  float hy = waveHeight(uv + vec2(0.0, eps), time);
  return vec2((hx - h) * 1.8 * strength, (hy - h) * 0.35 * strength);
}

vec3 sampleReflectedSky(vec2 uv, float horizonY, float time, float depth, vec2 ripple) {
  float mirrorY = horizonY + (horizonY - uv.y);
  vec2 reflectUv = vec2(uv.x + ripple.x, mirrorY + ripple.y * 0.4);

  vec3 color = sampleNightSky(reflectUv, horizonY);
  color += sampleEqBars(vec2(reflectUv.x, uv.y), horizonY, false) * (0.92 - depth * 0.15) * u_barOpacity;

  float stretch = 1.0 + depth * 0.12;
  return color * stretch;
}

vec3 sampleWater(vec2 uv, float horizonY, float time) {
  float depth = clamp((horizonY - uv.y) / max(horizonY, 0.001), 0.0, 1.0);
  float surfaceProx = pow(1.0 - depth, 2.2);

  vec3 shallow = vec3(0.014, 0.024, 0.042);
  vec3 deep = vec3(0.004, 0.009, 0.02);
  vec3 waterBody = mix(shallow, deep, pow(depth, 1.05));

  vec3 reflection = vec3(0.0);
  float weightSum = 0.0;
  float blur = mix(0.0012, 0.009, depth);

  for (int row = -1; row <= 1; row += 1) {
    for (int col = -3; col <= 3; col += 1) {
      float fi = float(col);
      float fj = float(row);
      float w = (1.0 - abs(fi) * 0.12) * (1.0 - abs(fj) * 0.18);
      vec2 ripple = waterSurfaceDistort(uv, time, 0.65 + surfaceProx * 0.55);
      vec2 tap = uv + ripple + vec2(fi * blur, fj * blur * 2.8);
      reflection += sampleReflectedSky(tap, horizonY, time, depth, ripple) * w;
      weightSum += w;
    }
  }
  reflection /= max(weightSum, 0.001);

  float horizonBand = exp(-abs(uv.y - horizonY) * 95.0);
  reflection += starHorizonGlow(u_beat) * horizonBand * (0.28 + u_beat * 0.18 + u_energy * 0.06) * u_barOpacity;

  float fresnel = pow(surfaceProx, 2.4);
  float reflectivity = mix(0.5, 0.86, fresnel);
  vec3 color = mix(waterBody, reflection, reflectivity);

  float x = uv.x * 6.28318;
  float gleamWave = sin(x * 48.0 - time * 2.4) * sin(x * 19.0 + time * 1.1);
  float horizonGleam = horizonBand * horizonBand * max(0.0, gleamWave) * 0.14 * surfaceProx;
  color += mix(vec3(0.85, 0.92, 1.0), starHorizonGlow(u_beat), 0.35) * horizonGleam;

  float eps = 0.0016;
  float h0 = waveHeight(vec2(uv.x, horizonY), time);
  float hx = waveHeight(vec2(uv.x + eps, horizonY), time);
  vec3 normal = normalize(vec3(h0 - hx, eps * 3.5, 1.0));
  vec3 lightDir = normalize(vec3(0.15, 1.0, 0.35));
  float spec = pow(max(0.0, dot(normal, lightDir)), mix(48.0, 120.0, surfaceProx));
  color += vec3(0.75, 0.88, 1.0) * spec * 0.11 * surfaceProx * (0.5 + u_energy * 0.5);

  float caustic = pow(
    max(0.0, sin(uv.x * 120.0 + time * 2.8 + depth * 8.0) * sin(uv.y * 280.0 - time * 2.2)),
    6.0
  );
  color += vec3(0.08, 0.16, 0.22) * caustic * surfaceProx * 0.35;

  color = mix(color, waterBody, pow(depth, 1.6) * 0.42);
  color *= exp(-depth * 0.55);
  return color;
}

void main() {
  vec2 uv = v_uv;
  float horizonY = u_horizon;
  vec3 color;
  float alpha = 1.0;

  if (uv.y >= horizonY) {
    color = sampleSkyScene(uv, horizonY, u_time);
    alpha = skySceneAlpha(uv, horizonY);
  } else {
    color = sampleWater(uv, horizonY, u_time);
  }

  float vignette = 1.0 - dot((uv - 0.5) * vec2(0.75, 0.95), (uv - 0.5) * vec2(0.75, 0.95)) * 0.28;
  color *= clamp(vignette, 0.62, 1.0);

  outColor = vec4(color, alpha);
}
`;
}

const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

export function createStarryHorizonRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const program = compileShaderProgram(
    gl,
    VERTEX_SHADER,
    buildStarryHorizonFragmentShader(STARRY_HORIZON_BAR_COUNT)
  );
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
  const timeLoc = gl.getUniformLocation(program, 'u_time');
  const horizonLoc = gl.getUniformLocation(program, 'u_horizon');
  const maxBarHeightLoc = gl.getUniformLocation(program, 'u_maxBarHeight');
  const primaryLoc = gl.getUniformLocation(program, 'u_primary');
  const secondaryLoc = gl.getUniformLocation(program, 'u_secondary');
  const bassLoc = gl.getUniformLocation(program, 'u_bass');
  const midLoc = gl.getUniformLocation(program, 'u_mid');
  const trebleLoc = gl.getUniformLocation(program, 'u_treble');
  const energyLoc = gl.getUniformLocation(program, 'u_energy');
  const beatLoc = gl.getUniformLocation(program, 'u_beat');
  const motionLoc = gl.getUniformLocation(program, 'u_motion');
  const barOpacityLoc = gl.getUniformLocation(program, 'u_barOpacity');
  const barLevelLoc = gl.getUniformLocation(program, 'u_barLevel');

  const spectrumNormalizer = createSpectrumNormalizer(STARRY_HORIZON_BAR_COUNT, {
    mode: 'frame-peak',
    peakDecay: 0.988,
  });

  let pixelWidth = 1;
  let pixelHeight = 1;

  return {
    resize(width, height) {
      pixelWidth = Math.max(1, width);
      pixelHeight = Math.max(1, height);
    },

    draw(frame: WebglDrawFrameInput) {
      const levels = spectrumNormalizer.normalize(
        frame.frequencyData,
        frame.deltaSeconds
      );

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLoc, pixelWidth, pixelHeight);
      gl.uniform1f(timeLoc, frame.time);
      gl.uniform1f(horizonLoc, STARRY_HORIZON_Y);
      gl.uniform1f(maxBarHeightLoc, STARRY_HORIZON_MAX_BAR_HEIGHT);
      gl.uniform3f(primaryLoc, frame.theme.primary[0], frame.theme.primary[1], frame.theme.primary[2]);
      gl.uniform3f(
        secondaryLoc,
        frame.theme.secondary[0],
        frame.theme.secondary[1],
        frame.theme.secondary[2]
      );
      gl.uniform1f(bassLoc, frame.reactive.bass);
      gl.uniform1f(midLoc, frame.reactive.mid);
      gl.uniform1f(trebleLoc, frame.reactive.treble);
      gl.uniform1f(energyLoc, frame.reactive.energy);
      gl.uniform1f(beatLoc, frame.reactive.beat);
      gl.uniform1f(motionLoc, frame.reducedMotion ? 0.3 : 1);
      gl.uniform1f(barOpacityLoc, frame.barOpacity);
      if (barLevelLoc) {
        gl.uniform1fv(barLevelLoc, levels);
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    reset() {
      spectrumNormalizer.reset();
    },

    destroy() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
  };
}
