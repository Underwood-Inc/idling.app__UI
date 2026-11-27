'use client';

import { bindOceConnectivityToasts } from '@lib/oce/oceConnectivityToasts';
import { getIdlingOceEngine } from '@lib/oce/idlingFetch';
import { useEffect } from 'react';

/** Client mount: wire page OCE singleton to the toast stack. */
export function OceConnectivityToastBridge() {
  useEffect(() => {
    return bindOceConnectivityToasts(getIdlingOceEngine());
  }, []);

  return null;
}