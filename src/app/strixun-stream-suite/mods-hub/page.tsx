import { SuiteDetailPageClient } from '../SuiteDetailPageClient';

const MODS_HUB_BUILT_WITH = [
  'React 19',
  'TypeScript',
  'Vite',
  'TanStack Query',
  'Zustand',
  '@preact/signals',
  'styled-components',
  'Cloudflare Workers',
  'R2 Storage',
] as const;

export default function ModsHubPage() {
  return (
    <SuiteDetailPageClient
      productId="mods_hub"
      builtWith={MODS_HUB_BUILT_WITH}
      links={{
        launchHref: 'https://mods.idling.app',
        sourceHref:
          'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/mods-hub',
        mascotSrc: '/red_panda/img11.png',
      }}
      icons={{
        keyFeatures: ['upload', 'hash', 'search', 'arrowDown', 'palette', 'lockKeyhole'],
        extraSections: [['zap', 'globe', 'refresh']],
      }}
    />
  );
}