import { render } from '@testing-library/react';
import { HomeHubTileVisual } from './HomeHubTileVisual';

/**
 * @description Parallax must respect reduced motion without driving React state every animation frame.
 */
test('when reduced motion is preferred, the hub tile visual mounts without throwing', () => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const original = media.matches;
  Object.defineProperty(media, 'matches', { configurable: true, value: true });

  expect(() =>
    render(
      <HomeHubTileVisual
        visual={{
          src: '/test.png',
          alt: 'test',
        }}
      />
    )
  ).not.toThrow();

  Object.defineProperty(media, 'matches', { configurable: true, value: original });
});