import {
  compileShaderProgram,
  hashUnit,
  mixRgb,
  multiplyMatricesInto,
  sampleFrequencyAt,
  tintFromTheme,
  writePerspectiveMatrix,
  writeTranslationMatrix,
} from '../webglGlUtils';
import { resolveAudioStreamTempoMotionRate } from '../../audioStreamTempo';
import { wrapTrackDepth } from '../netrunnerTrackDepth';
import { createReusableFloat32Buffer, createScratchNumberBuffer } from '../webglReusableBuffers';
import type { ScratchNumberBuffer } from '../webglReusableBuffers';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

const VERTEX_SHADER = `#version 300 es
precision highp float;
uniform mat4 u_matrix;
in vec3 a_position;
void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
}
`;

const SOLID_FRAGMENT = `#version 300 es
precision highp float;
uniform vec3 u_color;
uniform float u_alpha;
out vec4 outColor;
void main() {
  outColor = vec4(u_color, u_alpha);
}
`;

const LINE_FRAGMENT = `#version 300 es
precision highp float;
uniform vec3 u_color;
uniform float u_alpha;
out vec4 outColor;
void main() {
  outColor = vec4(u_color, u_alpha);
}
`;

const BUILDING_SLOTS = 24;
const AVENUE_HALF_WIDTH = 2.55;
const BUILDING_ROW_DEPTHS = [0.72, 1.88, 3.15, 4.6, 6.05, 7.5];
const BUILDING_ROW_COUNT = BUILDING_ROW_DEPTHS.length;
const BAND_COUNT = BUILDING_SLOTS * BUILDING_ROW_COUNT;
const GRID_SPAN_X = 9;
const GRID_SPAN_Z = 30;
const GRID_FLOOR_NEAR_Z = GRID_SPAN_Z * 0.78;
const GRID_FLOOR_STEP = 0.36;
const GRID_FLOOR_DEPTH_SPAN = GRID_FLOOR_NEAR_Z + GRID_SPAN_Z;
const BUILDING_ENTER_FADE_RATIO = 0.24;
const FLOOR_PLANE_Y = 0;
const FLOOR_LINE_Y = 0.014;
const HORIZON_SUN_Z = -GRID_SPAN_Z + 1.4;
const HORIZON_SUN_CENTER_Y = FLOOR_LINE_Y;
const HORIZON_SUN_RADIUS_X = AVENUE_HALF_WIDTH * 1.55;
const HORIZON_SUN_RADIUS_Y = 2.35;
const HORIZON_SUN_SEGMENTS = 32;

const SUN_VERTEX_SHADER = `#version 300 es
precision highp float;
uniform mat4 u_matrix;
in vec3 a_position;
in vec2 a_local;
out vec2 v_local;
void main() {
  v_local = a_local;
  gl_Position = u_matrix * vec4(a_position, 1.0);
}
`;

const SUN_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec3 u_coreColor;
uniform vec3 u_midColor;
uniform vec3 u_outerColor;
uniform float u_alpha;
in vec2 v_local;
out vec4 outColor;
void main() {
  if (v_local.y < -0.01) {
    discard;
  }

  float height = smoothstep(0.0, 1.0, v_local.y);
  float edge = abs(v_local.x);
  vec3 color = mix(u_outerColor, u_midColor, smoothstep(0.0, 0.82, height));
  color = mix(color, u_coreColor, smoothstep(0.3, 1.0, height) * (1.0 - edge * 0.28));
  float horizonFade = smoothstep(0.0, 0.06, v_local.y);
  float edgeFade = 1.0 - smoothstep(0.78, 1.0, edge);
  float alpha = u_alpha * horizonFade * edgeFade * (0.38 + height * 0.62);
  outColor = vec4(color, alpha);
}
`;

interface NetrunnerSunPalette {
  core: [number, number, number];
  mid: [number, number, number];
  outer: [number, number, number];
  haze: [number, number, number];
}

interface NetrunnerSunDrawPass {
  radiusScale: number;
  alpha: number;
  additive: boolean;
  colorRole: 'core' | 'haze';
}

export function resolveNetrunnerSunPalette(
  primary: [number, number, number],
  secondary: [number, number, number],
  pulse: number
): NetrunnerSunPalette {
  const warmCore: [number, number, number] = [
    Math.min(1, primary[0] * 0.72 + 0.18 + pulse * 0.04),
    Math.min(1, primary[1] * 0.65 + 0.12 + pulse * 0.03),
    Math.min(1, primary[2] * 0.5 + 0.06 + pulse * 0.02),
  ];
  const core = mixRgb(primary, warmCore, 0.45);
  const mid = mixRgb(primary, secondary, 0.42 + pulse * 0.08);
  const outer = mixRgb(secondary, primary, 0.28);
  const haze = mixRgb(mid, outer, 0.62);

  return { core, mid, outer, haze };
}

function appendHorizonSunArc(
  target: ScratchNumberBuffer,
  centerX: number,
  centerY: number,
  centerZ: number,
  radiusX: number,
  radiusY: number,
  segments: number
): void {
  for (let index = 0; index < segments; index += 1) {
    const angleA = Math.PI * (index / segments);
    const angleB = Math.PI * ((index + 1) / segments);
    const localAX = Math.cos(angleA);
    const localAY = Math.sin(angleA);
    const localBX = Math.cos(angleB);
    const localBY = Math.sin(angleB);

    target.push(
      centerX,
      centerY,
      centerZ,
      0,
      0,
      centerX + localAX * radiusX,
      centerY + localAY * radiusY,
      centerZ,
      localAX,
      localAY,
      centerX + localBX * radiusX,
      centerY + localBY * radiusY,
      centerZ,
      localBX,
      localBY
    );
  }
}

function resolveHorizonSunPulse(
  bass: number,
  beat: number,
  energy: number,
  tempoBeat: number
): number {
  return bass * 0.5 + beat * 0.28 + energy * 0.14 + tempoBeat * 0.12;
}

interface FloorGridLines {
  vertexCount: number;
}

interface NetrunnerFloorPalette {
  fill: [number, number, number];
  grid: [number, number, number];
  gridGlow: [number, number, number];
  avenue: [number, number, number];
}

function resolveNetrunnerFloorPalette(
  primary: [number, number, number],
  secondary: [number, number, number]
): NetrunnerFloorPalette {
  const blended = mixRgb(primary, secondary, 0.38);
  const fill: [number, number, number] = [
    blended[0] * 0.07 + 0.02,
    blended[1] * 0.08 + 0.02,
    blended[2] * 0.11 + 0.03,
  ];
  const gridBase = mixRgb(secondary, primary, 0.68);
  const grid: [number, number, number] = [
    Math.min(1, gridBase[0] * 0.42 + 0.04),
    Math.min(1, gridBase[1] * 0.4 + 0.035),
    Math.min(1, gridBase[2] * 0.46 + 0.06),
  ];
  const glowBase = mixRgb(primary, secondary, 0.35);
  const gridGlow: [number, number, number] = [
    Math.min(1, glowBase[0] * 0.68 + 0.1),
    Math.min(1, glowBase[1] * 0.52 + 0.07),
    Math.min(1, glowBase[2] * 0.62 + 0.14),
  ];
  const avenue = mixRgb(primary, secondary, 0.52);

  return { fill, grid, gridGlow, avenue };
}

function buildFloorPlane(scratch: ScratchNumberBuffer): void {
  scratch.clear();
  const farZ = -GRID_SPAN_Z;
  const nearZ = GRID_FLOOR_NEAR_Z;
  const x0 = -GRID_SPAN_X;
  const x1 = GRID_SPAN_X;
  appendQuad(scratch, x0, FLOOR_PLANE_Y, farZ, x1, FLOOR_PLANE_Y, farZ, x1, FLOOR_PLANE_Y, nearZ, x0, FLOOR_PLANE_Y, nearZ);
}

function resolveFloorGridScrollPhase(scrollZ: number): number {
  const scrolledOffset = ((scrollZ % GRID_FLOOR_DEPTH_SPAN) + GRID_FLOOR_DEPTH_SPAN) % GRID_FLOOR_DEPTH_SPAN;
  return ((scrolledOffset % GRID_FLOOR_STEP) + GRID_FLOOR_STEP) % GRID_FLOOR_STEP;
}

function buildFloorGridLines(scrollZ: number, scratch: ScratchNumberBuffer): FloorGridLines {
  scratch.clear();
  const floorFarZ = -GRID_SPAN_Z;
  const floorNearZ = GRID_FLOOR_NEAR_Z;
  const scrollPhase = resolveFloorGridScrollPhase(scrollZ);
  const y = FLOOR_LINE_Y;

  for (let xIndex = 0; xIndex <= GRID_SPAN_X * 2; xIndex += 1) {
    const x = -GRID_SPAN_X + xIndex;
    scratch.push(x, y, floorFarZ, x, y, floorNearZ);
  }

  let z = floorFarZ - GRID_FLOOR_STEP + scrollPhase;
  const zEnd = floorNearZ + GRID_FLOOR_STEP * 0.5;
  while (z <= zEnd) {
    if (z >= floorFarZ) {
      scratch.push(-GRID_SPAN_X, y, z, GRID_SPAN_X, y, z);
    }
    z += GRID_FLOOR_STEP;
  }

  return { vertexCount: scratch.length };
}

type BuildingArchetype = 'tower' | 'slab' | 'stepped' | 'spire' | 'block';
type BuildingSide = -1 | 1;

interface BuildingColors {
  fill: [number, number, number];
}

interface BuildingLayout {
  side: BuildingSide;
  archetype: BuildingArchetype;
  cx: number;
  cz: number;
  halfW: number;
  halfD: number;
  height: number;
  seed: number;
  bandIndex: number;
  enterFade: number;
}

interface ResolveBuildingEnterFadeInput {
  z: number;
  trackMin: number;
  trackLength: number;
}

function smoothStep01(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function resolveBuildingCenterX(
  side: BuildingSide,
  rowDepth: number,
  row: number,
  halfW: number,
  seed: number
): number {
  const lateralJitter = (hashUnit(seed + 1.3) - 0.5) * (row < 4 ? 1.25 : 0.7);
  let cx = side * (AVENUE_HALF_WIDTH + rowDepth + lateralJitter);

  if (row >= 4) {
    const wingFill = GRID_SPAN_X * (0.84 + hashUnit(seed + 12.7) * 0.1);
    const target = side * Math.max(AVENUE_HALF_WIDTH + halfW + 0.2, wingFill - halfW);
    cx = side * Math.max(Math.abs(cx), Math.abs(target));
  }

  const maxCenter = GRID_SPAN_X - halfW - 0.12;
  const minCenter = AVENUE_HALF_WIDTH + halfW + 0.14;
  const magnitude = Math.max(minCenter, Math.min(maxCenter, Math.abs(cx)));
  return side * magnitude;
}

function appendAvenueFloorAccent(scratch: ScratchNumberBuffer): void {
  const floorFarZ = -GRID_SPAN_Z;
  const floorNearZ = GRID_FLOOR_NEAR_Z;
  const y = FLOOR_LINE_Y;

  scratch.clear();
  scratch.push(0, y, floorFarZ, 0, y, floorNearZ);
  scratch.push(-AVENUE_HALF_WIDTH, y, floorFarZ, -AVENUE_HALF_WIDTH, y, floorNearZ);
  scratch.push(AVENUE_HALF_WIDTH, y, floorFarZ, AVENUE_HALF_WIDTH, y, floorNearZ);
}

function resolveBuildingEnterFade(input: ResolveBuildingEnterFadeInput): number {
  const fadeDepth = Math.max(0.001, input.trackLength * BUILDING_ENTER_FADE_RATIO);
  const depthAlongTrack = Math.max(0, input.z - input.trackMin);
  return smoothStep01(depthAlongTrack / fadeDepth);
}

function appendQuad(
  target: ScratchNumberBuffer,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
  dx: number,
  dy: number,
  dz: number
): void {
  target.push(ax, ay, az, bx, by, bz, cx, cy, cz);
  target.push(ax, ay, az, cx, cy, cz, dx, dy, dz);
}

function appendBoxSolids(
  target: ScratchNumberBuffer,
  cx: number,
  cy: number,
  cz: number,
  halfW: number,
  height: number,
  halfD: number
): void {
  const y0 = cy;
  const y1 = cy + height;
  const x0 = cx - halfW;
  const x1 = cx + halfW;
  const z0 = cz - halfD;
  const z1 = cz + halfD;

  appendQuad(target, x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0);
  appendQuad(target, x1, y0, z1, x0, y0, z1, x0, y1, z1, x1, y1, z1);
  appendQuad(target, x0, y0, z1, x0, y0, z0, x0, y1, z0, x0, y1, z1);
  appendQuad(target, x1, y0, z0, x1, y0, z1, x1, y1, z1, x1, y1, z0);
  appendQuad(target, x0, y0, z1, x1, y0, z1, x1, y0, z0, x0, y0, z0);
  appendQuad(target, x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1);
}

function resolveBuildingColors(
  primary: [number, number, number],
  secondary: [number, number, number],
  seed: number,
  band: number
): BuildingColors {
  const role = Math.floor(hashUnit(seed + 0.4) * 5);
  const bandMix = band * 0.35 + hashUnit(seed + 1.9) * 0.65;

  let fill: [number, number, number];
  switch (role) {
    case 0:
      fill = mixRgb(primary, secondary, 0.12 + bandMix * 0.25);
      break;
    case 1:
      fill = mixRgb(secondary, primary, 0.18 + bandMix * 0.42);
      break;
    case 2:
      fill = tintFromTheme(primary, secondary, seed + band * 6.1);
      break;
    case 3:
      fill = mixRgb(primary, secondary, 0.55 + bandMix * 0.35);
      break;
    default:
      fill = mixRgb(secondary, primary, 0.62 + bandMix * 0.28);
      break;
  }

  const shade = 0.55 + hashUnit(seed + 3.7) * 0.45;
  fill = [
    Math.min(1, fill[0] * shade),
    Math.min(1, fill[1] * (shade * 0.92 + 0.08)),
    Math.min(1, fill[2] * (shade * 1.05)),
  ];

  return { fill };
}

function resolveArchetype(seed: number): BuildingArchetype {
  const pick = hashUnit(seed + 2.2);
  if (pick < 0.22) {
    return 'slab';
  }
  if (pick < 0.42) {
    return 'stepped';
  }
  if (pick < 0.58) {
    return 'spire';
  }
  if (pick < 0.78) {
    return 'block';
  }
  return 'tower';
}

function appendBuildingSolids(target: ScratchNumberBuffer, layout: BuildingLayout): void {
  const { cx, cz, halfW, halfD, height, archetype } = layout;

  if (archetype === 'stepped') {
    const baseH = height * 0.58;
    const topH = height - baseH;
    appendBoxSolids(target, cx, 0, cz, halfW, baseH, halfD);
    appendBoxSolids(target, cx, baseH, cz, halfW * 0.62, topH, halfD * 0.68);
    return;
  }

  appendBoxSolids(target, cx, 0, cz, halfW, height, halfD);
}

export function createNetrunnerGridRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const solidProgram = compileShaderProgram(gl, VERTEX_SHADER, SOLID_FRAGMENT);
  const lineProgram = compileShaderProgram(gl, VERTEX_SHADER, LINE_FRAGMENT);
  const sunProgram = compileShaderProgram(gl, SUN_VERTEX_SHADER, SUN_FRAGMENT_SHADER);
  const solidMatrixLoc = gl.getUniformLocation(solidProgram, 'u_matrix');
  const solidColorLoc = gl.getUniformLocation(solidProgram, 'u_color');
  const solidAlphaLoc = gl.getUniformLocation(solidProgram, 'u_alpha');
  const solidPositionLoc = gl.getAttribLocation(solidProgram, 'a_position');
  const lineMatrixLoc = gl.getUniformLocation(lineProgram, 'u_matrix');
  const lineColorLoc = gl.getUniformLocation(lineProgram, 'u_color');
  const lineAlphaLoc = gl.getUniformLocation(lineProgram, 'u_alpha');
  const linePositionLoc = gl.getAttribLocation(lineProgram, 'a_position');
  const sunMatrixLoc = gl.getUniformLocation(sunProgram, 'u_matrix');
  const sunCoreColorLoc = gl.getUniformLocation(sunProgram, 'u_coreColor');
  const sunMidColorLoc = gl.getUniformLocation(sunProgram, 'u_midColor');
  const sunOuterColorLoc = gl.getUniformLocation(sunProgram, 'u_outerColor');
  const sunAlphaLoc = gl.getUniformLocation(sunProgram, 'u_alpha');
  const sunPositionLoc = gl.getAttribLocation(sunProgram, 'a_position');
  const sunLocalLoc = gl.getAttribLocation(sunProgram, 'a_local');
  const buffer = gl.createBuffer();
  const vertexUpload = createReusableFloat32Buffer(12_288);
  const floorScratch = createScratchNumberBuffer(8_192);
  const geometryScratch = createScratchNumberBuffer(12_288);
  const sunScratch = createScratchNumberBuffer(2_048);
  const sunVertexUpload = createReusableFloat32Buffer(2_048);
  const horizonSunPasses: NetrunnerSunDrawPass[] = [
    { radiusScale: 1.22, alpha: 0.1, additive: true, colorRole: 'haze' },
    { radiusScale: 1, alpha: 0.46, additive: false, colorRole: 'core' },
  ];
  const layoutPool: BuildingLayout[] = [];
  const projectionMatrix = new Float32Array(16);
  const viewMatrix = new Float32Array(16);
  const viewProjectionMatrix = new Float32Array(16);

  let layoutWidth = 1;
  let layoutHeight = 1;
  let scrollZ = 0;
  let smoothedScrollRate = 0;
  const smoothedBandSpec = new Float32Array(BAND_COUNT);
  let smoothedEnergy = 0;
  let smoothedBass = 0;
  let smoothedBeat = 0;

  const lerp = (current: number, target: number, amount: number): number =>
    current + (target - current) * amount;

  const drawBuffer = (
    program: WebGLProgram,
    matrixLoc: WebGLUniformLocation | null,
    colorLoc: WebGLUniformLocation | null,
    alphaLoc: WebGLUniformLocation | null,
    positionLoc: number,
    scratch: ScratchNumberBuffer,
    matrix: Float32Array,
    color: [number, number, number],
    alpha: number,
    mode: number
  ) => {
    if (scratch.length < 6) {
      return;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const upload = vertexUpload.uploadFrom(scratch.values, scratch.length);
    gl.bufferData(gl.ARRAY_BUFFER, upload, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(matrixLoc, false, matrix);
    gl.uniform3f(colorLoc, color[0], color[1], color[2]);
    gl.uniform1f(alphaLoc, alpha);
    gl.drawArrays(mode, 0, scratch.length / 3);
  };

  const drawHorizonSun = (
    matrix: Float32Array,
    palette: NetrunnerSunPalette,
    sunScale: number,
    sunCenterY: number,
    sunPulse: number
  ) => {
    horizonSunPasses.forEach((pass) => {
      const radiusX = HORIZON_SUN_RADIUS_X * sunScale * pass.radiusScale;
      const radiusY = HORIZON_SUN_RADIUS_Y * sunScale * pass.radiusScale;
      sunScratch.clear();
      appendHorizonSunArc(
        sunScratch,
        0,
        sunCenterY,
        HORIZON_SUN_Z,
        radiusX,
        radiusY,
        HORIZON_SUN_SEGMENTS
      );

      if (sunScratch.length < 15) {
        return;
      }

      gl.useProgram(sunProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const sunUpload = sunVertexUpload.uploadFrom(sunScratch.values, sunScratch.length);
      gl.bufferData(gl.ARRAY_BUFFER, sunUpload, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sunPositionLoc);
      gl.vertexAttribPointer(sunPositionLoc, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(sunLocalLoc);
      gl.vertexAttribPointer(sunLocalLoc, 2, gl.FLOAT, false, 20, 12);
      gl.uniformMatrix4fv(sunMatrixLoc, false, matrix);

      if (pass.colorRole === 'core') {
        gl.uniform3f(sunCoreColorLoc, palette.core[0], palette.core[1], palette.core[2]);
        gl.uniform3f(sunMidColorLoc, palette.mid[0], palette.mid[1], palette.mid[2]);
        gl.uniform3f(sunOuterColorLoc, palette.outer[0], palette.outer[1], palette.outer[2]);
      } else {
        gl.uniform3f(sunCoreColorLoc, palette.haze[0], palette.haze[1], palette.haze[2]);
        gl.uniform3f(sunMidColorLoc, palette.haze[0], palette.haze[1], palette.haze[2]);
        gl.uniform3f(sunOuterColorLoc, palette.haze[0], palette.haze[1], palette.haze[2]);
      }

      gl.uniform1f(sunAlphaLoc, pass.alpha + sunPulse * (pass.additive ? 0.06 : 0.1));

      if (pass.additive) {
        gl.depthMask(false);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      } else {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }

      gl.drawArrays(gl.TRIANGLES, 0, sunScratch.length / 5);
      gl.disableVertexAttribArray(sunLocalLoc);
      gl.depthMask(true);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    });

    gl.depthMask(true);
  };

  const buildLayouts = (frame: WebglDrawFrameInput, spanZ: number): BuildingLayout[] => {
    layoutPool.length = 0;
    const trackMin = -spanZ * 0.92;
    const trackMax = spanZ * 0.5;
    const trackLength = trackMax - trackMin;

    const sides: BuildingSide[] = [-1, 1];
    sides.forEach((side) => {
      BUILDING_ROW_DEPTHS.forEach((rowDepth, row) => {
        for (let slot = 0; slot < BUILDING_SLOTS; slot += 1) {
          const bandIndex = row * BUILDING_SLOTS + slot;
          const band = bandIndex / (BAND_COUNT - 1);
          const seed = side * 137 + row * 41 + slot * 2.17;

          const spec = sampleFrequencyAt(frame.frequencyData, band);
          smoothedBandSpec[bandIndex] = lerp(smoothedBandSpec[bandIndex], spec, 0.09);
          const calmSpec = smoothedBandSpec[bandIndex];

          const archetype = resolveArchetype(seed);
          const laneT = (slot + 0.5 + (hashUnit(seed + 4.1) - 0.5) * 0.18) / BUILDING_SLOTS;
          const rowZBias = (hashUnit(seed + 6.2) - 0.5) * 0.22;
          const scrollFactor = 1.15 + row * 0.1;
          let z = trackMin + laneT * trackLength + rowZBias + scrollZ * scrollFactor;
          z = wrapTrackDepth({ z, spanZ });
          const enterFade = resolveBuildingEnterFade({ z, trackMin, trackLength });

          let halfW = 0.28 + hashUnit(seed + 0.7) * 0.55;
          let halfD = 0.22 + hashUnit(seed + 1.1) * 0.62 + row * 0.08;
          let height =
            0.3 + Math.pow(Math.max(calmSpec, 0.05), 0.7) * (2.4 + smoothedBass * 0.65);

          if (archetype === 'slab') {
            halfW *= 1.45;
            halfD *= 1.2;
            height *= 0.42;
          } else if (archetype === 'spire') {
            halfW *= 0.48;
            halfD *= 0.52;
            height *= 1.65;
          } else if (archetype === 'block') {
            halfW *= 0.85 + hashUnit(seed + 3.3) * 0.35;
            halfD *= 0.9 + hashUnit(seed + 3.9) * 0.4;
          }

          if (row >= 4) {
            halfW *= 1.08 + hashUnit(seed + 13.2) * 0.22;
          }

          const cx = resolveBuildingCenterX(side, rowDepth, row, halfW, seed);

          layoutPool.push({
            side,
            archetype,
            cx,
            cz: z,
            halfW,
            halfD,
            height,
            seed,
            bandIndex,
            enterFade,
          });
        }
      });
    });

    return layoutPool;
  };

  return {
    resize(width, height) {
      layoutWidth = Math.max(1, width);
      layoutHeight = Math.max(1, height);
    },

    draw(frame: WebglDrawFrameInput) {
      const aspect = layoutWidth / layoutHeight;
      writePerspectiveMatrix(projectionMatrix, Math.PI / 2.35, aspect, 0.1, 60);
      writeTranslationMatrix(viewMatrix, 0, -0.85, -3.2);
      multiplyMatricesInto(viewProjectionMatrix, projectionMatrix, viewMatrix);

      smoothedEnergy = lerp(smoothedEnergy, frame.reactive.energy, 0.06);
      const targetScrollRate = frame.reducedMotion
        ? 0
        : resolveAudioStreamTempoMotionRate(
            frame.tempo,
            0.007 + smoothedEnergy * 0.01
          );
      smoothedScrollRate = lerp(smoothedScrollRate, targetScrollRate, 0.07);
      scrollZ += smoothedScrollRate * frame.deltaSeconds * 60;
      smoothedBass = lerp(smoothedBass, frame.reactive.bass, 0.07);
      smoothedBeat = lerp(smoothedBeat, frame.reactive.beat, 0.1);

      const floorPalette = resolveNetrunnerFloorPalette(frame.theme.primary, frame.theme.secondary);
      const gridPulse = smoothedBeat * 0.55 + smoothedBass * 0.3 + smoothedEnergy * 0.25;
      const gridLineAlpha = 0.14 + smoothedBass * 0.1 + smoothedEnergy * 0.06;
      const gridGlowAlpha = 0.06 + smoothedBeat * 1.05 + gridPulse * 0.28;
      const avenueAlpha = 0.26 + gridPulse * 0.32;

      buildFloorPlane(floorScratch);
      const spanZ = GRID_SPAN_Z;

      const layouts = buildLayouts(frame, spanZ);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      drawBuffer(
        solidProgram,
        solidMatrixLoc,
        solidColorLoc,
        solidAlphaLoc,
        solidPositionLoc,
        floorScratch,
        viewProjectionMatrix,
        floorPalette.fill,
        1,
        gl.TRIANGLES
      );

      const sunPulse = resolveHorizonSunPulse(
        smoothedBass,
        smoothedBeat,
        smoothedEnergy,
        frame.tempo.beat
      );
      const sunPalette = resolveNetrunnerSunPalette(
        frame.theme.primary,
        frame.theme.secondary,
        sunPulse
      );
      const sunBreathe = frame.reducedMotion ? 0 : Math.sin(frame.time * 0.42) * 0.008;
      const sunScale = 1 + sunPulse * 0.05 + sunBreathe;
      const sunCenterY = HORIZON_SUN_CENTER_Y;

      buildFloorGridLines(scrollZ, floorScratch);

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      drawBuffer(
        lineProgram,
        lineMatrixLoc,
        lineColorLoc,
        lineAlphaLoc,
        linePositionLoc,
        floorScratch,
        viewProjectionMatrix,
        floorPalette.grid,
        gridLineAlpha,
        gl.LINES
      );

      gl.depthMask(false);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      drawBuffer(
        lineProgram,
        lineMatrixLoc,
        lineColorLoc,
        lineAlphaLoc,
        linePositionLoc,
        floorScratch,
        viewProjectionMatrix,
        floorPalette.gridGlow,
        gridGlowAlpha,
        gl.LINES
      );
      gl.depthMask(true);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      appendAvenueFloorAccent(floorScratch);
      drawBuffer(
        lineProgram,
        lineMatrixLoc,
        lineColorLoc,
        lineAlphaLoc,
        linePositionLoc,
        floorScratch,
        viewProjectionMatrix,
        floorPalette.avenue,
        avenueAlpha,
        gl.LINES
      );

      drawHorizonSun(
        viewProjectionMatrix,
        sunPalette,
        sunScale,
        sunCenterY,
        sunPulse
      );

      layouts.forEach((layout) => {
        if (layout.enterFade < 0.02) {
          return;
        }

        const band = layout.bandIndex / (BAND_COUNT - 1);
        const colors = resolveBuildingColors(
          frame.theme.primary,
          frame.theme.secondary,
          layout.seed,
          band
        );
        const fade = layout.enterFade;
        const solidAlpha = fade * (0.74 + hashUnit(layout.seed + 10.2) * 0.08);

        geometryScratch.clear();
        appendBuildingSolids(geometryScratch, layout);
        drawBuffer(
          solidProgram,
          solidMatrixLoc,
          solidColorLoc,
          solidAlphaLoc,
          solidPositionLoc,
          geometryScratch,
          viewProjectionMatrix,
          colors.fill,
          solidAlpha,
          gl.TRIANGLES
        );
      });

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
    },

    reset() {
      scrollZ = 0;
      smoothedScrollRate = 0;
      smoothedEnergy = 0;
      smoothedBass = 0;
      smoothedBeat = 0;
      smoothedBandSpec.fill(0);
      layoutPool.length = 0;
      floorScratch.clear();
      geometryScratch.clear();
      sunScratch.clear();
    },

    destroy() {
      gl.deleteProgram(solidProgram);
      gl.deleteProgram(lineProgram);
      gl.deleteProgram(sunProgram);
      gl.deleteBuffer(buffer);
      layoutPool.length = 0;
      floorScratch.clear();
      geometryScratch.clear();
      sunScratch.clear();
    },
  };
}
