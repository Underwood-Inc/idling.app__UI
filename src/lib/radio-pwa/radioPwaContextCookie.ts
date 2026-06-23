import {
  RADIO_PWA_CONTEXT_COOKIE_NAME,
  RADIO_PWA_CONTEXT_COOKIE_VALUE,
} from './constants';
import type { NextRequest } from 'next/server';

export function hasRadioPwaContextCookie(request: NextRequest): boolean {
  return (
    request.cookies.get(RADIO_PWA_CONTEXT_COOKIE_NAME)?.value ===
    RADIO_PWA_CONTEXT_COOKIE_VALUE
  );
}

export function buildRadioPwaContextCookieAttribute(): string {
  return `${RADIO_PWA_CONTEXT_COOKIE_NAME}=${RADIO_PWA_CONTEXT_COOKIE_VALUE};path=/;max-age=31536000;SameSite=Lax`;
}

export function buildClearRadioPwaContextCookieAttribute(): string {
  return `${RADIO_PWA_CONTEXT_COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
}
