import {
  appendCircleVertices,
  appendThickLineQuad,
  compileShaderProgram,
  mixRgb,
  multiplyMatricesInto,
  sampleFrequencyAt,
  tintFromTheme,
  writeOrthoMatrix,
  writePerspectiveMatrix,
  writeTranslationMatrix,
} from '../webglGlUtils';
import {
  buildConstellationSphereMesh,
  projectConstellationScreenPoint,
  resolveConstellationWorldPosition,
} from '../neonConstellationSphereMesh';
import type { ConstellationScreenPoint, ConstellationSphereVertex } from '../neonConstellationSphereMesh';
import { createReusableFloat32Buffer, createScratchNumberBuffer, uploadArrayBuffer } from '../webglReusableBuffers';
import type { WebglDrawFrameInput, WebglVisualizerRenderer } from '../webglVisualizer.types';

interface ResolvedConstellationNode {
  index: number;
  screen: ConstellationScreenPoint;
  level: number;
  color: [number, number, number];
  size: number;
}

interface ConstellationLinkDraw {
  depth: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  color: [number, number, number];
  alpha: number;
  halfThickness: number;
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
uniform mat4 u_matrix;
uniform vec3 u_color;
uniform float u_alpha;
in vec2 a_position;
out vec2 v_local;
void main() {
  v_local = a_position;
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec3 u_color;
uniform float u_alpha;
in vec2 v_local;
out vec4 outColor;
void main() {
  float dist = length(v_local);
  float core = smoothstep(1.0, 0.08, dist);
  float halo = smoothstep(1.0, 0.72, dist);
  float alpha = u_alpha * halo * (0.5 + core * 0.5);
  outColor = vec4(u_color, alpha);
}
`;

const LINE_VERTEX = `#version 300 es
precision highp float;
uniform mat4 u_matrix;
in vec2 a_position;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
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

function linkKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function createNeonConstellationRenderer(gl: WebGL2RenderingContext): WebglVisualizerRenderer {
  const discProgram = compileShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const lineProgram = compileShaderProgram(gl, LINE_VERTEX, LINE_FRAGMENT);
  const discMatrixLoc = gl.getUniformLocation(discProgram, 'u_matrix');
  const discColorLoc = gl.getUniformLocation(discProgram, 'u_color');
  const discAlphaLoc = gl.getUniformLocation(discProgram, 'u_alpha');
  const discPositionLoc = gl.getAttribLocation(discProgram, 'a_position');
  const lineMatrixLoc = gl.getUniformLocation(lineProgram, 'u_matrix');
  const lineColorLoc = gl.getUniformLocation(lineProgram, 'u_color');
  const lineAlphaLoc = gl.getUniformLocation(lineProgram, 'u_alpha');
  const linePositionLoc = gl.getAttribLocation(lineProgram, 'a_position');
  const discBuffer = gl.createBuffer();
  const lineBuffer = gl.createBuffer();
  const unitDiscScratch = createScratchNumberBuffer(20 * 9);
  appendCircleVertices(unitDiscScratch, 0, 0, 1, 20);
  const unitDisc = new Float32Array(unitDiscScratch.values.slice(0, unitDiscScratch.length));
  const vertices = buildConstellationSphereMesh();
  const nodeCount = vertices.length;
  const projectionMatrix = new Float32Array(16);
  const viewMatrix = new Float32Array(16);
  const viewProjectionMatrix = new Float32Array(16);
  const orthoMatrix = new Float32Array(16);
  const discOrthoMatrix = new Float32Array(16);
  const linkScratch = createScratchNumberBuffer(12);
  const vertexUpload = createReusableFloat32Buffer(12);
  const drawnLinks = new Set<string>();
  const smoothedLevels = new Float32Array(nodeCount);
  const linkDrawPool: ConstellationLinkDraw[] = [];
  const nodePool: ResolvedConstellationNode[] = Array.from({ length: nodeCount }, (_, index) => ({
    index,
    screen: { sx: 0, sy: 0, depth: 0, visible: false },
    level: 0,
    color: [0, 0, 0] as [number, number, number],
    size: 0,
  }));

  let layoutWidth = 1;
  let layoutHeight = 1;
  let smoothedEnergy = 0;
  let smoothedBeat = 0;
  let smoothedMid = 0;

  const lerp = (current: number, target: number, amount: number): number =>
    current + (target - current) * amount;

  const smoothLevel = (current: number, target: number): number => {
    const rate = target > current ? 0.05 : 0.03;
    return lerp(current, target, rate);
  };

  const resolveNodes = (frame: WebglDrawFrameInput): ResolvedConstellationNode[] => {
    const aspect = layoutWidth / layoutHeight;
    const extent = Math.min(layoutWidth, layoutHeight);

    smoothedEnergy = lerp(smoothedEnergy, frame.reactive.energy, 0.045);
    smoothedBeat = lerp(smoothedBeat, frame.reactive.beat, 0.04);
    smoothedMid = lerp(smoothedMid, frame.reactive.mid, 0.05);

    const baseRadius = 1.05 + smoothedEnergy * 0.12;

    writePerspectiveMatrix(projectionMatrix, Math.PI / 3.1, aspect, 0.1, 40);
    writeTranslationMatrix(viewMatrix, 0, 0, -3.6);
    multiplyMatricesInto(viewProjectionMatrix, projectionMatrix, viewMatrix);

    for (let index = 0; index < nodeCount; index += 1) {
      const vertex = vertices[index];
      const rawLevel = sampleFrequencyAt(frame.frequencyData, vertex.band);
      smoothedLevels[index] = smoothLevel(smoothedLevels[index], rawLevel);
      const level = smoothedLevels[index];
      const world = resolveConstellationWorldPosition({
        vertex,
        level,
        energy: smoothedEnergy,
        beat: smoothedBeat,
        time: frame.reducedMotion ? 0 : frame.time,
        baseRadius,
      });
      const screen = projectConstellationScreenPoint({
        viewProjection: viewProjectionMatrix,
        width: layoutWidth,
        height: layoutHeight,
        position: world,
      });
      const tinted = tintFromTheme(
        frame.theme.primary,
        frame.theme.secondary,
        vertex.wobble + level * 2.8
      );
      const node = nodePool[index];
      node.index = index;
      node.screen = screen;
      node.level = level;
      node.color = mixRgb(tinted, frame.theme.primary, 0.12);
      const depthScale = screen.visible ? 1.1 - screen.depth * 0.18 : 1;
      node.size = extent * (0.008 + level * 0.028 + smoothedBeat * 0.004) * depthScale;
    }

    return nodePool;
  };

  const collectLinks = (
    nodePositions: ResolvedConstellationNode[],
    extent: number
  ): ConstellationLinkDraw[] => {
    linkDrawPool.length = 0;

    vertices.forEach((vertex: ConstellationSphereVertex, sourceIndex: number) => {
      const source = nodePositions[sourceIndex];
      if (!source?.screen.visible) {
        return;
      }

      vertex.links.forEach((targetIndex) => {
        const key = linkKey(sourceIndex, targetIndex);
        if (drawnLinks.has(key)) {
          return;
        }
        drawnLinks.add(key);

        const target = nodePositions[targetIndex];
        if (!target?.screen.visible) {
          return;
        }

        const strength = Math.min(source.level, target.level);
        const lineColor = mixRgb(source.color, target.color, 0.5);
        const depth = (source.screen.depth + target.screen.depth) * 0.5;
        const halfThickness = extent * (0.0018 + strength * 0.0032 + smoothedBeat * 0.0008);
        const alpha =
          0.08 +
          strength * 0.62 +
          smoothedMid * 0.16 +
          smoothedEnergy * 0.12 +
          smoothedBeat * 0.06;

        linkDrawPool.push({
          depth,
          ax: source.screen.sx,
          ay: source.screen.sy,
          bx: target.screen.sx,
          by: target.screen.sy,
          color: lineColor,
          alpha,
          halfThickness,
        });
      });
    });

    linkDrawPool.sort((left, right) => right.depth - left.depth);
    return linkDrawPool;
  };

  const drawDisc = (
    x: number,
    y: number,
    radius: number,
    color: [number, number, number],
    alpha: number
  ) => {
    if (radius < 0.5) {
      return;
    }

    const scale = writeOrthoMatrix(discOrthoMatrix, x - radius, x + radius, y + radius, y - radius);
    gl.useProgram(discProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, discBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, unitDisc, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(discPositionLoc);
    gl.vertexAttribPointer(discPositionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(discMatrixLoc, false, scale);
    gl.uniform3f(discColorLoc, color[0], color[1], color[2]);
    gl.uniform1f(discAlphaLoc, alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 20 * 3);
  };

  const drawThickLink = (
    matrix: Float32Array,
    link: ConstellationLinkDraw,
    alphaScale: number
  ) => {
    linkScratch.clear();
    appendThickLineQuad(
      linkScratch,
      { ax: link.ax, ay: link.ay, bx: link.bx, by: link.by },
      link.halfThickness
    );
    if (linkScratch.length < 6) {
      return;
    }

    gl.useProgram(lineProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    uploadArrayBuffer(gl, lineBuffer, vertexUpload, linkScratch.values, linkScratch.length);
    gl.enableVertexAttribArray(linePositionLoc);
    gl.vertexAttribPointer(linePositionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(lineMatrixLoc, false, matrix);
    gl.uniform3f(lineColorLoc, link.color[0], link.color[1], link.color[2]);
    gl.uniform1f(lineAlphaLoc, link.alpha * alphaScale);
    gl.drawArrays(gl.TRIANGLES, 0, linkScratch.length / 2);
  };

  return {
    resize(width, height) {
      layoutWidth = Math.max(1, width);
      layoutHeight = Math.max(1, height);
    },

    draw(frame: WebglDrawFrameInput) {
      const nodePositions = resolveNodes(frame);
      const matrix = writeOrthoMatrix(orthoMatrix, 0, layoutWidth, layoutHeight, 0);
      const extent = Math.min(layoutWidth, layoutHeight);
      drawnLinks.clear();

      const links = collectLinks(nodePositions, extent);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      links.forEach((link) => {
        drawThickLink(matrix, link, 0.42);
      });

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      links.forEach((link) => {
        drawThickLink(matrix, link, 1);
      });

      nodePositions.forEach((node) => {
        if (!node.screen.visible) {
          return;
        }

        drawDisc(node.screen.sx, node.screen.sy, node.size * 2.2, node.color, 0.1 + node.level * 0.12);
        drawDisc(node.screen.sx, node.screen.sy, node.size * 1.25, node.color, 0.24 + node.level * 0.2);
        drawDisc(node.screen.sx, node.screen.sy, node.size, node.color, 0.55 + node.level * 0.32);
      });

      gl.disable(gl.BLEND);
    },

    reset() {
      smoothedLevels.fill(0);
      smoothedEnergy = 0;
      smoothedBeat = 0;
      smoothedMid = 0;
      drawnLinks.clear();
      linkScratch.clear();
      linkDrawPool.length = 0;
    },

    destroy() {
      gl.deleteProgram(discProgram);
      gl.deleteProgram(lineProgram);
      gl.deleteBuffer(discBuffer);
      gl.deleteBuffer(lineBuffer);
    },
  };
}
