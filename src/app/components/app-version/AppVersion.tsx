import getConfig from 'next/config';

export default function AppVersion({ className }: { className?: string }) {
  const { publicRuntimeConfig } = getConfig();
  const version = publicRuntimeConfig?.version;

  return (
    <a
      href="https://github.com/Underwood-Inc/idling.app__UI"
      target="_blank"
      className={className}
    >
      v{version}
    </a>
  );
}
