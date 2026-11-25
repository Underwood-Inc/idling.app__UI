import { SuiteDetailPageClient } from '../SuiteDetailPageClient';

const STREAM_SUITE_BUILT_WITH = [
  'Svelte 5',
  'TypeScript',
  'Vite',
  'OBS WebSocket',
  'PWA',
] as const;

export default function StreamSuitePage() {
  return (
    <SuiteDetailPageClient
      productId="stream_suite"
      builtWith={STREAM_SUITE_BUILT_WITH}
      links={{
        launchHref: 'https://streamkit.idling.app',
        sourceHref: 'https://github.com/Underwood-Inc/strixun-stream-suite',
        mascotSrc: '/red_panda/img4.png',
      }}
      icons={{
        keyFeatures: ['sparkles', 'refresh', 'palette', 'messages', 'smartphone', 'globe'],
      }}
    />
  );
}