/**
 * Section-level editorial synthesis helpers.
 * Supports legacy section.editorial strings and additive section.editorialDoc.
 */

const EDITORIAL_DOC_VERSION = 1;
const DEFAULT_MAX_CHARS = 700;
const DEFAULT_MAX_CITATIONS = 3;

/**
 * Build a concise factual editorial from already-selected section stories.
 * Uses only supplied titles/sources — never invents outside facts.
 * @param {{ title: string, shortTitle?: string }} section
 * @param {Array<{ title?: string, source?: string }>} stories
 * @returns {string}
 */
function buildDeterministicEditorial(section, stories) {
  const label = section.shortTitle || section.title || 'This';
  const list = Array.isArray(stories) ? stories.filter(Boolean) : [];

  if (!list.length) {
    return `${label} section: no stories cleared the desk for this edition.`;
  }

  const leads = list.slice(0, 3).map((story) => {
    const title = typeof story.title === 'string' ? story.title.trim() : '';
    const source = typeof story.source === 'string' ? story.source.trim() : '';
    if (title && source) return `${title} (${source})`;
    return title || source;
  }).filter(Boolean);

  if (!leads.length) {
    return `${label} section: coverage compiled from available sources.`;
  }

  if (leads.length === 1) {
    return `${label} desk lead: ${leads[0]}.`;
  }

  if (leads.length === 2) {
    return `${label} desk today: ${leads[0]}; and ${leads[1]}.`;
  }

  return `${label} desk today: ${leads[0]}; ${leads[1]}; and ${leads[2]}.`;
}

/**
 * Normalize an editorial string from the LLM, falling back when invalid.
 * @param {unknown} value
 * @param {{ title: string, shortTitle?: string }} section
 * @param {object[]} stories
 * @param {number} [maxLength=700]
 * @returns {string}
 */
function resolveEditorial(value, section, stories, maxLength = DEFAULT_MAX_CHARS) {
  if (typeof value === 'string') {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (trimmed) return trimmed.slice(0, maxLength);
  }
  return buildDeterministicEditorial(section, stories).slice(0, maxLength);
}

/**
 * @param {object[]} stories
 * @returns {Set<string>}
 */
function selectedStoryUrlSet(stories) {
  return new Set(
    (Array.isArray(stories) ? stories : [])
      .map((story) => (typeof story?.url === 'string' ? story.url.trim() : ''))
      .filter(Boolean)
  );
}

/**
 * Build citations constrained to selected story URLs.
 * @param {object[]} stories
 * @param {number} [maxCitations=3]
 * @returns {Array<{ storyId: string|null, url: string, source: string|null }>}
 */
function buildCitationsFromStories(stories, maxCitations = DEFAULT_MAX_CITATIONS) {
  const list = Array.isArray(stories) ? stories.filter(Boolean) : [];
  const citations = [];
  const seen = new Set();

  for (const story of list) {
    if (citations.length >= maxCitations) break;
    const url = typeof story.url === 'string' ? story.url.trim() : '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    citations.push({
      storyId: typeof story.id === 'string' ? story.id : null,
      url,
      source: typeof story.source === 'string' ? story.source : null,
    });
  }

  return citations;
}

/**
 * Keep only citations whose URLs appear in the selected stories.
 * @param {unknown} citations
 * @param {object[]} stories
 * @param {number} [maxCitations=3]
 * @returns {Array<{ storyId: string|null, url: string, source: string|null }>}
 */
function constrainCitationsToStories(citations, stories, maxCitations = DEFAULT_MAX_CITATIONS) {
  const allowed = selectedStoryUrlSet(stories);
  const byUrl = new Map(
    (Array.isArray(stories) ? stories : [])
      .filter((story) => story?.url)
      .map((story) => [story.url, story])
  );

  if (!Array.isArray(citations) || !allowed.size) return [];

  const out = [];
  const seen = new Set();
  for (const item of citations) {
    if (out.length >= maxCitations) break;
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    if (!url || !allowed.has(url) || seen.has(url)) continue;
    seen.add(url);
    const story = byUrl.get(url);
    out.push({
      storyId:
        typeof item.storyId === 'string'
          ? item.storyId
          : typeof story?.id === 'string'
            ? story.id
            : null,
      url,
      source:
        typeof item.source === 'string'
          ? item.source
          : typeof story?.source === 'string'
            ? story.source
            : null,
    });
  }
  return out;
}

/**
 * Validate a published/candidate editorialDoc against selected stories.
 * @param {unknown} value
 * @param {object[]} stories
 * @param {{ maxChars?: number, maxCitations?: number, requireUrlsFromSelectedStories?: boolean, allowEmptyWhenNoStories?: boolean }} [options]
 * @returns {{ ok: true, doc: object } | { ok: false, reason: string }}
 */
function validateEditorialDoc(value, stories, options = {}) {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const maxCitations = options.maxCitations ?? DEFAULT_MAX_CITATIONS;
  const requireUrls = options.requireUrlsFromSelectedStories !== false;
  const allowEmpty = options.allowEmptyWhenNoStories !== false;
  const list = Array.isArray(stories) ? stories.filter(Boolean) : [];

  if (!value || typeof value !== 'object') {
    return { ok: false, reason: 'editorialDoc must be an object' };
  }

  if (value.version !== EDITORIAL_DOC_VERSION) {
    return { ok: false, reason: `unsupported editorialDoc.version (${value.version})` };
  }

  if (typeof value.text !== 'string' || !value.text.trim()) {
    return { ok: false, reason: 'editorialDoc.text must be a non-empty string' };
  }

  if (value.text.length > maxChars) {
    return { ok: false, reason: `editorialDoc.text exceeds maxChars (${maxChars})` };
  }

  if (!['deterministic', 'llm', 'subagent'].includes(value.mode)) {
    return { ok: false, reason: 'editorialDoc.mode is invalid' };
  }

  if (!['ok', 'fallback', 'failed'].includes(value.status)) {
    return { ok: false, reason: 'editorialDoc.status is invalid' };
  }

  if (typeof value.reviewedAt !== 'string' || Number.isNaN(Date.parse(value.reviewedAt))) {
    return { ok: false, reason: 'editorialDoc.reviewedAt must be an ISO timestamp' };
  }

  if (!Array.isArray(value.citations)) {
    return { ok: false, reason: 'editorialDoc.citations must be an array' };
  }

  if (value.citations.length > maxCitations) {
    return { ok: false, reason: `editorialDoc.citations exceeds maxCitations (${maxCitations})` };
  }

  if (!list.length) {
    if (!allowEmpty && value.citations.length) {
      return { ok: false, reason: 'citations not allowed when section has no stories' };
    }
    if (value.citations.length) {
      return { ok: false, reason: 'citations present but section has no selected stories' };
    }
  } else if (requireUrls) {
    const allowed = selectedStoryUrlSet(list);
    for (const citation of value.citations) {
      const url = typeof citation?.url === 'string' ? citation.url.trim() : '';
      if (!url || !allowed.has(url)) {
        return { ok: false, reason: `citation URL not in selected stories: ${url || '(empty)'}` };
      }
    }
  }

  return {
    ok: true,
    doc: {
      version: EDITORIAL_DOC_VERSION,
      text: value.text.replace(/\s+/g, ' ').trim(),
      citations: constrainCitationsToStories(value.citations, list, maxCitations),
      mode: value.mode,
      status: value.status,
      reviewedAt: new Date(value.reviewedAt).toISOString(),
    },
  };
}

/**
 * Deterministic editorialDoc populated only from selected stories.
 * @param {{ id?: string, title: string, shortTitle?: string }} section
 * @param {object[]} stories
 * @param {{ brief?: object, reviewedAt?: Date|string, status?: string }} [options]
 * @returns {object}
 */
function buildDeterministicEditorialDoc(section, stories, options = {}) {
  const brief = options.brief || {};
  const maxChars = brief.length?.maxChars ?? DEFAULT_MAX_CHARS;
  const maxCitations = brief.citations?.maxCitations ?? DEFAULT_MAX_CITATIONS;
  const list = Array.isArray(stories) ? stories.filter(Boolean) : [];
  const text = buildDeterministicEditorial(section, list).slice(0, maxChars);
  const reviewedAt = options.reviewedAt
    ? new Date(options.reviewedAt).toISOString()
    : new Date().toISOString();

  return {
    version: EDITORIAL_DOC_VERSION,
    text,
    citations: buildCitationsFromStories(list, maxCitations),
    mode: 'deterministic',
    status: options.status || (list.length ? 'ok' : 'fallback'),
    reviewedAt,
  };
}

/**
 * Resolve a usable editorialDoc from LLM/input or deterministic fallback.
 * Citations are always constrained to selected story URLs.
 * @param {unknown} value
 * @param {{ id?: string, title: string, shortTitle?: string }} section
 * @param {object[]} stories
 * @param {{ brief?: object, fallbackText?: unknown, mode?: string, reviewedAt?: Date|string }} [options]
 * @returns {object}
 */
function resolveEditorialDoc(value, section, stories, options = {}) {
  const brief = options.brief || {};
  const maxChars = brief.length?.maxChars ?? DEFAULT_MAX_CHARS;
  const maxCitations = brief.citations?.maxCitations ?? DEFAULT_MAX_CITATIONS;
  const list = Array.isArray(stories) ? stories.filter(Boolean) : [];
  const reviewedAt = options.reviewedAt || new Date().toISOString();
  const validationOptions = {
    maxChars,
    maxCitations,
    requireUrlsFromSelectedStories: brief.citations?.requireUrlsFromSelectedStories !== false,
    allowEmptyWhenNoStories: brief.citations?.allowEmptyWhenNoStories !== false,
  };

  const validation = validateEditorialDoc(value, list, validationOptions);
  if (validation.ok) return validation.doc;

  // Accept a plain editorial string by attaching provenance from selected stories.
  // Invalid structured docs (e.g. foreign citation URLs) fall through to deterministic.
  const stringSource =
    typeof options.fallbackText === 'string'
      ? options.fallbackText
      : typeof value === 'string'
        ? value
        : null;

  if (stringSource && stringSource.trim()) {
    const mode = ['deterministic', 'llm', 'subagent'].includes(options.mode)
      ? options.mode
      : 'llm';
    const candidate = {
      version: EDITORIAL_DOC_VERSION,
      text: resolveEditorial(stringSource, section, list, maxChars),
      citations: buildCitationsFromStories(list, maxCitations),
      mode,
      status: list.length ? 'ok' : 'fallback',
      reviewedAt,
    };
    const second = validateEditorialDoc(candidate, list, {
      maxChars,
      maxCitations,
      requireUrlsFromSelectedStories: true,
      allowEmptyWhenNoStories: true,
    });
    if (second.ok) return second.doc;
  }

  // Invalid structured docs force fallback status; plain null input is normal deterministic.
  const forcedFallback = value && typeof value === 'object';
  return buildDeterministicEditorialDoc(section, list, {
    brief,
    reviewedAt,
    status: forcedFallback ? 'fallback' : undefined,
  });
}

/**
 * Produce legacy editorial string + additive editorialDoc together.
 * @param {{ id?: string, title: string, shortTitle?: string }} section
 * @param {object[]} stories
 * @param {unknown} editorial
 * @param {unknown} editorialDoc
 * @param {{ brief?: object, mode?: string, reviewedAt?: Date|string }} [options]
 * @returns {{ editorial: string, editorialDoc: object }}
 */
function resolveSectionEditorialFields(section, stories, editorial, editorialDoc = null, options = {}) {
  const brief = options.brief || {};
  const maxChars = brief.length?.maxChars ?? DEFAULT_MAX_CHARS;
  const doc = resolveEditorialDoc(editorialDoc, section, stories, {
    brief,
    fallbackText: editorial,
    mode: options.mode,
    reviewedAt: options.reviewedAt,
  });

  // Legacy string always mirrors editorialDoc.text for backward compatibility.
  const text = resolveEditorial(doc.text, section, stories, maxChars);
  const synced = {
    ...doc,
    text,
  };

  return {
    editorial: text,
    editorialDoc: synced,
  };
}

module.exports = {
  EDITORIAL_DOC_VERSION,
  buildDeterministicEditorial,
  resolveEditorial,
  buildCitationsFromStories,
  constrainCitationsToStories,
  validateEditorialDoc,
  buildDeterministicEditorialDoc,
  resolveEditorialDoc,
  resolveSectionEditorialFields,
};
