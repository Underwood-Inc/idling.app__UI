/**
 * DiceBear Core Mock - Comprehensive Implementation
 * 
 * This mock covers all the methods that our tests expect from @dicebear/core
 */

export const createAvatar = jest.fn(() => ({
  toString: () => '<svg>mock avatar</svg>',
  toDataUri: () => 'data:image/svg+xml;base64,mock-avatar-data'
}));

export class StyleOptions {
  constructor() {}
}

export class ColorOptions {
  constructor() {}
}
