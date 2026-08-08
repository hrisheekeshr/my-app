function formatStoryDate(value) {
  if (!value) return 'Date unavailable';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Date unavailable';
  }
}

const StoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <article className="newspaper-card">
      <h3>
        <a href={story.url} target="_blank" rel="noopener noreferrer">
          {story.title}
        </a>
      </h3>
      <p>{story.summary || 'Summary unavailable for this story.'}</p>
      <footer className="newspaper-card-footer">
        <span>
          {story.source} · {formatStoryDate(story.publishedAt)}
        </span>
        <a href={story.url} target="_blank" rel="noopener noreferrer">
          Read source
        </a>
      </footer>
    </article>
  );
};

export default StoryCard;
