# Global Input App Browser Extension

A powerful browser extension that transforms your mobile device into a secure controller for web applications. Available for [Chrome](https://chromewebstore.google.com/detail/global-input-app/hcklienddlealndjnakkagefaelhnjkp) and [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/global-input-app/), this TypeScript-based React application leverages the [global-input-react] module to enable seamless mobile-to-desktop interactions.

## Overview

The extension creates a secure bridge between your mobile device and web browser, enabling you to interact with web pages directly from your mobile device. It provides secure data transfer capabilities while maintaining end-to-end encryption, making it ideal for tasks such as automated sign-in and authentication, secure form completion, mobile-based data storage and encryption, and custom element interaction and control.

## Compatibility

The extension works seamlessly with popular platforms and services including development and tools platforms like GitHub, GitLab, npm, Digital Ocean, JSFiddle, JS Bin, Heroku, and MuleSoft; productivity tools such as Dropbox, Evernote, Lucidchart, ProtonMail, and CamScanner; social and business platforms including LinkedIn, Twitter, Facebook, Microsoft, Google, and Apple; and e-commerce services like Amazon, AWS, Adobe, Atlassian, Tesco, Papa John's, WisePay, and 123-reg.

## Development Setup

### Prerequisites

- Node.js 20 or newer and npm
- Git for version control

### Build Instructions

```bash
git clone https://github.com/global-input/browser-extension.git
cd browser-extension
npm install
npm run build          # build/: popup, side panel, content script (Vite)
npm test               # unit tests (Vitest)
npm run typecheck      # TypeScript
npm run dev            # rebuild on change (development mode)
npm run package        # build/globalinputapp.zip for the Chrome Web Store
npm run package:firefox   # globalinputapp-firefox.zip for addons.mozilla.org
npm run package:source    # globalinputapp-source.zip: the committed source, for AMO review
```

### Building the Firefox package from source (for addons.mozilla.org reviewers)

The package is bundled with Vite, so its source is supplied separately. To rebuild it:

1. Use Node.js 20 or newer (built with Node.js 24.13 and npm 11.8) on macOS, Linux or Windows.
2. Unzip the source and run `npm ci` (exact versions from `package-lock.json`, all from the npm registry).
3. Run `npm run build:firefox`. The package is in `build-firefox/`, the same files as the submitted zip.

`scripts/firefox-manifest.mjs` makes the Firefox manifest from the Chrome one: Firefox's sidebar instead of Chrome's side panel, the add-on ID, and the data disclosure.

### Project Layout

| Path | What it is |
|---|---|
| `src/sidepanel/` | The side panel: `core/` (sign-in flow, no Chrome or React code), `adapters/` (Chrome, phone connection, storage), `ui/`, `tools/` |
| `src/content/` | The content script: page rules, sign-in form detection, filling |
| `src/shared/` | Page rule types and the panel and page message contract |
| `src/app/` | The tools (form transfer, encryption, decryption, page control), also the popup |
| `public/` | `manifest.json`, `background.js` (icon opens the panel), images |
| `scripts/firefox-manifest.mjs` | Makes the Firefox package from the Chrome build |

### Browser Extension Installation

You can install the extension in two ways:

#### Chrome Web Store Installation

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/global-input-app/hcklienddlealndjnakkagefaelhnjkp)

#### Developer Mode Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Navigate to and select the `build` directory in your project folder
5. The extension should now appear in your Chrome extensions list

### Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### License

<!-- Option 1: MIT License -->

MIT License

Copyright (c) 2024 Global Input App

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

For more information and documentation, visit [Global Input App](https://globalinput.co.uk/)
