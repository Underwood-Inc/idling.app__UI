import { SuiteDetailPageClient } from '../SuiteDetailPageClient';

const ACCESS_HUB_BUILT_WITH = [
  'React 18',
  'TypeScript',
  'Vite',
  'Cloudflare Workers',
  'Cloudflare Pages',
] as const;

export default function AccessHubPage() {
  return (
    <SuiteDetailPageClient
      productId="access_hub"
      builtWith={ACCESS_HUB_BUILT_WITH}
      links={{
        launchHref: 'https://access.idling.app',
        sourceHref:
          'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/access-hub',
        mascotSrc: '/red_panda/img7.png',
      }}
      icons={{
        keyFeatures: ['users', 'check', 'pen', 'wrench', 'barChart', 'target'],
        extraSections: [['globe', 'settings']],
      }}
    />
  );
}