const { findFollowUp, buildMorningBrief } = require('./morningBrief');

describe('morning brief helpers', () => {
  test('findFollowUp returns a same-section near match', () => {
    const previous = {
      title: 'City expands L train weekend service',
      titleKey: 'city expands l train weekend service',
      url: 'https://example.com/old',
      section: 'chicago',
    };
    const match = findFollowUp(previous, [
      {
        title: 'City expands L train weekend service further',
        titleKey: 'city expands l train weekend service further',
        url: 'https://example.com/new',
        section: 'chicago',
      },
      {
        title: 'Unrelated weather update',
        titleKey: 'unrelated weather update',
        url: 'https://example.com/weather',
        section: 'chicago',
      },
    ]);

    expect(match?.story.url).toBe('https://example.com/new');
    expect(match?.score).toBeGreaterThan(0.5);
  });

  test('buildMorningBrief attaches follow-ups and a summary', () => {
    const previousIssue = {
      brand: 'Four Corners Daily',
      publicationDate: 'Friday, August 7, 2026',
      timezone: 'America/Chicago',
      sections: {
        ai: {
          id: 'ai',
          editorial: 'AI desk lead: Labs ship smaller models.',
          stories: [
            {
              id: 'ai-1',
              title: 'Labs ship smaller reasoning models',
              titleKey: 'labs ship smaller reasoning models',
              url: 'https://example.com/ai-old',
              source: 'Wire',
              summary: 'Efficiency gains.',
              section: 'ai',
            },
          ],
        },
      },
    };

    const currentIssue = {
      sections: {
        ai: {
          stories: [
            {
              id: 'ai-2',
              title: 'Labs ship smaller reasoning models to phones',
              titleKey: 'labs ship smaller reasoning models to phones',
              url: 'https://example.com/ai-new',
              source: 'Wire',
              summary: 'On-device follow-up.',
              section: 'ai',
            },
          ],
        },
      },
    };

    const brief = buildMorningBrief(previousIssue, currentIssue, {
      forDate: '2026-08-07',
      generatedAt: new Date('2026-08-08T10:00:00.000Z'),
    });

    expect(brief.type).toBe('morning-brief');
    expect(brief.forDate).toBe('2026-08-07');
    expect(brief.summary).toContain('Morning brief for Friday, August 7, 2026');
    const ai = brief.sections.find((section) => section.id === 'ai');
    expect(ai.followUps[0].update.url).toBe('https://example.com/ai-new');
    expect(brief.meta.followUpsFound).toBe(1);
  });
});
