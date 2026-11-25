import { SuiteDetailPageClient } from '../SuiteDetailPageClient';

const URL_SHORTENER_BUILT_WITH = [
  'Cloudflare Workers',
  'React',
  'TypeScript',
  'KV Storage',
  '@strixun/api-framework',
] as const;

export default function URLShortenerPage() {
  return (
    <SuiteDetailPageClient
      productId="url_shortener"
      builtWith={URL_SHORTENER_BUILT_WITH}
      links={{
        launchHref: 'https://s.idling.app',
        sourceHref:
          'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/url-shortener',
        mascotSrc: '/red_panda/img22.png',
      }}
      icons={{
        keyFeatures: ['scissors', 'barChart', 'palette', 'clock', 'globe', 'lockKeyhole'],
      }}
    />
  );
}