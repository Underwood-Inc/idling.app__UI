export interface ProductTechStackItem {
  label: string;
  href: string;
}

/** Official docs / product sites for Built With pills on Strixun tour pages. */
export const PRODUCT_TECH_OFFICIAL_URLS: Record<string, string> = {
  'React 19': 'https://react.dev/',
  'React 18': 'https://react.dev/',
  React: 'https://react.dev/',
  TypeScript: 'https://www.typescriptlang.org/',
  Vite: 'https://vite.dev/',
  'TanStack Query': 'https://tanstack.com/query/latest',
  Zustand: 'https://zustand.docs.pmnd.rs/',
  '@preact/signals': 'https://preactjs.com/guide/v10/signals/',
  'styled-components': 'https://styled-components.com/',
  'Cloudflare Workers': 'https://developers.cloudflare.com/workers/',
  'R2 Storage': 'https://developers.cloudflare.com/r2/',
  'Cloudflare Pages': 'https://developers.cloudflare.com/pages/',
  'KV Storage': 'https://developers.cloudflare.com/kv/',
  'Svelte 5': 'https://svelte.dev/',
  'Resend API': 'https://resend.com/docs',
  JWT: 'https://jwt.io/',
  'OpenAPI 3.1.0': 'https://www.openapis.org/',
  'Swagger UI': 'https://swagger.io/tools/swagger-ui/',
  'OBS WebSocket': 'https://github.com/obsproject/obs-websocket',
  PWA: 'https://web.dev/explore/progressive-web-apps',
  '@strixun/api-framework': 'https://github.com/Underwood-Inc/strixun-stream-suite',
  Tauri: 'https://tauri.app/',
  'MapLibre GL JS': 'https://maplibre.org/',
};

export function productTechStackItems(labels: string[]): ProductTechStackItem[] {
  return labels.flatMap((label) => {
    const href = PRODUCT_TECH_OFFICIAL_URLS[label];

    if (!href) {
      return [];
    }

    return [{ label, href }];
  });
}