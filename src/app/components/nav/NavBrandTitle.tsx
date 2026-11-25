'use client';

import { IDLING_PRODUCT_NAME } from '@molecules/i18n/idlingProductName';

export function NavBrandTitle() {
  return <h1 className="nav__header">{IDLING_PRODUCT_NAME}</h1>;
}