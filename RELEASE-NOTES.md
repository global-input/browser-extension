# Release Notes

## 4.2.0

### Fixes

- **Multi-step sign-in on several preset sites.** Eight preset rule fields still used the old `nextUI` key, which the extension stopped reading when it moved to `next`. After pressing the button, the phone kept showing the old form instead of moving on to the page's next form. Renamed to `next` in `src/app/page-control/rules/preset.json` for:
  - Lucidchart (Billing Information, "pay")
  - Meetup
  - MuleSoft Anypoint
  - npm
  - Papa John's
  - Pexels (Sign Up and Login)
  - ProtonMail (Create Account)
- **Page Control error screen shows the domain.** The error form sent to the phone set the domain under the wrong key, so the domain field showed `...`. Fixed in `src/app/page-control/mobile-ui/errorControl.ts`.
- **Filled values now register on React-based sign-in pages.** `public/content.js` assigned `element.value = value` before firing `input`/`change`. React keeps its own record of the input's value, so it saw no change and its state stayed empty: the page showed the value, but submitted blank credentials. The content script now sets the value through the native `value` setter of the element's prototype (input, textarea or select, taken from the element's own window, so same-origin iframes work), then fires the events. Checked in headless Chrome with a React 18 controlled form: the old code left the React state empty, and the new code updates it. Also checked that a plain server-rendered form (Cassie sign-in) still fills correctly.
- **Version numbers aligned.** `public/manifest.json` and `package.json` are both `4.2.0`.

### Changes

- The "launch the Global Input App" QR link now points to `https://app.globalinput.co.uk/global-input-app/mobile-app?launchType=qr` (`src/global-input-config/index.js`).

### Known issues / to-do

- **TypeScript type check fails in `node_modules`.** `npx tsc --noEmit` reports syntax errors in `node_modules/styled-components/dist/types.d.ts`. The project pins `typescript ^3.9.10`, but `styled-components` 6 ships type definitions that need TypeScript 4.x or newer. The source in `src/` has no type errors of its own. To-do: upgrade TypeScript (and check that `react-scripts` 5 accepts it), or pin a compatible `styled-components` version.
- Hostname matching is exact (`location.host`, port included). The content script runs only in the top frame, and `type: "iframe"` rules look only in the first `<iframe>`.
