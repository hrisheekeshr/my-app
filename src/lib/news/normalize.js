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
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

/**
 * Canonical title key used for fuzzy deduplication.
 * @param {string} title
 * @returns {string}
 */
function normalizeTitleKey(title) {
  return stripHtml(title)
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
 * Normalize a raw feed/API item into a newspaper story.
 * @param {object} raw
 * @param {string} section
 * @param {string} [fallbackSource]
 * @returns {object|null}
 */
function normalizeItem(raw, section, fallbackSource = 'Unknown') {
  if (!raw || typeof raw !== 'object') return null;

  const title = stripHtml(raw.title || '');
  const url = (raw.link || raw.url || '').trim();
  if (!title || !url) return null;

  const description = raw.contentSnippet || raw.summary || raw.description || raw.content || '';
  const source =
    stripHtml(raw.source || raw.creator || raw.author || fallbackSource) || fallbackSource;
  const publishedAt = raw.isoDate || raw.pubDate || raw.publishedAt || null;
  const imageUrl =
    raw.enclosure?.url ||
    raw['media:content']?.$?.url ||
    raw.imageUrl ||
    null;

  return {
    id: buildStoryId(section, url, title),
    title,
    summary: summarize(description),
    url,
    source,
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    section,
    imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
    titleKey: normalizeTitleKey(title),
    urlKey: normalizeUrl(url),
  };
}

module.exports = {
  stripHtml,
  normalizeTitleKey,
  normalizeUrl,
  summarize,
  buildStoryId,
  normalizeItem,
};
