import { describe, expect, test } from 'vitest';
import {
  buildConstellationSphereMesh,
  projectConstellationScreenPoint,
  resolveConstellationWorldPosition,
} from './neonConstellationSphereMesh';

describe('neonConstellationSphereMesh', () => {
  test('buildConstellationSphereMesh creates linked vertices on a sphere', () => {
    const vertices = buildConstellationSphereMesh({ vertexCount: 32, neighborCount: 4 });

    expect(vertices.length).toBe(32);
    expect(vertices.reduce((sum, vertex) => sum + vertex.links.length, 0)).toBeGreaterThan(40);
  });

  test('resolveConstellationWorldPosition expands vertices with stronger audio level', () => {
    const [vertex] = buildConstellationSphereMesh({ vertexCount: 12, neighborCount: 3 });
    const calm = resolveConstellationWorldPosition({
      vertex,
      level: 0.05,
      energy: 0.05,
      beat: 0,
      time: 0,
      baseRadius: 1,
    });
    const loud = resolveConstellationWorldPosition({
      vertex,
      level: 0.9,
      energy: 0.8,
      beat: 0.7,
      time: 0.4,
      baseRadius: 1,
    });

    const calmRadius = Math.hypot(calm.x, calm.y, calm.z);
    const loudRadius = Math.hypot(loud.x, loud.y, loud.z);

    expect(loudRadius).toBeGreaterThan(calmRadius);
  });

  test('projectConstellationScreenPoint maps visible world points into screen space', () => {
    const viewProjection = new Float32Array(16);
    viewProjection[0] = 1;
    viewProjection[5] = 1;
    viewProjection[10] = -0.1;
    viewProjection[11] = -1;
    viewProjection[14] = -0.2;
    viewProjection[15] = 0;

    const projected = projectConstellationScreenPoint({
      viewProjection,
      width: 800,
      height: 600,
      position: { x: 0, y: 0, z: -2 },
    });

    expect(projected.visible).toBe(true);
    expect(projected.sx).toBeGreaterThan(0);
    expect(projected.sy).toBeGreaterThan(0);
  });
});
