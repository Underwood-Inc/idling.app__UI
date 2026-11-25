import { SuiteDetailPageClient } from '../SuiteDetailPageClient';

const AUTH_SERVICE_BUILT_WITH = [
  'Cloudflare Workers',
  'Svelte 5',
  'TypeScript',
  'KV Storage',
  'Resend API',
  'JWT',
  'OpenAPI 3.1.0',
  'Swagger UI',
] as const;

export default function AuthServicePage() {
  return (
    <SuiteDetailPageClient
      productId="auth_service"
      builtWith={AUTH_SERVICE_BUILT_WITH}
      links={{
        launchHref: 'https://auth.idling.app',
        sourceHref:
          'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/otp-auth-service',
        mascotSrc: '/red_panda/img6.png',
      }}
      icons={{
        keyFeatures: ['key', 'ticket', 'wrench', 'barChart', 'bookOpen', 'link'],
        extraSections: [['palette', 'library', 'flask']],
      }}
    />
  );
}