const { normalizeTitleKey, normalizeUrl } = require('./normalize');

/**
 * Token Jaccard similarity for near-duplicate titles.
 * @param {string} a
 * @param {string} b
 * @returns {number} 0–1
 */
function titleSimilarity(a, b) {
  const left = new Set((a || '').split(' ').filter(Boolean));
  const right = new Set((b || '').split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Prefer stories with richer summaries / earlier publication when merging duplicates.
 * @param {object} current
 * @param {object} candidate
 * @returns {object}
 */
function preferStory(current, candidate) {
  const currentScore =
    (current.summary?.length || 0) + (current.imageUrl ? 40 : 0) + (current.publishedAt ? 10 : 0);
  const candidateScore =
    (candidate.summary?.length || 0) +
    (candidate.imageUrl ? 40 : 0) +
    (candidate.publishedAt ? 10 : 0);

  if (candidateScore > currentScore) return candidate;
  if (candidateScore < currentScore) return current;

  if (current.publishedAt && candidate.publishedAt) {
    return new Date(candidate.publishedAt) > new Date(current.publishedAt) ? candidate : current;
  }
  return current;
}

/**
 * Deduplicate stories by canonical URL and near-matching titles.
 * @param {object[]} stories
 * @param {number} [titleThreshold=0.82]
 * @returns {object[]}
 */
function dedupeStories(stories, titleThreshold = 0.82) {
  if (!Array.isArray(stories) || stories.length === 0) return [];

  const byUrl = new Map();
  stories.forEach((story) => {
    if (!story) return;
    const key = story.urlKey || normalizeUrl(story.url);
    if (!key) return;
    const existing = byUrl.get(key);
    byUrl.set(key, existing ? preferStory(existing, story) : story);
  });

  const unique = [];
  Array.from(byUrl.values()).forEach((story) => {
    const key = story.titleKey || normalizeTitleKey(story.title);
    const duplicateIndex = unique.findIndex((kept) => {
      if (kept.section !== story.section) return false;
      const keptKey = kept.titleKey || normalizeTitleKey(kept.title);
      if (keptKey === key) return true;
      return titleSimilarity(keptKey, key) >= titleThreshold;
    });

    if (duplicateIndex === -1) {
      unique.push(story);
      return;
    }

    unique[duplicateIndex] = preferStory(unique[duplicateIndex], story);
  });

  return unique.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

module.exports = {
  titleSimilarity,
  preferStory,
  dedupeStories,
};
