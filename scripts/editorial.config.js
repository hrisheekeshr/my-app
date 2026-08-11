/**
 * Per-section editorial generation briefs (Phase 1).
 * Used by the newspaper pipeline for length/citation constraints and future
 * writer/reviewer prompts. UI still uses sections.js description fields.
 */

const { SECTION_IDS } = require('../src/lib/news/sections');

/** Stable schema version for published section.editorialDoc objects. */
const EDITORIAL_DOC_VERSION = 1;

const REQUIRED_SECTION_IDS = [
  'ai',
  'technology',
  'chicago',
  'global',
  'kerala_politics',
  'india_politics',
  'real_madrid',
  'movies',
];

/**
 * @typedef {object} EditorialBrief
 * @property {string} audience
 * @property {string} tone
 * @property {string[]} topicsToCover
 * @property {string[]} topicsToAvoid
 * @property {{ minSentences: number, maxSentences: number, maxChars: number }} length
 * @property {{ maxCitations: number, requireUrlsFromSelectedStories: boolean, allowEmptyWhenNoStories: boolean }} citations
 */

/** @type {Record<string, EditorialBrief>} */
const EDITORIAL_BRIEFS = {
  ai: {
    audience: 'Readers tracking AI research, products, policy, and workplace impact.',
    tone: 'Neutral, factual, concise; prioritize substance over hype.',
    topicsToCover: [
      'model and research releases',
      'AI policy and regulation',
      'enterprise and consumer product launches',
      'safety, evaluation, and labor impacts',
    ],
    topicsToAvoid: [
      'unverifiable rumor as fact',
      'stock tips framed as news',
      'unrelated consumer gadget roundups',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  technology: {
    audience: 'Readers following platforms, gadgets, infrastructure, and the wider tech industry.',
    tone: 'Clear and practical; emphasize what shipped or changed.',
    topicsToCover: [
      'platforms and developer tooling',
      'consumer hardware and software',
      'security and infrastructure',
      'industry competition and regulation',
    ],
    topicsToAvoid: [
      'pure AI research duplicates better suited to the AI desk',
      'affiliate deal fluff without news value',
      'unsourced leak speculation',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  chicago: {
    audience: 'Chicago-area readers focused on civic life, neighborhoods, and local institutions.',
    tone: 'Local-first, straightforward, community-aware.',
    topicsToCover: [
      'city government and public services',
      'neighborhood and transit news',
      'local culture and civic institutions',
      'weather or safety items with citywide impact',
    ],
    topicsToAvoid: [
      'national stories with only incidental Chicago mentions',
      'national sports wire unless clearly Chicago-team focused',
      'crime blurbs without local context when stronger civic stories exist',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  global: {
    audience: 'Readers following international affairs and major world developments.',
    tone: 'Measured, factual, geopolitically careful.',
    topicsToCover: [
      'diplomacy and conflict',
      'international elections and governance',
      'global economy and humanitarian developments',
      'cross-border science or culture with world impact',
    ],
    topicsToAvoid: [
      'US-only local stories',
      'celebrity gossip without geopolitical relevance',
      'unsourced conflict claims',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  kerala_politics: {
    audience: 'Readers following Kerala state politics, policy, and public administration.',
    tone: 'Neutral and state-focused; distinguish state vs national stories.',
    topicsToCover: [
      'Kerala government and assembly politics',
      'state policy and welfare administration',
      'party developments centered on Kerala',
      'governance and public services in the state',
    ],
    topicsToAvoid: [
      'national India politics without a Kerala link',
      'entertainment coverage',
      'unverified communal rumor',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  india_politics: {
    audience: 'Readers following national Indian politics and policy debates.',
    tone: 'Factual and balanced; avoid partisan framing.',
    topicsToCover: [
      'national government and parliament',
      'party strategy and elections',
      'major policy and legal developments',
      'federal issues with nationwide impact',
    ],
    topicsToAvoid: [
      'Kerala-only state stories better suited to the Kerala desk',
      'entertainment and sports wire',
      'unsourced allegation as established fact',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  real_madrid: {
    audience: 'Real Madrid supporters and football readers following the club.',
    tone: 'Club-focused and factual; match and transfer clarity over rumor mills.',
    topicsToCover: [
      'matches and results',
      'squad news and injuries',
      'transfers and contracts',
      'coaching and competition context',
    ],
    topicsToAvoid: [
      'unrelated La Liga clubs as the lead focus',
      'unsourced transfer fantasy',
      'off-pitch gossip without club news value',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
  movies: {
    audience: 'Readers following Malayalam and English film releases, reviews, and industry news.',
    tone: 'Cultural desk clarity; separate review opinion from hard news when possible.',
    topicsToCover: [
      'releases and trailers',
      'reviews and ratings coverage',
      'casting and production news',
      'festival or awards items with clear film focus',
    ],
    topicsToAvoid: [
      'politics-first stories without a film hook',
      'unverified casting rumor',
      'SEO slideshow content without news value',
    ],
    length: { minSentences: 1, maxSentences: 4, maxChars: 700 },
    citations: {
      maxCitations: 3,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    },
  },
};

/**
 * Validate brief map completeness and shape.
 * @param {Record<string, EditorialBrief>} [briefs]
 * @param {string[]} [sectionIds]
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
function validateEditorialBriefs(briefs = EDITORIAL_BRIEFS, sectionIds = REQUIRED_SECTION_IDS) {
  const errors = [];
  const ids = Object.keys(briefs || {});

  const missing = sectionIds.filter((id) => !briefs?.[id]);
  const extra = ids.filter((id) => !sectionIds.includes(id));
  if (missing.length) errors.push(`missing briefs: ${missing.join(', ')}`);
  if (extra.length) errors.push(`unexpected briefs: ${extra.join(', ')}`);

  sectionIds.forEach((id) => {
    const brief = briefs?.[id];
    if (!brief) return;
    if (typeof brief.audience !== 'string' || !brief.audience.trim()) {
      errors.push(`${id}: audience must be a non-empty string`);
    }
    if (typeof brief.tone !== 'string' || !brief.tone.trim()) {
      errors.push(`${id}: tone must be a non-empty string`);
    }
    if (!Array.isArray(brief.topicsToCover) || brief.topicsToCover.length === 0) {
      errors.push(`${id}: topicsToCover must be a non-empty array`);
    }
    if (!Array.isArray(brief.topicsToAvoid) || brief.topicsToAvoid.length === 0) {
      errors.push(`${id}: topicsToAvoid must be a non-empty array`);
    }
    const length = brief.length;
    if (
      !length ||
      !Number.isFinite(length.minSentences) ||
      !Number.isFinite(length.maxSentences) ||
      !Number.isFinite(length.maxChars) ||
      length.minSentences < 1 ||
      length.maxSentences < length.minSentences ||
      length.maxChars < 80
    ) {
      errors.push(`${id}: length constraints are invalid`);
    }
    const citations = brief.citations;
    if (
      !citations ||
      !Number.isFinite(citations.maxCitations) ||
      citations.maxCitations < 1 ||
      typeof citations.requireUrlsFromSelectedStories !== 'boolean' ||
      typeof citations.allowEmptyWhenNoStories !== 'boolean'
    ) {
      errors.push(`${id}: citation constraints are invalid`);
    }
  });

  // Keep config aligned with the runtime section registry.
  const registryMismatch = SECTION_IDS.filter((id) => !sectionIds.includes(id));
  if (registryMismatch.length) {
    errors.push(`SECTION_IDS mismatch: ${registryMismatch.join(', ')}`);
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * @param {string} sectionId
 * @returns {EditorialBrief|null}
 */
function getEditorialBrief(sectionId) {
  return EDITORIAL_BRIEFS[sectionId] || null;
}

const configValidation = validateEditorialBriefs();
if (!configValidation.ok) {
  throw new Error(`Invalid editorial.config.js: ${configValidation.errors.join('; ')}`);
}

module.exports = {
  EDITORIAL_DOC_VERSION,
  REQUIRED_SECTION_IDS,
  EDITORIAL_BRIEFS,
  validateEditorialBriefs,
  getEditorialBrief,
};
