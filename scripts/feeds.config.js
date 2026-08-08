/**
 * RSS / News API source configuration.
 *
 * NEWS_TIMEZONE — IANA timezone used for the publication date label (default America/Chicago)
 * NEWS_MAX_PER_SECTION — max stories kept per section after dedupe (default 8)
 * NEWS_API_KEY — optional NewsAPI.org key for extra coverage
 * OPENAI_API_KEY — optional gpt-4o-mini editorial curation + section editorials
 *
 * Hacker News (hnrss.org):
 * - Frontpage items include `Points: N` inside the RSS description HTML.
 * - hnrss supports absolute filters such as `?points=100`, but that is NOT a
 *   percentile / "top 30%" query. Ranking quality filtering is done locally in
 *   `src/lib/news/hnRank.js` after parsing points (feed-order fallback if absent).
 *
 * brutalist.report (inspected 2026-08-08):
 * - No public RSS/Atom feed (`/feed`, `/rss`, `/rss.xml`, `/atom.xml` → 404).
 * - Legacy JSON endpoint `https://brutalist.report/api` now returns
 *   `{"message":"this API has been moved, for updated usage see https://brutalist.report/about"}`
 *   and `/about` documents no replacement public API (premium features are UI-only).
 * - Topic pages are HTML aggregators only. We intentionally do not scrape that HTML
 *   (brittle) and do not add a live brutalist.report source until an official public
 *   feed/endpoint is restored. Existing RSS technology sources remain the supported path.
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
  {
    section: 'technology',
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    // Local top-30% filter by parsed HN points (see hnRank.js). Not an hnrss query.
    rankBy: 'hnPoints',
    topPercentile: 0.3,
  },

  // Kerala politics
  {
    section: 'kerala_politics',
    name: 'Google News — Kerala Politics',
    url: 'https://news.google.com/rss/search?q=Kerala+politics&hl=en-US&gl=US&ceid=US:en',
  },

  // India politics
  {
    section: 'india_politics',
    name: 'Indian Express Politics',
    url: 'https://indianexpress.com/section/politics/feed/',
  },
  {
    section: 'india_politics',
    name: 'Google News — India Politics',
    url: 'https://news.google.com/rss/search?q=India+politics&hl=en-US&gl=US&ceid=US:en',
  },

  // Real Madrid
  {
    section: 'real_madrid',
    name: 'Managing Madrid',
    url: 'https://www.managingmadrid.com/rss/index.xml',
  },

  // Movies and ratings
  {
    section: 'movies',
    name: 'Malayalam Movie Reviews',
    url: 'https://indianexpress.com/section/entertainment/malayalam/mollywood-movie-review/feed/',
  },
  {
    section: 'movies',
    name: 'English Movie Reviews',
    url: 'https://indianexpress.com/section/entertainment/hollywood/english-movie-review/feed/',
  },
  {
    section: 'movies',
    name: 'Malayalam Entertainment',
    url: 'https://indianexpress.com/section/entertainment/malayalam/feed/',
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
