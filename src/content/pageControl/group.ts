// Where a control belongs: its form, fieldset, dialog or page region, named as the page names
// it. An open modal dialog limits what can be operated to the dialog.
import { normalise } from './describe';
import type { IsVisible } from './collect';

const CONTAINERS = 'fieldset, form, dialog, [role="dialog"], [role="search"], nav, [role="navigation"], header, footer, aside';

const REGION_NAMES: Record<string, string> = {
  form: 'Form',
  fieldset: 'Form',
  dialog: 'Dialog',
  search: 'Search',
  nav: 'Navigation',
  header: 'Top of the page',
  footer: 'Bottom of the page',
  aside: 'Side section',
};

export type RegionType = keyof typeof REGION_NAMES | 'media' | 'page';

// The topmost open modal: a <dialog> opened with showModal(), or an element marked aria-modal.
export const findModal = (doc: Document, visible: IsVisible): Element | null => {
  const modals = Array.from(doc.querySelectorAll('dialog[open], [aria-modal="true"]')).filter(element => {
    if (element.tagName === 'DIALOG' && element.getAttribute('aria-modal') !== 'true') {
      try {
        if (!element.matches(':modal')) return false;
      } catch (error) {
        // Browsers without :modal: treat an open <dialog> as modal.
      }
    }
    return visible(element);
  });
  return modals.length ? modals[modals.length - 1] : null;
};

// A fieldset inside a form is part of that form (its legend names its own choices).
export const containerOf = (element: Element): Element | null => {
  const container = element.closest(CONTAINERS);
  return container && container.tagName === 'FIELDSET' ? container.closest('form') || container : container;
};

export const regionTypeOf = (container: Element | null): RegionType => {
  if (!container) return 'page';
  const role = container.getAttribute('role');
  if (role === 'dialog') return 'dialog';
  if (role === 'search') return 'search';
  if (role === 'navigation') return 'nav';
  const tag = container.tagName.toLowerCase();
  return (tag in REGION_NAMES ? tag : 'page') as RegionType;
};

const headingIn = (container: Element) =>
  normalise(container.querySelector('h1, h2, h3, h4, [role="heading"]')?.textContent);

export const titleOf = (container: Element | null, type: RegionType): string => {
  if (!container) return type === 'media' ? 'Video and audio' : 'Page';
  const labelledBy = container.getAttribute('aria-labelledby');
  const named =
    (labelledBy && normalise(container.ownerDocument.getElementById(labelledBy)?.textContent)) ||
    normalise(container.getAttribute('aria-label')) ||
    (container.tagName === 'FIELDSET' ? normalise(container.querySelector('legend')?.textContent) : '') ||
    (type === 'form' || type === 'fieldset' || type === 'dialog' ? headingIn(container) : '');
  return (named && named.slice(0, 60)) || REGION_NAMES[type] || 'Page';
};
