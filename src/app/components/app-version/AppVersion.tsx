'use client';

import { useEffect, useState } from 'react';
import { APP_VERSION_SELECTORS } from 'src/lib/test-selectors/components/app-version.selectors';

export default function AppVersion({
  className
}: Readonly<{ className?: string }>) {
  const [version, setVersion] = useState<string>('0.0.0');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get version from package.json via API or fetch
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => setVersion(data.version || '0.0.0'))
      .catch(() => setVersion('ERROR'));

    return () => {
      // Cleanup function to prevent memory leaks
      setMounted(false);
    };
  }, []);

  // Show placeholder during hydration to avoid layout shift
  if (!mounted) {
    return <span className={className}>v0.0.0</span>;
  }

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
