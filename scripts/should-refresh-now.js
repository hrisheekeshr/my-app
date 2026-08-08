#!/usr/bin/env node
/**
 * Exit 0 when the America/Chicago day/night cadence says a newspaper refresh
 * should run; exit 2 when this hourly tick should be skipped.
 *
 * Day 07:00–21:00 local: every 2 hours (odd hours)
 * Night 22:00 / 02:00 / 06:00 local: every 4 hours
 */
const { getRefreshDecision } = require('../src/lib/news');
const { TIMEZONE } = require('./feeds.config');

const decision = getRefreshDecision(new Date(), TIMEZONE);
console.log(`[schedule] ${decision.period} hour=${decision.hour} refresh=${decision.shouldRefresh} — ${decision.reason}`);

if (!decision.shouldRefresh) {
  process.exit(2);
}
