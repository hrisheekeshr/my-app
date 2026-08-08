# Automation prompt: 5 AM morning brief

Compile the Four Corners Daily morning brief for repository `hrisheekeshr/my-app` at 5:00 AM America/Chicago.

## Goal

Using yesterday’s archived newspaper issue, produce a concise factual summary and follow-ups for stories from the previous day. Write `public/data/morning-brief.json` and make it available to the UI.

## Steps

1. Checkout the working newspaper branch.
2. Ensure dependencies are installed (`npm ci` if needed).
3. Confirm an archive exists for yesterday (`public/data/archive/YYYY-MM-DD.json` or `public/data/previous.json`). If missing, run `npm run generate:news` once to establish current state, then still attempt the brief.
4. Ensure `public/data/latest.json` exists (generate news if absent) so follow-ups can be matched against the latest issue.
5. Run `npm run generate:morning-brief`.
6. Run `npm run test:ci`.
7. Commit changed brief/archive/latest files with message `chore: morning newspaper brief` and push (PR only if required).

## Editorial rules

- Summarize only from archived previous-day stories and matched current follow-ups.
- Never invent updates. If no follow-up exists for a story, keep the deterministic note that none was found.
- Preserve source attribution and original URLs.
- Keep the brief concise and section-scoped (ai, technology, chicago, global, kerala_politics, india_politics, real_madrid, movies).

## Output

Reply with: forDate, previousStories, followUpsFound, brief summary text, and commit/PR URL if created.
