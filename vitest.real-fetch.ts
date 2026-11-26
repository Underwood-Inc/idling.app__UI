/** Node fetch captured before vitest.setup replaces global fetch. */
export const realFetch = globalThis.fetch.bind(globalThis);
