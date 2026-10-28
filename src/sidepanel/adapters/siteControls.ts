// The controls Page control remembers per site, in one versioned record. Anything unexpected
// in it counts as nothing remembered.
import { EMPTY_SITE_CONTROLS, cleanSiteControls, isCustomised } from '../tools/pageControl/siteControls';
import type { SiteControls } from '../tools/pageControl/siteControls';

const KEY = 'globalInput.pageControl.sites';
const VERSION = 1;

const load = (): Record<string, unknown> => {
  try {
    const record = JSON.parse(localStorage.getItem(KEY) || 'null');
    return record && record.version === VERSION && record.sites && typeof record.sites === 'object' ? record.sites : {};
  } catch (error) {
    return {};
  }
};

const save = (sites: Record<string, unknown>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, sites }));
  } catch (error) {
    // Choices then last until the panel closes.
  }
};

export const siteControlsStore = {
  get: (host: string): SiteControls => cleanSiteControls(load()[host]),
  set: (host: string, site: SiteControls) => {
    const sites = load();
    if (isCustomised(site)) sites[host] = site;
    else delete sites[host];
    save(sites);
  },
  reset: (host: string) => siteControlsStore.set(host, EMPTY_SITE_CONTROLS),
  // Sites with remembered controls, for Settings → Sites.
  list: (): string[] =>
    Object.keys(load())
      .filter(host => isCustomised(siteControlsStore.get(host)))
      .sort(),
};
