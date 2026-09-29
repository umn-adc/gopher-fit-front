# Android onboarding fixes

## Causes and changes

- `components/Form.tsx`: the installed NativeWind native interop flattens the
  `Pressable.style` function as an object instead of passing it through to React
  Native. That removes the background, border, padding, row layout, and pressed
  feedback. `Action` now opts out of CSS interop so React Native evaluates its
  existing callback. Both regular and compact buttons have a 48 dp minimum touch
  target, with readable disabled/pressed feedback.
- `components/Design.tsx`: `Tile` uses the same inline callback and receives the
  same interop fix. `Gradient` now uses a fixed SVG viewBox and rectangle that
  scale with the viewport. On Android the previous percentage-sized rectangle
  retained its initial path when the progress container changed width.
- `screens/Onboarding/index.tsx`: Back was explicitly disabled on step one. It
  now dismisses to login, replacing the current route if login is absent from
  the stack. On later steps, both the visible button and Android system Back
  move one step while keeping the draft. Required fields are validated when
  Continue is pressed; missing input produces feedback instead of silently
  disabling the action. Only an in-flight account submission disables actions.
  Successful step changes dismiss the keyboard, and nested sports scrolling
  keeps taps on controls enabled.
- `components/AuthLayout.tsx`: on the Android emulator the keyboard overlaid the
  full-height scroll view, hiding the final form's Back/Create account controls.
  A keyboard-avoiding container now constrains the scroll viewport on Android
  and iOS so these controls can scroll above the keyboard. The device regression
  rejects taps on controls covered by the keyboard.

Before the fix, the welcome Continue control was **enabled** in Android's native
accessibility hierarchy. A tap directly on its small text area advanced to the
name step. Its missing visual button and reduced target explained the apparent
dead end. Neither the gradient nor the auth background blocked that tap; both
already exclude themselves from hit testing. No overlay or API redesign was
needed.

Reference screenshots remain untouched. The API payload, metric conversions,
eight introductory steps, final credential form, dependencies, and unrelated
local edits are preserved.

## Repeatable regression checks

Start the existing disposable backend in its own terminal:

```sh
cd ../gopher-fit-back
uv run python ../gopher-fit-front/tests/serve_backend.py
```

The tests require its `/__test__/fixture` marker before creating any accounts.
This fixture uses a temporary migrated database and loopback port 3000.

Start `GopherFit_Pixel`, open Expo Go, and run Metro against the fixture:

```sh
adb -s emulator-5554 reverse tcp:3000 tcp:3000
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 npx expo start --port 8082
EXPO_GO_URL=exp://<metro-host>:8082 python3 tests/onboarding-android.py
```

Set `ANDROID_ADB` to an executable path and `ANDROID_SERIAL` if needed. With
Windows SDK tools from WSL, use the Windows `adb.exe`, a Metro address reachable
from Windows, and confirm the Windows host can reach the fixture's loopback
port before using `adb reverse`. `REACT_NATIVE_PACKAGER_HOSTNAME` can set Metro's
advertised host. The Android runner uses only Python's standard library and adb;
it saves screenshots and the latest hierarchy in `/tmp/gopher-onboarding`
(override with `ONBOARDING_ARTIFACTS`). It restarts Expo Go without clearing app
storage, checks both login return paths, button padding/touch size, system Back,
required and optional steps, retained inputs, keyboard use, and registration.
It verifies the saved profile through the backend and deletes its test account.

For web, build with the same fixture URL and start the static preview. Restart
the preview after rebuilding so its CSP hashes match.

```sh
npm run typecheck
npm test
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 npm run build:web
npm run preview:web
# With the external Playwright installation described in README.md:
PLAYWRIGHT_MODULE=/tmp/gopher-fit-browser/node_modules/playwright node tests/onboarding-browser.cjs
PLAYWRIGHT_MODULE=/tmp/gopher-fit-browser/node_modules/playwright node tests/browser.cjs
TZ=America/Chicago PLAYWRIGHT_MODULE=/tmp/gopher-fit-browser/node_modules/playwright node tests/design-browser.cjs
```

The focused web test also checks 320/423/1100 px buttons, invalid numeric input,
no registration request for invalid fields, retained credentials, and disabled
actions during a slow registration response. The existing design test now
expects a useful validation message on an empty name.

## Verification record

Results are recorded after running the checks on the final implementation.
Native iOS runtime verification requires a Mac/simulator or device; a successful
iOS JavaScript/Hermes export alone does not establish native runtime behavior.
