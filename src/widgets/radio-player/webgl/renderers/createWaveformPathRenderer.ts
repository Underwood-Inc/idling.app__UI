import {
  compileShaderProgram,
  writeOrthoMatrix,
  mixRgb,
  sampleWaveformAt,
} from '../webglGlUtils';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

const VERTEX_SHADER = `#version 300 es
precision highp float;
uniform mat4 u_matrix;
in vec2 a_position;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec3 u_color;
uniform float u_alpha;
out vec4 outColor;
void main() {
  outColor = vec4(u_color, u_alpha);
}
`;

const SAMPLE_COUNT = 256;
const LINE_WIDTH = 3;

export function createWaveformPathRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const program = compileShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const matrixLoc = gl.getUniformLocation(program, 'u_matrix');
  const colorLoc = gl.getUniformLocation(program, 'u_color');
  const alphaLoc = gl.getUniformLocation(program, 'u_alpha');
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const buffer = gl.createBuffer();
  const orthoMatrix = new Float32Array(16);
  const ribbon = new Float32Array(SAMPLE_COUNT * 4);
  const centerline = new Float32Array(SAMPLE_COUNT * 2);
  let layoutWidth = 1;
  let layoutHeight = 1;

  const buildPaths = (frame: WebglDrawFrameInput): void => {
    const midY = layoutHeight * 0.5;
    const amplitude = layoutHeight * (0.22 + frame.reactive.energy * 0.12);

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const t = index / (SAMPLE_COUNT - 1);
      const x = t * layoutWidth;
      const wave = sampleWaveformAt(frame.waveformData, t);
      const y = midY - wave * amplitude;
      const ribbonOffset = index * 4;
      ribbon[ribbonOffset] = x;
      ribbon[ribbonOffset + 1] = y - LINE_WIDTH;
      ribbon[ribbonOffset + 2] = x;
      ribbon[ribbonOffset + 3] = y + LINE_WIDTH;

      const centerOffset = index * 2;
      centerline[centerOffset] = x;
      centerline[centerOffset + 1] = y;
    }
  };

  return {
    resize(width, height) {
      layoutWidth = Math.max(1, width);
      layoutHeight = Math.max(1, height);
    },

    draw(frame: WebglDrawFrameInput) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const matrix = writeOrthoMatrix(orthoMatrix, 0, layoutWidth, layoutHeight, 0);
      buildPaths(frame);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(matrixLoc, false, matrix);

      const glowColor = mixRgb(frame.theme.primary, frame.theme.secondary, 0.35);
      gl.bufferData(gl.ARRAY_BUFFER, ribbon, gl.DYNAMIC_DRAW);
      gl.uniform3f(colorLoc, glowColor[0], glowColor[1], glowColor[2]);
      gl.uniform1f(alphaLoc, 0.22 + frame.reactive.mid * 0.2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, SAMPLE_COUNT * 2);

      gl.bufferData(gl.ARRAY_BUFFER, centerline, gl.DYNAMIC_DRAW);
      gl.uniform3f(colorLoc, frame.theme.primary[0], frame.theme.primary[1], frame.theme.primary[2]);
      gl.uniform1f(alphaLoc, 0.75 + frame.reactive.beat * 0.2);
      gl.drawArrays(gl.LINE_STRIP, 0, SAMPLE_COUNT);

      gl.disable(gl.BLEND);
    },

    destroy() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
  };
}
