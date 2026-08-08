#!/usr/bin/env node
/** Compile a morning brief + follow-ups from yesterday's archived issue. */
const fs = require('fs');
const path = require('path');
const {
  buildMorningBrief,
  getPreviousDateKey,
  getZonedParts,
} = require('../src/lib/news');
const { TIMEZONE } = require('./feeds.config');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const LATEST_PATH = path.join(DATA_DIR, 'latest.json');
const BRIEF_PATH = path.join(DATA_DIR, 'morning-brief.json');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolvePreviousIssue(forDate) {
  const archived = readJson(path.join(ARCHIVE_DIR, `${forDate}.json`));
  if (archived) return { issue: archived, source: `archive/${forDate}.json` };

  const previousPointer = readJson(path.join(DATA_DIR, 'previous.json'));
  if (previousPointer) return { issue: previousPointer, source: 'previous.json' };

  return { issue: null, source: null };
}

function generate() {
  const now = new Date();
  const forDate = process.env.MORNING_BRIEF_DATE || getPreviousDateKey(now, TIMEZONE);
  const { issue: previousIssue, source } = resolvePreviousIssue(forDate);
  const currentIssue = readJson(LATEST_PATH);

  if (!previousIssue) {
    const empty = {
      brand: 'Four Corners Daily',
      type: 'morning-brief',
      forDate,
      generatedAt: now.toISOString(),
      timezone: TIMEZONE,
      publicationDate: null,
      summary: `Morning brief for ${forDate}: no archived previous-day issue was found yet. Refresh the newspaper during the day so tomorrow’s 5 AM brief has source material.`,
      sections: [],
      meta: {
        previousStories: 0,
        followUpsFound: 0,
        mode: 'deterministic',
        missingArchive: true,
        today: getZonedParts(now, TIMEZONE).dateKey,
      },
      errors: [{ source: 'morning-brief', message: `Missing archive for ${forDate}` }],
    };
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(BRIEF_PATH, `${JSON.stringify(empty, null, 2)}\n`, 'utf8');
    console.warn(`[morning-brief] No archive for ${forDate}; wrote empty brief → ${path.relative(process.cwd(), BRIEF_PATH)}`);
    process.exitCode = 0;
    return;
  }

  if (!currentIssue) {
    throw new Error('public/data/latest.json is required to locate follow-ups');
  }

  const brief = buildMorningBrief(previousIssue, currentIssue, {
    forDate,
    generatedAt: now,
    timezone: TIMEZONE,
  });
  brief.meta.archiveSource = source;
  brief.meta.currentGeneratedAt = currentIssue.generatedAt || null;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BRIEF_PATH, `${JSON.stringify(brief, null, 2)}\n`, 'utf8');
  console.log(
    `[morning-brief] Wrote brief for ${forDate} (${brief.meta.previousStories} stories, ${brief.meta.followUpsFound} follow-ups) → ${path.relative(process.cwd(), BRIEF_PATH)}`
  );
}

generate();
