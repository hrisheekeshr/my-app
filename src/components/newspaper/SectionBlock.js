import StoryCard from './StoryCard';

const SectionBlock = ({ section }) => {
  if (!section) return null;

  return (
    <section
      id={`section-${section.id}`}
      className="newspaper-section"
      aria-labelledby={`heading-${section.id}`}
    >
      <header className="newspaper-section-header">
        <h2 id={`heading-${section.id}`}>{section.title}</h2>
        <p>{section.description}</p>
      </header>

      {section.editorial ? (
        <p className="newspaper-section-editorial">{section.editorial}</p>
      ) : null}

      {section.stories?.length ? (
        <div className="newspaper-grid">
          {section.stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="newspaper-status" role="status">
          <h2>No stories yet</h2>
          <p>
            This section had no usable items after fetching and deduplication. It will refresh on
            the next daily run.
          </p>
        </div>
      )}
    </section>
  );
};

export default SectionBlock;
