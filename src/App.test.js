import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
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
            stories: [],
          },
          chicago: {
            id: 'chicago',
            title: 'Chicago',
            shortTitle: 'Chicago',
            description: 'Local reporting.',
            stories: [],
          },
          global: {
            id: 'global',
            title: 'Global',
            shortTitle: 'World',
            description: 'World affairs.',
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
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders newspaper brand in the main view', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /four corners daily/i })).toBeInTheDocument();
  expect(
    await screen.findByRole('navigation', { name: /newspaper sections/i })
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('heading', { name: /labs ship smaller reasoning models/i }).length
  ).toBeGreaterThan(0);
  expect(screen.getByText(/friday, august 7, 2026/i)).toBeInTheDocument();
});
