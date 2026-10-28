import { describe, expect, it } from 'vitest';
import { formatDateTime } from '../../src/utils/labels';

describe('formatDateTime', () => {
  it('shows the weekday, date and 12-hour time, like the app ("Wed, 28 Oct · 10:42 AM")', () => {
    // Local-time constructor: the result does not depend on the machine's time zone.
    expect(formatDateTime(new Date(2026, 9, 28, 10, 42).toISOString())).toBe('Wed, 28 Oct · 10:42 AM');
    expect(formatDateTime(new Date(2026, 9, 29, 0, 5).toISOString())).toBe('Thu, 29 Oct · 12:05 AM');
    expect(formatDateTime(new Date(2026, 9, 29, 12, 0).toISOString())).toBe('Thu, 29 Oct · 12:00 PM');
  });

  it('shows a dash when there is no time (older trips were not recorded)', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('not a date')).toBe('—');
  });
});
