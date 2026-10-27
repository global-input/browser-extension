// Makes the Firefox package (build-firefox/) from the Chrome build (build/).
// Firefox has no side panel API and no background service worker, so:
//  - the toolbar icon keeps opening the popup (no background script);
//  - the same panel page is offered as Firefox's sidebar (sidebar_action);
//  - Chrome-only keys and the sidePanel permission are left out.
// Firefox needs the add-on's ID from addons.mozilla.org: the existing listing's ID is the default,
// FIREFOX_ADDON_ID=... overrides it (FIREFOX_ADDON_ID= with no value builds a package without one).
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

// Firefox's data disclosure (decision 2026-10-27, the same as the Chrome Web Store listing):
// sign-in details and page content go between the page and the user's phone, end-to-end
// encrypted through the relay, to fill pages for the user; nothing is stored, sold or used
// for anything else.
const dataCollectionPermissions = { required: ['authenticationInfo', 'websiteContent'] };

// https://addons.mozilla.org/firefox/addon/global-input-app/ (the ID AMO's API reports for it).
const LISTING_ID = '{b870e598-9b77-49c7-914b-5d9e7002d33c}';
const addonId = process.env.FIREFOX_ADDON_ID ?? LISTING_ID;
if (addonId) {
  manifest.browser_specific_settings = {
    gecko: { id: addonId, strict_min_version: '115.0', data_collection_permissions: dataCollectionPermissions },
  };
} else {
  console.warn('FIREFOX_ADDON_ID is not set: the package has no add-on ID, so it can be tested but not submitted.');
}

writeFileSync(`${target}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Firefox package written to ${target}/`);
