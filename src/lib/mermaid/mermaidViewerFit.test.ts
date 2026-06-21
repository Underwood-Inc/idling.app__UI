import { fitDiagramToViewport } from './mermaidViewerFit';

test('fitDiagramToViewport upscales small diagrams to fill the viewport by default', () => {
  const state = fitDiagramToViewport({
    viewportWidth: 1000,
    viewportHeight: 600,
    contentBox: { x: 0, y: 0, width: 200, height: 100 },
    padding: 20,
  });

  expect(state.scale).toBeGreaterThan(1);
  expect(state.translateX).toBeGreaterThan(0);
  expect(state.translateY).toBeGreaterThan(0);
});

test('fitDiagramToViewport centers offset diagram content', () => {
  const state = fitDiagramToViewport({
    viewportWidth: 800,
    viewportHeight: 500,
    contentBox: { x: 40, y: 30, width: 400, height: 200 },
    padding: 20,
    allowUpscale: false,
  });

  expect(state.scale).toBeLessThanOrEqual(1);

  const left = state.translateX + 40 * state.scale;
  const top = state.translateY + 30 * state.scale;
  const right = left + 400 * state.scale;
  const bottom = top + 200 * state.scale;

  expect(left).toBeGreaterThanOrEqual(19);
  expect(top).toBeGreaterThanOrEqual(19);
  expect(right).toBeLessThanOrEqual(781);
  expect(bottom).toBeLessThanOrEqual(481);
});

test('fitDiagramToViewport keeps full diagram inside padded viewport bounds', () => {
  const contentBox = { x: 10, y: 15, width: 900, height: 420 };
  const padding = 24;
  const viewportWidth = 960;
  const viewportHeight = 540;

  const state = fitDiagramToViewport({
    viewportWidth,
    viewportHeight,
    contentBox,
    padding,
    allowUpscale: false,
  });

  const left = state.translateX + contentBox.x * state.scale;
  const top = state.translateY + contentBox.y * state.scale;
  const right = left + contentBox.width * state.scale;
  const bottom = top + contentBox.height * state.scale;

  expect(left).toBeGreaterThanOrEqual(padding - 0.5);
  expect(top).toBeGreaterThanOrEqual(padding - 0.5);
  expect(right).toBeLessThanOrEqual(viewportWidth - padding + 0.5);
  expect(bottom).toBeLessThanOrEqual(viewportHeight - padding + 0.5);
});
