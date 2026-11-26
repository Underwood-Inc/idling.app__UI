import { describe, expect, test } from 'vitest';

import { clarityTextField } from './clarityTextField';

describe('clarityTextField', () => {
  test('when user id is numeric, it stringifies for Clarity identify', () => {
    expect(clarityTextField(42, 'anonymous')).toBe('42');
  });
});