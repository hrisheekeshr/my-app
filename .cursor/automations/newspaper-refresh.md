# Automation prompt: Newspaper refresh

Refresh the Four Corners Daily newspaper issue for repository `hrisheekeshr/my-app`.

## Goal

Regenerate `public/data/latest.json` from configured RSS feeds, archive the day’s issue, run tests, and publish the updated static data so the UI Refresh button can load a newer edition.

## Steps

1. Checkout the working newspaper branch for this repo.
2. Run `npm ci` if `node_modules` is missing.
3. Run `npm run generate:news`.
4. Run `npm run generate:morning-brief` so follow-up matching stays current against the new issue.
5. Run `npm run test:ci`.
6. If issue/brief JSON changed, commit only:
   - `public/data/latest.json`
   - `public/data/previous.json` (if present)
   - `public/data/archive/**`
   - `public/data/morning-brief.json`
   with message `chore: refresh newspaper issue`.
7. Push to the branch. Open a PR only if the branch protection requires it; otherwise commit directly.
8. If GitHub Pages deploy is wired through Actions, do not hand-edit `gh-pages`; let the workflow/deploy path handle hosting.

## Rules

- Do not invent stories, URLs, or editorial facts.
- Keep existing sections and design.
- If feed fetches partially fail, still publish whatever valid stories were produced.
- If generation yields zero stories, do not commit empty wipe; report failure and stop.
- Prefer deterministic generation when `OPENAI_API_KEY` is unavailable.

## Output

Reply with: generatedAt, totalStories, sourcesSucceeded/sourcesAttempted, and whether JSON was committed.
