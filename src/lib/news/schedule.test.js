const {
  getZonedParts,
  getPreviousDateKey,
  getRefreshDecision,
  shouldRunMorningBrief,
} = require('./schedule');

describe('schedule helpers', () => {
  test('getZonedParts returns a stable dateKey in America/Chicago', () => {
    // 2026-08-08 17:30 UTC = 12:30 CDT
    const parts = getZonedParts(new Date('2026-08-08T17:30:00.000Z'), 'America/Chicago');
    expect(parts.dateKey).toBe('2026-08-08');
    expect(parts.hour).toBe(12);
  });

  test('day refresh runs every 2 hours at odd hours 7–21', () => {
    // 16:05 UTC = 11:05 CDT → day refresh hour
    expect(getRefreshDecision(new Date('2026-08-08T16:05:00.000Z')).shouldRefresh).toBe(true);
    // 17:05 UTC = 12:05 CDT → skip
    expect(getRefreshDecision(new Date('2026-08-08T17:05:00.000Z')).shouldRefresh).toBe(false);
  });

  test('night refresh runs at 22, 2, and 6 local', () => {
    // 03:05 UTC = 22:05 CDT previous calendar day → night refresh
    expect(getRefreshDecision(new Date('2026-08-09T03:05:00.000Z')).shouldRefresh).toBe(true);
    // 04:05 UTC = 23:05 CDT → skip
    expect(getRefreshDecision(new Date('2026-08-09T04:05:00.000Z')).shouldRefresh).toBe(false);
    // 07:05 UTC = 02:05 CDT → night refresh
    expect(getRefreshDecision(new Date('2026-08-09T07:05:00.000Z')).shouldRefresh).toBe(true);
  });

  test('morning brief runs only at 05:00 local', () => {
    // 10:05 UTC = 05:05 CDT
    expect(shouldRunMorningBrief(new Date('2026-08-08T10:05:00.000Z'))).toBe(true);
    expect(shouldRunMorningBrief(new Date('2026-08-08T11:05:00.000Z'))).toBe(false);
  });

  test('getPreviousDateKey returns the prior local calendar day', () => {
    expect(getPreviousDateKey(new Date('2026-08-08T10:05:00.000Z'), 'America/Chicago')).toBe(
      '2026-08-07'
    );
  });
});
