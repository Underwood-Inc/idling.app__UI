/** Minimal `Window` surface for navigator online/offline listeners. */
export type NavigatorOnLineWindow = Pick<
  Window,
  'addEventListener' | 'removeEventListener'
>;