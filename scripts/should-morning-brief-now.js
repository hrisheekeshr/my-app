#!/usr/bin/env node
/** Exit 0 at 05:00 America/Chicago; otherwise exit 2. */
const { shouldRunMorningBrief, getZonedParts } = require('../src/lib/news');
const { TIMEZONE } = require('./feeds.config');

const now = new Date();
const parts = getZonedParts(now, TIMEZONE);
const allowed = shouldRunMorningBrief(now, TIMEZONE);
console.log(`[schedule] local=${parts.dateKey} ${parts.hour}:00 morningBrief=${allowed}`);

if (!allowed) {
  process.exit(2);
}
