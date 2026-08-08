/**
 * Core normalization helpers for newspaper story items.
 * Shared by the generation pipeline and unit tests.
 */

const HTML_TAG_RE = /<\/?[^>]+(>|$)/g;
const WHITESPACE_RE = /\s+/g;
const NON_ALNUM_RE = /[^a-z0-9\s]/g;

/**
 * Remove HTML tags and decode a small set of common entities.
 * @param {string} value
 * @returns {string}
 */
function stripHtml(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(HTML_TAG_RE, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

/**
 * Remove trailing publisher suffixes common in Google News titles
 * (e.g. "Story headline - The Washington Post").
 * @param {string} title
 * @returns {string}
 */
function stripPublisherSuffix(title) {
  const clean = stripHtml(title);
  // Prefer the longest sensible split on " - " / " — " / " | "
  const parts = clean.split(/\s[-–—|]\s/);
  if (parts.length < 2) return clean;

  const publisher = parts[parts.length - 1].trim();
  // Treat short trailing segments as publisher names, keep the rest as the headline.
  if (publisher.length > 0 && publisher.length <= 48 && parts[0].trim().length >= 24) {
    return parts.slice(0, -1).join(' - ').trim();
  }
  return clean;
}

/**
 * Canonical title key used for fuzzy deduplication.
 * @param {string} title
 * @returns {string}
 */
function normalizeTitleKey(title) {
  return stripPublisherSuffix(title)
    .toLowerCase()
    .replace(NON_ALNUM_RE, ' ')
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

/**
 * Canonicalize URLs for comparison (strip tracking params / fragments).
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(
      (param) => parsed.searchParams.delete(param)
    );
    // Google News redirect wrappers often include the real URL in query params.
    const nested = parsed.searchParams.get('url');
    if (nested) {
      return normalizeUrl(nested);
    }
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Build a concise plain-text summary from RSS content.
 * @param {string} text
 * @param {number} [maxLength=220]
 * @returns {string}
 */
function summarize(text, maxLength = 220) {
  const clean = stripHtml(text);
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;

  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut.replace(/[.,;:!\-–—]+\s*$/, '')}…`;
}

/**
 * Stable id from section + url/title.
 * @param {string} section
 * @param {string} url
 * @param {string} title
 * @returns {string}
 */
function buildStoryId(section, url, title) {
  const seed = `${section}|${normalizeUrl(url) || normalizeTitleKey(title)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `${section}-${Math.abs(hash).toString(36)}`;
}

/**
 * Parse Hacker News points from hnrss item HTML/text.
 * hnrss embeds lines like `<p>Points: 86</p>` in the description; there is no
 * structured points field and no percentile query — only absolute `?points=N`.
 * @param {string} text
 * @returns {number|null}
 */
function extractHnPoints(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/Points:\s*(\d+)/i);
  if (!match) return null;
  const points = Number(match[1]);
  return Number.isFinite(points) ? points : null;
}

/**
 * Strip hnrss metadata lines so summaries are readable.
 * @param {string} text
 * @returns {string}
 */
function cleanHnDescription(text) {
  if (!text || typeof text !== 'string') return '';
  return stripHtml(text)
    .replace(/Article URL:\s*\S+/gi, ' ')
    .replace(/Comments URL:\s*\S+/gi, ' ')
    .replace(/Points:\s*\d+/gi, ' ')
    .replace(/#\s*Comments:\s*\d+/gi, ' ')
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

/**
 * Normalize a raw feed/API item into a newspaper story.
 * @param {object} raw
 * @param {string} section
 * @param {string} [fallbackSource]
 * @returns {object|null}
 */
function normalizeItem(raw, section, fallbackSource = 'Unknown') {
  if (!raw || typeof raw !== 'object') return null;

  const rawTitle = stripHtml(raw.title || '');
  const url = (raw.link || raw.url || '').trim();
  if (!rawTitle || !url) return null;

  const title = stripPublisherSuffix(rawTitle);
  const rawDescription =
    raw.contentSnippet || raw.summary || raw.description || raw.content || '';
  const points =
    typeof raw.points === 'number' && Number.isFinite(raw.points)
      ? raw.points
      : extractHnPoints(rawDescription);
  const isHnMetadata =
    points !== null ||
    /Article URL:/i.test(rawDescription) ||
    /Comments URL:/i.test(rawDescription);
  const description = isHnMetadata ? cleanHnDescription(rawDescription) : rawDescription;
  let source =
    stripHtml(raw.source || raw.creator || raw.author || fallbackSource) || fallbackSource;

  // Prefer publisher parsed from a Google News-style title suffix when present.
  if (title !== rawTitle) {
    const suffix = rawTitle.slice(title.length).replace(/^\s[-–—|]\s*/, '').trim();
    if (suffix) source = suffix;
  }

  const publishedAt = raw.isoDate || raw.pubDate || raw.publishedAt || null;
  const imageUrl =
    raw.enclosure?.url ||
    raw['media:content']?.$?.url ||
    raw.imageUrl ||
    null;

  let summary = summarize(description);
  // Google News often repeats the title (sometimes with a bare publisher name) as the snippet.
  const titleKey = normalizeTitleKey(title);
  const summaryKey = normalizeTitleKey(summary);
  const summaryIsTitleEcho =
    !summary || summaryKey === titleKey || summaryKey.startsWith(`${titleKey} `);

  if (summaryIsTitleEcho) {
    summary = `Coverage from ${source}. Open the source for the full report.`;
  }

  return {
    id: buildStoryId(section, url, title),
    title,
    summary,
    url,
    source,
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    section,
    imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
    points,
    titleKey: normalizeTitleKey(title),
    urlKey: normalizeUrl(url),
  };
}

module.exports = {
  stripHtml,
  stripPublisherSuffix,
  normalizeTitleKey,
  normalizeUrl,
  summarize,
  buildStoryId,
  extractHnPoints,
  cleanHnDescription,
  normalizeItem,
};
