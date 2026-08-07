#!/usr/bin/env node
/**
 * Daily newspaper generation pipeline.
 *
 * 1. Fetch RSS feeds (always; no API key required)
 * 2. Optionally enrich with NewsAPI when NEWS_API_KEY is set
 * 3. Normalize + deduplicate
 * 4. Write public/data/latest.json for the React app
 *
 * Failures are per-source: one broken feed does not block the issue.
 */

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const {
  normalizeItem,
  dedupeStories,
  SECTIONS,
} = require('../src/lib/news');
const {
  DEFAULT_MAX_PER_SECTION,
  TIMEZONE,
  RSS_FEEDS,
  NEWS_API_QUERIES,
} = require('./feeds.config');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'latest.json');
const FETCH_TIMEOUT_MS = Number(process.env.NEWS_FETCH_TIMEOUT_MS || 15000);

const parser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  headers: {
    'User-Agent': 'DailyNewspaperGenerator/1.0 (+https://github.com/hrisheekeshr/my-app)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

function formatPublicationDate(date, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

async function fetchRssFeed(feed) {
  const parsed = await parser.parseURL(feed.url);
  const sourceName = feed.name || parsed.title || 'RSS';
  const items = (parsed.items || [])
    .map((item) => normalizeItem(item, feed.section, sourceName))
    .filter(Boolean);

  return {
    feed,
    items,
    error: null,
  };
}

async function fetchNewsApi(query, apiKey) {
  const params = new URLSearchParams({
    pageSize: String(Math.min(DEFAULT_MAX_PER_SECTION * 2, 20)),
    apiKey,
  });

  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.country) params.set('country', query.country);
  if (query.language) params.set('language', query.language);

  const endpoint = query.category
    ? `https://newsapi.org/v2/top-headlines?${params}`
    : `https://newsapi.org/v2/everything?${params}&sortBy=publishedAt`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`NewsAPI HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (payload.status !== 'ok') {
      throw new Error(payload.message || 'NewsAPI error');
    }

    const items = (payload.articles || [])
      .map((article) =>
        normalizeItem(
          {
            title: article.title,
            link: article.url,
            description: article.description || article.content,
            source: article.source?.name,
            publishedAt: article.publishedAt,
            imageUrl: article.urlToImage,
          },
          query.section,
          article.source?.name || 'NewsAPI'
        )
      )
      .filter(Boolean);

    return { query, items, error: null };
  } finally {
    clearTimeout(timer);
  }
}

function pickLeadStory(sectionsPayload) {
  const priority = ['ai', 'technology', 'global', 'chicago'];
  for (const id of priority) {
    const lead = sectionsPayload[id]?.stories?.[0];
    if (lead) return lead;
  }
  return null;
}

async function generate() {
  const generatedAt = new Date();
  const errors = [];
  const sourceReports = [];
  const allStories = [];

  console.log(`[newspaper] Generating issue for ${TIMEZONE}…`);

  const rssResults = await Promise.allSettled(RSS_FEEDS.map((feed) => fetchRssFeed(feed)));

  rssResults.forEach((result, index) => {
    const feed = RSS_FEEDS[index];
    if (result.status === 'fulfilled') {
      allStories.push(...result.value.items);
      sourceReports.push({
        type: 'rss',
        name: feed.name,
        section: feed.section,
        count: result.value.items.length,
        ok: true,
      });
      console.log(`[newspaper] ✓ ${feed.name}: ${result.value.items.length} items`);
    } else {
      const message = result.reason?.message || String(result.reason);
      errors.push({ source: feed.name, section: feed.section, message });
      sourceReports.push({
        type: 'rss',
        name: feed.name,
        section: feed.section,
        count: 0,
        ok: false,
        message,
      });
      console.warn(`[newspaper] ✗ ${feed.name}: ${message}`);
    }
  });

  const newsApiKey = process.env.NEWS_API_KEY;
  if (newsApiKey) {
    console.log('[newspaper] NEWS_API_KEY detected — enriching with NewsAPI…');
    const apiResults = await Promise.allSettled(
      NEWS_API_QUERIES.map((query) => fetchNewsApi(query, newsApiKey))
    );

    apiResults.forEach((result, index) => {
      const query = NEWS_API_QUERIES[index];
      const label = `NewsAPI:${query.section}`;
      if (result.status === 'fulfilled') {
        allStories.push(...result.value.items);
        sourceReports.push({
          type: 'newsapi',
          name: label,
          section: query.section,
          count: result.value.items.length,
          ok: true,
        });
        console.log(`[newspaper] ✓ ${label}: ${result.value.items.length} items`);
      } else {
        const message = result.reason?.message || String(result.reason);
        errors.push({ source: label, section: query.section, message });
        sourceReports.push({
          type: 'newsapi',
          name: label,
          section: query.section,
          count: 0,
          ok: false,
          message,
        });
        console.warn(`[newspaper] ✗ ${label}: ${message}`);
      }
    });
  } else {
    console.log('[newspaper] No NEWS_API_KEY — using RSS-only fallback');
  }

  const sectionsPayload = {};
  SECTIONS.forEach((section) => {
    const sectionStories = allStories.filter((story) => story.section === section.id);
    const deduped = dedupeStories(sectionStories).slice(0, DEFAULT_MAX_PER_SECTION);
    sectionsPayload[section.id] = {
      id: section.id,
      title: section.title,
      shortTitle: section.shortTitle,
      description: section.description,
      stories: deduped.map(({ titleKey, urlKey, ...publicStory }) => publicStory),
    };
  });

  const issue = {
    brand: 'Four Corners Daily',
    tagline: 'AI · Technology · Chicago · The World',
    generatedAt: generatedAt.toISOString(),
    timezone: TIMEZONE,
    publicationDate: formatPublicationDate(generatedAt, TIMEZONE),
    leadStory: (() => {
      const lead = pickLeadStory(sectionsPayload);
      if (!lead) return null;
      const { titleKey, urlKey, ...publicLead } = lead;
      return publicLead;
    })(),
    sections: sectionsPayload,
    meta: {
      totalStories: Object.values(sectionsPayload).reduce(
        (sum, section) => sum + section.stories.length,
        0
      ),
      sourcesAttempted: sourceReports.length,
      sourcesSucceeded: sourceReports.filter((report) => report.ok).length,
      maxPerSection: DEFAULT_MAX_PER_SECTION,
      mode: newsApiKey ? 'rss+newsapi' : 'rss',
    },
    errors,
    sources: sourceReports,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(issue, null, 2)}\n`, 'utf8');

  console.log(
    `[newspaper] Wrote ${issue.meta.totalStories} stories → ${path.relative(process.cwd(), OUTPUT_PATH)}`
  );

  if (issue.meta.totalStories === 0) {
    console.error('[newspaper] Warning: issue contains zero stories');
    process.exitCode = 1;
  }
}

generate().catch((error) => {
  console.error('[newspaper] Fatal error:', error);
  process.exit(1);
});
