const { dedupeStories, titleSimilarity } = require('./dedupe');

describe('dedupeStories', () => {
  test('titleSimilarity scores overlapping tokens', () => {
    expect(
      titleSimilarity(
        'openai launches new model for developers',
        'openai launches new model for developers today'
      )
    ).toBeGreaterThan(0.8);
  });

  test('removes exact URL duplicates and keeps the richer summary', () => {
    const stories = [
      {
        id: 'a',
        section: 'ai',
        title: 'Model release',
        url: 'https://example.com/a',
        urlKey: 'https://example.com/a',
        titleKey: 'model release',
        summary: 'Short',
        publishedAt: '2026-08-07T10:00:00.000Z',
      },
      {
        id: 'b',
        section: 'ai',
        title: 'Model release',
        url: 'https://example.com/a?utm_source=x',
        urlKey: 'https://example.com/a',
        titleKey: 'model release',
        summary: 'A longer and more useful summary for readers.',
        publishedAt: '2026-08-07T11:00:00.000Z',
      },
    ];

    const result = dedupeStories(stories);
    expect(result).toHaveLength(1);
    expect(result[0].summary).toContain('longer and more useful');
  });

  test('collapses near-duplicate titles within the same section', () => {
    const stories = [
      {
        id: '1',
        section: 'technology',
        title: 'Apple unveils thinner smartphone prototype',
        url: 'https://a.example/1',
        urlKey: 'https://a.example/1',
        titleKey: 'apple unveils thinner smartphone prototype',
        summary: 'First report',
        publishedAt: '2026-08-06T09:00:00.000Z',
      },
      {
        id: '2',
        section: 'technology',
        title: 'Apple unveils thinner smartphone prototype today',
        url: 'https://b.example/2',
        urlKey: 'https://b.example/2',
        titleKey: 'apple unveils thinner smartphone prototype today',
        summary: 'Second report with more detail for the desk.',
        publishedAt: '2026-08-06T10:00:00.000Z',
      },
      {
        id: '3',
        section: 'global',
        title: 'Apple unveils thinner smartphone prototype today',
        url: 'https://c.example/3',
        urlKey: 'https://c.example/3',
        titleKey: 'apple unveils thinner smartphone prototype today',
        summary: 'Same title but different section should remain.',
        publishedAt: '2026-08-06T11:00:00.000Z',
      },
    ];

    const result = dedupeStories(stories);
    expect(result).toHaveLength(2);
    expect(result.find((story) => story.section === 'technology').summary).toContain(
      'more detail'
    );
    expect(result.find((story) => story.section === 'global')).toBeTruthy();
  });

  test('returns empty array for invalid input', () => {
    expect(dedupeStories(null)).toEqual([]);
    expect(dedupeStories([])).toEqual([]);
  });
});
