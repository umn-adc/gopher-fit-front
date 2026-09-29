# Frontend/backend integration verification

For the subsequent screenshot implementation and current visual checks, see
[design verification](design-verification.md). The checks below record the API
integration baseline; the current unit suite includes three additional UI-data tests.

The frontend was checked against the current sibling backend at
`../gopher-fit-back`; backend source and contracts were left unchanged. Tests use
only temporary migrated SQLite databases and disposable accounts. The plan file
is intentionally left untracked and uncommitted.

## Source inspection

Read both working trees and the backend API/deployment guides, OpenAPI snapshot,
auth/profile/nutrition/workout/social routers, models and services, with repository,
security, middleware and lifecycle tests consulted for behavior. The frontend's
starting screens were placeholders with hard-coded Home values. Its Storybook
requires file is currently **tracked despite its ignore rule** (the earlier review
reported it absent); unconditional imports coupled both entries, and Expo Router also ran in
Storybook mode. Normal startup now selects only Expo Router. Storybook generation
runs explicitly through its own script. No generated Storybook file change is
included.

The source inspection found contract documentation limitations:

- OpenAPI calls only `name`, `username`, and `password` required on registration.
  `ProfileService.validate_profile` also requires valid gender/activity selections
  because their schema defaults are invalid. The UI requires those selections.
- Gender/activity values and the Unicode password policy are service rules,
  incompletely described by the generated schema. The client follows those rules.
- Recovery 503 and several ownership 404/conflict 409 responses are not all listed
  on the individual OpenAPI operations. They are implemented in source and
  described in `docs/api.md`; the frontend handles them.
- Meal/workout response schemas are permissive objects due to backend custom
  serializers. Their actual router/service response fields determine client types.
- Neither current code nor the legacy models/docs define a concrete workout
  weight or overall workout-duration unit. No conversion or fabricated unit was
  introduced. `duration_minutes` and profile kg/cm units are explicit.

No backend contract changes are required for the implemented features. Date-filtered
meal lists/summaries would make Home more efficient; it currently loads every
page for correct totals. Offset pagination cannot guarantee a stable snapshot
under concurrent changes. Streaks, weekly workout targets, feeds, username search,
and barcode lookup remain outside the contract.

## Automated checks

- `npm run typecheck`: passed for the app. The optional legacy Storybook trees
  are excluded; their separate web framework packages are not dependencies here.
- `npm test`: 14 focused tests passed. Coverage includes refresh concurrency and
  bounded retry, uncertain refresh/write outcomes, stale account/public-recovery
  responses, 204 and error envelopes, request IDs, cooldowns, pagination past 100
  and exact multiples, omission of destructive nested arrays, timestamp clearing,
  validation/password byte limits, local dates/DST, zero targets, and recovery
  fragment capture/replacement.
- ESLint on changed app/screens/components/lib code: passed. The existing Metro
  font `require` has a documented local lint exception.
- Web static export: passed.
- Android and iOS Hermes bundle exports: passed. These validate bundling, not
  device execution. No Android/iOS simulator or physical-device tooling was
  available here.
- Backend `uv run pytest -q`: **264 passed**.
- Backend `uv run python -m scripts.export_openapi --check`: passed.

## Running backend through the actual frontend API client

`npm run test:integration` passed against `tests/serve_backend.py`, including:

- Atomic registration/login, wrong credentials/confirmation, profile replacement,
  username responses, real three-second access expiry and simultaneous refresh,
  password revocation, logout/logout-all, account deletion and surviving accounts.
- Meals/items/macros CRUD, absent/zero targets, 204 reads after writes, ownership
  failures, server-calculated calories, nested preserve/replace/delete, 200 meals
  including the empty final page, and total/protein recalculation.
- Workouts/items CRUD, generated nested IDs, unknown historical times, unchanged
  timestamps, inclusive start/exclusive end with encoded timezone offsets, 103
  workouts, and exercise-record recalculation after edits/deletes.
- Two-account friendships, sorted participants, prohibited transitions/incoming
  block deletion, accepted/block/unblock states, and tied ranks/percentiles across
  leaderboard pages.
- Recovery unavailable/configured modes, fake-mail enrollment/confirmation/reset,
  identical existing/unknown-account acknowledgments, consumed challenges, and
  session revocation. The backend lifecycle suite additionally exercises expiry,
  token-reuse revocation, concurrency, rate limits and delivery failures.

## Running web application

`tests/browser.cjs` drives Chromium against the exported app and the real disposable
backend, using the preview server's referrer policy/CSP. It checks protected deep
links, registration, Home missing/zero goals and updated totals, meal/item and
workout/item creation/edit/deletion, unknown dates, refreshed rankings, friendship
requests with a second account, profile edits, incorrect-password retention,
recovery verification/reset, revoked-session navigation, logout/all, account
switching, password change, account deletion and reload requiring login. Browser
storage remains empty and no page runtime errors occurred.

Recovery links are checked on initial navigation and on a second link in the same
tab. Both remove the fragment and consume the bootstrap's temporary property.
This testing found and fixed fragment-only navigation and revoked-session fallback
bugs before delivery.

The browser suite also injects deterministic offline, 500 and 429 responses into
macro writes to check retained inputs, request-ID feedback and suppression of
requests during Retry-After. Other success-path requests use the running backend.
The 14 unit tests and existing backend tests cover the corresponding transport
and limiter behavior separately.

## External prerequisites / limits

Real SMTP delivery, provider/DNS setup, production HTTPS, and production host
header configuration were not exercised. Local recovery uses a deliberately
fake in-memory mailbox, not real SMTP or guaranteed delivery. Configure deployment
as described in the README and backend guide before enabling production recovery.
Native runtime/device behavior still needs a device or simulator check. Storybook
was generated during startup investigation, but its interactive environment and
separate legacy web configuration are not part of integration verification.
