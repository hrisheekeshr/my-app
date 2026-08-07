/**
 * RSS / News API source configuration.
 *
 * NEWS_TIMEZONE — IANA timezone used for the publication date label (default America/Chicago)
 * NEWS_MAX_PER_SECTION — max stories kept per section after dedupe (default 8)
 * NEWS_API_KEY — optional NewsAPI.org key for extra coverage
 * OPENAI_API_KEY — reserved for future LLM summarization (unused; RSS summaries are default)
 */

const DEFAULT_MAX_PER_SECTION = Number(process.env.NEWS_MAX_PER_SECTION || 8);
const TIMEZONE = process.env.NEWS_TIMEZONE || 'America/Chicago';

/** Reliable public RSS feeds (no API key required). */
const RSS_FEEDS = [
  // Artificial Intelligence
  {
    section: 'ai',
    name: 'MIT Technology Review — AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
  },
  {
    section: 'ai',
    name: 'Google News — Artificial Intelligence',
    url: 'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en',
  },
  {
    section: 'ai',
    name: 'VentureBeat — AI',
    url: 'https://venturebeat.com/category/ai/feed/',
  },

  // Technology
  {
    section: 'technology',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
  },
  {
    section: 'technology',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
  },
  {
    section: 'technology',
    name: 'Google News — Technology',
    url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
  },

  // Chicago local
  {
    section: 'chicago',
    name: 'Block Club Chicago',
    url: 'https://blockclubchicago.org/feed/',
  },
  {
    section: 'chicago',
    name: 'Google News — Chicago',
    url: 'https://news.google.com/rss/search?q=Chicago+when:1d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    section: 'chicago',
    name: 'Chicago Sun-Times',
    url: 'https://chicago.suntimes.com/rss/index.xml',
  },

  // Global
  {
    section: 'global',
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  },
  {
    section: 'global',
    name: 'NPR World',
    url: 'https://feeds.npr.org/1004/rss.xml',
  },
  {
    section: 'global',
    name: 'Google News — World',
    url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en',
  },
];

/** Optional NewsAPI.org queries (used only when NEWS_API_KEY is set). */
const NEWS_API_QUERIES = [
  { section: 'ai', q: 'artificial intelligence OR generative AI', language: 'en' },
  { section: 'technology', category: 'technology', country: 'us' },
  { section: 'chicago', q: 'Chicago', language: 'en' },
  { section: 'global', category: 'general', country: 'us' },
];

module.exports = {
  DEFAULT_MAX_PER_SECTION,
  TIMEZONE,
  RSS_FEEDS,
  NEWS_API_QUERIES,
};
