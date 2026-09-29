# Remote branch triage

Checked 2026-09-29 against `ben/changes`. These are the remote branches with
commits that aren't in `ben/changes`. Remote branches were not modified or
deleted.

| Branch | Author | Last commit | Verdict |
|---|---|---|---|
| `homepage-ui` | Carson Hinsverk | 2026-04-07 | Superseded by the screenshot redesign; two behaviors ported in milestone 3c |
| `daily-nutrition-blob` | Carson Hinsverk | 2026-03-25 | Superseded (its only commit is also in `homepage-ui`) |
| `feat-header-component` | avik-ch, Qise Salem | 2026-03-14 | Superseded |
| `button` | Shivam Ranjan | 2026-02-17 | Superseded |
| `feat/api-service` | Idan Talker | 2025-12-01 | Superseded by `lib/api.ts` |

## Details

### `homepage-ui` (3 commits)

A Home screen built on hard-coded sample data: an animated Daily Nutrition card,
Today's Workout with category icons, Goals Progress bars, four shortcut buttons,
new SVG icons, and Reanimated entrance and scroll-reveal animations. It also moves
several components into `Name/index.tsx` + `styles.ts` folders.
`TodaysWorkout` renders a DOM `<div>`, which only works on web.

**Verdict: superseded by the screenshot redesign.** The current Home reads live
data for every card. Behavior in this branch that the current Home lacks:

- **Calories over target.** The branch shows "Goal Met! N over" when intake
  exceeds the target; the current Home clamps its badge at "0 left". Ported in
  milestone 3c.
- **Weekly workout goal.** The branch shows workouts as "3 / 5 this week". The
  API had no weekly target; milestone 3c adds one (D4).
- **Animations.** Entrance fade/slide, scroll-reveal cards and animated progress
  fills. Not ported; the screenshot design specifies no motion.
- **Workout category icons** (strength, cardio, functional). Not ported; the API
  has no workout category.
- **Goal completion bars with percentages.** Not ported; the API has no way to
  measure progress toward a profile goal (see `docs/design-verification.md`).

### `daily-nutrition-blob` (1 commit)

Adds a `DailyNutrition` card and makes `StatsBlob`'s goal optional so the streak
tile can omit a progress bar. The same commit (`0296c46`) is the first commit of
`homepage-ui`.

**Verdict: superseded.** The current Home has a live Daily Nutrition section and
`StatsBlob` supports missing goals, notes and `showProgress={false}`.

### `feat-header-component` (4 commits)

A reusable `Header` card with a title, subtitle and optional icon, demonstrated on
a placeholder Home.

**Verdict: superseded.** `Screen` in `components/Form.tsx` renders the same
title/subtitle/icon header, with the design gradient, on every tab.

### `button` (1 commit)

Adds `components/Button.tsx`, which contains only `import React from "react"`,
and a `bun.lockb` change.

**Verdict: superseded.** `Action` in `components/Form.tsx` is the shared button.

### `feat/api-service` (1 commit)

An axios client (`services/api.ts`) with request signing (device ID, nonce and
signature headers), tokens in `expo-secure-store`, automatic 401 refresh, and
generic retries. `@types/api.ts` describes a `{data, success}` response envelope
and page-number pagination.

**Verdict: superseded by `lib/api.ts`.** The backend doesn't verify request
signatures, returns bare JSON with an `{"error"}` envelope, and uses
limit/offset pagination. Automatic retries of writes and of consumed refresh
tokens are unsafe under the backend's refresh-reuse detection. Keeping the
refresh token in secure storage on native is adopted separately in milestone 3f
(D10).

## Branches fully contained in `ben/changes`

These have no commits outside `ben/changes`: `README`, `bottom-tab-switcher`,
`dev`, `feat/absolute-paths`, `feat/login-screen`, `feature/onboarding-screens`,
`feature/tabs_routing`, `linter`, `main`, `theme-colors-spacing`,
`ui-dependencies`.
