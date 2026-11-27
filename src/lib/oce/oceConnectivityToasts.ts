/**
 * Maps OCE connectivity snapshots to the vendored toast stack (deduped, non-blocking).
 */
import { toast } from '@lib/toast';
import type { ConnectivityEngine, ConnectivitySnapshot } from './connectivity/types';

const OCE_NETWORK_TOAST_KEY = 'oce-network-unavailable';
const OCE_RECOVERED_TOAST_KEY = 'oce-network-recovered';

function describeUnavailable(snapshot: ConnectivitySnapshot): string {
  if (snapshot.healthContractFailed) {
    return 'The app is having trouble verifying connectivity. You can still try your action.';
  }
  return 'We are having trouble reaching the network. You can still try your action.';
}

function applyOceToastSnapshot(
  snapshot: ConnectivitySnapshot,
  wasUnavailableRef: { current: boolean }
): void {
  if (snapshot.unavailable) {
    wasUnavailableRef.current = true;
    toast.warning('Network trouble', {
      description: describeUnavailable(snapshot),
      dismissMode: 'manual',
      dedupeKey: OCE_NETWORK_TOAST_KEY,
    });
    return;
  }

  if (wasUnavailableRef.current) {
    toast.dismissByKey(OCE_NETWORK_TOAST_KEY);
    toast.success('Back online', {
      description: 'Network responses look healthy again.',
      dismissMode: 'auto',
      durationMs: 4_000,
      dedupeKey: OCE_RECOVERED_TOAST_KEY,
    });
  }

  wasUnavailableRef.current = false;
}

/** Subscribe once; returns unsubscribe (for client lifecycle / tests). */
export function bindOceConnectivityToasts(engine: ConnectivityEngine): () => void {
  const wasUnavailableRef = { current: false };

  const sync = () => {
    applyOceToastSnapshot(engine.getSnapshot(), wasUnavailableRef);
  };

  sync();
  return engine.subscribe(sync);
}