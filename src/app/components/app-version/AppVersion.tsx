import getConfig from 'next/config';
import { APP_VERSION_SELECTORS } from 'src/lib/test-selectors/components/app-version.selectors';

export default function AppVersion({
  className
}: Readonly<{ className?: string }>) {
  const { publicRuntimeConfig } = getConfig();
  const version = publicRuntimeConfig?.version;

  return (
    <a
      data-testid={APP_VERSION_SELECTORS.ANCHOR}
      href="https://github.com/Underwood-Inc/idling.app__UI"
      target="_blank"
      className={className}
    >
      v{version}
    </a>
  );
}
