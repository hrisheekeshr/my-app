/**
 * Section-level editorial synthesis helpers.
 * Used by the generator for OpenAI validation and deterministic fallbacks.
 */

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
 * @param {number} [maxLength=600]
 * @returns {string}
 */
function resolveEditorial(value, section, stories, maxLength = 600) {
  if (typeof value === 'string') {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (trimmed) return trimmed.slice(0, maxLength);
  }
  return buildDeterministicEditorial(section, stories);
}

module.exports = {
  buildDeterministicEditorial,
  resolveEditorial,
};
