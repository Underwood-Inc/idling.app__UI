'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import {
  dismissToast,
  pauseToastAutoDismiss,
  resumeToastAutoDismiss,
} from '@lib/toast/toastStore';
import type { ToastRecord } from '@lib/toast/types';
import { useEffect, useRef, useState } from 'react';

const VARIANT_ICON: Record<ToastRecord['variant'], SiteIconId> = {
  info: 'info',
  success: 'check',
  warning: 'alertTriangle',
  error: 'circleX',
};

export interface ToastCardProps {
  toast: ToastRecord;
}

export function ToastCard({ toast }: ToastCardProps) {
  const [progress, setProgress] = useState(100);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (toast.dismissMode !== 'auto') {
      return;
    }

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / toast.durationMs) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [toast.createdAt, toast.dismissMode, toast.durationMs, toast.id]);

  const role = toast.variant === 'error' ? 'alert' : 'status';

  return (
    <li
      className={`idling-toast idling-toast--${toast.variant}`}
      role={role}
      aria-live={toast.ariaLive}
      aria-atomic="true"
      onMouseEnter={() => pauseToastAutoDismiss(toast.id)}
      onMouseLeave={() => resumeToastAutoDismiss(toast.id)}
      onFocusCapture={() => pauseToastAutoDismiss(toast.id)}
      onBlurCapture={() => resumeToastAutoDismiss(toast.id)}
    >
      <div className="idling-toast__body">
        <p className="idling-toast__title">
          <SiteIcon id={VARIANT_ICON[toast.variant]} sizeRem={0.9} aria-hidden />
          {' '}
          {toast.title}
        </p>
        {toast.description ? (
          <p className="idling-toast__description">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="idling-toast__dismiss no-glass"
        aria-label="Dismiss notification"
        onClick={() => dismissToast(toast.id)}
      >
        <SiteIcon id="x" sizeRem={1} aria-hidden />
      </button>
      {toast.dismissMode === 'auto' ? (
        <div className="idling-toast__progress" aria-hidden>
          <span
            className="idling-toast__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}