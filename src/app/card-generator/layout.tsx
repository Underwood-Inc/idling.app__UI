import React, { Suspense } from 'react';
import { MysticalLoader } from './components/MysticalLoader';

function LoadingFallback() {
  return (
    <MysticalLoader
      message="Awakening the ancient card creation chamber..."
      fullScreen={true}
    />
  );
}

export default function OgImageViewerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
