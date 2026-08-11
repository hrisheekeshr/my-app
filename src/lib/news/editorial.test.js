const {
  buildDeterministicEditorial,
  resolveEditorial,
  buildCitationsFromStories,
  constrainCitationsToStories,
  validateEditorialDoc,
  buildDeterministicEditorialDoc,
  resolveEditorialDoc,
  resolveSectionEditorialFields,
  EDITORIAL_DOC_VERSION,
} = require('./editorial');
const { getEditorialBrief } = require('../../../scripts/editorial.config');

describe('editorial helpers', () => {
  const section = { id: 'technology', title: 'Technology', shortTitle: 'Tech' };
  const stories = [
    {
      id: 'technology-1',
      title: 'Chipmakers raise guidance',
      source: 'Ars Technica',
      url: 'https://example.com/chips',
      section: 'technology',
    },
    {
      id: 'technology-2',
      title: 'Browser vendors tighten extensions',
      source: 'The Verge',
      url: 'https://example.com/browser',
      section: 'technology',
    },
    {
      id: 'technology-3',
      title: 'Open models expand access',
      source: 'Hacker News',
      url: 'https://example.com/models',
      section: 'technology',
    },
  ];

  test('buildDeterministicEditorial uses only supplied story titles/sources', () => {
    const text = buildDeterministicEditorial(section, stories);
    expect(text).toContain('Chipmakers raise guidance (Ars Technica)');
    expect(text).toContain('Browser vendors tighten extensions (The Verge)');
    expect(text).toContain('Open models expand access (Hacker News)');
    expect(text.startsWith('Tech desk')).toBe(true);
  });

  test('buildDeterministicEditorial handles empty sections', () => {
    expect(buildDeterministicEditorial(section, [])).toBe(
      'Tech section: no stories cleared the desk for this edition.'
    );
  });

  test('resolveEditorial prefers a valid LLM string and falls back otherwise', () => {
    const one = [{ title: 'Fallback headline', source: 'Wire', url: 'https://example.com/a' }];
    expect(resolveEditorial('  Concise factual synthesis.  ', section, one)).toBe(
      'Concise factual synthesis.'
    );
    expect(resolveEditorial('', section, one)).toContain('Fallback headline');
    expect(resolveEditorial(null, section, one)).toContain('Fallback headline');
  });

  test('buildCitationsFromStories and constrainCitationsToStories enforce URL provenance', () => {
    const citations = buildCitationsFromStories(stories, 2);
    expect(citations).toHaveLength(2);
    expect(citations[0]).toEqual({
      storyId: 'technology-1',
      url: 'https://example.com/chips',
      source: 'Ars Technica',
    });

    const constrained = constrainCitationsToStories(
      [
        { url: 'https://example.com/chips', source: 'Ars Technica' },
        { url: 'https://evil.example/not-selected', source: 'Nope' },
        { url: 'https://example.com/models', source: 'Hacker News' },
      ],
      stories,
      3
    );
    expect(constrained.map((item) => item.url)).toEqual([
      'https://example.com/chips',
      'https://example.com/models',
    ]);
  });

  test('validateEditorialDoc accepts a stable versioned shape and rejects foreign URLs', () => {
    const okDoc = {
      version: EDITORIAL_DOC_VERSION,
      text: 'Tech desk notes chip and browser updates.',
      citations: [{ storyId: 'technology-1', url: 'https://example.com/chips', source: 'Ars Technica' }],
      mode: 'deterministic',
      status: 'ok',
      reviewedAt: '2026-08-11T01:00:00.000Z',
    };
    expect(validateEditorialDoc(okDoc, stories).ok).toBe(true);

    const bad = validateEditorialDoc(
      {
        ...okDoc,
        citations: [{ url: 'https://evil.example/x', source: 'Nope' }],
      },
      stories
    );
    expect(bad.ok).toBe(false);
    expect(bad.reason).toMatch(/not in selected stories/);
  });

  test('deterministic editorialDoc populates text, citations, mode, status, reviewedAt', () => {
    const brief = getEditorialBrief('technology');
    const doc = buildDeterministicEditorialDoc(section, stories, {
      brief,
      reviewedAt: '2026-08-11T02:00:00.000Z',
    });

    expect(doc.version).toBe(1);
    expect(doc.text).toContain('Chipmakers raise guidance');
    expect(doc.citations).toHaveLength(3);
    expect(doc.citations.every((item) => stories.some((story) => story.url === item.url))).toBe(
      true
    );
    expect(doc.mode).toBe('deterministic');
    expect(doc.status).toBe('ok');
    expect(doc.reviewedAt).toBe('2026-08-11T02:00:00.000Z');
  });

  test('resolveEditorialDoc falls back when citations are invalid', () => {
    const brief = getEditorialBrief('technology');
    const doc = resolveEditorialDoc(
      {
        version: 1,
        text: 'Invented synthesis with a bad citation.',
        citations: [{ url: 'https://not-in-set.example', source: 'Fake' }],
        mode: 'llm',
        status: 'ok',
        reviewedAt: '2026-08-11T03:00:00.000Z',
      },
      section,
      stories,
      { brief, reviewedAt: '2026-08-11T03:00:00.000Z' }
    );

    expect(doc.mode).toBe('deterministic');
    expect(doc.status).toBe('fallback');
    expect(doc.citations.every((item) => stories.some((story) => story.url === item.url))).toBe(
      true
    );
  });

  test('resolveSectionEditorialFields keeps legacy editorial string in sync with editorialDoc', () => {
    const brief = getEditorialBrief('technology');
    const fields = resolveSectionEditorialFields(
      section,
      stories,
      '  Custom desk synthesis for compatibility.  ',
      null,
      { brief, mode: 'llm', reviewedAt: '2026-08-11T04:00:00.000Z' }
    );

    expect(fields.editorial).toBe('Custom desk synthesis for compatibility.');
    expect(fields.editorialDoc.text).toBe(fields.editorial);
    expect(fields.editorialDoc.mode).toBe('llm');
    expect(fields.editorialDoc.citations).toHaveLength(3);
  });

  test('legacy consumers can ignore editorialDoc and still read editorial', () => {
    const fields = resolveSectionEditorialFields(section, stories, null, null, {
      brief: getEditorialBrief('technology'),
    });
    const legacySection = {
      id: 'technology',
      editorial: fields.editorial,
      stories,
    };
    expect(typeof legacySection.editorial).toBe('string');
    expect(legacySection.editorial.length).toBeGreaterThan(0);
    expect(legacySection.editorialDoc).toBeUndefined();
  });
});
