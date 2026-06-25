import { compileShaderProgram, hashUnit, mixRgb, tintFromTheme } from '../webglGlUtils';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

const LIQUID_BLOB_COUNT = 18;
const LIQUID_BLOB_COLS = 6;
const LIQUID_BLOB_ROWS = 3;

interface LiquidBlob {
  orbitCx: number;
  orbitCy: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  orbitSpeed: number;
  phase: number;
  radius: number;
  baseColor: [number, number, number];
  displayColor: [number, number, number];
  x: number;
  y: number;
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

function buildLiquidMergeFragmentShader(blobCount: number): string {
  return `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform vec2 u_blobPos[${blobCount}];
uniform float u_blobRadius[${blobCount}];
uniform vec3 u_blobColor[${blobCount}];

float blobWeight(vec2 p, int index) {
  vec2 delta = p - u_blobPos[index];
  float distSq = dot(delta, delta);
  float r = u_blobRadius[index];
  float rSq = r * r;
  return rSq / (distSq + rSq * 0.85);
}

void main() {
  vec2 p = (v_uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  float field = 0.0;
  vec3 pigment = vec3(0.0);
  float pigmentWeight = 0.0;

  for (int i = 0; i < ${blobCount}; i++) {
    float weight = blobWeight(p, i);
    field += weight;
    pigment += u_blobColor[i] * weight;
    pigmentWeight += weight;
  }

  pigment /= max(pigmentWeight, 0.0001);

  float surface = smoothstep(0.18, 0.62, field);
  float shade = clamp(0.6 + field * 0.06, 0.0, 1.0);
  vec3 liquid = pigment * shade * 0.68;

  float alpha = surface * 0.54;
  outColor = vec4(liquid, alpha);
}
`;
}

function resolveBlobBaseRadius(index: number): number {
  return 0.062 + hashUnit(index * 4.7 + 1.9) * 0.048;
}

function createInitialBlob(index: number, aspect: number): LiquidBlob {
  const col = index % LIQUID_BLOB_COLS;
  const row = Math.floor(index / LIQUID_BLOB_COLS);
  const jitterX = (hashUnit(index * 2.1) - 0.5) * aspect * 0.22;
  const jitterY = (hashUnit(index * 3.3) - 0.5) * 0.18;
  const orbitCx = ((col + 0.5) / LIQUID_BLOB_COLS - 0.5) * aspect * 1.72 + jitterX;
  const orbitCy = ((row + 0.5) / LIQUID_BLOB_ROWS - 0.5) * 1.48 + jitterY;
  const radius = resolveBlobBaseRadius(index);

  return {
    orbitCx,
    orbitCy,
    orbitRadiusX: 0.08 + hashUnit(index + 5.4) * 0.14,
    orbitRadiusY: 0.07 + hashUnit(index + 6.2) * 0.12,
    orbitSpeed: 0.012 + hashUnit(index + 7.1) * 0.028,
    phase: index * 1.73 + hashUnit(index + 8.4) * Math.PI * 2,
    radius,
    baseColor: [1, 1, 1],
    displayColor: [1, 1, 1],
    x: orbitCx,
    y: orbitCy,
  };
}

const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

export function createLiquidMergeRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const program = compileShaderProgram(
    gl,
    VERTEX_SHADER,
    buildLiquidMergeFragmentShader(LIQUID_BLOB_COUNT)
  );
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

  const blobPosLocs = Array.from({ length: LIQUID_BLOB_COUNT }, (_, index) =>
    gl.getUniformLocation(program, `u_blobPos[${index}]`)
  );
  const blobRadiusLocs = Array.from({ length: LIQUID_BLOB_COUNT }, (_, index) =>
    gl.getUniformLocation(program, `u_blobRadius[${index}]`)
  );
  const blobColorLocs = Array.from({ length: LIQUID_BLOB_COUNT }, (_, index) =>
    gl.getUniformLocation(program, `u_blobColor[${index}]`)
  );

  let pixelWidth = 1;
  let pixelHeight = 1;
  let blobs: LiquidBlob[] = Array.from({ length: LIQUID_BLOB_COUNT }, (_, index) =>
    createInitialBlob(index, 1)
  );
  const smoothedSpec = new Float32Array(LIQUID_BLOB_COUNT);
  const renderX = new Float32Array(LIQUID_BLOB_COUNT);
  const renderY = new Float32Array(LIQUID_BLOB_COUNT);

  const lerp = (current: number, target: number, amount: number): number =>
    current + (target - current) * amount;

  const lerpColor = (
    current: [number, number, number],
    target: [number, number, number],
    amount: number
  ): [number, number, number] => [
    lerp(current[0], target[0], amount),
    lerp(current[1], target[1], amount),
    lerp(current[2], target[2], amount),
  ];

  const resetBlobs = (aspect: number) => {
    blobs = Array.from({ length: LIQUID_BLOB_COUNT }, (_, index) => createInitialBlob(index, aspect));
    for (let index = 0; index < LIQUID_BLOB_COUNT; index += 1) {
      renderX[index] = blobs[index].x;
      renderY[index] = blobs[index].y;
    }
    smoothedSpec.fill(0);
  };

  const tickBlobs = (frame: WebglDrawFrameInput) => {
    const aspect = pixelWidth / pixelHeight;
    const motionScale = frame.reducedMotion ? 0.35 : 1;
    const time = frame.time * motionScale;

    blobs.forEach((blob, index) => {
      let spec = 0;
      if (frame.frequencyData.length) {
        const center = Math.floor((index / LIQUID_BLOB_COUNT) * frame.frequencyData.length);
        const start = Math.max(0, center - 4);
        const end = Math.min(frame.frequencyData.length - 1, center + 4);
        let sum = 0;
        for (let bin = start; bin <= end; bin += 1) {
          sum += (frame.frequencyData[bin] ?? 0) / 255;
        }
        spec = sum / (end - start + 1);
      }

      smoothedSpec[index] = lerp(smoothedSpec[index], spec, 0.009);
      const calmSpec = smoothedSpec[index];

      const targetColor = tintFromTheme(
        frame.theme.primary,
        frame.theme.secondary,
        index * 2.11 + calmSpec * 0.4
      );
      blob.displayColor = lerpColor(blob.displayColor, targetColor, 0.012);
      blob.baseColor = mixRgb(blob.displayColor, frame.theme.primary, calmSpec * 0.08);

      const orbitAngle = time * blob.orbitSpeed + blob.phase;
      const targetX =
        blob.orbitCx + Math.cos(orbitAngle) * blob.orbitRadiusX * aspect * (0.42 + calmSpec * 0.04);
      const targetY =
        blob.orbitCy +
        Math.sin(orbitAngle * (0.88 + hashUnit(index + 12.6) * 0.18)) *
          blob.orbitRadiusY *
          (0.42 + calmSpec * 0.04);

      blob.x = lerp(blob.x, targetX, 0.028);
      blob.y = lerp(blob.y, targetY, 0.028);

      renderX[index] = lerp(renderX[index], blob.x, 0.045);
      renderY[index] = lerp(renderY[index], blob.y, 0.045);
    });
  };

  return {
    resize(width, height) {
      pixelWidth = Math.max(1, width);
      pixelHeight = Math.max(1, height);
      resetBlobs(pixelWidth / pixelHeight);
    },

    draw(frame: WebglDrawFrameInput) {
      tickBlobs(frame);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLoc, pixelWidth, pixelHeight);

      blobs.forEach((blob, index) => {
        const posLoc = blobPosLocs[index];
        const radiusLoc = blobRadiusLocs[index];
        const colorLoc = blobColorLocs[index];
        if (posLoc) {
          gl.uniform2f(posLoc, renderX[index] ?? blob.x, renderY[index] ?? blob.y);
        }
        if (radiusLoc) {
          gl.uniform1f(radiusLoc, blob.radius);
        }
        if (colorLoc) {
          gl.uniform3f(colorLoc, blob.baseColor[0], blob.baseColor[1], blob.baseColor[2]);
        }
      });

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
    },

    reset() {
      smoothedSpec.fill(0);
      resetBlobs(pixelWidth / pixelHeight);
    },

    destroy() {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      blobs = [];
    },
  };
}
