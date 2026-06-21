export interface FullscreenDocumentElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

export function isDocumentFullscreen(): boolean {
  const doc = document as FullscreenDocument;

  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

export async function requestDocumentFullscreen(): Promise<void> {
  const element = document.documentElement as FullscreenDocumentElement;

  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }

  if (element.webkitRequestFullscreen) {
    await element.webkitRequestFullscreen();
  }
}

export async function exitDocumentFullscreen(): Promise<void> {
  if (!isDocumentFullscreen()) {
    return;
  }

  const doc = document as FullscreenDocument;

  if (doc.exitFullscreen) {
    await doc.exitFullscreen();
    return;
  }

  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
    return;
  }

  if (doc.msExitFullscreen) {
    await doc.msExitFullscreen();
  }
}
