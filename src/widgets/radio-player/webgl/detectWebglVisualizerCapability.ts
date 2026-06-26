import type { WebglVisualizerCapability } from './webglVisualizer.types';

const WEBGL_CAPABILITY_PROBE_VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const WEBGL_CAPABILITY_PROBE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(0.0);
}
`;

let cachedSupportedCapability: WebglVisualizerCapability | null = null;

function compileProbeShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function linkProbeProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vertexShader = compileProbeShader(gl, gl.VERTEX_SHADER, WEBGL_CAPABILITY_PROBE_VERTEX_SHADER);
  if (!vertexShader) {
    return null;
  }

  const fragmentShader = compileProbeShader(
    gl,
    gl.FRAGMENT_SHADER,
    WEBGL_CAPABILITY_PROBE_FRAGMENT_SHADER
  );
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export function detectWebglVisualizerCapability(): WebglVisualizerCapability {
  if (cachedSupportedCapability?.isSupported) {
    return cachedSupportedCapability;
  }

  if (typeof document === 'undefined') {
    return {
      isSupported: false,
      reason: 'WebGL visualizers require a browser environment.',
    };
  }

  const canvas = document.createElement('canvas');
  let gl: WebGL2RenderingContext | null = null;

  try {
    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
  } catch {
    gl = null;
  }

  if (!gl) {
    return {
      isSupported: false,
      reason: 'WebGL2 is not available in this browser or is disabled.',
    };
  }

  const program = linkProbeProgram(gl);
  if (!program) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return {
      isSupported: false,
      reason: 'WebGL2 shaders could not run on this device.',
    };
  }

  gl.deleteProgram(program);
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  cachedSupportedCapability = {
    isSupported: true,
    reason: null,
  };
  return cachedSupportedCapability;
}

export function resetWebglVisualizerCapabilityCacheForTests(): void {
  cachedSupportedCapability = null;
}

export function isWebglVisualizerSourceAllowed(
  source: string,
  capability: WebglVisualizerCapability
): boolean {
  if (source !== 'webgl') {
    return true;
  }

  return capability.isSupported;
}
