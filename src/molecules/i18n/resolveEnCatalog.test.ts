import { RADIO_EN } from '$i18n-source/radio.en';
import { getLL, initIdlingI18nAsync, setIdlingLocale } from '$i18n/idling-i18n';
import { resolveCatalogFromLl } from './resolveEnCatalog';

/**
 * @description typesafe-i18n namespaces are functions; catalog resolution must not fall back to English.
 */
test('when zh locale is active, resolveCatalogFromLl reads namespace functions on ll.radio.bar', async () => {
  await initIdlingI18nAsync('en');
  await setIdlingLocale('zh');

  const copy = resolveCatalogFromLl(RADIO_EN, getLL().radio as Record<string, unknown>);
  expect(copy.bar.pressPlayToStart).toBe(getLL().radio.bar.pressPlayToStart());
  expect(copy.bar.pressPlayToStart).not.toBe(RADIO_EN.bar.pressPlayToStart);
});