import getConfig from 'next/config';

export default function AppVersion({ className }: { className?: string }) {
  const { publicRuntimeConfig } = getConfig();
  const version = publicRuntimeConfig?.version;

  return <p className={className}>v{version}</p>;
}
