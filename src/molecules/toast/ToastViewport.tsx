'use client';

import { ACTIVE_TOAST_VIEWPORTS, type ToastViewportPlacement } from '@lib/toast/placement';
import { getToastSnapshot, subscribeToasts } from '@lib/toast/toastStore';
import { useSyncExternalStore } from 'react';
import { ToastCard } from './ToastCard';
import './toast.css';

function placementClass(placement: ToastViewportPlacement): string {
  return `idling-toast-viewport idling-toast-viewport--${placement}`;
}

export function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastSnapshot, () => []);

  const populated = ACTIVE_TOAST_VIEWPORTS.filter((placement) =>
    toasts.some((t) => t.placement === placement)
  );

  if (populated.length === 0) {
    return null;
  }

  return (
    <>
      {populated.map((placement) => {
        const regionToasts = toasts.filter((t) => t.placement === placement);
        return (
          <section
            key={placement}
            className={placementClass(placement)}
            aria-label="Notifications"
            data-site-chrome
          >
            <ol className="idling-toast-list">
              {regionToasts.map((record) => (
                <ToastCard key={record.id} toast={record} />
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}