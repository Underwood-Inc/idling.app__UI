/**
 * Maps {@link ConnectivityEngine} snapshots to vendored toasts.
 *
 * Deduped keys; manual dismiss while unavailable; auto dismiss on recovery.
 * Mounted from {@link OceProvider} — do not instantiate per route.
 */

import { toast } from '@lib/toast';
import type { ConnectivityEngine } from './connectivity/ConnectivityEngine';
import type { ConnectivitySnapshot } from './connectivity/types';

const OCE_NETWORK_TOAST_KEY = 'oce-network-unavailable';
const OCE_RECOVERED_TOAST_KEY = 'oce-network-recovered';

/** Subscribes to engine snapshot transitions and drives toast UI. */
export class OceConnectivityToastBinder {
  private previousUnavailable: boolean;

  /**
   * @param engine - Same instance as {@link OCE.engine}.
   */
  constructor(private readonly engine: ConnectivityEngine) {
    this.previousUnavailable = engine.getSnapshot().unavailable;
  }

  /**
   * Sync immediately, then on every engine publish.
   * @returns Unsubscribe (pass to `useEffect` cleanup).
   */
  bind(): () => void {
    this.sync();
    return this.engine.subscribe(() => this.sync());
  }

  private sync(): void {
    const snapshot = this.engine.getSnapshot();
    const wasUnavailable = this.previousUnavailable;
    this.applySnapshot(snapshot, wasUnavailable);
    this.previousUnavailable = snapshot.unavailable;
  }

  private describeUnavailable(snapshot: ConnectivitySnapshot): string {
    if (snapshot.healthContractFailed) {
      return 'The app is having trouble verifying connectivity. You can still try your action.';
    }
    return 'We are having trouble reaching the network. You can still try your action.';
  }

  private applySnapshot(
    snapshot: ConnectivitySnapshot,
    wasUnavailable: boolean
  ): void {
    if (snapshot.unavailable) {
      toast.warning('Network trouble', {
        description: this.describeUnavailable(snapshot),
        dismissMode: 'manual',
        dedupeKey: OCE_NETWORK_TOAST_KEY,
      });
      return;
    }

    if (wasUnavailable) {
      toast.dismissByKey(OCE_NETWORK_TOAST_KEY);
      toast.success('Back online', {
        description: 'Network responses look healthy again.',
        dismissMode: 'auto',
        durationMs: 4_000,
        dedupeKey: OCE_RECOVERED_TOAST_KEY,
      });
    }
  }
}