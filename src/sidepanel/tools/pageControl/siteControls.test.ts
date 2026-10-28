import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_SITE_CONTROLS, applySiteControls, cleanSiteControls, hide, isCustomised, pin, rename, show, unpin } from './siteControls';
import { siteControlsStore } from '../../adapters/siteControls';
import type { PageControl, PageModel } from '../../../shared/pageControlMessages';

const search: PageControl = { id: 'c1', kind: 'text', label: 'Search' };
const go: PageControl = { id: 'c2', kind: 'button', label: 'Go' };
const home: PageControl = { id: 'c3', kind: 'link', label: 'Home' };
const remove2: PageControl = { id: 'c4', kind: 'button', label: 'Delete (2)' };
const model: PageModel = {
  host: 'a.example',
  title: 'A',
  scope: 'page',
  groups: [
    { id: 'g1', title: 'Search', controls: [search, go] },
    { id: 'g2', title: 'Menu', controls: [home, remove2] },
  ],
  more: { links: 0, buttons: 0, fields: 0 },
};
const shape = (m: PageModel) => m.groups.map(group => [group.title, group.controls.map(control => control.label)]);

beforeEach(() => localStorage.clear());

describe('remembered controls', () => {
  it('pins controls first in the order pinned, and renames them', () => {
    let site = pin(EMPTY_SITE_CONTROLS, home);
    site = pin(site, go);
    site = rename(site, home, '  Start   page ');
    expect(shape(applySiteControls(model, site))).toEqual([
      ['Pinned', ['Start page', 'Go']],
      ['Search', ['Search']],
      ['Menu', ['Delete (2)']],
    ]);
    expect(shape(applySiteControls(model, unpin(site, go)))[0]).toEqual(['Pinned', ['Start page']]);
  });

  it('matches repeated names by the name itself, keeping their number', () => {
    const site = rename(EMPTY_SITE_CONTROLS, remove2, 'Remove');
    expect(shape(applySiteControls(model, site))[1]).toEqual(['Menu', ['Home', 'Remove (2)']]);
  });

  it('hides (and unpins) a control, and shows it again; the page name restores a rename', () => {
    const site = hide(pin(EMPTY_SITE_CONTROLS, go), go);
    expect(site.pinned).toEqual([]);
    expect(site.hidden).toEqual([{ kind: 'button', label: 'Go' }]);
    expect(isCustomised(show(site, { kind: 'button', label: 'Go' }))).toBe(false);
    expect(rename(rename(EMPTY_SITE_CONTROLS, go, 'Find'), go, 'Go').names).toEqual({});
    expect(rename(rename(EMPTY_SITE_CONTROLS, go, 'Find'), go, ' ').names).toEqual({});
  });

  it('treats anything unexpected as nothing remembered', () => {
    expect(cleanSiteControls(null)).toEqual(EMPTY_SITE_CONTROLS);
    expect(cleanSiteControls({ pinned: [{ kind: 'rocket', label: 'x' }, { kind: 'button', label: 'Go' }, 'junk'], hidden: 'no', names: { a: 5, 'button|Go': 'Find' } })).toEqual({
      pinned: [{ kind: 'button', label: 'Go' }],
      hidden: [],
      names: { 'button|Go': 'Find' },
    });
  });

  it('stores sites that have something remembered, and resets them', () => {
    siteControlsStore.set('b.example', pin(EMPTY_SITE_CONTROLS, go));
    siteControlsStore.set('a.example', hide(EMPTY_SITE_CONTROLS, home));
    siteControlsStore.set('c.example', EMPTY_SITE_CONTROLS);
    expect(siteControlsStore.list()).toEqual(['a.example', 'b.example']);
    expect(siteControlsStore.get('b.example').pinned).toEqual([{ kind: 'button', label: 'Go' }]);
    siteControlsStore.reset('b.example');
    expect(siteControlsStore.list()).toEqual(['a.example']);
    localStorage.setItem('globalInput.pageControl.sites', '{"version": 99, "sites": {"a.example": {}}}');
    expect(siteControlsStore.list()).toEqual([]);
    localStorage.setItem('globalInput.pageControl.sites', 'not json');
    expect(siteControlsStore.get('a.example')).toEqual(EMPTY_SITE_CONTROLS);
  });
});
