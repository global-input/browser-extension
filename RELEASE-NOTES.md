# Release Notes

## 5.2.0

Private pairing for people who need more than the default protection, connection settings in the panel, and a way to connect a Global Input App on the same device.

### New

- **Copy the connection code.** Right-click the QR code and choose **Copy into Clipboard**, or press **Copy code for an app on this device**. A Global Input App on the same device can then connect from the clipboard instead of scanning.
- **Advanced settings.** Settings now ends with a collapsed **Advanced** section. Most people never need it.
  - **Relay server:** the WebSocket server URL and API key, for people who run their own server. The server only forwards end-to-end encrypted messages, so these values aren't secret. Leave them blank for the default server.
  - **Private pairing:** **Pair a phone** makes two new random keys (a Security Group Key and a Code Key) and shows a pairing code for your phone to scan. After that, only phones paired with this browser can read its QR codes and connect. The keys and the pairing code stay hidden until you press **Show**, and hide again by themselves. You can also pair another phone, make new keys, enter keys made elsewhere, or go back to the default keys.
- **Pairing at a glance.** With private keys, the Connect screen says so, and what to do if a phone can't connect.

### Changed

- Connection settings are stored in a new format. Anything unreadable falls back to the default settings, so the extension always connects. Settings saved by older versions are not carried over.

### Permissions

- No new permissions.

## 5.1.0

All the tools are redesigned for the panel, and new features help keep your content away from people and cameras around you. This is also the first release of the new extension for Firefox, where the panel is Firefox's sidebar.

### New

- **Redesigned tools.** Transfer form data, Encrypt, Decrypt and Page control now use the panel's design. Your phone shows the same screens as before.
  - **Transfer form data:** each field has **Insert into page** (into the field that has focus) and **Copy**. **Edit fields** adds and removes fields, and each site keeps its own list.
  - **Encrypt and Decrypt:** three clear steps. Results can be inserted into the page, copied, or shown on your phone.
  - **Page control:** shows the controls it found on the page, with **Find again**, a rule editor that checks the JSON before saving, and presets.
- **Encrypt and decrypt in place.** Click into a field on the page, then press **Use the focused field**, and **Put back into the page** when your phone sends the result. The plain text never needs to appear on your screen.
- **Hidden by default.** Decrypted text, and text taken from the page for encryption, are hidden until you press **Show**. Insert and Copy work while hidden.
- **Hides again by itself.** Anything you reveal hides again after 30 seconds, or when the panel is hidden.
- **Site access check.** If the extension's access to websites is turned off, the panel says so and offers **Allow on all sites**.
- **Firefox.** The panel opens as Firefox's sidebar: from the popup's **Open side panel**, or View → Sidebar.

### Fixed

- Changing the site in Transfer form data no longer overwrites the previous site's saved field list.
- The tools find the active page's site themselves. For a tab that was open before the extension was updated, they ask you to reload it.

### Permissions

- No new permissions. The Firefox package declares its data use: sign-in details and page content go between the page and your phone, end-to-end encrypted, to fill pages for you. Nothing is stored or sold.

## 5.0.0

The extension now lives in Chrome's side panel. It connects to your phone once, stays connected, and signs you in to sites without copy-paste.

### New

- **Always-connected side panel.** The toolbar icon opens the panel. One QR scan per browser session: the panel stays connected while it is open. If the phone drops (app in the background, network change), it rejoins from the app's history without a new scan. It disconnects after an idle time (30 minutes by default) or when the screen locks; both are in Settings.
- **Sign in from your phone.**
  - When a page shows a sign-in form, the phone gets "Sign in to <site>" with the account saved for that site.
  - Choose it and the page is filled directly, with no clipboard, then tap the page's sign-in button on the phone.
  - The panel shows each step, notices a wrong password (the phone asks again, no new scan), and confirms when you are signed in.
  - Forms are found by the built-in or your own page rules, or automatically.
- **Two-step sign-ins.** Sites that ask for the username on one page and the password on the next (Microsoft, Google, AWS or Okta style) are handled on the same connection, as "Step 1 of 2" and "Step 2 of 2" on the phone.
- **Per-site settings** on the panel's site card:
  - sign in automatically after filling;
  - turn sign-in detection off for a site;
  - save an automatically found form as a page rule.

  Settings, then Sites, lists and resets them.
- **Send text from the phone** into the field that has focus, for one-time codes and other values. A code split over one-character boxes is spread across them.
- **Tools in the panel.** Transfer form data, Encrypt, Decrypt and Page control (with the rule editor) are in the panel's Tools tab, and can also be started from the phone's home screen. They share the panel's connection, so no extra scan is needed.

### Security

- Values from the phone are written straight into the page. They are never stored, logged or put on the clipboard.
- A value is filled only if the page is still on the site it was requested for: the host is checked in the panel and again in the page.
- Only site names and per-site choices are stored (extension local storage).

### Permissions

- Added `sidePanel` (the panel) and `idle` (disconnect when idle or locked). Neither shows a new warning when installing or updating.
- A background service worker makes the toolbar icon open the panel. It needs no permission.

### Development

- Moved from Create React App to Vite 6 and TypeScript 5.9.
  - `npm run build` builds the popup, the panel and the content script.
  - `npm test` runs 53 unit tests (Vitest).
  - `npm run typecheck`.
  - `npm run build:firefox` and `npm run package:firefox` make the Firefox package.
- The content script is now TypeScript (`src/content/`). It replaces `public/content.js`, and the popup's messages get the same replies as before.
- Fixed: a top-level `const URL` in `src/global-input-mobile/storage.ts` shadowed the browser's `URL` once bundled, and the pages rendered blank. It is renamed to `URL_KEY`; the stored key name is unchanged.
- The 4.2.0 known issue "TypeScript type check fails in `node_modules`" is resolved by the TypeScript upgrade.

### Firefox

- The Firefox package keeps the popup on the toolbar icon. It offers the same panel as Firefox's sidebar, and the popup's "Open side panel" button opens that sidebar. Not tested in Firefox yet.

### Known issues

- Automated end-to-end tests cannot reach the relay in Chrome for Testing 150: there, requests from extension pages hang when the extension has site access. Manual testing in Chrome works.
- The tools still use the popup's styling inside the panel.

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
