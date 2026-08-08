const { selectTopPercentileByPoints } = require('./hnRank');

describe('selectTopPercentileByPoints', () => {
  test('keeps the top 30% by HN points when points are available', () => {
    const stories = [
      { title: 'low', points: 10, publishedAt: '2026-08-08T01:00:00.000Z' },
      { title: 'high', points: 300, publishedAt: '2026-08-08T02:00:00.000Z' },
      { title: 'mid', points: 120, publishedAt: '2026-08-08T03:00:00.000Z' },
      { title: 'higher', points: 250, publishedAt: '2026-08-08T04:00:00.000Z' },
      { title: 'tiny', points: 5, publishedAt: '2026-08-08T05:00:00.000Z' },
      { title: 'top', points: 400, publishedAt: '2026-08-08T06:00:00.000Z' },
      { title: 'mid2', points: 90, publishedAt: '2026-08-08T07:00:00.000Z' },
      { title: 'mid3', points: 80, publishedAt: '2026-08-08T08:00:00.000Z' },
      { title: 'mid4', points: 70, publishedAt: '2026-08-08T09:00:00.000Z' },
      { title: 'mid5', points: 60, publishedAt: '2026-08-08T10:00:00.000Z' },
    ];

    // ceil(10 * 0.3) = 3
    const selected = selectTopPercentileByPoints(stories, 0.3);
    expect(selected).toHaveLength(3);
    expect(selected.map((story) => story.title)).toEqual(['top', 'high', 'higher']);
  });

  test('falls back to feed order when points are unavailable', () => {
    const stories = [
      { title: 'first' },
      { title: 'second' },
      { title: 'third' },
      { title: 'fourth' },
      { title: 'fifth' },
    ];

    // ceil(5 * 0.3) = 2
    const selected = selectTopPercentileByPoints(stories, 0.3);
    expect(selected.map((story) => story.title)).toEqual(['first', 'second']);
  });

  test('returns empty array for empty input', () => {
    expect(selectTopPercentileByPoints([])).toEqual([]);
    expect(selectTopPercentileByPoints(null)).toEqual([]);
  });
});
