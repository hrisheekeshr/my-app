#!/usr/bin/env node
/** Fetch, normalize, dedupe, and optionally curate the daily newspaper. */
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { normalizeItem, dedupeStories, SECTIONS } = require('../src/lib/news');
const { DEFAULT_MAX_PER_SECTION, TIMEZONE, RSS_FEEDS, NEWS_API_QUERIES } = require('./feeds.config');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'latest.json');
const FETCH_TIMEOUT_MS = Number(process.env.NEWS_FETCH_TIMEOUT_MS || 12000);
const EDITOR_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const parser = new Parser({ headers: { 'User-Agent': 'DailyNewspaperGenerator/1.0', Accept: 'application/rss+xml, application/xml, text/xml, */*' } });

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'DailyNewspaperGenerator/1.0', Accept: 'application/rss+xml, application/xml, text/xml, application/json, */*' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`Timed out after ${FETCH_TIMEOUT_MS}ms`);
    throw error;
  } finally { clearTimeout(timer); }
}

async function fetchRssFeed(feed) {
  const parsed = await parser.parseString(await fetchText(feed.url));
  const sourceName = feed.name || parsed.title || 'RSS';
  return (parsed.items || []).slice(0, DEFAULT_MAX_PER_SECTION * 3)
    .map(item => normalizeItem(item, feed.section, sourceName)).filter(Boolean);
}

async function fetchNewsApi(query, apiKey) {
  const params = new URLSearchParams({ pageSize: String(Math.min(DEFAULT_MAX_PER_SECTION * 2, 20)), apiKey });
  Object.entries(query).forEach(([key, value]) => { if (key !== 'section') params.set(key, value); });
  const endpoint = query.category ? `https://newsapi.org/v2/top-headlines?${params}` : `https://newsapi.org/v2/everything?${params}&sortBy=publishedAt`;
  const payload = JSON.parse(await fetchText(endpoint));
  if (payload.status !== 'ok') throw new Error(payload.message || 'NewsAPI error');
  return (payload.articles || []).map(article => normalizeItem({ title: article.title, link: article.url, description: article.description || article.content, source: article.source?.name, publishedAt: article.publishedAt, imageUrl: article.urlToImage }, query.section, article.source?.name || 'NewsAPI')).filter(Boolean);
}

function publicStory(story) { const { titleKey, urlKey, ...result } = story; return result; }
function deterministicSections(stories) {
  const sections = {};
  SECTIONS.forEach(section => {
    const selected = dedupeStories(stories.filter(story => story.section === section.id)).slice(0, DEFAULT_MAX_PER_SECTION);
    sections[section.id] = { id: section.id, title: section.title, shortTitle: section.shortTitle, description: section.description, stories: selected.map(publicStory) };
  });
  return sections;
}

function validateEditorialResult(value, candidates) {
  if (!value || !Array.isArray(value.sections)) throw new Error('Editorial response has no sections array');
  const byUrl = new Map(candidates.map(story => [story.url, story]));
  const sections = {};
  for (const section of SECTIONS) {
    const returned = value.sections.find(item => item.id === section.id);
    if (!returned || !Array.isArray(returned.stories)) throw new Error(`Editorial response missing ${section.id}`);
    const stories = returned.stories.slice(0, DEFAULT_MAX_PER_SECTION).map(item => {
      const source = byUrl.get(item.url);
      if (!source || source.section !== section.id) return null;
      return { ...publicStory(source), title: typeof item.title === 'string' ? item.title.slice(0, 240) : source.title, summary: typeof item.summary === 'string' ? item.summary.slice(0, 600) : source.summary };
    }).filter(Boolean);
    sections[section.id] = { id: section.id, title: section.title, shortTitle: section.shortTitle, description: section.description, stories };
  }
  if (!Object.values(sections).some(section => section.stories.length)) throw new Error('Editorial response selected no valid stories');
  return sections;
}

async function curateWithOpenAI(candidates) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const input = candidates.map((story, index) => ({ index, section: story.section, title: story.title, summary: story.summary, url: story.url, source: story.source, publishedAt: story.publishedAt }));
  const body = {
    model: EDITOR_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a careful newspaper editor. Select and rank the best timely, substantive, non-duplicative stories for AI, Technology, Chicago, and Global. Use only supplied candidates. Never invent facts, URLs, sources, or stories. Return JSON only: {"sections":[{"id":"ai|technology|chicago|global","stories":[{"url":"candidate URL","title":"accurate headline","summary":"concise factual summary"}]}]}. Include every section, at most the requested limit, and omit weak candidates.' },
      { role: 'user', content: `Select up to ${DEFAULT_MAX_PER_SECTION} stories per section. Preserve candidate URLs exactly. Candidate stories:\n${JSON.stringify(input)}` }
    ]
  };
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no editorial content');
  return validateEditorialResult(JSON.parse(content), candidates);
}

async function generate() {
  const generatedAt = new Date();
  const errors = [], sourceReports = [], allStories = [];
  const rssResults = await Promise.allSettled(RSS_FEEDS.map(fetchRssFeed));
  rssResults.forEach((result, index) => {
    const feed = RSS_FEEDS[index];
    if (result.status === 'fulfilled') { allStories.push(...result.value); sourceReports.push({ type: 'rss', name: feed.name, section: feed.section, count: result.value.length, ok: true }); }
    else { const message = result.reason?.message || String(result.reason); errors.push({ source: feed.name, section: feed.section, message }); sourceReports.push({ type: 'rss', name: feed.name, section: feed.section, count: 0, ok: false, message }); }
  });
  if (process.env.NEWS_API_KEY) {
    const apiResults = await Promise.allSettled(NEWS_API_QUERIES.map(query => fetchNewsApi(query, process.env.NEWS_API_KEY)));
    apiResults.forEach((result, index) => { const query = NEWS_API_QUERIES[index]; const name = `NewsAPI:${query.section}`; if (result.status === 'fulfilled') { allStories.push(...result.value); sourceReports.push({ type: 'newsapi', name, section: query.section, count: result.value.length, ok: true }); } else { const message = result.reason?.message || String(result.reason); errors.push({ source: name, section: query.section, message }); sourceReports.push({ type: 'newsapi', name, section: query.section, count: 0, ok: false, message }); } });
  }
  const deterministic = deterministicSections(allStories);
  let sections = deterministic;
  let editorialMode = 'deterministic';
  try {
    const curated = await curateWithOpenAI(allStories);
    if (curated) { sections = curated; editorialMode = 'llm'; }
  } catch (error) {
    const message = `LLM editorial fallback: ${error.message}`;
    console.warn(`[newspaper] ${message}`);
    errors.push({ source: 'OpenAI editorial', section: 'all', message });
  }
  const lead = ['ai', 'technology', 'global', 'chicago'].map(id => sections[id]?.stories?.[0]).find(Boolean) || null;
  const issue = { brand: 'Four Corners Daily', tagline: 'AI · Technology · Chicago · The World', generatedAt: generatedAt.toISOString(), timezone: TIMEZONE, publicationDate: new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE }).format(generatedAt), leadStory: lead, sections, meta: { totalStories: Object.values(sections).reduce((sum, section) => sum + section.stories.length, 0), sourcesAttempted: sourceReports.length, sourcesSucceeded: sourceReports.filter(report => report.ok).length, maxPerSection: DEFAULT_MAX_PER_SECTION, mode: editorialMode }, errors, sources: sourceReports };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(issue, null, 2)}\n`, 'utf8');
  console.log(`[newspaper] Wrote ${issue.meta.totalStories} stories in ${editorialMode} mode → ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  if (issue.meta.totalStories === 0) process.exitCode = 1;
}
generate().catch(error => { console.error('[newspaper] Fatal error:', error); process.exit(1); });
