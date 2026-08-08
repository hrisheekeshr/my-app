/**
 * Publication schedule helpers for America/Chicago day/night refresh cadence.
 *
 * Day (07:00–21:59): refresh every 2 hours at 7,9,11,13,15,17,19,21
 * Night (22:00–06:59): refresh every 4 hours at 22, 2, 6
 * Morning brief: 05:00
 */

const DEFAULT_TIMEZONE = 'America/Chicago';

/**
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {{ year: number, month: number, day: number, hour: number, minute: number, dateKey: string }}
 */
function getZonedParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/**
 * Yesterday's YYYY-MM-DD in the configured timezone.
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {string}
 */
function getPreviousDateKey(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  // Walk back hour-by-hour until the zoned calendar day changes (handles DST).
  const today = getZonedParts(date, timeZone).dateKey;
  let cursor = new Date(date.getTime());
  for (let i = 0; i < 48; i += 1) {
    cursor = new Date(cursor.getTime() - 60 * 60 * 1000);
    const key = getZonedParts(cursor, timeZone).dateKey;
    if (key !== today) return key;
  }
  return today;
}

/**
 * Whether the current Chicago local time is in the night refresh window.
 * Night = 22:00–06:59 inclusive of start hours used for cadence.
 * @param {number} hour
 * @returns {boolean}
 */
function isNightHour(hour) {
  return hour >= 22 || hour < 7;
}

/**
 * Whether a refresh should run at this local hour for the day/night cadence.
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {{ shouldRefresh: boolean, period: 'day'|'night', hour: number, reason: string }}
 */
function getRefreshDecision(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const { hour } = getZonedParts(date, timeZone);
  const night = isNightHour(hour);

  if (night) {
    const allowed = hour === 22 || hour === 2 || hour === 6;
    return {
      shouldRefresh: allowed,
      period: 'night',
      hour,
      reason: allowed
        ? `Night refresh window hour ${hour}:00`
        : `Night hours refresh only at 22:00, 02:00, and 06:00 (local); now ${hour}:00`,
    };
  }

  const allowed = hour >= 7 && hour <= 21 && hour % 2 === 1;
  return {
    shouldRefresh: allowed,
    period: 'day',
    hour,
    reason: allowed
      ? `Day refresh window hour ${hour}:00`
      : `Day hours refresh every 2 hours at 7–21 odd hours; now ${hour}:00`,
  };
}

/**
 * Whether the morning brief should run (05:00 local hour).
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {boolean}
 */
function shouldRunMorningBrief(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  return getZonedParts(date, timeZone).hour === 5;
}

module.exports = {
  DEFAULT_TIMEZONE,
  getZonedParts,
  getPreviousDateKey,
  isNightHour,
  getRefreshDecision,
  shouldRunMorningBrief,
};
