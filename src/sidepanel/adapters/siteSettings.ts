// Per-site choices: sign in automatically after filling, and whether to look for sign-in
// forms at all. Only site names and these choices are stored, never anything typed.
import type { SiteSettings } from '../core/signInController';

export const DEFAULT_SITE_SETTINGS: SiteSettings = { autoSubmit: false, detect: true };

const KEY = 'iterative.globalInputApp.sidePanel.sites';

type SiteMap = Record<string, SiteSettings>;

const load = (): SiteMap => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (error) {
    return {};
  }
};

const save = (sites: SiteMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(sites));
  } catch (error) {
    // Choices then last until the panel closes.
  }
};

export const siteSettingsStore = {
  get: (host: string): SiteSettings => ({ ...DEFAULT_SITE_SETTINGS, ...(load()[host] || {}) }),
  set: (host: string, settings: SiteSettings) => {
    const sites = load();
    const isDefault = settings.autoSubmit === DEFAULT_SITE_SETTINGS.autoSubmit && settings.detect === DEFAULT_SITE_SETTINGS.detect;
    if (isDefault) {
      delete sites[host];
    } else {
      sites[host] = settings;
    }
    save(sites);
  },
  // Sites whose choices differ from the defaults, for the Settings page.
  list: (): { host: string; settings: SiteSettings }[] =>
    Object.entries(load())
      .map(([host, settings]) => ({ host, settings: { ...DEFAULT_SITE_SETTINGS, ...settings } }))
      .sort((a, b) => a.host.localeCompare(b.host)),
};
