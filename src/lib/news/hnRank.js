/**
 * Hacker News ranking helpers.
 *
 * hnrss.org embeds points in each item description as `Points: N` (see normalize.js).
 * It also supports absolute filters like `?points=100`, but that is a fixed threshold —
 * not a percentile / "top 30%" query. This module ranks locally from parsed points.
 *
 * Fallback when points are unavailable: preserve hnrss feed order (frontpage ranking
 * from Hacker News / Algolia) and keep the top percentile of that order. Do not invent
 * a points query parameter for percentile selection.
 */

/**
 * Keep the top `ratio` of stories by ranking quality.
 * @param {object[]} stories
 * @param {number} [ratio=0.3]
 * @returns {object[]}
 */
function selectTopPercentileByPoints(stories, ratio = 0.3) {
  if (!Array.isArray(stories) || stories.length === 0) return [];

  const boundedRatio = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0.3;
  const keepCount = Math.max(1, Math.ceil(stories.length * boundedRatio));
  const pointsAvailable = stories.every(
    (story) => typeof story?.points === 'number' && Number.isFinite(story.points)
  );

  if (!pointsAvailable) {
    // Documented fallback: feed order already reflects HN frontpage ranking quality.
    return stories.slice(0, keepCount);
  }

  return [...stories]
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, keepCount);
}

module.exports = {
  selectTopPercentileByPoints,
};
