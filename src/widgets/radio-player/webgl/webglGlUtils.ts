export function releaseWebglContextState(gl: WebGL2RenderingContext): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.useProgram(null);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
}

/** Clears the framebuffer so the app star-field shows through the visualizer. */
export function clearTransparentWebglFrame(gl: WebGL2RenderingContext): void {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export function compileShaderProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const compile = (type: number, source: string): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('WebGL shader allocation failed');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  };

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    throw new Error('WebGL program allocation failed');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export function createOrthoMatrix(
  left: number,
  right: number,
  bottom: number,
  top: number
): Float32Array {
  return writeOrthoMatrix(new Float32Array(16), left, right, bottom, top);
}

export function writeOrthoMatrix(
  out: Float32Array,
  left: number,
  right: number,
  bottom: number,
  top: number
): Float32Array {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  out.fill(0);
  out[0] = -2 * lr;
  out[5] = -2 * bt;
  out[10] = -1;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[15] = 1;
  return out;
}

export function writePerspectiveMatrix(
  out: Float32Array,
  fovRadians: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1 / Math.tan(fovRadians * 0.5);
  const range = near - far;
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / range;
  out[11] = -1;
  out[14] = (2 * far * near) / range;
  out[15] = 0;
  return out;
}

export function createPerspectiveMatrix(
  fovRadians: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  return writePerspectiveMatrix(new Float32Array(16), fovRadians, aspect, near, far);
}

export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  return multiplyMatricesInto(out, a, b);
}

export function multiplyMatricesInto(
  out: Float32Array,
  a: Float32Array,
  b: Float32Array
): Float32Array {
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        a[row] * b[col * 4] +
        a[row + 4] * b[col * 4 + 1] +
        a[row + 8] * b[col * 4 + 2] +
        a[row + 12] * b[col * 4 + 3];
    }
  }
  return out;
}

export function writeTranslationMatrix(
  out: Float32Array,
  x: number,
  y: number,
  z: number
): Float32Array {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[12] = x;
  out[13] = y;
  out[14] = z;
  out[15] = 1;
  return out;
}

export function createTranslationMatrix(x: number, y: number, z: number): Float32Array {
  return writeTranslationMatrix(new Float32Array(16), x, y, z);
}

export function mixRgb(
  primary: [number, number, number],
  secondary: [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  return [
    primary[0] + (secondary[0] - primary[0]) * clamped,
    primary[1] + (secondary[1] - primary[1]) * clamped,
    primary[2] + (secondary[2] - primary[2]) * clamped,
  ];
}

export function hashUnit(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function tintFromTheme(
  primary: [number, number, number],
  secondary: [number, number, number],
  seed: number
): [number, number, number] {
  const blend = hashUnit(seed) * 0.9 + hashUnit(seed + 2.17) * 0.1;
  const accent = mixRgb(primary, secondary, blend);
  const lift = hashUnit(seed + 4.3) * 0.35;
  return [
    Math.min(1, accent[0] + lift),
    Math.min(1, accent[1] + lift * 0.8),
    Math.min(1, accent[2] + lift * 1.1),
  ];
}

export interface VertexPushTarget {
  push: (...items: number[]) => void;
}

export function appendCircleVertices(
  target: VertexPushTarget,
  centerX: number,
  centerY: number,
  radius: number,
  segments: number
): void {
  for (let index = 0; index < segments; index += 1) {
    const angleA = (index / segments) * Math.PI * 2;
    const angleB = ((index + 1) / segments) * Math.PI * 2;
    target.push(centerX, centerY);
    target.push(centerX + Math.cos(angleA) * radius, centerY + Math.sin(angleA) * radius);
    target.push(centerX + Math.cos(angleB) * radius, centerY + Math.sin(angleB) * radius);
  }
}

export interface ThickLineSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export function appendThickLineQuad(
  target: VertexPushTarget,
  segment: ThickLineSegment,
  halfThickness: number
): void {
  const dx = segment.bx - segment.ax;
  const dy = segment.by - segment.ay;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / length) * halfThickness;
  const ny = (dx / length) * halfThickness;

  const x0 = segment.ax + nx;
  const y0 = segment.ay + ny;
  const x1 = segment.ax - nx;
  const y1 = segment.ay - ny;
  const x2 = segment.bx + nx;
  const y2 = segment.by + ny;
  const x3 = segment.bx - nx;
  const y3 = segment.by - ny;

  target.push(x0, y0, x1, y1, x2, y2);
  target.push(x0, y0, x2, y2, x3, y3);
}

export function sampleFrequencyLevel(data: Uint8Array, index: number): number {
  if (data.length === 0) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(data.length - 1, index));
  return (data[clamped] ?? 0) / 255;
}

export function sampleFrequencyAt(data: Uint8Array, normalizedX: number): number {
  if (data.length === 0) {
    return 0;
  }
  const position = Math.max(0, Math.min(1, normalizedX)) * (data.length - 1);
  const left = Math.floor(position);
  const right = Math.min(data.length - 1, left + 1);
  const blend = position - left;
  const leftValue = (data[left] ?? 0) / 255;
  const rightValue = (data[right] ?? 0) / 255;
  return leftValue + (rightValue - leftValue) * blend;
}

export function sampleWaveformAt(data: Uint8Array, normalizedX: number): number {
  if (data.length === 0) {
    return 0;
  }
  const position = Math.max(0, Math.min(1, normalizedX)) * (data.length - 1);
  const index = Math.floor(position);
  return ((data[index] ?? 128) / 255) * 2 - 1;
}
