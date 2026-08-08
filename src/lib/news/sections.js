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
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

module.exports = {
  SECTIONS,
  SECTION_IDS,
};
