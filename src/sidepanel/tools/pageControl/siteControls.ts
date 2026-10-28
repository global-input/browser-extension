// What Page control remembers for a site: controls pinned first (in the order pinned), controls
// hidden from the phone, and your own names. Controls are matched by kind and the page's name,
// not by where they are, so a site that changes its pages keeps your choices as long as it
// keeps its wording. Analysis still runs underneath: remembered controls only rank, hide and
// rename, so they can't stop Page control working.
// Pure functions; reading and writing the record is in adapters/siteControls.
import type { ControlKind, ControlRef, PageControl, PageModel, SiteCustom } from '../../../shared/pageControlMessages';

export interface SiteControls extends SiteCustom {
  // Your names, by refKey.
  names: Record<string, string>;
}

export const EMPTY_SITE_CONTROLS: SiteControls = { pinned: [], hidden: [], names: {} };

export const PINNED_GROUP_ID = 'pinned';
export const PINNED_GROUP_TITLE = 'Pinned';

const MAX_NAME = 60;

// Repeated names are numbered by the analysis ("Delete (2)"); remembering goes by the name itself.
export const baseLabel = (label: string) => label.replace(/\s\(\d+\)$/, '');

export const refOf = (control: PageControl): ControlRef => ({ kind: control.kind, label: baseLabel(control.label) });

export const refKey = (ref: ControlRef) => `${ref.kind}|${ref.label}`;

const sameRef = (a: ControlRef, b: ControlRef) => refKey(a) === refKey(b);

const KINDS = new Set<ControlKind>(['text', 'multiline', 'secret', 'number', 'date', 'choice', 'multi-choice', 'toggle', 'button', 'link', 'range', 'media']);

const cleanRefs = (value: unknown): ControlRef[] =>
  Array.isArray(value)
    ? value
        .filter(ref => ref && KINDS.has(ref.kind) && typeof ref.label === 'string' && ref.label.trim())
        .map(ref => ({ kind: ref.kind as ControlKind, label: String(ref.label).slice(0, MAX_NAME) }))
    : [];

// Anything unexpected counts as nothing remembered.
export const cleanSiteControls = (value: unknown): SiteControls => {
  if (!value || typeof value !== 'object') return EMPTY_SITE_CONTROLS;
  const raw = value as Partial<SiteControls>;
  const names: Record<string, string> = {};
  if (raw.names && typeof raw.names === 'object') {
    for (const [key, name] of Object.entries(raw.names)) {
      if (typeof name === 'string' && name.trim()) names[key] = name.trim().slice(0, MAX_NAME);
    }
  }
  return { pinned: cleanRefs(raw.pinned), hidden: cleanRefs(raw.hidden), names };
};

export const isCustomised = (site: SiteControls) => site.pinned.length + site.hidden.length + Object.keys(site.names).length > 0;

export const isPinned = (site: SiteControls, control: PageControl) => site.pinned.some(ref => sameRef(ref, refOf(control)));

export const pin = (site: SiteControls, control: PageControl): SiteControls =>
  isPinned(site, control) ? site : { ...site, pinned: [...site.pinned, refOf(control)] };

export const unpin = (site: SiteControls, control: PageControl): SiteControls => ({
  ...site,
  pinned: site.pinned.filter(ref => !sameRef(ref, refOf(control))),
});

// Hidden controls aren't pinned.
export const hide = (site: SiteControls, control: PageControl): SiteControls => {
  const ref = refOf(control);
  return {
    ...site,
    pinned: site.pinned.filter(other => !sameRef(other, ref)),
    hidden: site.hidden.some(other => sameRef(other, ref)) ? site.hidden : [...site.hidden, ref],
  };
};

export const show = (site: SiteControls, ref: ControlRef): SiteControls => ({ ...site, hidden: site.hidden.filter(other => !sameRef(other, ref)) });

// An empty name, or the page's own, goes back to the page's name.
export const rename = (site: SiteControls, control: PageControl, name: string): SiteControls => {
  const ref = refOf(control);
  const names = { ...site.names };
  const clean = name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  if (!clean || clean === ref.label) delete names[refKey(ref)];
  else names[refKey(ref)] = clean;
  return { ...site, names };
};

// The page's own name of a control, before any renaming.
export const pageNameOf = (control: PageControl) => baseLabel(control.label);

// The analysis as you want it: your names, and pinned controls first in their own group.
// Hidden controls are already left out by the page (it gets the hidden list with the request).
export const applySiteControls = (model: PageModel, site: SiteControls): PageModel => {
  if (!isCustomised(site)) return model;
  const named = (control: PageControl) => {
    const name = site.names[refKey(refOf(control))];
    if (!name) return control;
    const number = control.label.slice(baseLabel(control.label).length);
    return { ...control, label: `${name}${number}` };
  };
  const pinnedOrder = (control: PageControl) => site.pinned.findIndex(ref => sameRef(ref, refOf(control)));
  const pinned: PageControl[] = [];
  const groups = model.groups
    .map(group => ({
      ...group,
      controls: group.controls.filter(control => {
        if (pinnedOrder(control) < 0) return true;
        pinned.push(control);
        return false;
      }),
    }))
    .filter(group => group.controls.length);
  pinned.sort((a, b) => pinnedOrder(a) - pinnedOrder(b));
  const all = pinned.length ? [{ id: PINNED_GROUP_ID, title: PINNED_GROUP_TITLE, controls: pinned }, ...groups] : groups;
  return { ...model, groups: all.map(group => ({ ...group, controls: group.controls.map(named) })) };
};
