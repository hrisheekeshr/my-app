const {
  stripHtml,
  normalizeTitleKey,
  normalizeUrl,
  summarize,
  normalizeItem,
  extractHnPoints,
  cleanHnDescription,
} = require('./normalize');

describe('normalize helpers', () => {
  test('stripHtml removes tags and decodes entities', () => {
    expect(stripHtml('<p>Hello&nbsp;<b>world</b> &amp; friends</p>')).toBe(
      'Hello world & friends'
    );
    expect(stripHtml('New Balance&#124; August 8th')).toBe('New Balance| August 8th');
  });

  test('normalizeTitleKey lowercases and strips punctuation', () => {
    expect(normalizeTitleKey('OpenAI Unveils GPT-5!!')).toBe('openai unveils gpt 5');
  });

  test('normalizeTitleKey strips publisher suffixes for dedupe', () => {
    expect(
      normalizeTitleKey(
        'Some US adults are using AI for financial guidance but few trust it, Gallup poll finds - The Washington Post'
      )
    ).toBe(
      normalizeTitleKey(
        'Some US adults are using AI for financial guidance but few trust it, Gallup poll finds - wral.com'
      )
    );
  });

  test('normalizeUrl strips tracking params and trailing slash', () => {
    expect(
      normalizeUrl('https://Example.com/Story/?utm_source=news&utm_medium=rss#section')
    ).toBe('https://example.com/story');
  });

  test('normalizeUrl unwraps nested Google News url param', () => {
    expect(
      normalizeUrl('https://news.google.com/rss/articles/abc?url=https%3A%2F%2Freuters.com%2Fworld%2F')
    ).toBe('https://reuters.com/world');
  });

  test('summarize truncates on word boundaries', () => {
    const long =
      'Researchers announced a breakthrough in multimodal models that can reason across text and images while remaining efficient enough for on-device deployment in consumer hardware this year.';
    const summary = summarize(long, 80);
    expect(summary.endsWith('…')).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(81);
    expect(summary.includes('  ')).toBe(false);
  });

  test('normalizeItem returns null without title or url', () => {
    expect(normalizeItem({ title: 'Only title' }, 'ai')).toBeNull();
    expect(normalizeItem({ link: 'https://example.com' }, 'ai')).toBeNull();
  });

  test('normalizeItem maps raw RSS fields into a story', () => {
    const story = normalizeItem(
      {
        title: '  <b>City expands L train service</b> ',
        link: 'https://blockclubchicago.org/story/?utm_source=rss',
        contentSnippet: '<p>Overnight work will reshape weekend schedules for riders.</p>',
        creator: 'Block Club Chicago',
        isoDate: '2026-08-07T12:00:00.000Z',
      },
      'chicago',
      'Fallback'
    );

    expect(story).toMatchObject({
      section: 'chicago',
      title: 'City expands L train service',
      source: 'Block Club Chicago',
      url: 'https://blockclubchicago.org/story/?utm_source=rss',
      urlKey: 'https://blockclubchicago.org/story',
      titleKey: 'city expands l train service',
    });
    expect(story.summary).toContain('Overnight work');
    expect(story.id).toMatch(/^chicago-/);
  });

  test('normalizeItem replaces title-echo Google News snippets', () => {
    const story = normalizeItem(
      {
        title: 'Who is liable when AI goes rogue? Lawyers see new risks - Reuters',
        link: 'https://news.google.com/rss/articles/abc',
        contentSnippet: 'Who is liable when AI goes rogue? Lawyers see new risks Reuters',
      },
      'ai',
      'Google News'
    );

    expect(story.title).toBe('Who is liable when AI goes rogue? Lawyers see new risks');
    expect(story.source).toBe('Reuters');
    expect(story.summary).toBe('Coverage from Reuters. Open the source for the full report.');
  });

  test('extractHnPoints reads Points from hnrss description HTML', () => {
    expect(
      extractHnPoints(
        '<p>Article URL: <a href="https://example.com">https://example.com</a></p><p>Points: 286</p><p># Comments: 40</p>'
      )
    ).toBe(286);
    expect(extractHnPoints('No score here')).toBeNull();
  });

  test('normalizeItem parses HN points and cleans metadata-only summaries', () => {
    const story = normalizeItem(
      {
        title: 'Hardware backdoors in some x86 CPUs',
        link: 'https://github.com/xoreaxeaxeax/rosenbridge',
        content:
          '<p>Article URL: <a href="https://github.com/xoreaxeaxeax/rosenbridge">https://github.com/xoreaxeaxeax/rosenbridge</a></p><p>Comments URL: <a href="https://news.ycombinator.com/item?id=1">https://news.ycombinator.com/item?id=1</a></p><p>Points: 196</p><p># Comments: 58</p>',
        isoDate: '2026-08-08T07:04:51.000Z',
      },
      'technology',
      'Hacker News'
    );

    expect(story.points).toBe(196);
    expect(cleanHnDescription(story.summary)).toBe(story.summary);
    expect(story.summary).toBe('Coverage from Hacker News. Open the source for the full report.');
    expect(story.summary).not.toMatch(/Points:/i);
  });
});
