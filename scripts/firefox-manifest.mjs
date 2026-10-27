// Makes the Firefox package (build-firefox/) from the Chrome build (build/).
// Firefox has no side panel API and no background service worker, so:
//  - the toolbar icon keeps opening the popup (no background script);
//  - the same panel page is offered as Firefox's sidebar (sidebar_action);
//  - Chrome-only keys and the sidePanel permission are left out.
// Firefox needs the add-on's ID from addons.mozilla.org: FIREFOX_ADDON_ID=... npm run build:firefox
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const source = 'build';
const target = 'build-firefox';

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
for (const file of ['background.js', 'globalinputapp.zip']) {
  if (existsSync(`${target}/${file}`)) {
    rmSync(`${target}/${file}`);
  }
}

const manifest = JSON.parse(readFileSync(`${target}/manifest.json`, 'utf8'));
delete manifest.side_panel;
delete manifest.background;
delete manifest.minimum_chrome_version;
if (manifest.content_security_policy && !Object.keys(manifest.content_security_policy).length) {
  delete manifest.content_security_policy;
}
manifest.permissions = manifest.permissions.filter(permission => permission !== 'sidePanel');
manifest.sidebar_action = {
  default_panel: 'sidepanel.html',
  default_title: 'Global Input',
  default_icon: manifest.action.default_icon,
  open_at_install: false,
};

const addonId = process.env.FIREFOX_ADDON_ID;
if (addonId) {
  manifest.browser_specific_settings = { gecko: { id: addonId, strict_min_version: '115.0' } };
} else {
  console.warn('FIREFOX_ADDON_ID is not set: the package has no add-on ID, so it can be tested but not submitted.');
}

writeFileSync(`${target}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Firefox package written to ${target}/`);
