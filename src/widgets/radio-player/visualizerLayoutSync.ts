export interface ScheduleVisualizerLayoutSyncOptions {
  frame: HTMLElement;
  minSize?: number;
  maxAttempts?: number;
  onSize: (width: number, height: number) => void;
}

/** Wait until the visualizer frame has non-zero layout (common on mobile first paint). */
export function scheduleVisualizerLayoutSync(
  options: ScheduleVisualizerLayoutSyncOptions
): () => void {
  const minSize = options.minSize ?? 48;
  const maxAttempts = options.maxAttempts ?? 24;
  let attempts = 0;
  let rafId = 0;
  let cancelled = false;

  const tick = () => {
    if (cancelled) {
      return;
    }

    const width = options.frame.clientWidth;
    const height = options.frame.clientHeight;

    if (width >= minSize && height >= minSize) {
      options.onSize(width, height);
      return;
    }

    attempts += 1;
    if (attempts < maxAttempts) {
      rafId = requestAnimationFrame(tick);
    }
  };

  tick();

  return () => {
    cancelled = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
}
