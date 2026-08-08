const { titleSimilarity } = require('./dedupe');
const { normalizeTitleKey } = require('./normalize');
const { SECTIONS } = require('./sections');

/**
 * Find the best follow-up candidate for a previous story.
 * Prefer same-section near title matches; never invent URLs.
 * @param {object} previous
 * @param {object[]} candidates
 * @param {number} [threshold=0.42]
 * @returns {{ story: object, score: number }|null}
 */
function findFollowUp(previous, candidates, threshold = 0.42) {
  if (!previous || !Array.isArray(candidates) || !candidates.length) return null;

  const previousKey = previous.titleKey || normalizeTitleKey(previous.title || '');
  let best = null;

  candidates.forEach((candidate) => {
    if (!candidate || candidate.url === previous.url) return;
    if (previous.section && candidate.section && previous.section !== candidate.section) return;

    const candidateKey = candidate.titleKey || normalizeTitleKey(candidate.title || '');
    const score = titleSimilarity(previousKey, candidateKey);
    if (score < threshold) return;
    if (!best || score > best.score) best = { story: candidate, score };
  });

  return best;
}

/**
 * Build a deterministic overall summary from previous-day section editorials/stories.
 * @param {object} previousIssue
 * @param {Array<object>} followUpSections
 * @returns {string}
 */
function buildDeterministicBriefSummary(previousIssue, followUpSections) {
  const dateLabel = previousIssue?.publicationDate || previousIssue?.meta?.dateKey || 'yesterday';
  const withUpdates = followUpSections.filter((section) =>
    (section.followUps || []).some((item) => item.update)
  ).length;
  const totalPrevious = followUpSections.reduce(
    (sum, section) => sum + (section.followUps || []).length,
    0
  );

  if (!totalPrevious) {
    return `Morning brief for ${dateLabel}: no archived stories were available from the previous day.`;
  }

  return `Morning brief for ${dateLabel}: reviewing ${totalPrevious} stories from yesterday across ${followUpSections.length} sections. ${withUpdates} section${withUpdates === 1 ? '' : 's'} already show clear follow-up coverage in the latest issue.`;
}

/**
 * Compile a morning brief comparing a previous-day issue to current stories.
 * @param {object} previousIssue
 * @param {object} currentIssue
 * @param {{ generatedAt?: Date, forDate?: string, timezone?: string }} [options]
 * @returns {object}
 */
function buildMorningBrief(previousIssue, currentIssue, options = {}) {
  const generatedAt = options.generatedAt || new Date();
  const timezone = options.timezone || previousIssue?.timezone || 'America/Chicago';
  const currentStories = Object.values(currentIssue?.sections || {}).flatMap(
    (section) => section.stories || []
  );

  const sections = SECTIONS.map((sectionMeta) => {
    const previousSection = previousIssue?.sections?.[sectionMeta.id];
    const previousStories = previousSection?.stories || [];
    const followUps = previousStories.map((story) => {
      const match = findFollowUp(story, currentStories);
      return {
        previous: {
          id: story.id,
          title: story.title,
          url: story.url,
          source: story.source,
          summary: story.summary,
          section: story.section,
          publishedAt: story.publishedAt,
        },
        update: match
          ? {
              id: match.story.id,
              title: match.story.title,
              url: match.story.url,
              source: match.story.source,
              summary: match.story.summary,
              section: match.story.section,
              publishedAt: match.story.publishedAt,
              matchScore: Number(match.score.toFixed(3)),
            }
          : null,
        note: match
          ? 'Related coverage found in the latest issue.'
          : 'No clear follow-up yet in the latest issue.',
      };
    });

    const updatedCount = followUps.filter((item) => item.update).length;
    const summary =
      previousSection?.editorial ||
      (followUps.length
        ? `${sectionMeta.shortTitle} desk carried ${followUps.length} stor${followUps.length === 1 ? 'y' : 'ies'} yesterday; ${updatedCount} follow-up${updatedCount === 1 ? '' : 's'} found.`
        : `${sectionMeta.shortTitle} desk had no archived stories yesterday.`);

    return {
      id: sectionMeta.id,
      title: sectionMeta.title,
      shortTitle: sectionMeta.shortTitle,
      summary,
      followUps,
    };
  });

  return {
    brand: previousIssue?.brand || currentIssue?.brand || 'Four Corners Daily',
    type: 'morning-brief',
    forDate: options.forDate || null,
    generatedAt: generatedAt.toISOString(),
    timezone,
    publicationDate: previousIssue?.publicationDate || null,
    summary: buildDeterministicBriefSummary(previousIssue, sections),
    sections,
    meta: {
      previousStories: sections.reduce((sum, section) => sum + section.followUps.length, 0),
      followUpsFound: sections.reduce(
        (sum, section) => sum + section.followUps.filter((item) => item.update).length,
        0
      ),
      mode: 'deterministic',
    },
  };
}

module.exports = {
  findFollowUp,
  buildDeterministicBriefSummary,
  buildMorningBrief,
};
