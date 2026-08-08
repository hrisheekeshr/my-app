import { useEffect, useState } from 'react';
import SectionBlock from './SectionBlock';
import './Newspaper.css';

const ISSUE_URL = `${process.env.PUBLIC_URL || ''}/data/latest.json`;
const BRIEF_URL = `${process.env.PUBLIC_URL || ''}/data/morning-brief.json`;

function formatShortDate(value) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return null;
  }
}

const LoadingState = () => (
  <div className="newspaper-status" role="status" aria-live="polite" aria-busy="true">
    <h2>Setting the press…</h2>
    <p>Loading today’s compiled issue across AI, technology, Chicago, and global news.</p>
    <div className="newspaper-skeleton" aria-hidden="true">
      <div className="newspaper-skeleton-block tall" />
      <div className="newspaper-skeleton-block" />
      <div className="newspaper-skeleton-block" />
    </div>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="newspaper-status" role="alert">
    <h2>Issue unavailable</h2>
    <p>{message}</p>
    <div className="newspaper-status-actions">
      <button type="button" className="newspaper-button" onClick={onRetry}>
        Try again
      </button>
      <a className="newspaper-button secondary" href={ISSUE_URL}>
        Open raw issue JSON
      </a>
    </div>
  </div>
);

const EmptyState = ({ onRetry }) => (
  <div className="newspaper-status" role="status">
    <h2>The page is blank</h2>
    <p>
      The latest issue file loaded, but it contains no stories. Run{' '}
      <code>npm run generate:news</code> to refresh feeds, then reload.
    </p>
    <div className="newspaper-status-actions">
      <button type="button" className="newspaper-button" onClick={onRetry}>
        Reload issue
      </button>
    </div>
  </div>
);

const MorningBrief = ({ brief }) => {
  if (!brief || brief.meta?.missingArchive) return null;
  const sectionsWithFollowUps = (brief.sections || []).filter(
    (section) => (section.followUps || []).length > 0
  );
  if (!sectionsWithFollowUps.length && !brief.summary) return null;

  return (
    <section className="newspaper-brief" aria-label="Morning brief">
      <header className="newspaper-brief-header">
        <p className="newspaper-lead-label">Morning brief</p>
        <h2>Yesterday’s stories & follow-ups</h2>
        <p>{brief.summary}</p>
        {brief.forDate || brief.generatedAt ? (
          <div className="newspaper-story-meta">
            {brief.forDate ? <span>For {brief.forDate}</span> : null}
            {brief.generatedAt ? <span>Compiled {formatShortDate(brief.generatedAt)}</span> : null}
            <span>
              {brief.meta?.followUpsFound || 0}/{brief.meta?.previousStories || 0} follow-ups
            </span>
          </div>
        ) : null}
      </header>

      <div className="newspaper-brief-sections">
        {sectionsWithFollowUps.map((section) => (
          <div key={section.id} className="newspaper-brief-section">
            <h3>{section.title}</h3>
            <p>{section.summary}</p>
            <ul>
              {(section.followUps || []).slice(0, 4).map((item) => (
                <li key={item.previous.id || item.previous.url}>
                  <a href={item.previous.url} target="_blank" rel="noopener noreferrer">
                    {item.previous.title}
                  </a>
                  {item.update ? (
                    <>
                      {' '}
                      →{' '}
                      <a href={item.update.url} target="_blank" rel="noopener noreferrer">
                        {item.update.title}
                      </a>
                    </>
                  ) : (
                    <span className="newspaper-brief-note"> — {item.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

const Newspaper = () => {
  const [issue, setIssue] = useState(null);
  const [brief, setBrief] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadIssue() {
      setStatus((current) => (current === 'ready' ? current : 'loading'));
      setRefreshing(true);
      setErrorMessage('');

      try {
        const bust = Date.now();
        const [issueResponse, briefResponse] = await Promise.all([
          fetch(`${ISSUE_URL}?t=${bust}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
          fetch(`${BRIEF_URL}?t=${bust}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }).catch(() => null),
        ]);

        if (!issueResponse.ok) {
          throw new Error(`Could not load the latest issue (HTTP ${issueResponse.status}).`);
        }

        const payload = await issueResponse.json();
        let briefPayload = null;
        if (briefResponse?.ok) {
          briefPayload = await briefResponse.json();
        }
        if (cancelled) return;

        setIssue(payload);
        setBrief(briefPayload);
        const total = payload?.meta?.totalStories ?? 0;
        setStatus(total > 0 ? 'ready' : 'empty');
      } catch (error) {
        if (cancelled || error.name === 'AbortError') return;
        setIssue(null);
        setBrief(null);
        setStatus('error');
        setErrorMessage(
          error.message ||
            'Something went wrong while loading the newspaper. Check that public/data/latest.json exists.'
        );
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    loadIssue();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken]);

  const retry = () => setReloadToken((value) => value + 1);
  const sections = issue ? Object.values(issue.sections || {}) : [];

  return (
    <div className="newspaper">
      <div className="newspaper-shell">
        <header className="newspaper-masthead">
          <div className="newspaper-masthead-row">
            <p className="newspaper-kicker">Daily compiled edition</p>
            <button
              type="button"
              className="newspaper-button newspaper-refresh"
              onClick={retry}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <h1 className="newspaper-brand">{issue?.brand || 'Four Corners Daily'}</h1>
          <p className="newspaper-tagline">
            {issue?.tagline ||
              'A readable morning brief across artificial intelligence, technology, Chicago, and the world.'}
          </p>
          <div className="newspaper-meta">
            <span>
              <strong>Published</strong>{' '}
              {issue?.publicationDate || 'Awaiting first generation'}
            </span>
            {issue?.timezone ? (
              <span>
                <strong>Timezone</strong> {issue.timezone}
              </span>
            ) : null}
            {issue?.generatedAt ? (
              <span>
                <strong>Generated</strong> {formatShortDate(issue.generatedAt)}
              </span>
            ) : null}
          </div>
        </header>

        {status === 'loading' ? <LoadingState /> : null}
        {status === 'error' ? <ErrorState message={errorMessage} onRetry={retry} /> : null}
        {status === 'empty' ? <EmptyState onRetry={retry} /> : null}

        {status === 'ready' && issue ? (
          <>
            {issue.errors?.length ? (
              <div className="newspaper-alert" role="status">
                {issue.errors.length} source{issue.errors.length === 1 ? '' : 's'} failed while
                compiling this issue. Remaining feeds still published below.
              </div>
            ) : null}

            <nav className="newspaper-nav" aria-label="Newspaper sections">
              {sections.map((section) => (
                <a key={section.id} href={`#section-${section.id}`}>
                  {section.shortTitle || section.title}
                </a>
              ))}
            </nav>

            <MorningBrief brief={brief} />

            {issue.leadStory ? (
              <article className="newspaper-lead" aria-label="Lead story">
                <div>
                  <p className="newspaper-lead-label">Lead story</p>
                  <h2>
                    <a
                      href={issue.leadStory.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {issue.leadStory.title}
                    </a>
                  </h2>
                  <div className="newspaper-story-meta">
                    <span>{issue.leadStory.source}</span>
                    <span>{formatShortDate(issue.leadStory.publishedAt) || 'Recent'}</span>
                    <span>{issue.leadStory.section?.toUpperCase()}</span>
                  </div>
                </div>
                <p>{issue.leadStory.summary || 'Open the source for the full report.'}</p>
              </article>
            ) : null}

            <main>
              {sections.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </main>

            <footer className="newspaper-footer">
              Compiled from {issue.meta?.sourcesSucceeded || 0}/
              {issue.meta?.sourcesAttempted || 0} sources · mode {issue.meta?.mode || 'rss'} ·{' '}
              {issue.meta?.totalStories || 0} stories
            </footer>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Newspaper;
