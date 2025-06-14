import {
  formatLastUpdated,
  getAvailableTimezones,
  getFormattedDateTime
} from '../LinkTooltip';

// Mock Date.now() to return a fixed timestamp
const mockNow = 1700000000000; // 2023-11-14T12:13:20.000Z
const originalDateNow = Date.now;

describe('LinkTooltip', () => {
  beforeEach(() => {
    // Mock Date.now() before each test
    Date.now = jest.fn(() => mockNow);
  });

  afterEach(() => {
    // Restore Date.now() after each test
    Date.now = originalDateNow;
  });

  describe('formatLastUpdated', () => {
    const testCases = [
      // Seconds
      {
        timestamp: mockNow - 1000, // 1 second ago
        expected: '1s ago'
      },
      {
        timestamp: mockNow - 59000, // 59 seconds ago
        expected: '59s ago'
      },
      // Minutes
      {
        timestamp: mockNow - 60000, // 1 minute ago
        expected: '1m ago'
      },
      {
        timestamp: mockNow - 3599000, // 59 minutes 59 seconds ago
        expected: '59m 59s ago'
      },
      // Hours
      {
        timestamp: mockNow - 3600000, // 1 hour ago
        expected: '1h ago'
      },
      {
        timestamp: mockNow - 86399000, // 23 hours 59 minutes 59 seconds ago
        expected: '23h 59m 59s ago'
      },
      // Days
      {
        timestamp: mockNow - 86400000, // 1 day ago
        expected: '1d ago'
      },
      {
        timestamp: mockNow - 604799000, // 6 days 23 hours 59 minutes 59 seconds ago
        expected: '6d 23h 59m 59s ago'
      },
      // Months
      {
        timestamp: mockNow - 2592000000, // 30 days ago
        expected: '29d 23h ago'
      },
      {
        timestamp: mockNow - 31535999000, // 364 days 23 hours 59 minutes 59 seconds ago
        expected: '11mo 30d ago'
      },
      // Years
      {
        timestamp: mockNow - 31536000000, // 1 year ago
        expected: '1y ago'
      },
      {
        timestamp: mockNow - 315360000000, // 10 years ago
        expected: '9y 11mo 29d ago'
      },
      // Edge cases
      {
        timestamp: mockNow - 1, // Just now
        expected: '0s ago'
      },
      {
        timestamp: mockNow + 1000, // Future time
        expected: '0s ago'
      }
    ];

    testCases.forEach(({ timestamp, expected }) => {
      it(`should format ${expected} correctly`, () => {
        expect(formatLastUpdated(timestamp)).toBe(expected);
      });
    });

    it('should handle future timestamps', () => {
      const futureTimestamp = mockNow + 1000; // 1 second in the future
      expect(formatLastUpdated(futureTimestamp)).toBe('0s ago');
    });

    it('should handle invalid timestamps', () => {
      expect(formatLastUpdated(NaN)).toBe('0s ago');
      expect(formatLastUpdated(Infinity)).toBe('0s ago');
      expect(formatLastUpdated(-Infinity)).toBe('0s ago');
    });

    it('should format with different timezones', () => {
      const timestamp = mockNow - 3600000; // 1 hour ago
      expect(formatLastUpdated(timestamp, 'UTC')).toBe('1h ago');
      expect(formatLastUpdated(timestamp, 'America/New_York')).toBe('1h ago');
    });
  });

  describe('getFormattedDateTime', () => {
    it('should format date with timezone', () => {
      const timestamp = 1699999999999; // Nov 14, 2023, 10:13:20 PM UTC
      const utcResult = getFormattedDateTime(timestamp, 'UTC');
      const nyResult = getFormattedDateTime(timestamp, 'America/New_York');

      // Update pattern to match actual date-fns output
      expect(utcResult).toMatch(
        /^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [AP]M UTC$/
      );
      expect(nyResult).toMatch(
        /^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [AP]M EST$/
      );
    });

    it('should handle invalid timestamps', () => {
      const invalidTimestamp = 'invalid';
      const result = getFormattedDateTime(invalidTimestamp, 'UTC');
      expect(result).toBe('Invalid date');
    });
  });

  describe('getAvailableTimezones', () => {
    it('should return array of timezone info', () => {
      const timezones = getAvailableTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones[0]).toHaveProperty('name');
      expect(timezones[0]).toHaveProperty('offset');
    });

    it('should include common timezones', () => {
      const timezones = getAvailableTimezones();
      const timezoneNames = timezones.map((tz) => tz.name);

      // Check for timezones that are actually available in the list
      expect(timezoneNames).toContain('Africa/Abidjan'); // UTC+0
      expect(timezoneNames).toContain('America/New_York');
      expect(timezoneNames).toContain('Europe/London');
    });
  });
});
