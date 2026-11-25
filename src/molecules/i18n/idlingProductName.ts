/** Product / domain brand — never localize (Mappy `PRODUCT_NAME` policy). */
export const IDLING_PRODUCT_NAME = 'idling.app' as const;

export type I18nIdlingProductNameParams = { readonly productName: typeof IDLING_PRODUCT_NAME };

export function i18nWithIdlingProductName<T extends Record<string, unknown>>(
  params?: T
): T & I18nIdlingProductNameParams {
  return { ...(params ?? {}), productName: IDLING_PRODUCT_NAME } as T & I18nIdlingProductNameParams;
}

export function withIdlingProductName(
  fn: (params: I18nIdlingProductNameParams) => string
): string {
  return fn({ productName: IDLING_PRODUCT_NAME });
}