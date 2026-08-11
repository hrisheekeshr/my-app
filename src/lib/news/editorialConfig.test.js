const {
  EDITORIAL_BRIEFS,
  EDITORIAL_DOC_VERSION,
  REQUIRED_SECTION_IDS,
  validateEditorialBriefs,
  getEditorialBrief,
} = require('../../../scripts/editorial.config');
const { SECTION_IDS } = require('./sections');
const { EDITORIAL_DOC_VERSION: RUNTIME_DOC_VERSION } = require('./editorial');

describe('editorial.config.js', () => {
  test('defines validated briefs for exactly the eight section IDs', () => {
    expect(REQUIRED_SECTION_IDS).toEqual([
      'ai',
      'technology',
      'chicago',
      'global',
      'kerala_politics',
      'india_politics',
      'real_madrid',
      'movies',
    ]);
    expect(Object.keys(EDITORIAL_BRIEFS).sort()).toEqual(REQUIRED_SECTION_IDS.slice().sort());
    expect(SECTION_IDS.slice().sort()).toEqual(REQUIRED_SECTION_IDS.slice().sort());

    const result = validateEditorialBriefs();
    expect(result).toEqual({ ok: true });
  });

  test('each brief includes audience, tone, topics, length, and citation constraints', () => {
    REQUIRED_SECTION_IDS.forEach((id) => {
      const brief = getEditorialBrief(id);
      expect(brief.audience.length).toBeGreaterThan(10);
      expect(brief.tone.length).toBeGreaterThan(5);
      expect(brief.topicsToCover.length).toBeGreaterThan(0);
      expect(brief.topicsToAvoid.length).toBeGreaterThan(0);
      expect(brief.length.maxChars).toBeGreaterThanOrEqual(80);
      expect(brief.length.maxSentences).toBeGreaterThanOrEqual(brief.length.minSentences);
      expect(brief.citations.maxCitations).toBeGreaterThanOrEqual(1);
      expect(brief.citations.requireUrlsFromSelectedStories).toBe(true);
    });
  });

  test('config doc version matches runtime editorialDoc version', () => {
    expect(EDITORIAL_DOC_VERSION).toBe(RUNTIME_DOC_VERSION);
    expect(EDITORIAL_DOC_VERSION).toBe(1);
  });

  test('validateEditorialBriefs rejects incomplete maps', () => {
    const incomplete = { ...EDITORIAL_BRIEFS };
    delete incomplete.movies;
    const result = validateEditorialBriefs(incomplete, REQUIRED_SECTION_IDS);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('missing briefs: movies');
  });
});
