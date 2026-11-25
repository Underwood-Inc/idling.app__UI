type LocalizedFn = () => string;

function isLocalizedFn(value: unknown): value is LocalizedFn {
  return typeof value === 'function';
}

/** typesafe-i18n namespaces are often functions with leaf translators attached as properties. */
function isLlRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

/** Project nested `ll.*` functions onto a plain English catalog tree. */
export function resolveCatalogFromLl<T>(english: T, localized: unknown): T {
  if (english === null || english === undefined) {
    return english;
  }

  if (typeof english === 'string') {
    if (isLocalizedFn(localized)) {
      return localized() as T;
    }
    return english;
  }

  if (Array.isArray(english)) {
    if (!Array.isArray(localized)) {
      return english;
    }
    return english.map((row, index) =>
      resolveCatalogFromLl(row, localized[index])
    ) as T;
  }

  if (typeof english === 'object') {
    const enRecord = english as Record<string, unknown>;
    const llRecord = isLlRecord(localized) ? localized : {};
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(enRecord)) {
      result[key] = resolveCatalogFromLl(enRecord[key], llRecord[key]);
    }
    return result as T;
  }

  return english;
}