# Four Corners Daily

A daily newspaper generator built on this React app. Each morning it compiles concise stories across **AI**, **Technology**, **Chicago**, **Global**, **Kerala Politics**, **India Politics**, **Real Madrid**, and **Movies** into a readable HTML issue with source links and a short section editorial.

The existing profile sidebar (Home / Profile / Settings) is preserved. **Newspaper** is the default main view.

## Features

- RSS-first pipeline with optional NewsAPI enrichment
- Normalization, HTML stripping, concise summaries, and deduplication
- Hacker News technology stories limited to the top 30% by parsed points
- Per-section editorial synthesis (`section.editorial`) via OpenAI or deterministic fallback
- Graceful per-source failure handling
- Responsive editorial layout with section navigation, lead story, and story cards
- Loading, empty, and error states with accessible semantic markup
- GitHub Actions schedule that refreshes the issue once per day
- Unit tests for core normalize/dedupe/HN ranking/editorial logic

## Setup

```bash
npm install
cp .env.example .env.local   # optional
npm run generate:news        # fetch + write public/data/latest.json
npm start                    # http://localhost:3000
```

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NEWS_TIMEZONE` | No | `America/Chicago` | IANA timezone for the published-date label |
| `NEWS_MAX_PER_SECTION` | No | `8` | Max stories kept per section after dedupe |
| `NEWS_FETCH_TIMEOUT_MS` | No | `15000` | Per-feed fetch timeout |
| `NEWS_API_KEY` | No | _(unset)_ | Optional [NewsAPI.org](https://newsapi.org/) key |
| `OPENAI_API_KEY` | No | _(unset)_ | Optional [OpenAI](https://platform.openai.com/) key for gpt-4o-mini curation + section editorials |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model override for editorial curation |

Without `NEWS_API_KEY`, the generator uses public RSS feeds only. That is the supported no-key fallback. Without `OPENAI_API_KEY`, story selection and `section.editorial` use deterministic fallbacks built only from fetched candidates.

### Repository secrets / variables (GitHub Actions)

- Optional secrets: `NEWS_API_KEY`, `OPENAI_API_KEY`
- Optional variables: `NEWS_TIMEZONE`, `NEWS_MAX_PER_SECTION`, `NEWS_FETCH_TIMEOUT_MS`, `OPENAI_MODEL`

## Local development

```bash
npm start                 # React app
npm run generate:news     # refresh issue JSON
npm test                  # Jest (normalize/dedupe/HN/editorial + app smoke test)
npm run build             # production build (also regenerates news first)
```

Open the **Newspaper** item in the sidebar to read the latest issue.

## Pipeline operation

`npm run generate:news` runs `scripts/generate-newspaper.js`:

1. Fetch configured RSS feeds for all newspaper sections
2. Optionally query NewsAPI when `NEWS_API_KEY` is present
3. Normalize titles/URLs/summaries (`src/lib/news/normalize.js`), including HN points from hnrss descriptions
4. For Hacker News, keep only the top 30% by points (`src/lib/news/hnRank.js`); if points are missing, keep the top 30% of feed order (frontpage ranking). Do **not** treat hnrss `?points=N` as a percentile API — that parameter is an absolute threshold only.
5. Deduplicate by canonical URL and near-matching titles (`src/lib/news/dedupe.js`)
6. Optionally curate with OpenAI (`gpt-4o-mini`) and generate one concise factual `section.editorial` per section from selected stories only
7. When OpenAI is unavailable or fails validation, use deterministic story selection plus deterministic editorial text
8. Write `public/data/latest.json` (backward-compatible additive `section.editorial` field)
9. Record per-source success/failure metadata for the UI

Feed definitions live in `scripts/feeds.config.js`.

### brutalist.report source note

Inspected 2026-08-08: brutalist.report does **not** expose a stable public RSS/Atom feed, and the former JSON API at `/api` only returns a relocation message pointing at `/about`, which documents no replacement public endpoint (premium features are UI-only). HTML topic pages were not scraped. Until an official public feed returns, technology coverage continues via Ars Technica, The Verge, Google News Technology, and Hacker News.

## Daily automation

Workflow: [`.github/workflows/daily-newspaper.yml`](.github/workflows/daily-newspaper.yml)

| Detail | Value |
|---|---|
| Schedule (UTC) | `0 12 * * *` every day |
| Local meaning | **07:00 America/Chicago (CST)** / **06:00 (CDT)** |
| Issue timezone label | `NEWS_TIMEZONE` (default `America/Chicago`) |
| Manual run | Actions → **Daily Newspaper** → **Run workflow** |

The workflow generates the issue, runs tests, builds the site, commits updated `public/data/latest.json` when appropriate, and deploys `build/` to GitHub Pages (`gh-pages` branch).

## Deployment (GitHub Pages)

This repository did not previously have hosting configured. The app is set up for **GitHub Pages** via `gh-pages`.

Expected site URL after Pages is enabled:

`https://hrisheekeshr.github.io/my-app/`

### One-time GitHub settings

1. Repo **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Choose branch `gh-pages` / folder `/ (root)`
4. Ensure Actions have permission to write (`Settings → Actions → General → Workflow permissions → Read and write`)

### Deploy commands

```bash
npm run deploy            # generate news + build + push to gh-pages
# or rely on the Daily Newspaper GitHub Action
```

`package.json` sets `"homepage": "https://hrisheekeshr.github.io/my-app"` so asset paths resolve on project Pages.

If automatic deployment cannot complete in this environment (missing Pages enablement or token scope), the RSS fallback pipeline and workflow are still fully implemented — enable Pages with the steps above, then re-run the **Daily Newspaper** workflow.

## Project structure

```
scripts/
  generate-newspaper.js   # fetch → normalize → dedupe → editorial → latest.json
  feeds.config.js         # RSS + NewsAPI source config
src/lib/news/             # shared normalize/dedupe/HN/editorial (tested)
src/components/newspaper/ # React newspaper UI
public/data/latest.json   # latest compiled issue
.github/workflows/        # daily schedule + deploy
```

## Tests

```bash
npm test -- --watchAll=false
```

Coverage focuses on:

- HTML stripping / URL canonicalization / summaries / HN points parsing
- URL + fuzzy-title deduplication
- Top-30% HN ranking with feed-order fallback
- Deterministic section editorial text
- App smoke render of the newspaper masthead and section editorial
