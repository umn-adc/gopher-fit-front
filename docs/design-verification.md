# Screenshot implementation verification

The supplied local references cover the eight introduction steps, Home, Workouts,
Social (Feed / Rankings / Friends), and Profile. They are excluded from Git and
from application bundles. No original Figma source assets or font metadata were
available; the existing stat SVGs are reused and the mascot is a vector adaptation.
Login and Nutrition use the same shared visual styles.

## Implementation

- Light surfaces, maroon/gold accents, rounded cards and a floating five-tab bar.
- Responsive dashboard columns and mobile layouts, including 320px widths.
- Eight onboarding steps with validation, preserved Back navigation, multiple
  sports/goals, activity selection, and a subsequent credentials form. Inches and
  pounds convert to the backend's whole centimetres/kilograms.
- Live nutrition totals, dated workout summaries/streaks, goal lists, and actions
  linking Home to the relevant screens. Workout Quick Start opens a populated
  editor and scrolls it into view.
- Social panels use real personal activity, exercise leaderboards and friendship
  controls. Profile retains profile/account edits, recovery, sign-out and deletion.
- Achievement badges are calculated from logged workouts, exercise minutes and
  longest workout streak. They aren't an API-issued award system.

## Checks

`npm run typecheck`, targeted ESLint, `npm test` (17 tests), web export, and iOS /
Android Hermes exports pass. Native exports establish bundling, not device behavior.
The new unit checks cover imperial conversion, distinct-day streaks across DST,
unknown/future dates, and daily macro totals.

`tests/browser.cjs` uses the real disposable backend to verify registration through
all eight steps, meal/workout CRUD, macro updates and error handling, friendships,
rankings, profile edits, recovery, session revocation, account switching and deletion.
Existing in-memory credential behavior is preserved.

`tests/design-browser.cjs` captures the eight onboarding states and the main screens
at 423px, 320px and 1100px. It checks horizontal overflow, onboarding Back behavior,
Quick Start, social panel switching, repeated Home shortcuts, and modal accessibility
on a narrow viewport. It reports runtime errors and writes artifacts outside the repo.
Run it after starting `tests/serve_backend.py`, exporting the web app with API port
3000, and starting the preview server:

```sh
TZ=America/Chicago \
PLAYWRIGHT_MODULE=/tmp/gopher-fit-browser/node_modules/playwright \
node tests/design-browser.cjs
```

Artifacts default to `/tmp/gopher-fit-visual`; set `DESIGN_ARTIFACTS` to override.
The visual comparison checks card geometry, margins, icon proportions, typography,
onboarding placement, tab rounding and labels. Displayed data and unsupported
features intentionally differ from the reference's sample content.

## Backend and asset limits

The API doesn't support friend posts, likes/comments/messages, coach-assigned
plans, notification delivery, privacy visibility settings, body scans, weekly
workout targets, goal percentages, or calories burned. These are explained or shown
as unavailable. Disabled notification controls do not pretend to save preferences.
Body scan actions explain how to contact RecWell. Workout/achievement values come
from actual records; the screenshot's fictional rankings and progress aren't seeded
into production.

For exact asset fidelity, the original mascot illustration and font information
would still be needed. Real SMTP, production hosting and native device testing
remain outside this verification.
