import {
  createBarLevelEnvelope,
  fillFrequencyBarTargets,
} from '../../barLevelEnvelope';
import {
  appendCircleVertices,
  compileShaderProgram,
  writeOrthoMatrix,
  mixRgb,
  sampleFrequencyAt,
} from '../webglGlUtils';
import { createReusableFloat32Buffer, createScratchNumberBuffer, uploadArrayBuffer } from '../webglReusableBuffers';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

const BAR_COUNT = 80;
const SEGMENTS = 6;

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

export function createRadialSpectrumRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const program = compileShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const matrixLoc = gl.getUniformLocation(program, 'u_matrix');
  const colorLoc = gl.getUniformLocation(program, 'u_color');
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const buffer = gl.createBuffer();
  const barEnvelope = createBarLevelEnvelope(BAR_COUNT);
  const orthoMatrix = new Float32Array(16);
  const wedgeScratch = createScratchNumberBuffer(40);
  const hubScratch = createScratchNumberBuffer(SEGMENTS * 6);
  const vertexUpload = createReusableFloat32Buffer(64);
  const frequencyTargets = new Float32Array(BAR_COUNT);
  let layoutWidth = 1;
  let layoutHeight = 1;

  return {
    resize(width, height) {
      layoutWidth = Math.max(1, width);
      layoutHeight = Math.max(1, height);
    },

    draw(frame: WebglDrawFrameInput) {
      const centerX = layoutWidth * 0.5;
      const centerY = layoutHeight * 0.5;
      const extent = Math.min(layoutWidth, layoutHeight);
      const inner = extent * 0.05;
      const maxReach = extent * 0.47;
      const matrix = writeOrthoMatrix(orthoMatrix, 0, layoutWidth, layoutHeight, 0);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(matrixLoc, false, matrix);

      fillFrequencyBarTargets(frequencyTargets, {
        frequencyData: frame.frequencyData,
        barCount: BAR_COUNT,
        power: 0.8,
        sampleAt: sampleFrequencyAt,
      });
      const levels = barEnvelope.smooth(frequencyTargets, frame.deltaSeconds);

      for (let index = 0; index < BAR_COUNT; index += 1) {
        const level = levels[index] ?? 0;
        const startAngle = (index / BAR_COUNT) * Math.PI * 2 - Math.PI * 0.5;
        const endAngle = ((index + 1) / BAR_COUNT) * Math.PI * 2 - Math.PI * 0.5;
        const outer = inner + level * maxReach * (1 + frame.reactive.beat * 0.08);
        if (level < 0.004 || outer <= inner + 2) {
          continue;
        }

        wedgeScratch.clear();
        wedgeScratch.push(centerX, centerY);
        wedgeScratch.push(
          centerX + Math.cos(startAngle) * inner,
          centerY + Math.sin(startAngle) * inner
        );
        wedgeScratch.push(
          centerX + Math.cos(startAngle) * outer,
          centerY + Math.sin(startAngle) * outer
        );
        wedgeScratch.push(
          centerX + Math.cos(endAngle) * outer,
          centerY + Math.sin(endAngle) * outer
        );
        wedgeScratch.push(centerX + Math.cos(endAngle) * inner, centerY + Math.sin(endAngle) * inner);

        uploadArrayBuffer(gl, buffer, vertexUpload, wedgeScratch.values, wedgeScratch.length);
        const color = mixRgb(frame.theme.primary, frame.theme.secondary, level);
        gl.uniform3f(colorLoc, color[0], color[1], color[2]);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 5);
      }

      hubScratch.clear();
      appendCircleVertices(hubScratch, centerX, centerY, inner * 0.92, SEGMENTS);
      uploadArrayBuffer(gl, buffer, vertexUpload, hubScratch.values, hubScratch.length);
      gl.uniform3f(
        colorLoc,
        frame.theme.primary[0] * 0.4,
        frame.theme.primary[1] * 0.4,
        frame.theme.primary[2] * 0.4
      );
      gl.drawArrays(gl.TRIANGLES, 0, SEGMENTS * 3);
    },

    reset() {
      barEnvelope.reset();
      wedgeScratch.clear();
      hubScratch.clear();
    },

    destroy() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      wedgeScratch.clear();
      hubScratch.clear();
    },
  };
}
