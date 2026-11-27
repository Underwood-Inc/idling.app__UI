import { enhanceMermaidDiagrams } from '../lib/mermaid/mermaidViewer';

let watching = false;

function scanMermaidDiagrams(): void {
  enhanceMermaidDiagrams(document);
}

function watchMermaidDiagrams(): void {
  if (watching || !document.body) return;
  watching = true;

  scanMermaidDiagrams();

  const observer = new MutationObserver(() => {
    scanMermaidDiagrams();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchMermaidDiagrams);
  } else {
    watchMermaidDiagrams();
  }
}