import { productTechStackItems } from './productTechStackCatalog';

/** Union of labels on all Strixun tour Built With sections — must resolve in PRODUCT_TECH_OFFICIAL_URLS */
const STRIXUN_TOUR_BUILT_WITH_LABELS = [
  'React 19',
  'React 18',
  'React',
  'TypeScript',
  'Vite',
  'TanStack Query',
  'Zustand',
  '@preact/signals',
  'styled-components',
  'Cloudflare Workers',
  'R2 Storage',
  'Cloudflare Pages',
  'KV Storage',
  'Svelte 5',
  'OBS WebSocket',
  'PWA',
  '@strixun/api-framework',
  'Resend API',
  'JWT',
  'OpenAPI 3.1.0',
  'Swagger UI',
] as const;

test('when built-with labels are resolved, each item links to an official https URL', () => {
  const items = productTechStackItems(['React 19', 'TanStack Query', 'Cloudflare Workers']);

  expect(items).toHaveLength(3);
  expect(items[0]?.href).toMatch(/^https:\/\//);
  expect(items[0]?.href).toContain('react.dev');
});

test('every Strixun tour built-with label resolves to a link (no silent drops)', () => {
  const items = productTechStackItems([...STRIXUN_TOUR_BUILT_WITH_LABELS]);

  expect(items).toHaveLength(STRIXUN_TOUR_BUILT_WITH_LABELS.length);
  for (const item of items) {
    expect(item.href).toMatch(/^https:\/\//);
    expect(item.label.length).toBeGreaterThan(0);
  }
});