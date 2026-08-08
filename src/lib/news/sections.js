const SECTIONS = [
  {
    id: 'ai',
    title: 'Artificial Intelligence',
    shortTitle: 'AI',
    description: 'Models, research, and the systems reshaping how we work.',
  },
  {
    id: 'technology',
    title: 'Technology',
    shortTitle: 'Tech',
    description: 'Gadgets, platforms, and the infrastructure behind the web.',
  },
  {
    id: 'chicago',
    title: 'Chicago',
    shortTitle: 'Chicago',
    description: 'Local civic life, culture, and neighborhood reporting.',
  },
  {
    id: 'global',
    title: 'Global',
    shortTitle: 'World',
    description: 'International affairs and stories shaping the wider world.',
  },
  {
    id: 'kerala_politics',
    title: 'Kerala Politics',
    shortTitle: 'Kerala',
    description: 'State politics, policy, and public life in Kerala.',
  },
  {
    id: 'india_politics',
    title: 'India Politics',
    shortTitle: 'India',
    description: 'National politics and policy debates across India.',
  },
  {
    id: 'real_madrid',
    title: 'Real Madrid',
    shortTitle: 'Madrid',
    description: 'Club news, matches, and transfers for Real Madrid.',
  },
  {
    id: 'movies',
    title: 'Movies',
    shortTitle: 'Movies',
    description: 'Reviews and entertainment coverage across Malayalam and English cinema.',
  },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

module.exports = {
  SECTIONS,
  SECTION_IDS,
};
