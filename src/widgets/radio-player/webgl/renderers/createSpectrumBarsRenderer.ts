import {
  createBarLevelEnvelope,
  fillFrequencyBarTargets,
} from '../../barLevelEnvelope';
import {
  compileShaderProgram,
  writeOrthoMatrix,
  mixRgb,
  sampleFrequencyAt,
} from '../webglGlUtils';
import { uploadArrayBuffer, createReusableFloat32Buffer } from '../webglReusableBuffers';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

const VERTEX_SHADER = `#version 300 es
precision highp float;
uniform mat4 u_matrix;
uniform vec3 u_color;
in vec2 a_position;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec3 u_color;
out vec4 outColor;
void main() {
  outColor = vec4(u_color, 1.0);
}
`;

const BAR_COUNT = 64;

export function createSpectrumBarsRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const program = compileShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const matrixLoc = gl.getUniformLocation(program, 'u_matrix');
  const colorLoc = gl.getUniformLocation(program, 'u_color');
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const buffer = gl.createBuffer();
  const barEnvelope = createBarLevelEnvelope(BAR_COUNT);
  const orthoMatrix = new Float32Array(16);
  const rectVertices = new Float32Array(8);
  const vertexUpload = createReusableFloat32Buffer(8);
  const frequencyTargets = new Float32Array(BAR_COUNT);
  let layoutWidth = 1;
  let layoutHeight = 1;

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number]
  ) => {
    rectVertices[0] = x;
    rectVertices[1] = y;
    rectVertices[2] = x + w;
    rectVertices[3] = y;
    rectVertices[4] = x;
    rectVertices[5] = y + h;
    rectVertices[6] = x + w;
    rectVertices[7] = y + h;
    uploadArrayBuffer(gl, buffer, vertexUpload, rectVertices, 8);
    gl.uniform3f(colorLoc, color[0], color[1], color[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  return {
    resize(width, height) {
      layoutWidth = Math.max(1, width);
      layoutHeight = Math.max(1, height);
    },

    draw(frame: WebglDrawFrameInput) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      const matrix = writeOrthoMatrix(orthoMatrix, 0, layoutWidth, layoutHeight, 0);
      gl.uniformMatrix4fv(matrixLoc, false, matrix);
      gl.disable(gl.BLEND);

      const gap = 2;
      const barWidth = (layoutWidth - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const maxBarHeight = layoutHeight * 0.82;

      fillFrequencyBarTargets(frequencyTargets, {
        frequencyData: frame.frequencyData,
        barCount: BAR_COUNT,
        power: 0.85,
        sampleAt: sampleFrequencyAt,
      });
      const levels = barEnvelope.smooth(frequencyTargets, frame.deltaSeconds);

      for (let index = 0; index < BAR_COUNT; index += 1) {
        const level = levels[index] ?? 0;
        const barHeight = Math.max(1, level * maxBarHeight * (1 + frame.reactive.beat * 0.08));
        if (level < 0.004) {
          continue;
        }

        const x = index * (barWidth + gap);
        const y = layoutHeight - barHeight;
        const color = mixRgb(frame.theme.primary, frame.theme.secondary, level);
        drawRect(x, y, barWidth, barHeight, color);

        const peakY = y - 2;
        if (peakY > 0) {
          drawRect(x, peakY, barWidth, 2, [1, 1, 1]);
        }
      }
    },

    reset() {
      barEnvelope.reset();
    },

    destroy() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
  };
}
