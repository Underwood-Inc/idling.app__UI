import { isValidIanaTimezone } from './isValidIanaTimezone';

describe('isValidIanaTimezone', () => {
  test('when analytics uses UTC, the timezone is accepted for SQL grouping', () => {
    expect(isValidIanaTimezone('UTC')).toBe(true);
  });

  test('when an operator selects America/New_York, the timezone is accepted', () => {
    expect(isValidIanaTimezone('America/New_York')).toBe(true);
  });

  test('when a crafted timezone tries to break out of AT TIME ZONE, it is rejected', () => {
    expect(isValidIanaTimezone("UTC' ) AS x; SELECT pg_sleep(10); --")).toBe(false);
  });

  test('when an empty timezone is submitted, it is rejected', () => {
    expect(isValidIanaTimezone('')).toBe(false);
  });
});
