import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (String(url).includes('morning-brief.json')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          type: 'morning-brief',
          forDate: '2026-08-06',
          generatedAt: '2026-08-07T10:00:00.000Z',
          summary: 'Morning brief for Thursday: reviewing 1 story from yesterday.',
          sections: [
            {
              id: 'ai',
              title: 'Artificial Intelligence',
              summary: 'AI desk lead from yesterday.',
              followUps: [
                {
                  previous: {
                    id: 'ai-0',
                    title: 'Earlier model release',
                    url: 'https://example.com/ai-old',
                  },
                  update: {
                    id: 'ai-1',
                    title: 'Labs ship smaller reasoning models',
                    url: 'https://example.com/ai',
                  },
                  note: 'Related coverage found in the latest issue.',
                },
              ],
            },
          ],
          meta: { previousStories: 1, followUpsFound: 1 },
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({
        brand: 'Four Corners Daily',
        tagline: 'AI · Technology · Chicago · The World',
        publicationDate: 'Friday, August 7, 2026',
        timezone: 'America/Chicago',
        generatedAt: '2026-08-07T12:00:00.000Z',
        leadStory: {
          id: 'ai-1',
          title: 'Labs ship smaller reasoning models',
          summary: 'A concise look at efficient AI systems.',
          url: 'https://example.com/ai',
          source: 'Example Wire',
          publishedAt: '2026-08-07T11:00:00.000Z',
          section: 'ai',
        },
        sections: {
          ai: {
            id: 'ai',
            title: 'Artificial Intelligence',
            shortTitle: 'AI',
            description: 'Models and research.',
            editorial: 'AI desk lead: Labs ship smaller reasoning models (Example Wire).',
            stories: [
              {
                id: 'ai-1',
                title: 'Labs ship smaller reasoning models',
                summary: 'A concise look at efficient AI systems.',
                url: 'https://example.com/ai',
                source: 'Example Wire',
                publishedAt: '2026-08-07T11:00:00.000Z',
                section: 'ai',
              },
            ],
          },
          technology: {
            id: 'technology',
            title: 'Technology',
            shortTitle: 'Tech',
            description: 'Platforms and gadgets.',
            editorial: 'Tech section: no stories cleared the desk for this edition.',
            stories: [],
          },
          chicago: {
            id: 'chicago',
            title: 'Chicago',
            shortTitle: 'Chicago',
            description: 'Local reporting.',
            editorial: 'Chicago section: no stories cleared the desk for this edition.',
            stories: [],
          },
          global: {
            id: 'global',
            title: 'Global',
            shortTitle: 'World',
            description: 'World affairs.',
            editorial: 'World section: no stories cleared the desk for this edition.',
            stories: [],
          },
          kerala_politics: {
            id: 'kerala_politics',
            title: 'Kerala Politics',
            shortTitle: 'Kerala',
            description: 'State politics.',
            editorial: 'Kerala section: no stories cleared the desk for this edition.',
            stories: [],
          },
          india_politics: {
            id: 'india_politics',
            title: 'India Politics',
            shortTitle: 'India',
            description: 'National politics.',
            editorial: 'India section: no stories cleared the desk for this edition.',
            stories: [],
          },
          real_madrid: {
            id: 'real_madrid',
            title: 'Real Madrid',
            shortTitle: 'Madrid',
            description: 'Club news.',
            editorial: 'Madrid section: no stories cleared the desk for this edition.',
            stories: [],
          },
          movies: {
            id: 'movies',
            title: 'Movies',
            shortTitle: 'Movies',
            description: 'Reviews.',
            editorial: 'Movies section: no stories cleared the desk for this edition.',
            stories: [],
          },
        },
        meta: {
          totalStories: 1,
          sourcesAttempted: 1,
          sourcesSucceeded: 1,
          mode: 'rss',
        },
        errors: [],
      }),
    });
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders newspaper brand in the main view', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /four corners daily/i })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /refresh/i })).toBeInTheDocument();
  expect(
    await screen.findByRole('navigation', { name: /newspaper sections/i })
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('heading', { name: /labs ship smaller reasoning models/i }).length
  ).toBeGreaterThan(0);
  expect(
    screen.getByText(/AI desk lead: Labs ship smaller reasoning models \(Example Wire\)\./i)
  ).toBeInTheDocument();
  expect(screen.getByText(/friday, august 7, 2026/i)).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /yesterday’s stories & follow-ups/i })
  ).toBeInTheDocument();
});
