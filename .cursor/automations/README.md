# Cursor Automations for Four Corners Daily

Cursor Automations are configured in the UI ([cursor.com/automations/new](https://cursor.com/automations/new)); they are not loaded from repo files yet. Use the prompts below to create two automations against this repository.

Timezone intent: **America/Chicago**.

## 1) Newspaper refresh (day 2h / night 4h)

Create one automation with **multiple scheduled triggers** (OR semantics):

| Period | Local times (America/Chicago) | Suggested cron (UTC, CDT = UTC−5) |
|---|---|---|
| Day every 2h | 07:00, 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00 | `0 12,14,16,18,20,22,0,2 * * *` |
| Night every 4h | 22:00, 02:00, 06:00 | `0 3,7,11 * * *` |

If the Automations UI supports a timezone picker, prefer setting **America/Chicago** and using local cron instead of the UTC table above (UTC shifts one hour in CST).

**Repository:** `hrisheekeshr/my-app` (branch used for Pages / newspaper data)  
**Tools:** Pull request creation on (or direct commit if you prefer), Memories optional  
**Prompt:** paste [`newspaper-refresh.md`](./newspaper-refresh.md)

## 2) Morning brief at 5 AM

| Job | Local time | Suggested cron (UTC, CDT) |
|---|---|---|
| Morning summary + follow-ups | 05:00 America/Chicago | `0 10 * * *` |

**Repository:** same as above  
**Prompt:** paste [`morning-brief.md`](./morning-brief.md)

## Verification

After an automation run:

1. `public/data/latest.json` has a fresh `generatedAt`
2. `public/data/archive/YYYY-MM-DD.json` exists for recent days
3. After the 5 AM run, `public/data/morning-brief.json` summarizes yesterday and lists follow-ups
4. The newspaper UI **Refresh** button reloads both JSON files (cache-busted)

GitHub Actions (`.github/workflows/daily-newspaper.yml`) mirrors the same cadence as a backup using an hourly UTC cron + Chicago gate scripts.
