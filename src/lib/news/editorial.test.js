const { buildDeterministicEditorial, resolveEditorial } = require('./editorial');

describe('editorial helpers', () => {
  const section = { title: 'Technology', shortTitle: 'Tech' };

  test('buildDeterministicEditorial uses only supplied story titles/sources', () => {
    const text = buildDeterministicEditorial(section, [
      { title: 'Chipmakers raise guidance', source: 'Ars Technica' },
      { title: 'Browser vendors tighten extensions', source: 'The Verge' },
      { title: 'Open models expand access', source: 'Hacker News' },
    ]);

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
    const stories = [{ title: 'Fallback headline', source: 'Wire' }];
    expect(resolveEditorial('  Concise factual synthesis.  ', section, stories)).toBe(
      'Concise factual synthesis.'
    );
    expect(resolveEditorial('', section, stories)).toContain('Fallback headline');
    expect(resolveEditorial(null, section, stories)).toContain('Fallback headline');
  });
});
