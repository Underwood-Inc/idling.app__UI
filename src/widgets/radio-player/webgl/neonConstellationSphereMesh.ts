import { hashUnit } from './webglGlUtils';

export interface ConstellationSphereVertex {
  bx: number;
  by: number;
  bz: number;
  band: number;
  wobble: number;
  links: number[];
}

export interface ConstellationWorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface ConstellationScreenPoint {
  sx: number;
  sy: number;
  depth: number;
  visible: boolean;
}

export interface BuildConstellationSphereMeshOptions {
  vertexCount: number;
  neighborCount: number;
}

const DEFAULT_SPHERE_MESH_OPTIONS: BuildConstellationSphereMeshOptions = {
  vertexCount: 64,
  neighborCount: 4,
};

interface ConstellationNeighborDistance {
  index: number;
  distance: number;
}

export function buildConstellationSphereMesh(
  options: BuildConstellationSphereMeshOptions = DEFAULT_SPHERE_MESH_OPTIONS
): ConstellationSphereVertex[] {
  const vertices: ConstellationSphereVertex[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const count = Math.max(12, options.vertexCount);

  for (let index = 0; index < count; index += 1) {
    const t = index / Math.max(1, count - 1);
    const y = 1 - t * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    const jitter = (hashUnit(index * 2.71) - 0.5) * 0.04;

    const bx = Math.cos(theta) * ringRadius + jitter;
    const by = y + jitter * 0.6;
    const bz = Math.sin(theta) * ringRadius - jitter * 0.5;
    const length = Math.hypot(bx, by, bz) || 1;

    vertices.push({
      bx: bx / length,
      by: by / length,
      bz: bz / length,
      band: index / Math.max(1, count - 1),
      wobble: index * 1.73,
      links: [],
    });
  }

  for (let a = 0; a < vertices.length; a += 1) {
    const vertexA = vertices[a];
    const neighbors: ConstellationNeighborDistance[] = [];

    for (let b = 0; b < vertices.length; b += 1) {
      if (a === b) {
        continue;
      }

      const vertexB = vertices[b];
      const dx = vertexA.bx - vertexB.bx;
      const dy = vertexA.by - vertexB.by;
      const dz = vertexA.bz - vertexB.bz;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      neighbors.push({ index: b, distance });
    }

    neighbors.sort((left, right) => left.distance - right.distance);
    const linkCount = Math.min(options.neighborCount, neighbors.length);

    for (let neighborIndex = 0; neighborIndex < linkCount; neighborIndex += 1) {
      const targetIndex = neighbors[neighborIndex].index;
      if (!vertexA.links.includes(targetIndex)) {
        vertexA.links.push(targetIndex);
      }
      if (!vertices[targetIndex].links.includes(a)) {
        vertices[targetIndex].links.push(a);
      }
    }
  }

  return vertices;
}

export interface ResolveConstellationWorldPositionInput {
  vertex: ConstellationSphereVertex;
  level: number;
  energy: number;
  beat: number;
  time: number;
  baseRadius: number;
}

export function resolveConstellationWorldPosition(
  input: ResolveConstellationWorldPositionInput
): ConstellationWorldPosition {
  const { vertex, level, energy, beat, time, baseRadius } = input;
  let x = vertex.bx;
  let y = vertex.by;
  let z = vertex.bz;

  const length = Math.sqrt(x * x + y * y + z * z) || 1;
  x /= length;
  y /= length;
  z /= length;

  const rotY = time * 0.11;
  const rotX = Math.sin(time * 0.06) * 0.22;
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  let rotatedX = x * cosY + z * sinY;
  let rotatedZ = -x * sinY + z * cosY;
  x = rotatedX;
  z = rotatedZ;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const rotatedY = y * cosX - z * sinX;
  rotatedZ = y * sinX + z * cosX;
  y = rotatedY;
  z = rotatedZ;

  const wobble =
    Math.sin(time * 0.85 + vertex.wobble) * 0.035 * level +
    Math.cos(time * 0.55 + vertex.wobble * 1.2) * 0.022 * energy;
  const radius =
    baseRadius * (1 + level * 0.42 + energy * 0.14 + beat * 0.09 + wobble);

  return {
    x: x * radius,
    y: y * radius,
    z: z * radius,
  };
}

export interface ProjectConstellationScreenPointInput {
  viewProjection: Float32Array;
  width: number;
  height: number;
  position: ConstellationWorldPosition;
}

export function projectConstellationScreenPoint(
  input: ProjectConstellationScreenPointInput
): ConstellationScreenPoint {
  const { viewProjection, width, height, position } = input;
  const { x, y, z } = position;

  const clipX =
    viewProjection[0] * x +
    viewProjection[4] * y +
    viewProjection[8] * z +
    viewProjection[12];
  const clipY =
    viewProjection[1] * x +
    viewProjection[5] * y +
    viewProjection[9] * z +
    viewProjection[13];
  const clipZ =
    viewProjection[2] * x +
    viewProjection[6] * y +
    viewProjection[10] * z +
    viewProjection[14];
  const clipW =
    viewProjection[3] * x +
    viewProjection[7] * y +
    viewProjection[11] * z +
    viewProjection[15];

  if (clipW <= 0.001) {
    return { sx: 0, sy: 0, depth: 1, visible: false };
  }

  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;
  const ndcZ = clipZ / clipW;

  return {
    sx: (ndcX * 0.5 + 0.5) * width,
    sy: (0.5 - ndcY * 0.5) * height,
    depth: ndcZ,
    visible: ndcZ >= -1 && ndcZ <= 1,
  };
}
