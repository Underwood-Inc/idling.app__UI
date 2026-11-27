'use client';

import { useSyncExternalStore } from 'react';
import { getPageConnectivityEngine } from './getPageConnectivityEngine';
import { SERVER_OCE_SNAPSHOT, type ConnectivitySnapshot } from './types';

function subscribe(onStoreChange: () => void): () => void {
  return getPageConnectivityEngine().subscribe(onStoreChange);
}

function getSnapshot(): ConnectivitySnapshot {
  return getPageConnectivityEngine().getSnapshot();
}

function getServerSnapshot(): ConnectivitySnapshot {
  return SERVER_OCE_SNAPSHOT;
}

export function useConnectivitySnapshot(): ConnectivitySnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useOceUnavailable(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getPageConnectivityEngine().getSnapshot().unavailable,
    () => false
  );
}