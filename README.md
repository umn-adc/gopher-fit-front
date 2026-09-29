# GopherFit Frontend

Expo / React Native / TypeScript app for profiles, meal and workout tracking,
friends, and exercise rankings. The existing Home, Nutrition, Workouts, Social,
and Profile tabs share a small fetch client and ordinary React state.

## Run locally

Use Node 22 and the checked-in npm lockfile:

```sh
npm ci
cp .env.example .env
npm start
# or: npm run web
```

Set `EXPO_PUBLIC_API_URL` in `.env` before starting/building. It is a **public**
value embedded in the bundle; never place backend secrets here.

- Web on the same computer: `http://localhost:3000`.
- Android emulator: `http://10.0.2.2:3000`.
- Physical device: a reachable LAN address such as `http://192.168.1.20:3000`;
  bind the development backend to `0.0.0.0` and allow its port through your firewall.
  Device `localhost` refers to the device itself. Keep device and computer on the
  same network. Use HTTPS for production credential traffic.

Run the backend from `../gopher-fit-back` following its `docs/deployment.md`, with
its own private environment and migrations. For web, configure exact backend
origins, including the actual frontend port, for example:

```dotenv
CORS_ORIGINS=["http://localhost:8081","http://127.0.0.1:8081"]
```

No wildcard, path or trailing slash; production should list only deployed origins.
Restart Expo when changing `.env`. A missing API URL produces a setup message.

## Login and data behavior

Registration creates credentials and a profile together. Login uses a username.
Access/refresh credentials remain **in memory only**; reload/restart requires login.
Each browser tab has its own login and session. There is no AsyncStorage,
localStorage, cookie, or cross-tab credential sharing. Refresh is serialized and
rotates the pair together; an uncertain refresh response requires login again.
Writes are not automatically retried after network failures. Check/reload data
before submitting an uncertain write again. Failed logout offers local sign-out;
that cannot guarantee server revocation.

Profile editing uses whole centimetres and kilograms; zero means unspecified.
The eight-step introduction accepts inches and pounds and converts them to the
backend's whole metric units on registration. The profile's display units (metric
by default, or imperial) control how the profile summary shows height and weight. New passwords follow the backend Unicode policy and 72-byte
UTF-8 limit; ordinary login does not impose new-password complexity.

Meal dates are local `YYYY-MM-DD` strings. Home reads today's totals and macro
targets from one `/nutrition/summary?date=` request using the device's local date,
and shows "Goal met! N over" once calories exceed a nonzero target. Favorite meals
are templates saved from a meal's food items; logging one copies its items into a
new meal on the chosen date, and editing or deleting a favorite never changes meals
already logged. Weeks run from local Monday 00:00 inclusive to the next
Monday 00:00 exclusive, including DST changes. Workout timestamps require `T`
and an offset; unknown historical dates remain unknown and are excluded from
weekly counts. Screens refresh on focus. Offset pagination cannot provide a
snapshot while another client inserts/deletes records; refresh to reconcile.

Parent edits omit child arrays and use individual item routes. They cannot
accidentally delete siblings. Unchanged workout timestamps are omitted; clearing
the date explicitly sends null. Empty response item collections become empty
lists in the UI. Macro edits submit all four targets, including zero targets.
The frontend restricts integers to JavaScript's exact safe range (which is narrower
than the backend's signed 64-bit range) rather than silently rounding values.

Every weighted exercise records its unit, kg or lb. New exercises default to the
profile's display units (kg for metric, lb for imperial). Exercises logged before
units existed show "unit unknown" and need a unit chosen when edited; the app never
guesses. Rankings compare kilograms, show them in the preferred unit, and exclude
lifts with an unknown unit. Workouts record their overall length in minutes
(`duration_minutes`). The older unitless `duration` is shown as "unit unknown" and
never written, so old values stay intact. Training minutes use a workout's overall
minutes when recorded, otherwise the sum of its exercises' minutes. Workout streaks
are derived from distinct local workout dates; yesterday's streak stays active
until the end of today. An optional weekly workout target (1–14, set in the profile
editor) shows as progress on Home's Workouts card; with no target, only the count is
shown. The Friends panel searches usernames by prefix (at least three characters,
sent once typing pauses) and can send a request from each result; blocked users
don't appear. Looking up a numeric user ID still works; your ID appears in the
profile editor and Friends panel.

## Recovery hosting

Recovery enrollment/request/verification/reset are implemented at `/recovery`.
Disabled servers return an unavailable message. A 202 means accepted, not delivered;
there is no address-status read endpoint. Email links are handled on the web;
native users can enroll/request, then open the HTTPS web link from their email.

Production recovery requires backend SMTP/TLS settings and
`RECOVERY_FRONTEND_URL=https://YOUR_FRONTEND/recovery`. Follow the backend deployment
guide for SMTP and mail/DNS requirements. No real email provider is included.
Tokens stay in memory, are stripped from URL fragments immediately, and are sent
only in JSON bodies. Do not add analytics, third-party scripts, query-string token
handling, or body/credential logging to this page.

Serve the static build over HTTPS with these headers (replace the API origin):

```text
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-BOOTSTRAP_HASH'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://YOUR_API; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```

Compute `BOOTSTRAP_HASH` from the **exact inline script content** in the exported
`dist/recovery.html` after each build. Do not use a constant hash from an older
build. `scripts/serve-web.cjs` demonstrates extracting inline script hashes and
serves these headers for local preview. The app also includes a no-referrer meta
tag. Configure your production host to serve `/recovery` from `recovery.html`
and keep all exported scripts/fonts on the same origin. The preview server is
for local testing, not a production HTTPS server.

## Checks and disposable integration tests

`lib/api-schema.ts` is generated from the backend's checked-in OpenAPI snapshot
(`../gopher-fit-back/docs/openapi.json`) and `lib/api-types.ts` derives the app's
request/response types from it. `npm run typecheck` first fails if the generated
file is stale, so it needs the backend checkout next to this one. After a backend
contract change, run `npm run gen:api` and fix whatever `tsc` reports. Don't edit
the generated file by hand.

```sh
npm run typecheck
npm test
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 npm run build:web
npm run preview:web
# Native JS/Hermes bundles (does not launch devices):
npx expo export --platform android --platform ios --output-dir /tmp/gopher-native
```

For integration checks, start the test-only backend in a separate terminal:

```sh
cd ../gopher-fit-back
uv run python ../gopher-fit-front/tests/serve_backend.py
```

This binds **only loopback port 3000**, migrates a new temporary database, uses
three-second access tokens, and delivers mail to an in-memory fake. It never
opens your normal database. Its `/__test__/*` fixture controls must never be
installed or exposed in production. Then, in this frontend repository:

```sh
npm run test:integration
# Optional browser tooling is installed outside the app dependencies:
npm install --prefix /tmp/gopher-fit-browser --no-save playwright
/tmp/gopher-fit-browser/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/gopher-fit-browser/node_modules/playwright node tests/browser.cjs
TZ=America/Chicago PLAYWRIGHT_MODULE=/tmp/gopher-fit-browser/node_modules/playwright node tests/design-browser.cjs
```

Browser tests require the static preview built with API port 3000. Restart preview
after rebuilding so CSP hashes match. Backend checks:

```sh
cd ../gopher-fit-back
uv run pytest -q
uv run python -m scripts.export_openapi --check
```

See [verification notes](docs/verification.md) for checked flows and remaining
external prerequisites. Source inspection and bundle exports do not establish
physical-device or production-mail behavior.

For the Android onboarding fixes and repeatable emulator/browser regression
checks, see [onboarding verification](docs/onboarding-verification.md).

## Finding the code

- `lib/api.ts`, `auth.tsx`: HTTP client, errors, in-memory sessions.
- `lib/api-schema.ts` (generated), `api-types.ts`: the API contract as TS types.
- `lib/hooks.ts`: submit lock and the repeated paginated-list behavior.
- `lib/writes.ts`, `validation.ts`, `stats.ts`: safe parent payloads, inputs, totals.
- `screens/`: each tab's forms and lists, login, onboarding, and recovery.
- `components/Form.tsx`, `ProfileFields.tsx`, `StatsBlob.tsx`: themed UI controls.
- `app/_layout.tsx`: protected navigation; `app/+html.tsx`: recovery bootstrap.

Storybook is optional. `npm run storybook` generates its requires file and enables
its entry; normal startup registers only Expo Router. The app typecheck excludes
the separate legacy Storybook web configuration, whose packages are not installed.

## Screenshot design implementation

The local `figma_screenshots/` references drive the light maroon/gold appearance,
eight-step introduction, dashboard, floating tabs, workout cards, social panels,
and profile. These references are ignored by Git and are not bundled. Shared
styles live in `constants/Design.ts` and `components/Design.tsx`; existing form
controls and SVG stat icons are reused. The mascot is a scalable SVG adaptation
of the screenshot because the original isolated illustration was not supplied.
Nutrition and login follow the same visual system; no nutrition reference was supplied.

Live records drive dashboard totals, workout streaks, exercise rankings, and
locally calculated achievement badges. The Feed shows the current user's dated
workouts. Friend posts, messaging, coach plans, notification delivery, privacy
visibility controls, body scans, goal completion percentages and calories burned
have no backend contract; the UI describes their availability instead of using
the screenshot's sample records or pretending to save settings. Account/profile
editing, recovery, destructive-action confirmations and data CRUD remain wired
to the existing API. Onboarding's credential form follows the eight profile steps.

Screens adapt to narrow mobile and desktop widths. The static preview supports
both flat exported routes and directory routes such as `/login/index.html`.
See `docs/design-verification.md` for the design checks and remaining limits.
